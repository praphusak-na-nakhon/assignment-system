const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for deployment
app.set('trust proxy', 1);

// CORS configuration
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://wondrous-piroshki-96cc9e.netlify.app',
    'https://assignment-system-one.vercel.app'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://wondrous-piroshki-96cc9e.netlify.app',
    'https://assignment-system-one.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'studentId', 'username', 'password']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import Supabase services
const supabaseDatabase = require('./services/supabaseDatabase');
const { authenticateTeacher, authenticateStudent } = require('./middlewares/auth');

// Import route modules
const studentRoutes = require('./routes/student');
const teacherRoutes = require('./routes/teacher');

// Health check
app.get('/', async (req, res) => {
  const dbHealth = await supabaseDatabase.healthCheck();
  res.json({ 
    success: true, 
    message: 'Assignment System (Supabase Database)',
    version: '3.1.0',
    timestamp: new Date().toISOString(),
    database: 'Supabase PostgreSQL',
    dbHealth: dbHealth
  });
});

// Use route modules
try {
  app.use('/api/student', studentRoutes);
  app.use('/api/teacher', teacherRoutes);
  console.log('✅ Route modules loaded successfully');
} catch (error) {
  console.error('❌ Failed to load route modules:', error);
}

// Fallback student submit route (if routes/student.js fails to load)
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10485760 } });

app.post('/api/student/submit', authenticateStudent, upload.single('file'), async (req, res) => {
  console.log('🔄 [FALLBACK] Student submit route called');
  console.log('📊 [FALLBACK] Request body:', req.body);
  console.log('📁 [FALLBACK] File:', req.file ? { name: req.file.originalname, size: req.file.size } : 'No file');
  console.log('👤 [FALLBACK] User:', req.user);
  
  return res.status(500).json({ 
    success: false, 
    message: 'Fallback route - routes/student.js failed to load properly' 
  });
});

// Health check
app.get('/api/health', async (req, res) => {
  const dbHealth = await supabaseDatabase.healthCheck();
  res.json({ 
    success: true, 
    message: 'Assignment System with Supabase Database is running',
    timestamp: new Date().toISOString(),
    database: dbHealth
  });
});

// Test endpoint for debugging
app.get('/api/test-score-update', async (req, res) => {
  try {
    await supabaseDatabase.testAssignmentScoreUpdate();
    res.json({
      success: true,
      message: 'Test completed - check backend logs'
    });
  } catch (error) {
    console.error('Test failed:', error);
    res.status(500).json({
      success: false,
      message: 'Test failed',
      error: error.message
    });
  }
});

// Student Routes
app.post('/api/student/login', authenticateStudent, (req, res) => {
  res.json({
    success: true,
    message: 'Student login successful',
    data: {
      studentId: req.user.studentId,
      name: req.user.name,
      class: req.user.class,
      subjects: []
    }
  });
});

// Student routes are now handled by routes/student.js module
/* app.get('/api/student/dashboard', authenticateStudent, async (req, res) => {
  try {
    const [subjects, assignments, submissions] = await Promise.all([
      supabaseDatabase.getSubjects(),
      supabaseDatabase.getAssignments(),
      supabaseDatabase.getSubmissions()
    ]);
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => subject.class === req.user.class);
    
    // Get assignments for student's subjects (only active assignments)
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subject_id) && assignment.is_active === true
    );
    
    // Get student's submissions
    const studentSubmissions = submissions.filter(submission => 
      submission.students && submission.students.student_id === req.user.studentId
    );
    
    // Enrich assignments with submission status
    const enrichedAssignments = studentAssignments.map(assignment => {
      const subject = studentSubjects.find(s => s.id === assignment.subject_id);
      const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        score: assignment.score,
        subjectId: assignment.subject_id,
        subjectName: subject ? subject.name : 'ไม่ทราบ',
        subjectClass: subject ? subject.class : 'ไม่ทราบ',
        isSubmitted: !!submission,
        submissionScore: submission ? submission.score : 0,
        submittedAt: submission ? submission.submitted_at : null
      };
    });
    
    res.json({
      success: true,
      student: {
        studentId: req.user.studentId,
        name: req.user.name,
        class: req.user.class
      },
      subjects: studentSubjects.map(s => ({ 
        id: s.id, 
        name: s.name, 
        class: s.class,
        maxScore: s.max_score,
        totalAssignments: s.total_assignments
      })),
      assignments: enrichedAssignments,
      totalScore: studentSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
}); */

