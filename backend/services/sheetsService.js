const { google } = require('googleapis');
const {
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY,
  GOOGLE_SHEETS_ID,
  SHEETS_RANGES
} = require('../config/constants');

class SheetsService {
  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: GOOGLE_PRIVATE_KEY,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
    this.requestQueue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // Reduce back to 100ms for local use
    this.quotaExceededUntil = 0; // Track when quota will be available again
    this.dataCache = new Map(); // Simple cache for frequently accessed data
    this.cacheTimeout = 30000; // Cache for 30 seconds
  }

  // Rate limiting and retry logic
  async executeWithRetry(operation, maxRetries = 3, baseDelay = 2000) {
    // Check if quota is still exceeded
    const now = Date.now();
    if (this.quotaExceededUntil > now) {
      const waitTime = this.quotaExceededUntil - now;
      console.warn(`Quota still exceeded, waiting ${waitTime}ms before attempting...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Rate limiting - wait between requests
        const currentTime = Date.now();
        const timeSinceLastRequest = currentTime - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
          await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
        }
        this.lastRequestTime = Date.now();

        const result = await operation();
        // Reset quota exceeded tracker on success
        this.quotaExceededUntil = 0;
        return result;
      } catch (error) {
        const isQuotaError = error.response?.status === 429 || 
                           error.code === 429 || 
                           error.message?.includes('Quota exceeded');
        
        const isRateLimitError = error.response?.status === 403 &&
                               (error.message?.includes('Rate Limit Exceeded') ||
                                error.message?.includes('User rate limit exceeded'));

        if ((isQuotaError || isRateLimitError) && attempt < maxRetries - 1) {
          // Exponential backoff with longer delays
          const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 2000;
          console.warn(`Google Sheets API quota/rate limit hit. Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          
          // Set quota exceeded until timestamp
          this.quotaExceededUntil = Date.now() + delay;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (isQuotaError || isRateLimitError) {
          // Set quota exceeded for longer period
          this.quotaExceededUntil = Date.now() + 60000; // 60 seconds
          const error429 = new Error('Google Sheets API quota exceeded');
          error429.status = 429;
          throw error429;
        }
        
        throw error;
      }
    }
  }

  async getSheetData(range, useCache = true) {
    const startTime = Date.now();
    const cacheKey = `sheet_${range}`;
    
    // Check cache first
    if (useCache && this.dataCache.has(cacheKey)) {
      const cached = this.dataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`💾 [${new Date().toISOString()}] Cache hit for ${range}`);
        return cached.data;
      }
      // Remove expired cache
      this.dataCache.delete(cacheKey);
    }
    
    console.log(`📡 [${new Date().toISOString()}] Fetching from Google Sheets: ${range}...`);
    const data = await this.executeWithRetry(async () => {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range,
      });
      return response.data.values || [];
    });
    
    const endTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Fetched ${range} in ${endTime - startTime}ms (${data.length} rows)`);
    
    // Cache the result
    if (useCache) {
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
    }
    
    return data;
  }

  async appendSheetData(range, values) {
    const startTime = Date.now();
    console.log(`📝 [${new Date().toISOString()}] Appending to Google Sheets: ${range}...`);
    
    const result = await this.executeWithRetry(async () => {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range,
        valueInputOption: 'RAW',
        resource: { values },
      });
      return response.data;
    });
    
    const endTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Appended to ${range} in ${endTime - startTime}ms`);
    
    // Clear related cache
    this.clearCacheByRange(range);
    return result;
  }

  async updateSheetData(range, values) {
    const result = await this.executeWithRetry(async () => {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEETS_ID,
        range,
        valueInputOption: 'RAW',
        resource: { values },
      });
      return response.data;
    });
    
    // Clear related cache
    this.clearCacheByRange(range);
    return result;
  }

  // Helper method to clear cache when data changes
  clearCacheByRange(range) {
    const sheetName = range.split('!')[0];
    const keysToDelete = [];
    
    for (const [key] of this.dataCache) {
      if (key.includes(sheetName)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.dataCache.delete(key));
  }

  // Subjects CRUD
  async getSubjects() {
    const data = await this.getSheetData(SHEETS_RANGES.SUBJECTS);
    if (data.length <= 1) return [];
    
    return data.slice(1)
      .filter(row => row[0] && row[0].toString().trim()) // Filter out empty/deleted rows
      .map(row => ({
        id: row[0],
        name: row[1],
        class: row[2],
        maxScore: parseInt(row[3]) || 100,
        totalAssignments: parseInt(row[4]) || 0,
        scorePerAssignment: parseFloat(row[5]) || 0,
        scoreSheetUrl: row[6] || ''
      }));
  }

  async createSubject(subject) {
    const newRow = [
      Date.now().toString(),
      subject.name,
      subject.class,
      subject.maxScore || 100,
      0, // totalAssignments
      0, // scorePerAssignment
      subject.scoreSheetUrl || ''
    ];
    return await this.appendSheetData(SHEETS_RANGES.SUBJECTS, [newRow]);
  }

  async updateSubject(id, subject) {
    const data = await this.getSheetData(SHEETS_RANGES.SUBJECTS);
    if (data.length <= 1) throw new Error('ไม่พบข้อมูลวิชา');
    
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) throw new Error('ไม่พบวิชาที่ต้องการแก้ไข');
    
    // Keep existing values for fields not being updated
    const existingRow = data[rowIndex];
    const updatedRow = [
      id, // Keep original ID
      subject.name || existingRow[1],
      subject.class || existingRow[2],
      subject.maxScore || existingRow[3] || 100,
      existingRow[4] || 0, // Keep totalAssignments
      existingRow[5] || 0, // Keep scorePerAssignment
      subject.scoreSheetUrl || existingRow[6] || ''
    ];
    
    const range = `Subjects!A${rowIndex + 1}:G${rowIndex + 1}`;
    return await this.updateSheetData(range, [updatedRow]);
  }

  async deleteSubject(id) {
    const data = await this.getSheetData(SHEETS_RANGES.SUBJECTS);
    if (data.length <= 1) throw new Error('ไม่พบข้อมูลวิชา');
    
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) throw new Error('ไม่พบวิชาที่ต้องการลบ');
    
    // First, delete all assignments associated with this subject
    await this.deleteAssignmentsBySubject(id);
    
    // Then delete the subject
    // Clear the row content instead of deleting the dimension
    // This is safer as it doesn't require exact sheetId
    const range = `Subjects!A${rowIndex + 1}:G${rowIndex + 1}`;
    return await this.updateSheetData(range, [['', '', '', '', '', '', '']]);
  }

  // Helper method to delete all assignments for a specific subject
  async deleteAssignmentsBySubject(subjectId) {
    const assignments = await this.getAssignments();
    const subjectAssignments = assignments.filter(a => a.subjectId === subjectId && a.isActive);
    
    // Mark all assignments as inactive (soft delete)
    for (const assignment of subjectAssignments) {
      const assignmentIndex = assignments.findIndex(a => a.id === assignment.id) + 2; // +2 for header row and 0-based index
      await this.updateSheetData(`Assignments!H${assignmentIndex}`, [['false']]);
    }
    
    console.log(`Deleted ${subjectAssignments.length} assignments for subject ${subjectId}`);
  }

  // Students CRUD
  async getStudents() {
    const data = await this.getSheetData(SHEETS_RANGES.STUDENTS);
    if (data.length <= 1) return [];
    
    return data.slice(1).map(row => ({
      id: row[0],
      studentId: row[1],
      name: row[2],
      class: row[3],
      subjects: row[4] || '',
      totalScore: parseFloat(row[5]) || 0
    }));
  }

  async createStudent(student) {
    const newRow = [
      Date.now().toString(),
      student.studentId,
      student.name,
      student.class,
      Array.isArray(student.subjects) ? student.subjects.join(',') : student.subjects,
      0 // totalScore
    ];
    return await this.appendSheetData(SHEETS_RANGES.STUDENTS, [newRow]);
  }

  // Assignments CRUD
  async getAssignments() {
    const data = await this.getSheetData(SHEETS_RANGES.ASSIGNMENTS);
    if (data.length <= 1) return [];
    
    return data.slice(1).map(row => ({
      id: row[0],
      subjectId: row[1],
      title: row[2],
      description: row[3] || '',
      dueDate: row[4] || '',
      createdAt: row[5] || '',
      score: parseFloat(row[6]) || 0,
      isActive: row[7]?.toString().toLowerCase() === 'true'
    }));
  }

  // Fast assignment creation - responds immediately, processes scores in background
  async createAssignmentFast(assignment) {
    const newRow = [
      Date.now().toString(),
      assignment.subjectId,
      assignment.title,
      assignment.description || '',
      assignment.dueDate || '',
      new Date().toISOString(),
      assignment.score || 0,
      'true'
    ];
    const result = await this.appendSheetData(SHEETS_RANGES.ASSIGNMENTS, [newRow]);
    
    // Process score calculations in background (don't wait)
    setImmediate(() => {
      this.updateSubjectScoresAsync(assignment.subjectId);
    });
    
    return result;
  }

  // Original method (kept for compatibility)
  async createAssignment(assignment) {
    const newRow = [
      Date.now().toString(),
      assignment.subjectId,
      assignment.title,
      assignment.description || '',
      assignment.dueDate || '',
      new Date().toISOString(),
      assignment.score || 0,
      'true'
    ];
    const result = await this.appendSheetData(SHEETS_RANGES.ASSIGNMENTS, [newRow]);
    
    // Load data once and pass to update functions to avoid multiple API calls
    const [assignments, subjects, submissions] = await Promise.all([
      this.getAssignments(),
      this.getSubjects(),
      this.getSubmissions()
    ]);
    
    // Update subject's total assignments and recalculate scores
    await this.updateSubjectScores(assignment.subjectId, assignments, subjects, submissions);
    
    return result;
  }

  // Async version for background processing
  async updateSubjectScoresAsync(subjectId) {
    try {
      const [assignments, subjects, submissions] = await Promise.all([
        this.getAssignments(),
        this.getSubjects(), 
        this.getSubmissions()
      ]);
      
      await this.updateSubjectScores(subjectId, assignments, subjects, submissions);
      console.log(`Background score update completed for subject ${subjectId}`);
    } catch (error) {
      console.error(`Background score update failed for subject ${subjectId}:`, error);
    }
  }

  async updateAssignment(id, assignment) {
    const data = await this.getSheetData(SHEETS_RANGES.ASSIGNMENTS);
    if (data.length <= 1) throw new Error('ไม่พบข้อมูลงาน');
    
    const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
    if (rowIndex === -1) throw new Error('ไม่พบงานที่ต้องการแก้ไข');
    
    // Keep existing values for fields not being updated
    const existingRow = data[rowIndex];
    const updatedRow = [
      id, // Keep original ID
      assignment.subjectId || existingRow[1],
      assignment.title || existingRow[2],
      assignment.description || existingRow[3] || '',
      assignment.dueDate || existingRow[4] || '',
      existingRow[5] || new Date().toISOString(), // Keep original createdAt
      assignment.score || existingRow[6] || 0,
      'true' // Keep active
    ];
    
    const range = `Assignments!A${rowIndex + 1}:H${rowIndex + 1}`;
    const result = await this.updateSheetData(range, [updatedRow]);
    
    // Load data once for efficiency
    const [assignments, subjects, submissions] = await Promise.all([
      this.getAssignments(),
      this.getSubjects(),
      this.getSubmissions()
    ]);
    
    // Update subject scores if subjectId changed
    const oldSubjectId = existingRow[1];
    if (oldSubjectId !== assignment.subjectId) {
      await this.updateSubjectScores(oldSubjectId, assignments, subjects, submissions); // Recalculate old subject
      await this.updateSubjectScores(assignment.subjectId, assignments, subjects, submissions); // Recalculate new subject
    } else {
      await this.updateSubjectScores(assignment.subjectId, assignments, subjects, submissions);
    }
    
    return result;
  }

  // Fast deletion - responds immediately, processes scores in background
  async deleteAssignmentFast(assignmentId) {
    const assignments = await this.getAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (assignment) {
      // Mark as inactive instead of deleting
      const assignmentIndex = assignments.findIndex(a => a.id === assignmentId) + 2; // +2 for header row and 0-based index
      const result = await this.updateSheetData(`Assignments!H${assignmentIndex}`, [['false']]);
      
      // Process score calculations in background (don't wait)
      setImmediate(() => {
        this.updateSubjectScoresAsync(assignment.subjectId);
      });
      
      return result;
    }
  }

  async deleteAssignment(assignmentId) {
    const assignments = await this.getAssignments();
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (assignment) {
      // Mark as inactive instead of deleting
      const assignmentIndex = assignments.findIndex(a => a.id === assignmentId) + 2; // +2 for header row and 0-based index
      await this.updateSheetData(`Assignments!H${assignmentIndex}`, [['false']]);
      
      // Load data once for efficiency
      const [updatedAssignments, subjects, submissions] = await Promise.all([
        this.getAssignments(),
        this.getSubjects(),
        this.getSubmissions()
      ]);
      
      // Update subject scores
      await this.updateSubjectScores(assignment.subjectId, updatedAssignments, subjects, submissions);
    }
  }

  // Submissions
  async getSubmissions() {
    const data = await this.getSheetData(SHEETS_RANGES.SUBMISSIONS);
    if (data.length <= 1) return [];
    
    return data.slice(1).map(row => ({
      id: row[0],
      studentId: row[1],
      assignmentId: row[2],
      subjectId: row[3],
      fileName: row[4] || '',
      fileUrl: row[5] || '',
      score: parseFloat(row[6]) || 0,
      submittedAt: row[7] || '',
      status: row[8] || 'submitted'
    }));
  }

  // Fast submission creation - responds immediately, processes scores in background
  async createSubmissionFast(submission) {
    const startTime = Date.now();
    console.log(`🚀 [${new Date().toISOString()}] Starting fast submission creation...`);
    
    const newRow = [
      Date.now().toString(),
      submission.studentId,
      submission.assignmentId,
      submission.subjectId,
      submission.fileName || '',
      submission.fileUrl || '',
      submission.score || 0,
      new Date().toISOString(),
      'submitted'
    ];
    
    const result = await this.appendSheetData(SHEETS_RANGES.SUBMISSIONS, [newRow]);
    
    const completedTime = Date.now();
    console.log(`✅ [${new Date().toISOString()}] Submission created in Google Sheets in ${completedTime - startTime}ms`);
    
    // Process score calculations in background (don't wait)
    setImmediate(() => {
      console.log(`🔄 [${new Date().toISOString()}] Starting background score calculation for student ${submission.studentId}...`);
      this.recalculateStudentScoresAsync(submission.studentId);
    });
    
    return result;
  }

  async createSubmission(submission) {
    const newRow = [
      Date.now().toString(),
      submission.studentId,
      submission.assignmentId,
      submission.subjectId,
      submission.fileName || '',
      submission.fileUrl || '',
      submission.score || 0,
      new Date().toISOString(),
      'submitted'
    ];
    return await this.appendSheetData(SHEETS_RANGES.SUBMISSIONS, [newRow]);
  }

  // Documents CRUD
  async getDocuments() {
    const data = await this.getSheetData(SHEETS_RANGES.DOCUMENTS);
    if (data.length <= 1) return [];
    
    return data.slice(1).map(row => ({
      id: row[0],
      title: row[1],
      description: row[2] || '',
      category: row[3] || '',
      subjectId: row[4] || '',
      fileUrl: row[5] || '',
      uploadedAt: row[6] || ''
    }));
  }

  async createDocument(document) {
    const newRow = [
      Date.now().toString(),
      document.title,
      document.description || '',
      document.category || '',
      document.subjectId || '',
      document.fileUrl || '',
      new Date().toISOString()
    ];
    return await this.appendSheetData(SHEETS_RANGES.DOCUMENTS, [newRow]);
  }

  // Score calculation helper
  async updateSubjectScores(subjectId, existingAssignments = null, existingSubjects = null, existingSubmissions = null) {
    const assignments = existingAssignments || await this.getAssignments();
    const subjects = existingSubjects || await this.getSubjects();
    const submissions = existingSubmissions || await this.getSubmissions();
    
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    const activeAssignments = assignments.filter(a => a.subjectId === subjectId && a.isActive);
    const totalAssignments = activeAssignments.length;
    const baseScore = totalAssignments > 0 ? Math.floor(subject.maxScore / totalAssignments) : 0;
    const remainder = totalAssignments > 0 ? subject.maxScore - (baseScore * totalAssignments) : 0;
    
    // Update subject data
    const subjectIndex = subjects.findIndex(s => s.id === subjectId) + 2;
    await this.updateSheetData(`Subjects!E${subjectIndex}:F${subjectIndex}`, [
      [totalAssignments, baseScore]
    ]);
    
    // Update assignment scores - distribute remainder to last assignments
    const newAssignmentScores = [];
    for (let i = 0; i < activeAssignments.length; i++) {
      const assignment = activeAssignments[i];
      const assignmentIndex = assignments.findIndex(a => a.id === assignment.id) + 2;
      // Add 1 extra point to the last 'remainder' assignments
      const finalScore = i >= (totalAssignments - remainder) ? baseScore + 1 : baseScore;
      await this.updateSheetData(`Assignments!G${assignmentIndex}`, [[finalScore]]);
      
      // Track new scores for submission updates
      newAssignmentScores.push({
        assignmentId: assignment.id,
        oldScore: assignment.score,
        newScore: finalScore
      });
    }
    
    // Update submission scores based on new assignment scores
    await this.updateSubmissionScores(subjectId, newAssignmentScores, submissions);
    
    // Update student total scores (reuse existing data)
    await this.recalculateStudentScores(null, submissions);
  }

  // Update submission scores when assignment scores change
  async updateSubmissionScores(subjectId, assignmentScoreChanges, existingSubmissions = null) {
    const submissions = existingSubmissions || await this.getSubmissions();
    
    for (const scoreChange of assignmentScoreChanges) {
      const { assignmentId, oldScore, newScore } = scoreChange;
      
      // Skip if score didn't change
      if (oldScore === newScore) continue;
      
      // Find submissions for this assignment
      const assignmentSubmissions = submissions.filter(s => 
        s.assignmentId === assignmentId && s.subjectId === subjectId
      );
      
      for (const submission of assignmentSubmissions) {
        // Calculate proportional score adjustment
        // If student got full marks (oldScore), they should get full new marks (newScore)
        let newSubmissionScore;
        if (submission.score === oldScore) {
          // Full marks - give full new score
          newSubmissionScore = newScore;
        } else if (submission.score === 0) {
          // Zero score stays zero
          newSubmissionScore = 0;
        } else {
          // Proportional adjustment: (current_score / old_max) * new_max
          const ratio = submission.score / oldScore;
          newSubmissionScore = Math.round(ratio * newScore);
        }
        
        // Update the submission score in the sheet
        const submissionIndex = submissions.findIndex(s => s.id === submission.id) + 2;
        await this.updateSheetData(`Submissions!G${submissionIndex}`, [[newSubmissionScore]]);
        
        console.log(`Updated submission ${submission.id}: ${submission.score} -> ${newSubmissionScore} (assignment ${assignmentId}: ${oldScore} -> ${newScore})`);
      }
    }
  }

  // Async version for background processing (specific student)
  async recalculateStudentScoresAsync(targetStudentId = null) {
    try {
      const students = await this.getStudents();
      const submissions = await this.getSubmissions();
      
      if (targetStudentId) {
        // Update only specific student
        const studentIndex = students.findIndex(s => s.studentId === targetStudentId);
        if (studentIndex !== -1) {
          const student = students[studentIndex];
          const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
          const totalScore = studentSubmissions.reduce((sum, sub) => sum + sub.score, 0);
          
          const sheetIndex = studentIndex + 2; // +2 for header row and 0-based index
          await this.updateSheetData(`Students!F${sheetIndex}`, [[totalScore]]);
          console.log(`Background score update completed for student ${targetStudentId}: ${totalScore}`);
        }
      } else {
        // Update all students
        for (let i = 0; i < students.length; i++) {
          const student = students[i];
          const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
          const totalScore = studentSubmissions.reduce((sum, sub) => sum + sub.score, 0);
          
          const studentIndex = i + 2;
          await this.updateSheetData(`Students!F${studentIndex}`, [[totalScore]]);
        }
        console.log(`Background score update completed for all students`);
      }
    } catch (error) {
      console.error(`Background student score update failed:`, error);
    }
  }

  async recalculateStudentScores(existingStudents = null, existingSubmissions = null) {
    const students = existingStudents || await this.getStudents();
    const submissions = existingSubmissions || await this.getSubmissions();
    
    for (let i = 0; i < students.length; i++) {
      const student = students[i];
      const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
      const totalScore = studentSubmissions.reduce((sum, sub) => sum + sub.score, 0);
      
      const studentIndex = i + 2;
      await this.updateSheetData(`Students!F${studentIndex}`, [[totalScore]]);
    }
  }
}

module.exports = new SheetsService();