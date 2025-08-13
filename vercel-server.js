const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

// Trust proxy for deployment
app.set('trust proxy', 1);

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://dsqcgrkvoyiqanzicpgz.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcWNncmt2b3lpcWFuemljcGd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwOTkxNzksImV4cCI6MjA3MDY3NTE3OX0.YPbI4oz80Ukkgq-7EVnG9oK_tNpAOkzWlSizEJUNklw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`🔗 Supabase client initialized for Vercel deployment`);

// Simple database service
const supabaseDatabase = {
  async getStudents() {
    console.log('📊 [Supabase] Fetching students...');
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('student_id', { ascending: true });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} students`);
    return data;
  },

  async getSubjects() {
    console.log('📊 [Supabase] Fetching subjects...');
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} subjects`);
    return data;
  },

  async getAssignments() {
    console.log('📊 [Supabase] Fetching assignments...');
    const { data, error } = await supabase
      .from('assignments')
      .select(`
        *,
        subjects (
          name,
          class
        )
      `)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} assignments`);
    return data;
  },

  async getSubmissions() {
    console.log('📊 [Supabase] Fetching submissions...');
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        students (
          student_id,
          name,
          class
        ),
        assignments (
          title,
          due_date
        ),
        subjects (
          name
        )
      `)
      .order('submitted_at', { ascending: false });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} submissions`);
    return data;
  },

  async getDocuments() {
    console.log('📊 [Supabase] Fetching documents...');
    const { data, error } = await supabase
      .from('documents')
      .select(`
        *,
        subjects (
          name
        )
      `)
      .order('uploaded_at', { ascending: false });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} documents`);
    return data;
  },

  async createSubmission(submissionData) {
    console.log('📝 [Supabase] Creating submission...');
    
    // Get student UUID from student_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('student_id', submissionData.studentId)
      .single();
    
    if (studentError) throw studentError;

    // Check for existing submission
    const { data: existing } = await supabase
      .from('submissions')
      .select('id, score')
      .eq('student_id', student.id)
      .eq('assignment_id', submissionData.assignmentId)
      .single();

    let result;
    if (existing) {
      // Update existing submission
      const { data, error } = await supabase
        .from('submissions')
        .update({
          file_name: submissionData.fileName,
          file_url: submissionData.fileUrl,
          score: submissionData.score || 0,
          cloudinary_id: submissionData.cloudinaryId || '',
          thumbnail_url: submissionData.thumbnailUrl || '',
          submitted_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create new submission
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          student_id: student.id,
          assignment_id: submissionData.assignmentId,
          subject_id: submissionData.subjectId,
          file_name: submissionData.fileName,
          file_url: submissionData.fileUrl,
          score: submissionData.score || 0,
          cloudinary_id: submissionData.cloudinaryId || '',
          thumbnail_url: submissionData.thumbnailUrl || ''
        })
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    console.log('✅ [Supabase] Submission saved successfully');
    return result;
  }
};

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
    const students = await supabaseDatabase.getStudents();
    
    if (!students || students.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลนักเรียน' 
      });
    }
    
    const student = students.find(s => s.student_id === finalStudentId);
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบเลขประจำตัวนักเรียนในระบบ' 
      });
    }
    
    req.user = { 
      type: 'student', 
      studentId: student.student_id,
      id: student.id,
      name: student.name,
      class: student.class,
      subjects: []
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
      version: '3.1.0',
      timestamp: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      dbHealth: {
        status: error ? 'error' : 'healthy',
        connection: 'ok',
        studentCount: count || 0
      }
    });
  } catch (error) {
    res.json({ 
      success: true, 
      message: 'Assignment System (Supabase Database)',
      version: '3.1.0',
      timestamp: new Date().toISOString(),
      database: 'Supabase PostgreSQL',
      dbHealth: {
        status: 'error',
        connection: 'failed',
        error: error.message
      }
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
});

app.get('/api/student/documents', authenticateStudent, async (req, res) => {
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
});

app.get('/api/student/scores', authenticateStudent, async (req, res) => {
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
});

app.post('/api/student/submit', authenticateStudent, async (req, res) => {
  try {
    const { assignmentId, subjectId, fileName, fileUrl, cloudinaryId, thumbnailUrl } = req.body;
    
    if (!assignmentId || !subjectId || !fileName || !fileUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน' 
      });
    }
    
    const newSubmission = await supabaseDatabase.createSubmission({
      studentId: req.user.studentId,
      assignmentId,
      subjectId,
      fileName,
      fileUrl,
      cloudinaryId,
      thumbnailUrl,
      score: 0 // Default score, teacher will update later
    });
    
    res.json({ success: true, data: newSubmission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการส่งงาน' });
  }
});

// Teacher Routes
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
    const students = await supabaseDatabase.getStudents();
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
    const assignments = await supabaseDatabase.getAssignments();
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
    const submissions = await supabaseDatabase.getSubmissions();
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