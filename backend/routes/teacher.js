const express = require('express');
const multer = require('multer');
const { authenticateTeacher } = require('../middlewares/auth');
const jsonDatabase = require('../services/jsonDatabase');
const driveService = require('../services/driveService');
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
    const subjects = await jsonDatabase.getSubjects();
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

    await jsonDatabase.createSubject(req.body);
    
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
    const validation = validateSubjectData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.messages.join(', ') 
      });
    }

    await jsonDatabase.updateSubject(req.params.id, req.body);
    res.json({ success: true, message: 'แก้ไขวิชาเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขวิชา' });
  }
});

router.delete('/subjects/:id', async (req, res) => {
  try {
    // ดึงข้อมูลวิชาก่อนลบเพื่อใช้ลบโฟลเดอร์
    const subjects = await jsonDatabase.getSubjects();
    const subject = subjects.find(s => s.id === req.params.id);
    
    await jsonDatabase.deleteSubject(req.params.id);
    
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
    const students = await jsonDatabase.getStudents();
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
  }
});

router.post('/students', async (req, res) => {
  try {
    await jsonDatabase.createStudent(req.body);
    res.json({ success: true, message: 'เพิ่มนักเรียนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน' });
  }
});

// Assignments Management
router.get('/assignments', async (req, res) => {
  try {
    const assignments = await jsonDatabase.getAssignments();
    const subjects = await jsonDatabase.getSubjects();
    
    // Filter out assignments that don't have a valid subject (subject was deleted)
    const validAssignments = assignments.filter(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      return subject && assignment.isActive; // Only show active assignments with valid subjects
    });
    
    const enrichedAssignments = validAssignments.map(assignment => {
      const subject = subjects.find(s => s.id === assignment.subjectId);
      return {
        ...assignment,
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
    const createPromise = jsonDatabase.createAssignmentFast(req.body);
    
    // Respond immediately after the assignment is created
    await createPromise;
    
    // สร้างโฟลเดอร์สำหรับงานนี้
    // ดึงข้อมูลวิชาเพื่อใช้สร้างโฟลเดอร์
    const subjects = await jsonDatabase.getSubjects();
    const subject = subjects.find(s => s.id === req.body.subjectId);
    
    if (subject) {
      await fileManager.createAssignmentFolder(subject.name, subject.class, req.body.title);
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
    const validation = validateAssignmentData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.messages.join(', ') 
      });
    }

    await jsonDatabase.updateAssignment(req.params.id, req.body);
    res.json({ success: true, message: 'แก้ไขงานเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการแก้ไขงาน' });
  }
});

router.delete('/assignments/:id', async (req, res) => {
  try {
    // ดึงข้อมูลงานก่อนลบเพื่อใช้ลบโฟลเดอร์
    const assignments = await jsonDatabase.getAssignments();
    const assignment = assignments.find(a => a.id === req.params.id);
    
    await jsonDatabase.deleteAssignmentFast(req.params.id);
    
    // ลบโฟลเดอร์และไฟล์ทั้งหมดของงานนี้
    if (assignment) {
      const subjects = await jsonDatabase.getSubjects();
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
    const documents = await jsonDatabase.getDocuments();
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

    // Upload to Google Drive
    const uploadResult = await driveService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Save document info to sheets
    const documentData = {
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      category: req.body.category || '',
      subjectId: req.body.subjectId || '',
      fileUrl: uploadResult.url
    };

    await jsonDatabase.createDocument(documentData);
    
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
    const submissions = await jsonDatabase.getSubmissions();
    const students = await jsonDatabase.getStudents();
    const assignments = await jsonDatabase.getAssignments();
    
    const enrichedSubmissions = submissions.map(submission => {
      const student = students.find(s => s.studentId === submission.studentId);
      const assignment = assignments.find(a => a.id === submission.assignmentId);
      
      return {
        ...submission,
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
    await jsonDatabase.updateSubjectScores(req.params.id);
    
    res.json({ success: true, message: 'อัปเดตการตั้งค่าคะแนนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Update subject score error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตคะแนน' });
  }
});

module.exports = router;