const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Import Supabase services
const supabaseDatabase = require('./backend/services/supabaseDatabase');
const { authenticateTeacher, authenticateStudent } = require('./backend/middlewares/supabaseAuth');

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

// Student login endpoint with Supabase
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

// Teacher login endpoint with Supabase  
app.get('/api/teacher/subjects', authenticateTeacher, async (req, res) => {
  try {
    const subjects = await supabaseDatabase.getSubjects();
    res.json({ 
      success: true, 
      message: 'Teacher login successful',
      data: subjects.map(s => ({
        id: s.id,
        name: s.name,
        class: s.class,
        maxScore: s.max_score,
        totalAssignments: s.total_assignments,
        scorePerAssignment: s.score_per_assignment
      }))
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิชา' });
  }
});

// Teacher endpoints with Supabase
app.get('/api/teacher/students', authenticateTeacher, async (req, res) => {
  try {
    const students = await supabaseDatabase.getStudents();
    res.json({ 
      success: true, 
      data: students.map(s => ({
        id: s.id,
        studentId: s.student_id,
        name: s.name,
        class: s.class,
        subjects: '', // Legacy field
        totalScore: s.total_score
      }))
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
  }
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

// Database is imported at the top

app.get('/api/student/dashboard', authenticateStudent, async (req, res) => {
  try {
    const [subjects, assignments, submissions] = await Promise.all([
      supabaseDatabase.getSubjects(),
      supabaseDatabase.getAssignments(), 
      supabaseDatabase.getSubmissions()
    ]);
    
    const studentSubjects = subjects.filter(subject => subject.class === req.user.class);
    const studentAssignments = assignments.filter(assignment => 
      studentSubjects.some(subject => subject.id === assignment.subject_id) && assignment.is_active === true
    );
    const studentSubmissions = submissions.filter(submission => 
      submission.students && submission.students.student_id === req.user.studentId
    );
    
    const enrichedAssignments = studentAssignments.map(assignment => {
      const subject = studentSubjects.find(s => s.id === assignment.subject_id);
      const submission = studentSubmissions.find(s => s.assignment_id === assignment.id);
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        score: assignment.score,
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