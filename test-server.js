const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Simple CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://wondrous-piroshki-96cc9e.netlify.app');
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
      user: { studentId: studentId, name: `Student ${studentId}` }
    });
  } else {
    res.status(400).json({ success: false, message: 'Student ID required' });
  }
});

// Teacher login endpoint  
app.get('/api/teacher/subjects', (req, res) => {
  const { username, password } = req.headers;
  if (username && password) {
    res.json({
      success: true,
      message: 'Teacher login successful',
      subjects: ['วิทยาศาสตร์', 'คณิตศาสตร์', 'ภาษาไทย']
    });
  } else {
    res.status(401).json({ success: false, message: 'Authentication required' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
});