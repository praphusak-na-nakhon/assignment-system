const express = require('express');
const multer = require('multer');
const { authenticateTeacher } = require('../middlewares/auth');
const supabaseDatabase = require('../services/supabaseDatabase');
const cloudinaryService = require('../services/cloudinaryService');
const { validateSubjectData, validateAssignmentData, validateFileUpload } = require('../utils/validation');
const { MAX_FILE_SIZE } = require('../config/constants');
const fileManager = require('../utils/fileManager');

const router = express.Router();

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Apply authentication middleware to all routes
router.use(authenticateTeacher);

// Subjects Management
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await supabaseDatabase.getSubjects();
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิชา' });
  }
});

router.post('/subjects', async (req, res) => {
  try {
    const validation = validateSubjectData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.messages.join(', ') 
      });
    }

    await supabaseDatabase.createSubject(req.body);
    
    // สร้างโฟลเดอร์สำหรับวิชานี้
    await fileManager.createSubjectFolder(req.body.name, req.body.class);
    
    res.json({ success: true, message: 'เพิ่มวิชาเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มวิชา' });
  }
});

router.put('/subjects/:id', async (req, res) => {
  try {
    console.log(`🔄 [Update Subject] ID: ${req.params.id}`);
    console.log(`🔄 [Update Subject] Request body:`, req.body);
    
    try {
      const validation = validateSubjectData(req.body);
      console.log(`🔄 [Update Subject] Validation result:`, validation);
      
      if (!validation.isValid) {
        console.log(`❌ [Update Subject] Validation failed:`, validation.messages);
        return res.status(400).json({ 
          success: false, 
          message: validation.messages.join(', ') 
        });
      }
    } catch (validationError) {
      console.error('❌ [Update Subject] Validation error:', validationError);
      return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล' });
    }

    // Transform frontend field names to database field names  
    const updates = {
      name: req.body.name,
      class: req.body.class
    };

    // Only include max_score if maxScore is provided and convert to number
    if (req.body.maxScore !== undefined && req.body.maxScore !== null && req.body.maxScore !== '') {
      const maxScore = Number(req.body.maxScore);
      console.log(`🔄 [Update Subject] Converting maxScore: ${req.body.maxScore} -> ${maxScore}`);
      if (!isNaN(maxScore) && maxScore > 0) {
        updates.max_score = maxScore;
      } else {
        console.log(`❌ [Update Subject] Invalid maxScore: ${req.body.maxScore}`);
      }
    }

    console.log(`🔄 [Update Subject] Updates to apply:`, updates);
    
    try {
      const result = await supabaseDatabase.updateSubject(req.params.id, updates);
      console.log(`✅ [Update Subject] Success:`, result);
      
      res.json({ success: true, message: 'แก้ไขวิชาเรียบร้อยแล้ว' });
    } catch (dbError) {
      console.error('❌ [Update Subject] Database error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('❌ [Update Subject] Error:', error);
    console.error('❌ [Update Subject] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขวิชา' });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    // ดึงข้อมูลวิชาก่อนลบเพื่อใช้ลบโฟลเดอร์
    const subjects = await supabaseDatabase.getSubjects();
    const subject = subjects.find(s => s.id === req.params.id);
    
    await supabaseDatabase.deleteSubject(req.params.id);
    
    // ลบโฟลเดอร์และไฟล์ทั้งหมดของวิชานี้
    if (subject) {
      await fileManager.deleteSubjectFolder(subject.name, subject.class);
    }
    
    res.json({ success: true, message: 'ลบวิชาเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบวิชา' });
  }
});

// Students Management
router.get('/students', async (req, res) => {
  try {
    const students = await supabaseDatabase.getStudents();
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
  }
});

router.post('/students', async (req, res) => {
  try {
    await supabaseDatabase.createStudent(req.body);
    res.json({ success: true, message: 'เพิ่มนักเรียนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน' });
  }
});

// Assignments Management
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await supabaseDatabase.getAssignments();
    const subjects = await supabaseDatabase.getSubjects();
    
    console.log('🔍 [DEBUG] Raw assignments from DB:', assignments.length > 0 ? assignments[0] : 'No assignments');
    console.log('🔍 [DEBUG] Available assignment fields:', assignments.length > 0 ? Object.keys(assignments[0]) : 'N/A');
    
    // Filter out assignments that don't have a valid subject (subject was deleted)
    const validAssignments = assignments.filter(assignment => {
      const subjectId = assignment.subject_id;
      const isActive = assignment.is_active !== false; // Default to true if undefined
      const subject = subjects.find(s => s.id === subjectId);
      
      console.log(`🔍 [DEBUG] Assignment ${assignment.title}: subjectId=${subjectId}, isActive=${isActive}, hasSubject=${!!subject}`);
      
      return subject && isActive; // Only show active assignments with valid subjects
    });
    
    console.log(`🔍 [DEBUG] Valid assignments after filtering: ${validAssignments.length}`);
    
    const enrichedAssignments = validAssignments.map(assignment => {
      const subjectId = assignment.subject_id;
      const subject = subjects.find(s => s.id === subjectId);
      return {
        ...assignment,
        subjectId: assignment.subject_id,
        isActive: assignment.is_active,
        subjectName: subject.name,
        subjectClass: subject.class
      };
    });
    
    res.json({ success: true, data: enrichedAssignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const validation = validateAssignmentData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.messages.join(', ') 
      });
    }

    // Start the creation process (don't wait for score updates)
    const createPromise = supabaseDatabase.createAssignment(req.body);
    
    // Respond immediately after the assignment is created
    await createPromise;
    
    // สร้างโฟลเดอร์สำหรับงานนี้
    // ดึงข้อมูลวิชาเพื่อใช้สร้างโฟลเดอร์
    const subjects = await supabaseDatabase.getSubjects();
    const subject = subjects.find(s => s.id === req.body.subjectId);
    
    if (subject) {
      await fileManager.createAssignmentFolder(subject.name, subject.class, req.body.title);
    }
    
    // Update subject scores automatically after creating assignment
    console.log(`🔄 [Auto Update] Updating scores for subject ${req.body.subjectId} after creating new assignment`);
    try {
      await supabaseDatabase.updateSubjectAssignmentCount(req.body.subjectId);
      console.log(`✅ [Auto Update] Successfully updated scores for subject ${req.body.subjectId}`);
    } catch (updateError) {
      console.error(`❌ [Auto Update] Failed to update scores for subject ${req.body.subjectId}:`, updateError);
      // Don't fail the assignment creation if score update fails
    }
    
    res.json({ success: true, message: 'เพิ่มงานเรียบร้อยแล้ว' });

  } catch (error) {
    console.error('Create assignment error:', error);
    
    // Handle quota exceeded error specifically
    if (error.status === 429 || error.message?.includes('quota exceeded')) {
      return res.status(429).json({ 
        success: false, 
        message: 'Google Sheets ใช้งานเกินขีดจำกัด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
        retryAfter: 60
      });
    }
    
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มงาน' });
  }
});

