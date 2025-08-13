-- Assignment Submission System Database Schema for Supabase
-- Run this SQL in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  class VARCHAR(10) NOT NULL,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subjects Table  
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  class VARCHAR(10) NOT NULL,
  max_score INTEGER DEFAULT 100,
  total_assignments INTEGER DEFAULT 0,
  score_per_assignment DECIMAL(5,2) DEFAULT 0,
  score_sheet_url TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignments Table
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  due_date DATE,
  score INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Submissions Table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_url TEXT,
  score INTEGER DEFAULT 0,
  cloudinary_id VARCHAR(255) DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_id)
);

-- Documents Table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  file_url TEXT NOT NULL,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_class ON students(class);
CREATE INDEX idx_subjects_class ON subjects(class);
CREATE INDEX idx_assignments_subject_id ON assignments(subject_id);
CREATE INDEX idx_assignments_is_active ON assignments(is_active);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_subject_id ON submissions(subject_id);

-- Insert initial data
INSERT INTO students (student_id, name, class, total_score) VALUES
('19450', 'เด็กหญิงกัสนี บุตรโกบ', 'ม.1/1', 30),
('19451', 'เด็กหญิงกานต์ธิดา ตี้กุล', 'ม.1/1', 130),
('19452', 'เด็กหญิงจิณณพัด ชายกุล', 'ม.1/1', 0),
('19453', 'เด็กชายจิรเดช แซ่หลี', 'ม.1/2', 0);

INSERT INTO subjects (name, class, max_score, total_assignments, score_per_assignment) VALUES
('การออกแบบและเทคโนโลยี', 'ม.1/1', 30, 5, 6),
('การออกแบบและเทคโนโลยี', 'ม.1/2', 30, 2, 15),
('การเขียนโปรแกรมเบื้องต้น', 'ม.1/1', 30, 0, 0),
('ทดสอบ', 'ม.1/1', 100, 2, 50);

-- Get subject IDs for assignments (will need to be updated with actual UUIDs)
DO $$
DECLARE
    design_m11_id UUID;
    design_m12_id UUID;
    programming_id UUID;
    test_id UUID;
    student_19450_id UUID;
    student_19451_id UUID;
BEGIN
    -- Get subject IDs
    SELECT id INTO design_m11_id FROM subjects WHERE name = 'การออกแบบและเทคโนโลยี' AND class = 'ม.1/1';
    SELECT id INTO design_m12_id FROM subjects WHERE name = 'การออกแบบและเทคโนโลยี' AND class = 'ม.1/2';
    SELECT id INTO programming_id FROM subjects WHERE name = 'การเขียนโปรแกรมเบื้องต้น' AND class = 'ม.1/1';
    SELECT id INTO test_id FROM subjects WHERE name = 'ทดสอบ' AND class = 'ม.1/1';
    
    -- Get student IDs
    SELECT id INTO student_19450_id FROM students WHERE student_id = '19450';
    SELECT id INTO student_19451_id FROM students WHERE student_id = '19451';
    
    -- Insert assignments
    INSERT INTO assignments (subject_id, title, description, due_date, score, is_active) VALUES
    (design_m11_id, 'การบ้านที่ 1 - กลไกง่าย', 'ออกแบบกลไกง่ายในชีวิตประจำวัน', '2025-08-20', 6, true),
    (design_m11_id, 'การบ้านที่ 2 - เฟือง', 'เข้าใจระบบเฟืองและการทำงาน', '2025-08-25', 6, true),
    (programming_id, 'โปรแกรมแรก - Hello World', 'เขียนโปรแกรม Hello World', '2025-08-30', 10, true);
    
    -- Insert sample submissions
    INSERT INTO submissions (student_id, assignment_id, subject_id, file_name, file_url, score, submitted_at)
    SELECT 
        student_19450_id, 
        a.id, 
        design_m11_id, 
        'งาน1_19450.png', 
        'https://example.com/file1.png', 
        6, 
        '2025-08-11 15:30:00+00'
    FROM assignments a 
    WHERE a.subject_id = design_m11_id AND a.title = 'การบ้านที่ 1 - กลไกง่าย';
    
    INSERT INTO submissions (student_id, assignment_id, subject_id, file_name, file_url, score, submitted_at)
    SELECT 
        student_19451_id, 
        a.id, 
        design_m11_id, 
        'งาน1_19451.jpg', 
        'https://example.com/file2.jpg', 
        6, 
        '2025-08-11 16:00:00+00'
    FROM assignments a 
    WHERE a.subject_id = design_m11_id AND a.title = 'การบ้านที่ 1 - กลไกง่าย';
    
    -- Insert sample documents
    INSERT INTO documents (title, description, file_url, subject_id) VALUES
    ('เอกสารประกอบการเรียน ม.1', 'เอกสารสำหรับนักเรียนม.1 ทุกคน', 'https://example.com/doc1.pdf', NULL),
    ('คู่มือการออกแบบ', 'คู่มือสำหรับวิชาการออกแบบและเทคโนโลยี', 'https://example.com/doc2.pdf', design_m11_id);
END $$;