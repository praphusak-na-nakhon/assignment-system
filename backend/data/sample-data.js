// Sample data for testing the system
// This file contains example data structure for Google Sheets

const sampleData = {
  // Subjects Sheet Data
  subjects: [
    ['ID', 'Name', 'Class', 'MaxScore', 'TotalAssignments', 'ScorePerAssignment', 'ScoreSheetUrl'],
    ['1001', 'คณิตศาสตร์', 'ม.1/1', 100, 3, 33.33, 'https://docs.google.com/spreadsheets/d/example1'],
    ['1002', 'ภาษาไทย', 'ม.1/1', 80, 2, 40, 'https://docs.google.com/spreadsheets/d/example2'],
    ['1003', 'วิทยาศาสตร์', 'ม.1/2', 100, 4, 25, 'https://docs.google.com/spreadsheets/d/example3'],
    ['1004', 'สังคมศึกษา', 'ม.1/2', 60, 2, 30, 'https://docs.google.com/spreadsheets/d/example4']
  ],

  // Students Sheet Data  
  students: [
    ['ID', 'StudentID', 'Name', 'Class', 'Subjects', 'TotalScore'],
    ['2001', '10001', 'สมชาย ใจดี', 'ม.1/1', '1001,1002', 0],
    ['2002', '10002', 'สมหญิง มีสุข', 'ม.1/1', '1001,1002', 0],
    ['2003', '10003', 'สมศักดิ์ เก่งเรียน', 'ม.1/2', '1003,1004', 0],
    ['2004', '10004', 'สมพร ขยันหา', 'ม.1/2', '1003,1004', 0],
    ['2005', '12345', 'นักเรียนทดสอบ', 'ม.1/1', '1001,1002', 0]
  ],

  // Assignments Sheet Data
  assignments: [
    ['ID', 'SubjectID', 'Title', 'Description', 'DueDate', 'CreatedAt', 'Score', 'IsActive'],
    ['3001', '1001', 'การบ้านที่ 1: เลขจำนวนจริง', 'แบบฝึกหัดเรื่องเลขจำนวนจริง หน้า 15-20', '2024-01-15', '2024-01-01T00:00:00Z', 33.33, 'true'],
    ['3002', '1001', 'การบ้านที่ 2: พีชคณิต', 'แก้สมการเชิงเส้นตัวแปรเดียว', '2024-01-22', '2024-01-08T00:00:00Z', 33.33, 'true'],
    ['3003', '1001', 'การบ้านที่ 3: เรขาคณิต', 'คำนวณพื้นที่รูปทรงต่างๆ', '2024-01-29', '2024-01-15T00:00:00Z', 33.34, 'true'],
    ['3004', '1002', 'เขียนเรียงความ', 'เขียนเรียงความเรื่อง "ความฝันของฉัน"', '2024-01-18', '2024-01-02T00:00:00Z', 40, 'true'],
    ['3005', '1002', 'อ่านหนังสือ', 'อ่านหนังสือและเขียนสรุป', '2024-01-25', '2024-01-10T00:00:00Z', 40, 'true'],
    ['3006', '1003', 'การทดลองวิทยาศาสตร์', 'รายงานการทดลองเรื่องแรงและการเคลื่อนที่', '2024-01-20', '2024-01-05T00:00:00Z', 25, 'true'],
    ['3007', '1004', 'ประวัติศาสตร์ไทย', 'ศึกษาประวัติสมัยสุโขทัย', '2024-01-17', '2024-01-03T00:00:00Z', 30, 'true']
  ],

  // Submissions Sheet Data (empty initially)
  submissions: [
    ['ID', 'StudentID', 'AssignmentID', 'SubjectID', 'FileName', 'FileURL', 'Score', 'SubmittedAt', 'Status']
  ],

  // Documents Sheet Data
  documents: [
    ['ID', 'Title', 'Description', 'Category', 'SubjectID', 'FileURL', 'UploadedAt'],
    ['4001', 'ตารางสอบกลางภาค', 'ตารางสอบประจำภาคเรียนที่ 1', 'ประกาศ', '', 'https://drive.google.com/file/d/example1', '2024-01-01T00:00:00Z'],
    ['4002', 'แนวข้อสอบคณิตศาสตร์', 'แนวข้อสอบกลางภาควิชาคณิตศาสตร์', 'เอกสารการเรียน', '1001', 'https://drive.google.com/file/d/example2', '2024-01-05T00:00:00Z'],
    ['4003', 'บทความภาษาไทย', 'เอกสารประกอบการเรียนวิชาภาษาไทย', 'เอกสารการเรียน', '1002', 'https://drive.google.com/file/d/example3', '2024-01-07T00:00:00Z'],
    ['4004', 'คู่มือการทดลอง', 'คู่มือการทดลองวิทยาศาสตร์', 'คู่มือ', '1003', 'https://drive.google.com/file/d/example4', '2024-01-10T00:00:00Z']
  ]
};

// Instructions for using sample data
const instructions = `
การใช้งาน Sample Data:

1. สร้าง Google Sheets ใหม่
2. สร้าง Sheet 5 หน้าตามชื่อ: Subjects, Students, Assignments, Submissions, Documents
3. Copy ข้อมูลจาก sampleData ไปวางในแต่ละ Sheet
4. แชร์ Google Sheets ให้กับ Service Account
5. คัดลอก Sheets ID มาใส่ในไฟล์ .env

ข้อมูลทดสอบ:
- นักเรียนทดสอบ: เลขประจำตัว 12345
- ครู: username = admin, password = password123
- วิชาที่มี: คณิตศาสตร์, ภาษาไทย, วิทยาศาสตร์, สังคมศึกษา
`;

module.exports = {
  sampleData,
  instructions
};