router.put('/assignments/:id', async (req, res) => {
  try {
    console.log(`🔄 [Update Assignment] ID: ${req.params.id}`);
    console.log(`🔄 [Update Assignment] Request body:`, req.body);
    
    const validation = validateAssignmentData(req.body);
    console.log(`🔄 [Update Assignment] Validation result:`, validation);
    
    if (!validation.isValid) {
      console.log(`❌ [Update Assignment] Validation failed:`, validation.messages);
      return res.status(400).json({ 
        success: false, 
        message: validation.messages.join(', ') 
      });
    }

    // Transform frontend field names to database field names
    const updates = {
      title: req.body.title,
      description: req.body.description || '',
      subject_id: req.body.subjectId
    };

    // Only include due_date if it's not empty
    if (req.body.dueDate && req.body.dueDate.trim() !== '') {
      updates.due_date = req.body.dueDate;
    }

    console.log(`🔄 [Update Assignment] Updates to apply:`, updates);

    const result = await supabaseDatabase.updateAssignment(req.params.id, updates);
    console.log(`✅ [Update Assignment] Success:`, result);
    
    res.json({ success: true, message: 'แก้ไขงานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('❌ [Update Assignment] Error:', error);
    console.error('❌ [Update Assignment] Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขงาน' });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    // ดึงข้อมูลงานก่อนลบเพื่อใช้ลบโฟลเดอร์
    const assignments = await supabaseDatabase.getAssignments();
    const assignment = assignments.find(a => a.id === req.params.id);
    
    await supabaseDatabase.deleteAssignmentFast(req.params.id);
    
    // ลบโฟลเดอร์และไฟล์ทั้งหมดของงานนี้
    if (assignment) {
      const subjects = await supabaseDatabase.getSubjects();
      const subject = subjects.find(s => s.id === assignment.subjectId);
      
      if (subject) {
        await fileManager.deleteAssignmentFolder(subject.name, subject.class, assignment.title);
      }
    }
    
    res.json({ success: true, message: 'ลบงานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    
    // Handle quota exceeded error specifically
    if (error.status === 429 || error.message?.includes('quota exceeded')) {
      return res.status(429).json({ 
        success: false, 
        message: 'Google Sheets ใช้งานเกินขีดจำกัด กรุณารอสักครู่แล้วลองใหม่อีกครั้ง',
        retryAfter: 60 // seconds
      });
    }
    
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบงาน' });
  }
});

// Documents Management
router.get('/documents', async (req, res) => {
  try {
    const documents = await supabaseDatabase.getDocuments();
    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร' });
  }
});

router.post('/documents', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' });
    }

    const fileValidation = validateFileUpload(req.file);
    if (!fileValidation.isValid) {
      return res.status(400).json({ success: false, message: fileValidation.message });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinaryService.uploadDocument(
      req.file.buffer,
      req.file.originalname,
      'documents'
    );

    // Save document info to database
    const documentData = {
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      category: req.body.category || '',
      subjectId: req.body.subjectId || '',
      fileUrl: uploadResult.secure_url
    };

    await supabaseDatabase.createDocument(documentData);
    
    res.json({ 
      success: true, 
      message: 'อัปโหลดเอกสารเรียบร้อยแล้ว',
      data: { ...documentData, id: uploadResult.id }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลดเอกสาร' });
  }
});

// Submissions
router.get('/submissions', async (req, res) => {
  try {
    const submissions = await supabaseDatabase.getSubmissions();
    const students = await supabaseDatabase.getStudents();
    const assignments = await supabaseDatabase.getAssignments();
    
    const enrichedSubmissions = submissions.map(submission => {
      const student = students.find(s => s.student_id === submission.students?.student_id);
      const assignment = assignments.find(a => a.id === submission.assignment_id);
      
      return {
        ...submission,
        studentId: submission.students?.student_id,
        assignmentId: submission.assignment_id,
        studentName: student ? student.name : 'ไม่ทราบ',
        assignmentTitle: assignment ? assignment.title : 'ไม่ทราบ'
      };
    });
    
    res.json({ success: true, data: enrichedSubmissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่งงาน' });
  }
});

// Update subject score settings
router.put('/subjects/:id/score', async (req, res) => {
  try {
    const { maxScore, scoreSheetUrl } = req.body;
    
    if (!maxScore || maxScore <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณาระบุคะแนนเต็มที่ถูกต้อง' 
      });
    }

    // This would require implementing updateSubject method in sheetsService
    // For now, let's trigger score recalculation
    await supabaseDatabase.updateSubjectScores(req.params.id);
    
    res.json({ success: true, message: 'อัปเดตการตั้งค่าคะแนนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Update subject score error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตคะแนน' });
  }
});

module.exports = router;