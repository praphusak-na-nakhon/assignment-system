import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    subjects: 0,
    students: 0,
    assignments: 0,
    submissions: 0
  });
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all teacher data in parallel
      const [subjectsRes, studentsRes, assignmentsRes, submissionsRes] = await Promise.all([
        teacherAPI.getSubjects(),
        teacherAPI.getStudents(),
        teacherAPI.getAssignments(),
        teacherAPI.getSubmissions()
      ]);

      const subjects = subjectsRes.data.data || [];
      const students = studentsRes.data.data || [];
      const assignments = assignmentsRes.data.data || [];
      const submissions = submissionsRes.data.data || [];

      setDashboardData({
        subjects,
        students,
        assignments,
        submissions
      });

      setStats({
        subjects: subjects.length,
        students: students.length,
        assignments: assignments.length,
        submissions: submissions.length
      });

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error);
      
      // Handle specific error types
      if (error.code === 'ECONNABORTED') {
        toast.error('การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง', { duration: 6000 });
      } else if (error.response?.status === 429) {
        toast.error('Google Sheets ใช้งานเกินขีดจำกัด กรุณารอสักครู่แล้วลองใหม่', { duration: 6000 });
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/teacher/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <Card.Body className="text-center p-8">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-gray-600 mb-6">
              {error.code === 'ECONNABORTED' 
                ? 'การเชื่อมต่อใช้เวลานานเกินไป' 
                : 'ไม่สามารถโหลดข้อมูลได้'}
            </p>
            <div className="space-y-3">
              <Button onClick={fetchDashboardData} disabled={loading}>
                {loading ? 'กำลังโหลด...' : 'ลองใหม่'}
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const recentSubmissions = dashboardData?.submissions?.slice(0, 5) || [];
  const recentAssignments = dashboardData?.assignments?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                แดชบอร์ดครู
              </h1>
              <p className="text-sm text-gray-600">
                ยินดีต้อนรับ, {user?.username}
              </p>
            </div>
            <Button variant="secondary" onClick={handleLogout}>
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <Card.Body className="text-center p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.subjects}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  วิชาที่สอน
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body className="text-center p-6">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.students}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  นักเรียนทั้งหมด
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body className="text-center p-6">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {stats.assignments}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  งานที่มอบหมาย
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body className="text-center p-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats.submissions}
                </div>
                <div className="text-sm font-medium text-gray-600">
                  งานที่ส่งแล้ว
                </div>
              </Card.Body>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Button 
              fullWidth
              onClick={() => navigate('/teacher/subjects')}
              className="h-12"
            >
              จัดการวิชา
            </Button>
            <Button 
              fullWidth
              variant="secondary"
              onClick={() => navigate('/teacher/students')}
              className="h-12"
            >
              จัดการนักเรียน
            </Button>
            <Button 
              fullWidth
              variant="secondary"
              onClick={() => navigate('/teacher/assignments')}
              className="h-12"
            >
              จัดการงาน
            </Button>
            <Button 
              fullWidth
              variant="secondary"
              onClick={() => navigate('/teacher/submissions')}
              className="h-12"
            >
              ดูคะแนนนักเรียน
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Submissions */}
            <Card>
              <Card.Header>
                <Card.Title>งานที่ส่งล่าสุด</Card.Title>
              </Card.Header>
              <Card.Body>
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {recentSubmissions.map((submission, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {submission.studentName || submission.studentId}
                          </div>
                          <div className="text-xs text-gray-600">
                            {submission.assignmentTitle || 'งานไม่ทราบชื่อ'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {submission.submittedAt ? 
                            new Date(submission.submittedAt).toLocaleDateString('th-TH') : 
                            'ไม่ทราบวันที่'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    ยังไม่มีงานที่ส่ง
                  </p>
                )}
                
                {recentSubmissions.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate('/teacher/submissions')}
                    >
                      ดูทั้งหมด
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Recent Assignments */}
            <Card>
              <Card.Header>
                <Card.Title>งานล่าสุด</Card.Title>
              </Card.Header>
              <Card.Body>
                {recentAssignments.length > 0 ? (
                  <div className="space-y-3">
                    {recentAssignments.map((assignment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">
                            {assignment.title}
                          </div>
                          <div className="text-xs text-gray-600">
                            {assignment.subjectName || 'วิชาไม่ทราบชื่อ'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.dueDate ? 
                            new Date(assignment.dueDate).toLocaleDateString('th-TH') : 
                            'ไม่กำหนด'
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    ยังไม่มีงานที่มอบหมาย
                  </p>
                )}
                
                {recentAssignments.length > 0 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => navigate('/teacher/assignments')}
                    >
                      ดูทั้งหมด
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;