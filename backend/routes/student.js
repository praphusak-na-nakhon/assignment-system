const express = require('express');
const multer = require('multer');
const { authenticateStudent } = require('../middlewares/auth');
const sheetsService = require('../services/sheetsService');
const driveService = require('../services/driveService');
const { validateFileUpload } = require('../utils/validation');
const { MAX_FILE_SIZE } = require('../config/constants');
const fileManager = require('../utils/fileManager');

const router = express.Router();

// Multer configuration for assignment uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});


// Student login (authentication check)
router.post('/login', authenticateStudent, (req, res) => {
  res.json({
    success: true,
    message: 'เข้าสู่ระบบเรียบร้อย',
    data: {
      studentId: req.user.studentId,
      name: req.user.name,
      class: req.user.class,
      subjects: req.user.subjects
    }
  });
});

// Get student's subjects and assignments
router.get('/dashboard', authenticateStudent, async (req, res) => {
  try {
    const subjects = await sheetsService.getSubjects();
    const assignments = await sheetsService.getAssignments();
    const submissions = await sheetsService.getSubmissions();
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => 
      subject.class === req.user.class
    );
    
    // Get assignments for student's subjects (only active assignments)
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subjectId) &&
      assignment.isActive === true
    );
    
    // Get student's submissions
    const studentSubmissions = submissions.filter(submission => 
      submission.studentId === req.user.studentId
    );
    
    // Enrich assignments with submission status
    const enrichedAssignments = studentAssignments.map(assignment => {
      const subject = studentSubjects.find(s => s.id === assignment.subjectId);
      const submission = studentSubmissions.find(s => s.assignmentId === assignment.id);
      
      return {
        ...assignment,
        subjectName: subject ? subject.name : 'ไม่ทราบ',
        subjectClass: subject ? subject.class : 'ไม่ทราบ',
        isSubmitted: !!submission,
        submissionScore: submission ? submission.score : 0,
        submittedAt: submission ? submission.submittedAt : null
      };
    });
    
    res.json({
      success: true,
      data: {
        student: {
          studentId: req.user.studentId,
          name: req.user.name,
          class: req.user.class
        },
        subjects: studentSubjects,
        assignments: enrichedAssignments,
        totalScore: studentSubmissions.reduce((sum, sub) => sum + sub.score, 0)
      }
    });
  } catch (error) {
    console.error('Get student dashboard error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// Submit assignment
router.post('/submit', authenticateStudent, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  console.log(`📤 [${new Date().toISOString()}] Student ${req.user.studentId} starting submission process...`);
  
  try {
    const { assignmentId, subjectId } = req.body;
    
    if (!assignmentId || !subjectId) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุงานและวิชาที่ต้องการส่ง' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาเลือกไฟล์ที่ต้องการส่ง' 
      });
    }

    // Validate file
    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.isValid) {
      return res.status(400).json({ success: false, message: fileValidation.message });
    }

    const validationTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Validation completed in ${validationTime - startTime}ms`);;

    // Load minimal required data in parallel - only what's needed for validation
    console.log(`🔄 [${new Date().toISOString()}] Loading minimal data for validation...`);
    const [subjects, assignments] = await Promise.all([
      sheetsService.getSubjects(),
      sheetsService.getAssignments()
    ]);

    const dataLoadTime = Date.now();
    console.log(`📊 [${new Date().toISOString()}] Validation data loaded in ${dataLoadTime - validationTime}ms`);
    
    const subject = subjects.find(s => s.id === subjectId);
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (!subject || !assignment) {
      return res.status(400).json({ 
        success: false, 
        message: 'ไม่พบข้อมูลงานหรือวิชาที่ระบุ' 
      });
    }

    // Skip duplicate check for better performance - let frontend handle it
    // Note: Duplicate submissions will be handled by the business logic later
    console.log(`⚡ [${new Date().toISOString()}] Skipping duplicate check for faster performance`);

    console.log(`🔍 [${new Date().toISOString()}] Data validation completed`);;

    // Save file with new naming convention and folder structure
    console.log(`💾 [${new Date().toISOString()}] Saving file to subject folder...`);
    
    // สร้างชื่อไฟล์ใหม่: เลขนักเรียน_ชื่อ-นามสกุล_ชื่องาน
    const fileName = fileManager.generateFileName(
      req.user.studentId,
      req.user.name,
      assignment.title,
      req.file.originalname
    );
    
    // บันทึกไฟล์ในโฟลเดอร์งานที่ถูกต้อง
    const fileResult = await fileManager.saveFile(
      req.file.buffer,
      fileName,
      subject.name,
      subject.class,
      assignment.title
    );
    
    var fileUrl = `${req.protocol}://${req.get('host')}/uploads/${fileResult.relativePath}`;
    
    const fileUploadTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] File saved locally: ${fileName} in ${fileUploadTime - dataLoadTime}ms`);

    // Calculate score (subject.scorePerAssignment or fallback calculation)
    const score = subject.scorePerAssignment || (
      subject.totalAssignments > 0 ? subject.maxScore / subject.totalAssignments : 0
    );

    // Save submission to sheets (with mock file URL)
    const submissionData = {
      studentId: req.user.studentId,
      assignmentId,
      subjectId,
      fileName: fileName,
      fileUrl: fileUrl,
      score: score
    };

    console.log(`📝 [${new Date().toISOString()}] Saving submission to Google Sheets...`);
    // Use fast submission creation (background score processing)
    await sheetsService.createSubmissionFast(submissionData);

    const submissionSaveTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Submission saved in ${submissionSaveTime - fileUploadTime}ms`);
    console.log(`🎉 [${new Date().toISOString()}] Total process time: ${submissionSaveTime - startTime}ms`);

    res.json({
      success: true,
      message: `ส่งงานเรียบร้อยแล้ว ได้คะแนน ${score} คะแนน (ระบบกำลังอัปเดตคะแนนรวมในเบื้องหลัง)`,
      data: {
        submission: submissionData,
        score: score,
        fileUrl: fileUrl
      }
    });
  } catch (error) {
    const errorTime = Date.now();
    console.error(`❌ [${new Date().toISOString()}] Submit assignment error after ${errorTime - startTime}ms:`, error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งงาน' });
  }
});

// Get documents for download
router.get('/documents', authenticateStudent, async (req, res) => {
  try {
    const documents = await sheetsService.getDocuments();
    const subjects = await sheetsService.getSubjects();
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => 
      subject.class === req.user.class
    );
    
    const availableDocuments = documents.filter(doc => 
      !doc.subjectId || // General documents
      studentSubjects.some(subject => subject.id === doc.subjectId)
    );
    
    // Enrich documents with subject name
    const enrichedDocuments = availableDocuments.map(doc => {
      const subject = subjects.find(s => s.id === doc.subjectId);
      return {
        ...doc,
        subjectName: subject ? subject.name : 'ทั่วไป'
      };
    });
    
    res.json({ success: true, data: enrichedDocuments });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร' });
  }
});

// Get score data for all students in class (like teacher's submission view)
router.get('/scores', authenticateStudent, async (req, res) => {
  try {
    const [subjects, assignments, submissions, students] = await Promise.all([
      sheetsService.getSubjects(),
      sheetsService.getAssignments(),
      sheetsService.getSubmissions(),
      sheetsService.getStudents()
    ]);
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => 
      subject.class === req.user.class
    );
    
    // Get all students in the same class
    const classStudents = students.filter(student => 
      student.class === req.user.class
    );

    // Get assignments for student's subjects
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subjectId) &&
      assignment.isActive === true
    );

    // Calculate scores for each subject (showing all students in class)
    const subjectScores = studentSubjects.map(subject => {
      const subjectAssignments = studentAssignments.filter(a => a.subjectId === subject.id);
      
      // Get all submissions for this subject
      const subjectSubmissions = submissions.filter(s => 
        subjectAssignments.some(a => a.id === s.assignmentId)
      );

      const assignments = subjectAssignments
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .map(assignment => ({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxScore: assignment.score || 0
        }));

      // Calculate scores for all students in class
      const studentScores = classStudents.map(student => {
        const studentSubmissions = subjectSubmissions.filter(s => s.studentId === student.studentId);
        
        const assignmentScores = assignments.map(assignment => {
          const submission = studentSubmissions.find(s => s.assignmentId === assignment.assignmentId);
          return {
            assignmentId: assignment.assignmentId,
            assignmentTitle: assignment.assignmentTitle,
            maxScore: assignment.maxScore,
            studentScore: submission ? submission.score : 0,
            isSubmitted: !!submission,
            submittedAt: submission ? submission.submittedAt : null
          };
        });

        const totalScore = assignmentScores.reduce((sum, item) => sum + item.studentScore, 0);
        const maxTotalScore = assignmentScores.reduce((sum, item) => sum + item.maxScore, 0);

        return {
          studentId: student.studentId,
          studentName: student.name,
          class: student.class,
          assignments: assignmentScores,
          totalScore,
          maxTotalScore,
          percentage: maxTotalScore > 0 ? (totalScore / maxTotalScore * 100).toFixed(1) : '0.0'
        };
      });

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        class: subject.class,
        assignments: assignments,
        students: studentScores
      };
    });
    
    res.json({ success: true, data: subjectScores });
  } catch (error) {
    console.error('Get score data error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน' });
  }
});

module.exports = router;