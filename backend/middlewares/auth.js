const { ADMIN_USERNAME, ADMIN_PASSWORD } = require('../config/constants');
const supabaseDatabase = require('../services/supabaseDatabase');

// Teacher Authentication
const authenticateTeacher = (req, res, next) => {
  const { username, password } = req.headers;
  
  if (!username || !password) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาระบุชื่อผู้ใช้และรหัสผ่าน' 
    });
  }
  
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ 
      success: false, 
      message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' 
    });
  }
  
  req.user = { type: 'teacher', username };
  next();
};

// Student Authentication
const authenticateStudent = async (req, res, next) => {
  console.log(`🔒 [AUTH DEBUG] Headers:`, req.headers);
  
  const { studentId, studentid } = req.headers;
  const finalStudentId = studentId || studentid;
  
  console.log(`🔒 [AUTH DEBUG] Student ID from headers: ${finalStudentId}`);
  
  if (!finalStudentId) {
    console.log(`❌ [AUTH DEBUG] No student ID provided`);
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาระบุเลขประจำตัวนักเรียน' 
    });
  }
  
  try {
    console.log(`🔒 [AUTH DEBUG] Fetching students from database...`);
    const students = await supabaseDatabase.getStudents();
    console.log(`🔒 [AUTH DEBUG] Found ${students?.length || 0} students`);
    
    // If we can't get students data, reject authentication
    if (!students || students.length === 0) {
      console.log(`❌ [AUTH DEBUG] No students in database`);
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่สามารถเชื่อมต่อกับฐานข้อมูลนักเรียน' 
      });
    }
    
    const student = students.find(s => s.student_id === finalStudentId);
    console.log(`🔒 [AUTH DEBUG] Student lookup result:`, student ? 'FOUND' : 'NOT FOUND');
    
    if (!student) {
      console.log(`❌ [AUTH DEBUG] Student ${finalStudentId} not found in database`);
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบเลขประจำตัวนักเรียนในระบบ' 
      });
    }
    
    console.log(`✅ [AUTH DEBUG] Authentication successful for student ${finalStudentId}`);
    req.user = { 
      type: 'student', 
      studentId: student.student_id,
      name: student.name,
      class: student.class,
      subjects: student.subjects ? student.subjects.split(',') : []
    };
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    // Return 401 instead of 500 to prevent fake logins
    return res.status(401).json({ 
      success: false, 
      message: 'ไม่สามารถตรวจสอบข้อมูลนักเรียนได้ กรุณาลองใหม่อีกครั้ง' 
    });
  }
};

module.exports = {
  authenticateTeacher,
  authenticateStudent
};