import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { studentAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const ViewScores = () => {
  const [scoreData, setScoreData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScoreData();
  }, []);

  const fetchScoreData = async () => {
    try {
      const response = await studentAPI.getScores();
      const subjects = response.data.data;
      setScoreData(subjects);
      
      // Auto-select if only one subject
      if (subjects.length === 1) {
        setSelectedSubject(subjects[0]);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคะแนน');
      console.error('Score data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดข้อมูลคะแนน..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ดูคะแนน</h1>
              <p className="text-sm text-gray-600">ตรวจสอบคะแนนของแต่ละวิชา</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={fetchScoreData} disabled={loading}>
                รีเฟรช
              </Button>
              <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
                กลับหน้าหลัก
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {scoreData.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ยังไม่มีข้อมูลคะแนน</h3>
                <p className="mt-1 text-sm text-gray-500">คุณยังไม่ได้ลงทะเบียนเรียนวิชาใดๆ</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Subject Selection - only show if multiple subjects */}
              {scoreData.length > 1 && !selectedSubject && (
                <Card>
                  <Card.Header>
                    <Card.Title>เลือกวิชาที่ต้องการดูคะแนน</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scoreData.map((subject) => (
                        <div
                          key={subject.subjectId}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedSubject(subject)}
                        >
                          <h3 className="font-medium text-gray-900">{subject.subjectName}</h3>
                          <p className="text-sm text-gray-600">ชั้น: {subject.class}</p>
                          <p className="text-sm text-gray-600">
                            นักเรียน: {subject.students?.length || 0} คน
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Score Details - show when subject is selected or only one subject */}
              {selectedSubject && (
                <div className="space-y-6">
                  {/* Subject Info */}
                  <Card>
                    <div className="flex items-center justify-between p-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedSubject.subjectName}</h2>
                        <p className="text-sm text-gray-600">ชั้น: {selectedSubject.class}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          แสดงคะแนนของนักเรียนทั้งหมด: {selectedSubject.students?.length || 0} คน
                        </p>
                      </div>
                      {scoreData.length > 1 && (
                        <Button variant="secondary" onClick={() => setSelectedSubject(null)}>
                          เลือกวิชาอื่น
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* Score Table - Same as Teacher View */}
                  <Card>
                    <Card.Header>
                      <Card.Title>ตารางคะแนน - {selectedSubject.subjectName}</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      {!selectedSubject.assignments || selectedSubject.assignments.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          ยังไม่มีงานในวิชานี้
                        </div>
                      ) : (
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
                                {selectedSubject.assignments.map((assignment, index) => (
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
                                ))}
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  คะแนนรวม
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {selectedSubject.students?.map((student) => (
                                <tr key={student.studentId} className="hover:bg-gray-50">
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                                    {student.studentId}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-left text-sm text-gray-900">
                                    {student.studentName}
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                    {student.class}
                                  </td>
                                  {/* Individual assignment scores */}
                                  {student.assignments?.map((assignment, index) => (
                                    <td key={`${student.studentId}-${assignment.assignmentTitle || assignment.assignmentId || index}`} className="px-3 py-4 text-center text-sm">
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
                                      <span className="text-gray-900">{student.totalScore}</span>
                                      <span className="text-gray-500">/{student.maxTotalScore}</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewScores;