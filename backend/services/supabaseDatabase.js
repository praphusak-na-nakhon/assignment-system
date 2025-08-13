const supabase = require('./supabaseClient');

class SupabaseDatabase {
  constructor() {
    console.log('🗃️  Supabase Database Service initialized');
  }

  // Students
  async getStudents() {
    console.log('📊 [Supabase] Fetching students...');
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('student_id', { ascending: true });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} students`);
    return data;
  }

  async createStudent(studentData) {
    const { data, error } = await supabase
      .from('students')
      .insert({
        student_id: studentData.studentId,
        name: studentData.name,
        class: studentData.class,
        total_score: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateStudent(studentId, updates) {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('student_id', studentId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Subjects
  async getSubjects() {
    console.log('📊 [Supabase] Fetching subjects...');
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    console.log(`✅ [Supabase] Retrieved ${data.length} subjects`);
    return data;
  }

  async createSubject(subjectData) {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name: subjectData.name,
        class: subjectData.class,
        max_score: subjectData.maxScore || 100,
        total_assignments: 0,
        score_per_assignment: 0
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateSubject(id, updates) {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteSubject(id) {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Assignments
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
  }

  async createAssignment(assignmentData) {
    const { data, error } = await supabase
      .from('assignments')
      .insert({
        subject_id: assignmentData.subjectId,
        title: assignmentData.title,
        description: assignmentData.description || '',
        due_date: assignmentData.dueDate,
        score: assignmentData.score || 10,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;

    // Update subject total_assignments and score_per_assignment
    await this.updateSubjectAssignmentCount(assignmentData.subjectId);
    
    return data;
  }

  async updateAssignment(id, updates) {
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteAssignment(id) {
    // Get assignment info first
    const { data: assignment } = await supabase
      .from('assignments')
      .select('subject_id')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;

    // Update subject assignment count
    if (assignment) {
      await this.updateSubjectAssignmentCount(assignment.subject_id);
    }
  }

  // Helper function to update subject assignment counts
  async updateSubjectAssignmentCount(subjectId) {
    // Count assignments for this subject
    const { count, error: countError } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('subject_id', subjectId);

    if (countError) throw countError;

    // Get subject max_score
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('max_score')
      .eq('id', subjectId)
      .single();

    if (subjectError) throw subjectError;

    // Update subject
    const scorePerAssignment = count > 0 ? subject.max_score / count : 0;
    await this.updateSubject(subjectId, {
      total_assignments: count,
      score_per_assignment: scorePerAssignment
    });
  }

  // Submissions
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
  }

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
      
      // Update student total score (difference)
      const scoreDifference = (submissionData.score || 0) - existing.score;
      if (scoreDifference !== 0) {
        await this.updateStudentScore(submissionData.studentId, scoreDifference);
      }
      
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
      
      // Update student total score
      await this.updateStudentScore(submissionData.studentId, submissionData.score || 0);
      
      result = data;
    }

    console.log('✅ [Supabase] Submission saved successfully');
    return result;
  }

  // Helper function to update student total score
  async updateStudentScore(studentId, scoreChange) {
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('total_score')
      .eq('student_id', studentId)
      .single();

    if (fetchError) throw fetchError;

    const newTotalScore = (student.total_score || 0) + scoreChange;
    
    const { error: updateError } = await supabase
      .from('students')
      .update({ total_score: newTotalScore })
      .eq('student_id', studentId);

    if (updateError) throw updateError;
  }

  // Documents
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
  }

  async createDocument(documentData) {
    const { data, error } = await supabase
      .from('documents')
      .insert({
        title: documentData.title,
        description: documentData.description || '',
        file_url: documentData.fileUrl,
        subject_id: documentData.subjectId || null
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Health check
  async healthCheck() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return { 
        status: 'healthy', 
        connection: 'ok',
        studentCount: data?.count || 0
      };
    } catch (error) {
      return { 
        status: 'error', 
        connection: 'failed',
        error: error.message 
      };
    }
  }
}

module.exports = new SupabaseDatabase();