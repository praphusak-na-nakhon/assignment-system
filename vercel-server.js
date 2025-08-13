const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://dsqcgrkvoyiqanzicpgz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcWNncmt2b3lpcWFuemljcGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTkxNzksImV4cCI6MjA3MDY3NTE3OX0.YPbI4oz80Ukkgq-7EVnG9oK_tNpAOkzWlSizEJUNklw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔗 Supabase client initialized for Vercel deployment`);

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

// Authentication middleware
const authenticateTeacher = (req, res, next) => {
  const { username, password } = req.headers;
  
  if (!username || !password) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน' 
    });
  }
  
  if (username !== 'admin' || password !== 'password123') {
    return res.status(401).json({ 
      success: false, 
      message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
    });
  }
  
  req.user = { type: 'teacher', username };
  next();
};

const authenticateStudent = async (req, res, next) => {
  const { studentId, studentid } = req.headers;
  const finalStudentId = studentId || studentid;
  
  if (!finalStudentId) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาระบุเลขประจำตัวนักเรียน' 
    });
  }
  
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('student_id', finalStudentId);
    
    if (error) throw error;
    
    if (!students || students.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบเลขประจำตัวนักเรียนในระบบ' 
      });
    }
    
    const student = students[0];
    req.user = { 
      type: 'student', 
      studentId: student.student_id,
      id: student.id,
      name: student.name,
      class: student.class
    };
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'ไม่สามารถตรวจสอบข้อมูลนักเรียนได้ กรุณาลองใหม่อีกครั้ง' 
    });
  }
};

// Root endpoint
app.get('/', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      success: true, 
      message: 'Assignment System (Supabase Database)',
      version: '3.0.0-vercel',
      timestamp: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      studentCount: count || 0,
      status: error ? 'error' : 'healthy'
    });
  } catch (error) {
    res.json({ 
      success: true, 
      message: 'Assignment System (Supabase Database)',
      version: '3.0.0-vercel',
      timestamp: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      status: 'error',
      error: error.message
    });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    res.json({ 
      success: true, 
      message: 'Assignment System with Supabase Database is running',
      timestamp: new Date().toISOString(),
      database: {
        status: error ? 'error' : 'healthy',
        connection: 'ok',
        studentCount: count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection error',
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

app.get('/api/student/dashboard', authenticateStudent, async (req, res) => {
  try {
    // Get subjects for student's class
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .eq('class', req.user.class);
    
    if (subjectsError) throw subjectsError;
    
    // Get assignments for these subjects
    const subjectIds = subjects.map(s => s.id);
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        subjects (name, class)
      `)
      .in('subject_id', subjectIds)
      .eq('is_active', true);
    
    if (assignmentsError) throw assignmentsError;
    
    // Get student's submissions
    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', req.user.id)
      .in('assignment_id', assignmentIds);
    
    if (submissionsError) throw submissionsError;
    
    // Enrich assignments with submission status
    const enrichedAssignments = assignments.map(assignment => {
      const submission = submissions.find(s => s.assignment_id === assignment.id);
      
      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.due_date,
        score: assignment.score,
        subjectName: assignment.subjects.name,
        subjectClass: assignment.subjects.class,
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
      subjects: subjects.map(s => ({ 
        id: s.id, 
        name: s.name, 
        class: s.class,
        maxScore: s.max_score,
        totalAssignments: s.total_assignments
      })),
      assignments: enrichedAssignments,
      totalScore: submissions.reduce((sum, sub) => sum + (sub.score || 0), 0)
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
});

// Teacher Routes
app.get('/api/teacher/subjects', authenticateTeacher, async (req, res) => {
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      message: 'Teacher login successful',
      data: subjects.map(s => ({
        id: s.id,
        name: s.name,
        class: s.class,
        maxScore: s.max_score,
        totalAssignments: s.total_assignments,
        scorePerAssignment: s.score_per_assignment,
        scoreSheetUrl: s.score_sheet_url || ''
      }))
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลวิชา' });
  }
});

app.get('/api/teacher/students', authenticateTeacher, async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .order('student_id', { ascending: true });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: students.map(s => ({
        id: s.id,
        studentId: s.student_id,
        name: s.name,
        class: s.class,
        subjects: '',
        totalScore: s.total_score
      }))
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน' });
  }
});

app.get('/api/teacher/assignments', authenticateTeacher, async (req, res) => {
  try {
    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subjects (name, class)
      `)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: assignments.map(a => ({
        id: a.id,
        subjectId: a.subject_id,
        title: a.title,
        description: a.description,
        dueDate: a.due_date,
        score: a.score,
        isActive: a.is_active,
        createdAt: a.created_at,
        subjectName: a.subjects ? a.subjects.name : '',
        subjectClass: a.subjects ? a.subjects.class : ''
      }))
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลงาน' });
  }
});

app.get('/api/teacher/submissions', authenticateTeacher, async (req, res) => {
  try {
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        students (student_id, name, class),
        assignments (title, due_date),
        subjects (name)
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    
    res.json({ 
      success: true, 
      data: submissions.map(s => ({
        id: s.id,
        studentId: s.students ? s.students.student_id : '',
        studentName: s.students ? s.students.name : '',
        assignmentId: s.assignment_id,
        assignmentTitle: s.assignments ? s.assignments.title : '',
        subjectName: s.subjects ? s.subjects.name : '',
        fileName: s.file_name,
        fileUrl: s.file_url,
        score: s.score,
        submittedAt: s.submitted_at
      }))
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการส่งงาน' });
  }
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

// For Vercel serverless function
module.exports = app;

// For local testing
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Vercel Server running on port ${PORT}`);
  });
}