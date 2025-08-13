import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ViewStudentScores = () => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Update available classes when subjects change
    if (subjects.length > 0) {
      const classes = [...new Set(subjects.map(s => s.class))].sort();
      setAvailableClasses(classes);
    }
  }, [subjects]);

  useEffect(() => {
    // Filter students based on selected criteria
    let filtered = students;
    
    if (selectedClass) {
      filtered = filtered.filter(student => student.class === selectedClass);
    }
    
    if (selectedSubject) {
      const subject = subjects.find(s => s.id === selectedSubject);
      if (subject) {
        filtered = filtered.filter(student => student.class === subject.class);
      }
    }
    
    setFilteredStudents(filtered);
  }, [students, selectedSubject, selectedClass, subjects]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, studentsRes, assignmentsRes, submissionsRes] = await Promise.all([
        teacherAPI.getSubjects(),
        teacherAPI.getStudents(),
        teacherAPI.getAssignments(),
        teacherAPI.getSubmissions()
      ]);

      if (subjectsRes.data.success) setSubjects(subjectsRes.data.data || []);
      if (studentsRes.data.success) setStudents(studentsRes.data.data || []);
      if (assignmentsRes.data.success) setAssignments(assignmentsRes.data.data || []);
      if (submissionsRes.data.success) setSubmissions(submissionsRes.data.data || []);
    } catch (error) {
      console.error('Fetch data error:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getStudentScoreData = (student) => {
    const studentSubmissions = submissions.filter(s => s.studentId === student.studentId);
    const subjectAssignments = selectedSubject 
      ? assignments.filter(a => a.subjectId === selectedSubject && a.isActive)
      : assignments.filter(a => a.isActive);
    
    const scoreData = subjectAssignments
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)) // Sort by creation date
      .map(assignment => {
        const submission = studentSubmissions.find(s => s.assignmentId === assignment.id);
        return {
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          maxScore: assignment.score || 0,
          studentScore: submission ? submission.score : 0,
          isSubmitted: !!submission,
          submittedAt: submission ? submission.submittedAt : null
        };
      });

    const totalScore = scoreData.reduce((sum, item) => sum + item.studentScore, 0);
    const maxTotalScore = scoreData.reduce((sum, item) => sum + item.maxScore, 0);

    return { scoreData, totalScore, maxTotalScore };
  };

  const exportToExcel = () => {
    if (!selectedClass || !selectedSubject || filteredStudents.length === 0) {
      toast.error('กรุณาเลือกห้องและวิชา และมีข้อมูลนักเรียนก่อนส่งออก');
      return;
    }

    const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
    
    // สร้าง header
    const { scoreData } = getStudentScoreData(filteredStudents[0]);
    const assignmentHeaders = scoreData.map(assignment => assignment.assignmentTitle);
    
    const headers = [
      'เลขประจำตัว',
      'ชื่อ-นามสกุล', 
      'ห้อง',
      ...assignmentHeaders,
      'คะแนนรวม',
      'คะแนนเต็ม',
      'เปอร์เซ็นต์'
    ];

    // สร้าง data rows
    const dataRows = filteredStudents.map(student => {
      const { scoreData, totalScore, maxTotalScore } = getStudentScoreData(student);
      const percentage = maxTotalScore > 0 ? (totalScore / maxTotalScore * 100).toFixed(1) : '0.0';
      
      return [
        student.studentId,
        student.name,
        student.class,
        ...scoreData.map(assignment => assignment.isSubmitted ? assignment.studentScore : ''),
        totalScore,
        maxTotalScore,
        `${percentage}%`
      ];
    });

    // สร้าง max score row สำหรับแสดงคะแนนเต็มของแต่ละงาน
    const maxScoreRow = [
      '',
      'คะแนนเต็ม',
      '',
      ...scoreData.map(assignment => assignment.maxScore),
      '',
      '',
      ''
    ];

    // รวม headers, max score row, และ data
    const allData = [headers, maxScoreRow, ...dataRows];

    // สร้าง workbook และ worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(allData);

    // ปรับขนาดคอลัมน์
    const colWidths = [
      { wch: 15 }, // เลขประจำตัว
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 10 }, // ห้อง
      ...assignmentHeaders.map(() => ({ wch: 15 })), // งานต่างๆ
      { wch: 12 }, // คะแนนรวม
      { wch: 12 }, // คะแนนเต็ม
      { wch: 12 }  // เปอร์เซ็นต์
    ];
    ws['!cols'] = colWidths;

    // เพิ่ม worksheet ลง workbook
    XLSX.utils.book_append_sheet(wb, ws, 'คะแนน');

    // ส่งออกไฟล์
    const fileName = `คะแนน_${selectedSubjectData?.name || 'วิชา'}_${selectedClass}_${new Date().toLocaleDateString('th-TH')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('ส่งออกไฟล์ Excel เรียบร้อย');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ดูคะแนนนักเรียน
              </h1>
              <p className="text-sm text-gray-600">
                ผู้ใช้: {user?.username} | นักเรียนทั้งหมด: {filteredStudents.length} คน
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/teacher/dashboard')}
              >
                ← กลับ
              </Button>
              <Button 
                variant="secondary" 
                onClick={fetchData}
                disabled={loading}
              >
                รีเฟรช
              </Button>
              <Button 
                variant="success" 
                onClick={exportToExcel}
                disabled={!selectedClass || !selectedSubject || filteredStudents.length === 0}
              >
                📊 ส่งออก Excel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Filter Controls */}
          <Card className="mb-6">
            <Card.Header>
              <Card.Title>เลือกเงื่อนไข</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกห้อง
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedSubject(''); // Reset subject when class changes
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- เลือกห้อง --</option>
                    {availableClasses.map(className => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกวิชา
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedClass}
                    required
                  >
                    <option value="">-- เลือกวิชา --</option>
                    {subjects
                      .filter(subject => selectedClass && subject.class === selectedClass)
                      .map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.class})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {selectedSubjectData && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">ข้อมูลวิชา</h4>
                  <p className="text-sm text-blue-800">
                    วิชา: {selectedSubjectData.name} | ห้อง: {selectedSubjectData.class} | 
                    คะแนนเต็ม: {selectedSubjectData.maxScore} | 
                    งานทั้งหมด: {selectedSubjectData.totalAssignments} งาน
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Student Scores Table */}
          <Card>
            <Card.Header>
              <Card.Title>
                ตารางคะแนนนักเรียน
                {selectedClass && ` - ${selectedClass}`}
                {selectedSubjectData && ` - ${selectedSubjectData.name}`}
              </Card.Title>
            </Card.Header>
            <Card.Body>
              {selectedClass && selectedSubject && filteredStudents.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          เลขประจำตัว
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ชื่อ-นามสกุล
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ห้อง
                        </th>
                        {/* Dynamic assignment columns */}
                        {selectedClass && selectedSubject && filteredStudents.length > 0 && (() => {
                          const { scoreData } = getStudentScoreData(filteredStudents[0]);
                          return scoreData.map((assignment, index) => (
                            <th key={assignment.assignmentId} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                              <div className="flex flex-col items-center">
                                <div className="truncate max-w-[70px]" title={assignment.assignmentTitle}>
                                  {assignment.assignmentTitle}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  ({assignment.maxScore})
                                </div>
                              </div>
                            </th>
                          ));
                        })()}
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          คะแนนรวม
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map((student) => {
                        const { scoreData, totalScore, maxTotalScore } = getStudentScoreData(student);
                                          
                        return (
                          <tr key={student.studentId} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                              {student.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                              {student.name}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              {student.class}
                            </td>
                            {/* Individual assignment scores */}
                            {scoreData.map((assignment) => (
                              <td key={assignment.assignmentId} className="px-3 py-4 text-center text-sm">
                                <div className="flex flex-col items-center">
                                  <div className={`font-medium ${
                                    assignment.isSubmitted ? 'text-gray-900' : 'text-gray-400'
                                  }`}>
                                    {assignment.isSubmitted ? assignment.studentScore : '-'}
                                  </div>
                                  {assignment.isSubmitted && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full mt-1"></div>
                                  )}
                                </div>
                              </td>
                            ))}
                            <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                              <div className="font-medium">
                                <span className="text-gray-900">{totalScore}</span>
                                <span className="text-gray-500">/{maxTotalScore}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">
                    {!selectedClass ? 'กรุณาเลือกห้องก่อน' :
                     !selectedSubject ? 'กรุณาเลือกวิชาก่อน' :
                     'ไม่พบข้อมูลนักเรียน'}
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    {!selectedClass || !selectedSubject ? 
                      'เลือกห้องและวิชาเพื่อดูคะแนนนักเรียน' :
                      'ไม่มีนักเรียนในห้องและวิชาที่เลือก'
                    }
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewStudentScores;