import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...', forceRefresh ? '(force refresh)' : ''); // Debug log
      
      // Force refresh by adding timestamp to prevent cache
      const response = await studentAPI.getDashboard();
      console.log('Dashboard data:', response.data); // Debug log
      console.log('Assignments count:', response.data.assignments.length); // Debug assignments
      
      setDashboardData(response.data);
      
      if (forceRefresh) {
        toast.success('รีเฟรชข้อมูลเรียบร้อย');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดข้อมูล..." />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">ไม่สามารถโหลดข้อมูลได้</p>
            <Button onClick={fetchDashboardData}>ลองใหม่</Button>
          </div>
        </Card>
      </div>
    );
  }

  const { student, subjects, assignments } = dashboardData.data || dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ยินดีต้อนรับ, {student.name}
              </h1>
              <p className="text-sm text-gray-600">
                เลขประจำตัว: {student.studentId} | ชั้น: {student.class}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => fetchDashboardData(true)}
                disabled={loading}
              >
                {loading ? 'โหลด...' : 'รีเฟรช'}
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              console.log('Navigating to submit page...');
              navigate('/student/submit');
            }}>
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ส่งงาน</h3>
                <p className="text-sm text-gray-600">อัปโหลดไฟล์งานของคุณ</p>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              console.log('Navigating to scores page...');
              navigate('/student/scores');
            }}>
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ดูคะแนน</h3>
                <p className="text-sm text-gray-600">ตรวจสอบคะแนนของแต่ละวิชา</p>
              </div>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
              console.log('Navigating to documents page...');
              navigate('/student/documents');
            }}>
              <div className="text-center py-6">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">ดาวน์โหลดเอกสาร</h3>
                <p className="text-sm text-gray-600">เอกสารและไฟล์จากครู</p>
              </div>
            </Card>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{subjects.length}</div>
                <div className="text-sm text-gray-600 mt-1">วิชาที่ลงทะเบียน</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{assignments.filter(a => a.isSubmitted).length}</div>
                <div className="text-sm text-gray-600 mt-1">งานที่ส่งแล้ว</div>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{assignments.filter(a => !a.isSubmitted).length}</div>
                <div className="text-sm text-gray-600 mt-1">งานที่ยังไม่ส่ง</div>
              </div>
            </Card>
          </div>

          {/* Recent Assignments */}
          <Card>
            <Card.Header>
              <Card.Title>งานล่าสุด</Card.Title>
            </Card.Header>
            <Card.Body>
              {assignments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีงานที่ได้รับมอบหมาย
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 5)
                    .map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <p className="text-sm text-gray-600">
                          {assignment.subjectName} - {assignment.subjectClass}
                        </p>
                        {assignment.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            กำหนดส่ง: {new Date(assignment.dueDate).toLocaleDateString('th-TH')}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {assignment.isSubmitted ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ส่งแล้ว ({assignment.submissionScore} คะแนน)
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ยังไม่ส่ง
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;