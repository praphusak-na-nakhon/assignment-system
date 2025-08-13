const fs = require('fs').promises;
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.json');

class JsonDatabase {
  constructor() {
    this.data = null;
    this.lastLoad = 0;
    this.CACHE_DURATION = 5000; // 5 seconds cache
  }

  async loadData() {
    const now = Date.now();
    if (this.data && (now - this.lastLoad) < this.CACHE_DURATION) {
      return this.data;
    }

    try {
      const fileContent = await fs.readFile(DB_PATH, 'utf8');
      this.data = JSON.parse(fileContent);
      this.lastLoad = now;
      console.log(`📊 [${new Date().toISOString()}] Database loaded from JSON file`);
      return this.data;
    } catch (error) {
      console.error('Error loading database:', error);
      // Return empty structure if file doesn't exist
      this.data = {
        students: [],
        subjects: [],
        assignments: [],
        submissions: [],
        documents: []
      };
      return this.data;
    }
  }

  async saveData() {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf8');
      console.log(`💾 [${new Date().toISOString()}] Database saved to JSON file`);
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  // Students
  async getStudents() {
    const data = await this.loadData();
    return data.students;
  }

  async createStudent(studentData) {
    const data = await this.loadData();
    const newStudent = {
      id: studentData.studentId,
      studentId: studentData.studentId,
      name: studentData.name,
      class: studentData.class,
      subjects: studentData.subjects || "",
      totalScore: 0
    };
    data.students.push(newStudent);
    await this.saveData();
    return newStudent;
  }

  // Subjects
  async getSubjects() {
    const data = await this.loadData();
    return data.subjects;
  }

  async createSubject(subjectData) {
    const data = await this.loadData();
    const newSubject = {
      id: Date.now().toString(),
      name: subjectData.name,
      class: subjectData.class,
      maxScore: subjectData.maxScore || 100,
      totalAssignments: 0,
      scorePerAssignment: 0,
      scoreSheetUrl: ""
    };
    data.subjects.push(newSubject);
    await this.saveData();
    return newSubject;
  }

  async updateSubject(id, updates) {
    const data = await this.loadData();
    const index = data.subjects.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subject not found');
    
    data.subjects[index] = { ...data.subjects[index], ...updates };
    await this.saveData();
    return data.subjects[index];
  }

  async deleteSubject(id) {
    const data = await this.loadData();
    const index = data.subjects.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Subject not found');
    
    data.subjects.splice(index, 1);
    await this.saveData();
  }

  // Assignments
  async getAssignments() {
    const data = await this.loadData();
    return data.assignments;
  }

  async createAssignment(assignmentData) {
    const data = await this.loadData();
    const newAssignment = {
      id: Date.now().toString(),
      subjectId: assignmentData.subjectId,
      title: assignmentData.title,
      description: assignmentData.description || "",
      dueDate: assignmentData.dueDate,
      score: assignmentData.score || 10,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    data.assignments.push(newAssignment);
    
    // Update subject totalAssignments
    const subject = data.subjects.find(s => s.id === assignmentData.subjectId);
    if (subject) {
      subject.totalAssignments += 1;
      subject.scorePerAssignment = subject.maxScore / subject.totalAssignments;
    }
    
    await this.saveData();
    return newAssignment;
  }

  async updateAssignment(id, updates) {
    const data = await this.loadData();
    const index = data.assignments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    
    data.assignments[index] = { ...data.assignments[index], ...updates };
    await this.saveData();
    return data.assignments[index];
  }

  async deleteAssignment(id) {
    const data = await this.loadData();
    const index = data.assignments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    
    const assignment = data.assignments[index];
    data.assignments.splice(index, 1);
    
    // Update subject totalAssignments
    const subject = data.subjects.find(s => s.id === assignment.subjectId);
    if (subject && subject.totalAssignments > 0) {
      subject.totalAssignments -= 1;
      subject.scorePerAssignment = subject.totalAssignments > 0 ? subject.maxScore / subject.totalAssignments : 0;
    }
    
    await this.saveData();
  }

  // Submissions
  async getSubmissions() {
    const data = await this.loadData();
    return data.submissions;
  }

  async createSubmission(submissionData) {
    const data = await this.loadData();
    const newSubmission = {
      id: `sub${Date.now()}`,
      studentId: submissionData.studentId,
      assignmentId: submissionData.assignmentId,
      subjectId: submissionData.subjectId,
      fileName: submissionData.fileName,
      fileUrl: submissionData.fileUrl,
      score: submissionData.score || 0,
      submittedAt: new Date().toISOString(),
      cloudinaryId: submissionData.cloudinaryId || "",
      thumbnailUrl: submissionData.thumbnailUrl || ""
    };
    
    // Check for duplicate submission
    const existingSubmission = data.submissions.find(s => 
      s.studentId === submissionData.studentId && 
      s.assignmentId === submissionData.assignmentId
    );
    
    if (existingSubmission) {
      // Update existing submission
      Object.assign(existingSubmission, newSubmission);
      await this.saveData();
      return existingSubmission;
    } else {
      data.submissions.push(newSubmission);
      
      // Update student total score
      const student = data.students.find(s => s.studentId === submissionData.studentId);
      if (student) {
        student.totalScore += (submissionData.score || 0);
      }
      
      await this.saveData();
      return newSubmission;
    }
  }

  // Documents
  async getDocuments() {
    const data = await this.loadData();
    return data.documents;
  }

  async createDocument(documentData) {
    const data = await this.loadData();
    const newDocument = {
      id: `doc${Date.now()}`,
      title: documentData.title,
      description: documentData.description || "",
      fileUrl: documentData.fileUrl,
      subjectId: documentData.subjectId || null,
      uploadedAt: new Date().toISOString()
    };
    data.documents.push(newDocument);
    await this.saveData();
    return newDocument;
  }
}

module.exports = new JsonDatabase();