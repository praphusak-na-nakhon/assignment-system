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

// Student Authentication with Supabase
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
    
    // If we can't get students data, reject authentication
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
      id: student.id, // UUID for database operations
      name: student.name,
      class: student.class,
      subjects: [] // We'll populate this if needed
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