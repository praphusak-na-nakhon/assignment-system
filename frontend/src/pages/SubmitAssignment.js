import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const SubmitAssignment = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState(''); // 'uploading', 'processing', 'saving'
  useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await studentAPI.getDashboard();
      const data = response.data;
      setDashboardData(data);
      
      // Auto-select subject if student has only one subject
      if (data.subjects && data.subjects.length === 1) {
        setSelectedSubject(data.subjects[0].id);
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ (JPEG, PNG, GIF) เท่านั้น');
        e.target.value = '';
        return;
      }
      
      // Validate file size (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('ขนาดไฟล์ใหญ่เกินไป (สูงสุด 10MB)');
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedAssignment) {
      toast.error('กรุณาเลือกงานที่ต้องการส่ง');
      return;
    }
    
    if (!file) {
      toast.error('กรุณาเลือกไฟล์ที่ต้องการส่ง');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignmentId', selectedAssignment);
    formData.append('subjectId', selectedSubject);

    setSubmitting(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    
    // Set timeout for upload
    const uploadTimeout = setTimeout(() => {
      setSubmitting(false);
      setUploadProgress(0);
      setUploadStage('error');
      toast.error('การอัปโหลดใช้เวลานานเกินไป กรุณาลองใหม่');
    }, 300000); // 5 minutes timeout
    
    try {
      const response = await studentAPI.submitAssignment(formData, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          
          if (percentCompleted === 100) {
            setUploadStage('processing');
          }
        }
      });
      
      clearTimeout(uploadTimeout);
      
      setUploadStage('saving');
      
      if (response.data.success) {
        setUploadProgress(100);
        setUploadStage('completed');
        toast.success(response.data.message, { duration: 5000 });
        
        // Wait a bit to show completion before navigating
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 1500);
      }
    } catch (error) {
      clearTimeout(uploadTimeout); // Clear timeout on error
      console.error('Submit error:', error);
      setUploadStage('error');
      
      // Handle timeout errors specially
      if (error.code === 'ECONNABORTED') {
        toast.error('การส่งงานใช้เวลานานเกินไป อาจส่งสำเร็จแล้ว กรุณาตรวจสอบในหน้าหลัก', { duration: 6000 });
        navigate('/student/dashboard');
      } else {
        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งงาน');
      }
    } finally {
      setSubmitting(false);
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage('');
      }, 3000);
    }
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

  const { subjects, assignments } = dashboardData;
  const availableAssignments = assignments.filter(
    a => (!selectedSubject || a.subjectId === selectedSubject) && !a.isSubmitted
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ส่งงาน</h1>
              <p className="text-sm text-gray-600">อัปโหลดไฟล์งานของคุณ</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <Card.Header>
              <Card.Title>ส่งงาน</Card.Title>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Subject Selection (only show if student has multiple subjects) */}
                {subjects.length > 1 && (
                  <div>
                    <label className="form-label">เลือกวิชา</label>
                    <select
                      className="form-input"
                      value={selectedSubject}
                      onChange={(e) => {
                        setSelectedSubject(e.target.value);
                        setSelectedAssignment(''); // Reset assignment when subject changes
                      }}
                      required
                    >
                      <option value="">-- เลือกวิชา --</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} - {subject.class}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Display (for single subject) */}
                {subjects.length === 1 && (
                  <div>
                    <label className="form-label">วิชา</label>
                    <div className="form-input bg-gray-50">
                      {subjects[0].name} - {subjects[0].class}
                    </div>
                  </div>
                )}

                {/* Assignment Selection */}
                <div>
                  <label className="form-label">เลือกงาน</label>
                  <select
                    className="form-input"
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    required
                    disabled={!selectedSubject}
                  >
                    <option value="">-- เลือกงานที่ต้องการส่ง --</option>
                    {availableAssignments.map((assignment) => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                        {assignment.dueDate && ` (กำหนดส่ง: ${new Date(assignment.dueDate).toLocaleDateString('th-TH')})`}
                      </option>
                    ))}
                  </select>
                  {selectedSubject && availableAssignments.length === 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      ไม่มีงานที่ยังไม่ได้ส่งในวิชานี้
                    </p>
                  )}
                </div>

                {/* Assignment Details */}
                {selectedAssignment && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    {(() => {
                      const assignment = assignments.find(a => a.id === selectedAssignment);
                      return assignment ? (
                        <div>
                          <h4 className="font-medium text-blue-900 mb-2">รายละเอียดงาน</h4>
                          <p className="text-sm text-blue-800 mb-1">
                            <strong>ชื่องาน:</strong> {assignment.title}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-blue-800 mb-1">
                              <strong>คำอธิบาย:</strong> {assignment.description}
                            </p>
                          )}
                          {assignment.dueDate && (
                            <p className="text-sm text-blue-800 mb-1">
                              <strong>กำหนดส่ง:</strong> {new Date(assignment.dueDate).toLocaleDateString('th-TH')}
                            </p>
                          )}
                          <p className="text-sm text-blue-800">
                            <strong>คะแนน:</strong> {assignment.score || 'ยังไม่กำหนด'} คะแนน
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* File Upload */}
                <div>
                  <label className="form-label">เลือกไฟล์ (รูปภาพเท่านั้น, ขนาดไม่เกิน 10MB)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-input"
                    required
                  />
                  {file && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        ไฟล์ที่เลือก: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Upload Progress */}
                {submitting && (
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-300 ${
                          uploadStage === 'error' ? 'bg-red-500' : 
                          uploadStage === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {uploadStage === 'uploading' && 'กำลังอัปโหลดไฟล์...'}
                        {uploadStage === 'processing' && 'กำลังประมวลผลไฟล์...'}
                        {uploadStage === 'saving' && 'กำลังบันทึกข้อมูล...'}
                        {uploadStage === 'completed' && 'ส่งงานสำเร็จ!'}
                        {uploadStage === 'error' && 'เกิดข้อผิดพลาด'}
                        {!uploadStage && 'เตรียมส่งงาน...'}
                      </span>
                      <span className="text-gray-500 font-mono">
                        {uploadProgress}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    fullWidth
                    loading={submitting}
                    disabled={!selectedAssignment || !file}
                  >
                    {submitting ? 
                      (uploadStage === 'uploading' ? `กำลังอัปโหลด... ${uploadProgress}%` :
                       uploadStage === 'processing' ? 'กำลังประมวลผล...' :
                       uploadStage === 'saving' ? 'กำลังบันทึก...' :
                       uploadStage === 'completed' ? 'ส่งงานสำเร็จ!' :
                       'กำลังส่งงาน...') : 
                      'ส่งงาน'
                    }
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SubmitAssignment;