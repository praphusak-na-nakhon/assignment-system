const { ADMIN_USERNAME, ADMIN_PASSWORD } = require('../config/constants');
const sheetsService = require('../services/sheetsService');

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
  const { studentId, studentid } = req.headers;
  const finalStudentId = studentId || studentid;
  
  if (!finalStudentId) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาระบุเลขประจำตัวนักเรียน' 
    });
  }
  
  try {
    const students = await sheetsService.getStudents();
    const student = students.find(s => s.studentId === finalStudentId);
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบเลขประจำตัวนักเรียนในระบบ' 
      });
    }
    
    req.user = { 
      type: 'student', 
      studentId: student.studentId,
      name: student.name,
      class: student.class,
      subjects: student.subjects ? student.subjects.split(',') : []
    };
    next();
  } catch (error) {
    console.error('Student authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลนักเรียน' 
    });
  }
};

module.exports = {
  authenticateTeacher,
  authenticateStudent
};