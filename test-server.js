const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple CORS headers
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
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, username, password, studentId, studentid');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Test server is working!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API test endpoint working!',
    cors: 'enabled'
  });
});

// Student login endpoint
app.post('/api/student/login', (req, res) => {
  const studentId = req.headers.studentid || req.headers.studentId;
  if (studentId) {
    res.json({
      success: true,
      message: 'Student login successful',
      data: { 
        studentId: studentId, 
        name: `นักเรียน ${studentId}`,
        class: 'ม.1/1',
        subjects: []
      }
    });
  } else {
    res.status(400).json({ success: false, message: 'กรุณาระบุเลขประจำตัวนักเรียน' });
  }
});

// Teacher login endpoint  
app.get('/api/teacher/subjects', (req, res) => {
  const { username, password } = req.headers;
  if (username && password) {
    res.json({
      success: true,
      message: 'Teacher login successful',
      data: [
        { id: '1', name: 'วิทยาศาสตร์', class: 'ม.1/1', maxScore: 100, totalAssignments: 3 },
        { id: '2', name: 'คณิตศาสตร์', class: 'ม.1/1', maxScore: 100, totalAssignments: 2 },
        { id: '3', name: 'ภาษาไทย', class: 'ม.1/2', maxScore: 100, totalAssignments: 2 }
      ]
    });
  } else {
    res.status(401).json({ success: false, message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน' });
  }
});

// Mock teacher endpoints
app.get('/api/teacher/students', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: '19450', studentId: '19450', name: 'เด็กหญิงกัสนี บุตรโกบ', class: 'ม.1/1', totalScore: 0 },
      { id: '19451', studentId: '19451', name: 'เด็กหญิงกานต์ธิดา ตี้กุล', class: 'ม.1/1', totalScore: 0 },
      { id: '19452', studentId: '19452', name: 'เด็กหญิงจิณณพัด ชายกุล', class: 'ม.1/2', totalScore: 0 }
    ]
  });
});

app.get('/api/teacher/assignments', (req, res) => {
  res.json({
    success: true,
    assignments: [
      { id: 1, title: 'การบ้านที่ 1', subject: 'วิทยาศาสตร์', dueDate: '2025-08-15' },
      { id: 2, title: 'การบ้านที่ 2', subject: 'คณิตศาสตร์', dueDate: '2025-08-20' }
    ]
  });
});

app.get('/api/teacher/submissions', (req, res) => {
  res.json({
    success: true,
    submissions: [
      { id: 1, studentId: '19450', assignmentTitle: 'การบ้านที่ 1', status: 'submitted', submittedAt: '2025-08-12' },
      { id: 2, studentId: '19451', assignmentTitle: 'การบ้านที่ 1', status: 'pending' }
    ]
  });
});

// Mock student endpoints with JSON database
const jsonDatabase = require('./backend/services/jsonDatabase');

app.get('/api/student/dashboard', async (req, res) => {
  try {
    const studentId = req.headers.studentid || req.headers.studentId || '19450';
    
    const [subjects, assignments, submissions, students] = await Promise.all([
      jsonDatabase.getSubjects(),
      jsonDatabase.getAssignments(), 
      jsonDatabase.getSubmissions(),
      jsonDatabase.getStudents()
    ]);
    
    const student = students.find(s => s.studentId === studentId) || students[0];
    const studentSubjects = subjects.filter(subject => subject.class === student.class);
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subjectId) && assignment.isActive === true
    );
    const studentSubmissions = submissions.filter(submission => submission.studentId === student.studentId);
    
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
        studentId: student.studentId,
        name: student.name,
        class: student.class
      },
      subjects: studentSubjects,
      assignments: enrichedAssignments,
      totalScore: studentSubmissions.reduce((sum, sub) => sum + sub.score, 0)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.json({
      success: true,
      student: { studentId: '19450', name: 'นักเรียน 19450', class: 'ม.1/1' },
      subjects: [],
      assignments: [],
      totalScore: 0
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});