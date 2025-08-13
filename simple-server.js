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

// Import JSON database directly
const jsonDatabase = require('./backend/services/jsonDatabase');

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Assignment Submission System (JSON Database)',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: 'JSON File Database'
  });
});

// Simple Authentication middleware
const authenticate = async (req, res, next) => {
  const { username, password, studentid, studentId } = req.headers;
  
  if (username && password) {
    // Teacher auth
    if (username === 'admin' && password === 'password123') {
      req.user = { type: 'teacher', username };
      return next();
    } else {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
  } else if (studentid || studentId) {
    // Student auth
    const finalStudentId = studentid || studentId;
    try {
      const students = await jsonDatabase.getStudents();
      const student = students.find(s => s.studentId === finalStudentId);
      if (student) {
        req.user = { 
          type: 'student', 
          studentId: student.studentId,
          name: student.name,
          class: student.class
        };
        return next();
      } else {
        return res.status(401).json({ success: false, message: 'ไม่พบเลขประจำตัวนักเรียนในระบบ' });
      }
    } catch (error) {
      return res.status(401).json({ success: false, message: 'ไม่สามารถตรวจสอบข้อมูลได้' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'กรุณาระบุข้อมูลการเข้าสู่ระบบ' });
  }
};

// Student Routes
app.post('/api/student/login', authenticate, (req, res) => {
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

app.get('/api/student/dashboard', authenticate, async (req, res) => {
  try {
    const [subjects, assignments, submissions] = await Promise.all([
      jsonDatabase.getSubjects(),
      jsonDatabase.getAssignments(),
      jsonDatabase.getSubmissions()
    ]);
    
    const studentSubjects = subjects.filter(subject => subject.class === req.user.class);
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subjectId) && assignment.isActive === true
    );
    const studentSubmissions = submissions.filter(submission => submission.studentId === req.user.studentId);
    
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
      student: {
        studentId: req.user.studentId,
        name: req.user.name,
        class: req.user.class
      },
      subjects: studentSubjects,
      assignments: enrichedAssignments,
      totalScore: studentSubmissions.reduce((sum, sub) => sum + sub.score, 0)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// Teacher Routes
app.get('/api/teacher/subjects', authenticate, async (req, res) => {
  try {
    const subjects = await jsonDatabase.getSubjects();
    res.json({ success: true, data: subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิชา' });
  }
});

app.get('/api/teacher/students', authenticate, async (req, res) => {
  try {
    const students = await jsonDatabase.getStudents();
    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
  }
});

app.get('/api/teacher/assignments', authenticate, async (req, res) => {
  try {
    const assignments = await jsonDatabase.getAssignments();
    res.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' });
  }
});

app.get('/api/teacher/submissions', authenticate, async (req, res) => {
  try {
    const submissions = await jsonDatabase.getSubmissions();
    res.json({ success: true, data: submissions });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่งงาน' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Assignment System with JSON Database is running',
    timestamp: new Date().toISOString()
  });
});

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
  console.log(`🚀 Simple Server running on port ${PORT}`);
  console.log(`📋 Assignment System with JSON Database Started`);
  console.log(`🗃️  Using JSON File Database (No external dependencies)`);
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