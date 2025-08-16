const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../config/constants');

const validateFileUpload = (file) => {
  if (!file) {
    return { isValid: false, message: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      message: `ไฟล์มีขนาดใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024}MB)` 
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    return { 
      isValid: false, 
      message: 'ประเภทไฟล์ไม่ถูกต้อง (รองรับเฉพาะไฟล์รูปภาพ)' 
    };
  }

  return { isValid: true };
};

const validateStudentId = (studentId) => {
  if (!studentId || typeof studentId !== 'string') {
    return { isValid: false, message: 'กรุณาระบุเลขประจำตัวนักเรียน' };
  }

  if (studentId.length < 5) {
    return { isValid: false, message: 'เลขประจำตัวนักเรียนต้องมีความยาวอย่างน้อย 5 หลัก' };
  }

  return { isValid: true };
};

const validateSubjectData = (subject) => {
  const errors = [];

  console.log(`🔍 [Validation] Input data:`, subject);

  if (!subject.name || subject.name.trim() === '') {
    errors.push('กรุณาระบุชื่อวิชา');
  }

  if (!subject.class || subject.class.trim() === '') {
    errors.push('กรุณาระบุระดับชั้น');
  }

  if (subject.maxScore) {
    console.log(`🔍 [Validation] maxScore value: ${subject.maxScore}, type: ${typeof subject.maxScore}, isNaN: ${isNaN(subject.maxScore)}`);
    if (isNaN(subject.maxScore) || Number(subject.maxScore) <= 0) {
      errors.push('คะแนนเต็มต้องเป็นตัวเลขที่มากกว่า 0');
    }
  }

  console.log(`🔍 [Validation] Errors:`, errors);
  
  return {
    isValid: errors.length === 0,
    messages: errors
  };
};

const validateAssignmentData = (assignment) => {
  const errors = [];

  if (!assignment.title || assignment.title.trim() === '') {
    errors.push('กรุณาระบุชื่องาน');
  }

  if (!assignment.subjectId) {
    errors.push('กรุณาระบุวิชา');
  }

  return {
    isValid: errors.length === 0,
    messages: errors
  };
};

module.exports = {
  validateFileUpload,
  validateStudentId,
  validateSubjectData,
  validateAssignmentData
};