/* app.get('/api/student/documents', authenticateStudent, async (req, res) => {
  try {
    const [documents, subjects] = await Promise.all([
      supabaseDatabase.getDocuments(),
      supabaseDatabase.getSubjects()
    ]);
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => subject.class === req.user.class);
    
    const availableDocuments = documents.filter(doc => 
      !doc.subject_id || // General documents
      studentSubjects.some(subject => subject.id === doc.subject_id)
    );
    
    // Enrich documents with subject name
    const enrichedDocuments = availableDocuments.map(doc => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      fileUrl: doc.file_url,
      uploadedAt: doc.uploaded_at,
      subjectName: doc.subjects ? doc.subjects.name : 'ทั่วไป'
    }));
    
    res.json({ success: true, data: enrichedDocuments });
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเอกสาร' });
  }
}); */

/* app.get('/api/student/scores', authenticateStudent, async (req, res) => {
  try {
    const [subjects, assignments, submissions, students] = await Promise.all([
      supabaseDatabase.getSubjects(),
      supabaseDatabase.getAssignments(),
      supabaseDatabase.getSubmissions(),
      supabaseDatabase.getStudents()
    ]);
    
    // Filter subjects by student's class
    const studentSubjects = subjects.filter(subject => subject.class === req.user.class);
    
    // Get all students in the same class
    const classStudents = students.filter(student => student.class === req.user.class);

    // Get assignments for student's subjects
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subject_id) && assignment.is_active === true
    );

    // Calculate scores for each subject (showing all students in class)
    const subjectScores = studentSubjects.map(subject => {
      const subjectAssignments = studentAssignments.filter(a => a.subject_id === subject.id);
      
      // Get all submissions for this subject
      const subjectSubmissions = submissions.filter(s => 
        subjectAssignments.some(a => a.id === s.assignment_id)
      );

      const assignmentList = subjectAssignments
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(assignment => ({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxScore: assignment.score || 0
        }));

      // Calculate scores for all students in class
      const studentScores = classStudents.map(student => {
        const studentSubmissions = subjectSubmissions.filter(s => 
          s.students && s.students.student_id === student.student_id
        );
        
        const assignmentScores = assignmentList.map(assignment => {
          const submission = studentSubmissions.find(s => s.assignment_id === assignment.assignmentId);
          return {
            assignmentId: assignment.assignmentId,
            assignmentTitle: assignment.assignmentTitle,
            maxScore: assignment.maxScore,
            studentScore: submission ? submission.score : 0,
            isSubmitted: !!submission,
            submittedAt: submission ? submission.submitted_at : null
          };
        });

        const totalScore = assignmentScores.reduce((sum, item) => sum + item.studentScore, 0);
        const maxTotalScore = assignmentScores.reduce((sum, item) => sum + item.maxScore, 0);

        return {
          studentId: student.student_id,
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
        assignments: assignmentList,
        students: studentScores
      };
    });
    
    res.json({ success: true, data: subjectScores });
  } catch (error) {
    console.error('Get score data error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคะแนน' });
  }
}); */


// All teacher routes are now handled by routes/teacher.js module

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'ไม่พบเส้นทาง API ที่ระบุ'
  });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Supabase Server running on port ${PORT}`);
  console.log(`📋 Assignment System with Supabase Database Started`);
  console.log(`🗃️  Using Supabase PostgreSQL Database`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;