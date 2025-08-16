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
    console.log(`🔄 [Supabase] Updating subject ${id} with:`, updates);
    
    // First check if the subject exists
    const { data: existingSubject, error: selectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (selectError) {
      console.error(`❌ [Supabase] Subject not found:`, selectError);
      throw new Error(`Subject with ID ${id} not found`);
    }
    
    console.log(`📋 [Supabase] Existing subject:`, existingSubject);
    
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ [Supabase] Update subject error:`, error);
      console.error(`❌ [Supabase] Error details:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log(`✅ [Supabase] Subject updated successfully:`, data);
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
    // Get subject max_score for initial assignment score calculation
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('max_score')
      .eq('id', assignmentData.subjectId)
      .single();

    if (subjectError) throw subjectError;

    // For new assignments, use subject's max_score as initial score
    // This will be redistributed later in updateSubjectAssignmentCount
    const initialScore = assignmentData.score || subject.max_score;

    const { data, error } = await supabase
      .from('assignments')
      .insert({
        subject_id: assignmentData.subjectId,
        title: assignmentData.title,
        description: assignmentData.description || '',
        due_date: assignmentData.dueDate,
        score: initialScore,
        is_active: true
      })
      .select()
      .single();
    
    if (error) throw error;

    console.log(`📝 [Assignment Created] Initial score: ${initialScore}, Subject max_score: ${subject.max_score}`);

    // Update subject total_assignments and redistribute scores
    console.log(`🔄 [Assignment Created] Starting redistribution for subject ${assignmentData.subjectId}`);
    await this.updateSubjectAssignmentCount(assignmentData.subjectId);
    
    // Verify the final assignment score
    const { data: finalAssignment } = await supabase
      .from('assignments')
      .select('score')
      .eq('id', data.id)
      .single();
    console.log(`🔍 [Final Check] Assignment ${data.id} final score: ${finalAssignment?.score}`);
    
    return data;
  }

  async updateAssignment(id, updates) {
    console.log(`🔄 [Supabase] Updating assignment ${id} with:`, updates);
    
    // First check if the assignment exists
    const { data: existingAssignment, error: selectError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (selectError) {
      console.error(`❌ [Supabase] Assignment not found:`, selectError);
      throw new Error(`Assignment with ID ${id} not found`);
    }
    
    console.log(`📋 [Supabase] Existing assignment:`, existingAssignment);
    
    const { data, error } = await supabase
      .from('assignments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`❌ [Supabase] Update assignment error:`, error);
      console.error(`❌ [Supabase] Error details:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log(`✅ [Supabase] Assignment updated successfully:`, data);
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

  // Fast delete for API responsiveness
  async deleteAssignmentFast(id) {
    console.log(`🗑️ [Fast Delete] Deleting assignment: ${id}`);
    return this.deleteAssignment(id);
  }

  // Update subject scores manually
  async updateSubjectScores(subjectId) {
    console.log(`🔄 [Manual Update] Updating scores for subject: ${subjectId}`);
    return this.updateSubjectAssignmentCount(subjectId);
  }

  // Helper function to update assignment scores and recalculate everything
  async updateSubjectAssignmentCount(subjectId) {
    try {
      console.log(`🔄 [Score Redistribution] Starting for subject ${subjectId}...`);
      
      // Count assignments for this subject
      const { count, error: countError } = await supabase
        .from('assignments')
        .select('*', { count: 'exact', head: true })
        .eq('subject_id', subjectId);

      if (countError) {
        console.error(`❌ [Score Redistribution] Count error:`, countError);
        throw countError;
      }

      // Get subject max_score
      const { data: subject, error: subjectError } = await supabase
        .from('subjects')
        .select('max_score')
        .eq('id', subjectId)
        .single();

      if (subjectError) {
        console.error(`❌ [Score Redistribution] Subject error:`, subjectError);
        throw subjectError;
      }

      // Calculate new score per assignment (equal distribution) - use integers only
      const scorePerAssignment = count > 0 ? Math.round(subject.max_score / count) : 0;
      
      console.log(`📊 [Score Redistribution] Subject max_score: ${subject.max_score}, Total assignments: ${count}`);
      console.log(`📊 [Score Redistribution] New score per assignment: ${scorePerAssignment}`);

      // Update subject first - direct database call to avoid recursion
      console.log(`🔄 [Score Redistribution] Updating subject...`);
      const { error: updateSubjectError } = await supabase
        .from('subjects')
        .update({
          total_assignments: count,
          score_per_assignment: scorePerAssignment
        })
        .eq('id', subjectId);
      
      if (updateSubjectError) {
        console.error(`❌ [Score Redistribution] Subject update error:`, updateSubjectError);
        throw updateSubjectError;
      }

      // Update ALL assignments with new score
      console.log(`🔄 [Score Redistribution] Updating all assignments...`);
      await this.updateAllAssignmentScores(subjectId, scorePerAssignment);
      
      // Recalculate existing student scores based on new assignment scores
      console.log(`🔄 [Score Redistribution] Recalculating student scores...`);
      await this.recalculateStudentScores(subjectId, scorePerAssignment);
      
      console.log(`✅ [Score Redistribution] Completed for subject ${subjectId}`);
    } catch (error) {
      console.error(`❌ [Score Redistribution] Failed for subject ${subjectId}:`, error);
      throw error;
    }
  }

  // Update all assignment scores to new equal distribution
  async updateAllAssignmentScores(subjectId, newScore) {
    console.log(`📝 [Assignment Update] Setting all assignments to ${newScore} points for subject ${subjectId}...`);
    
    try {
      // First, check what assignments exist for this subject
      const { data: existingAssignments, error: checkError } = await supabase
        .from('assignments')
        .select('id, title, score, subject_id')
        .eq('subject_id', subjectId);

      if (checkError) {
        console.error(`❌ [Assignment Update] Check error:`, checkError);
        throw checkError;
      }

      console.log(`🔍 [Assignment Update] Found ${existingAssignments?.length || 0} assignments for subject ${subjectId}:`, existingAssignments);

      if (!existingAssignments || existingAssignments.length === 0) {
        console.log(`⚠️ [Assignment Update] No assignments found for subject ${subjectId}`);
        return [];
      }

      // Now update them
      const { data, error } = await supabase
        .from('assignments')
        .update({ score: newScore })
        .eq('subject_id', subjectId)
        .select('id, title, score');

      if (error) {
        console.error(`❌ [Assignment Update] Update error:`, error);
        throw error;
      }

      console.log(`✅ [Assignment Update] Updated ${data?.length || 0} assignments:`, data);
      return data;
    } catch (error) {
      console.error(`❌ [Assignment Update] Failed to update assignments for subject ${subjectId}:`, error);
      throw error;
    }
  }

  // Recalculate student scores based on new assignment score distribution
  async recalculateStudentScores(subjectId, newAssignmentScore) {
    try {
      console.log(`🧮 [Student Score Recalc] Starting for subject ${subjectId}...`);
      
      // Get all assignments for this subject
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id')
        .eq('subject_id', subjectId);

      if (assignmentsError) throw assignmentsError;

      // Get all submissions for this subject with original scores
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('id, student_id, assignment_id, score')
        .eq('subject_id', subjectId);

      if (submissionsError) throw submissionsError;

      console.log(`📊 [Student Score Recalc] Found ${submissions.length} submissions to recalculate`);

      // Update each submission score proportionally
      for (const submission of submissions) {
        // Since we've already updated all assignments to newAssignmentScore,
        // calculate the percentage and apply to new score
        let newSubmissionScore;
        if (newAssignmentScore > 0 && submission.score >= 0) {
          // Keep the same percentage score as before
          const oldAssignmentScore = existingAssignments.find(a => a.id === submission.assignment_id)?.score || 1;
          if (oldAssignmentScore > 0) {
            const scorePercentage = submission.score / oldAssignmentScore;
            newSubmissionScore = Math.round(scorePercentage * newAssignmentScore * 100) / 100;
          } else {
            newSubmissionScore = Math.min(submission.score, newAssignmentScore);
          }
        } else {
          newSubmissionScore = 0;
        }

        // Update submission with new calculated score
        await supabase
          .from('submissions')
          .update({ score: newSubmissionScore })
          .eq('id', submission.id);

        console.log(`📝 [Submission Update] Assignment ${submission.assignment_id}: ${submission.score} → ${newSubmissionScore} (${newAssignmentScore} points max)`);
      }

      // Recalculate total scores for all students in this subject
      await this.updateStudentTotalScores(subjectId);

      console.log(`✅ [Student Score Recalc] Completed for subject ${subjectId}`);
    } catch (error) {
      console.error('❌ Error recalculating student scores:', error);
    }
  }


  // Update student total scores based on their submissions
  async updateStudentTotalScores(subjectId) {
    console.log(`🔢 [Total Score Update] Calculating totals for subject ${subjectId}...`);
    
    // Get all submissions grouped by student
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('student_id, score')
      .eq('subject_id', subjectId);

    if (error) throw error;

    // Group by student and calculate totals
    const studentTotals = {};
    submissions.forEach(submission => {
      if (!studentTotals[submission.student_id]) {
        studentTotals[submission.student_id] = 0;
      }
      studentTotals[submission.student_id] += submission.score || 0;
    });

    // Update each student's total score
    for (const [studentUuid, totalScore] of Object.entries(studentTotals)) {
      const { data: student } = await supabase
        .from('students')
        .select('student_id')
        .eq('id', studentUuid)
        .single();

      if (student) {
        await this.updateStudent(student.student_id, {
          total_score: Math.round(totalScore)
        });
        console.log(`📊 [Total Score] Student ${student.student_id}: ${totalScore}`);
      }
    }

    console.log(`✅ [Total Score Update] Updated ${Object.keys(studentTotals).length} students`);
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

  // Test function for debugging assignment score updates
  async testAssignmentScoreUpdate() {
    try {
      console.log('🧪 [TEST] Starting assignment score update test...');
      
      // Get first subject
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, max_score')
        .limit(1);
      
      if (subjectsError || !subjects?.length) {
        console.log('❌ [TEST] No subjects found');
        return;
      }
      
      const subject = subjects[0];
      console.log(`🧪 [TEST] Testing with subject: ${subject.name} (max_score: ${subject.max_score})`);
      
      // Manually call updateSubjectAssignmentCount
      await this.updateSubjectAssignmentCount(subject.id);
      
      console.log('✅ [TEST] Test completed');
    } catch (error) {
      console.error('❌ [TEST] Test failed:', error);
    }
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