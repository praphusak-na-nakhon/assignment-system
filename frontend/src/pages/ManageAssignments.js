import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const ManageAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectId: '',
    dueDate: '',
    score: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assignmentsRes, subjectsRes] = await Promise.all([
        teacherAPI.getAssignments(),
        teacherAPI.getSubjects()
      ]);

      if (assignmentsRes.data.success) {
        setAssignments(assignmentsRes.data.data || []);
      }
      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data || []);
      }
    } catch (error) {
      console.error('Fetch data error:', error);
      
      // Handle different types of errors
      if (error.code === 'ECONNABORTED') {
        toast.error('การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองรีเฟรชใหม่', { duration: 6000 });
      } else if (error.response?.status === 429) {
        toast.error('Google Sheets ใช้งานเกินขีดจำกัด กรุณารอสักครู่แล้วลองใหม่', { duration: 6000 });
      } else {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองรีเฟรชใหม่');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('กรุณาระบุชื่องาน');
      return;
    }
    
    if (!formData.subjectId) {
      toast.error('กรุณาเลือกวิชา');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        ...formData,
        score: parseFloat(formData.score) || 0
      };

      if (editingAssignment) {
        await teacherAPI.updateAssignment(editingAssignment.id, data);
        
        // Optimistic update for edit
        setAssignments(prev => prev.map(a => 
          a.id === editingAssignment.id 
            ? { ...a, ...data, subjectName: subjects.find(s => s.id === data.subjectId)?.name || 'ไม่ทราบ' }
            : a
        ));
      } else {
        await teacherAPI.createAssignment(data);
        
        // Optimistic update for create (temporary ID)
        const tempId = Date.now().toString();
        const subject = subjects.find(s => s.id === data.subjectId);
        setAssignments(prev => [...prev, {
          ...data,
          id: tempId,
          createdAt: new Date().toISOString(),
          isActive: true,
          subjectName: subject?.name || 'ไม่ทราบ',
          subjectClass: subject?.class || 'ไม่ทราบ'
        }]);
      }

      handleCloseModal();
      
      // Show success message with note about background processing
      toast.success(
        editingAssignment 
          ? 'แก้ไขงานสำเร็จ (ระบบกำลังคำนวณคะแนนในเบื้องหลัง)' 
          : 'เพิ่มงานสำเร็จ (ระบบกำลังคำนวณคะแนนในเบื้องหลัง)', 
        { duration: 4000 }
      );
      
      return; // Exit early to avoid going to catch block
    } catch (error) {
      console.error('Submit error:', error);
      
      // Handle timeout errors specially
      if (error.code === 'ECONNABORTED') {
        toast.error('การบันทึกใช้เวลานานเกินไป อาจบันทึกสำเร็จแล้ว กรุณากดรีเฟรชเพื่อตรวจสอบ', { duration: 6000 });
        handleCloseModal();
      } else {
        const message = error.response?.data?.message || 'เกิดข้อผิดพลาด';
        toast.error(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title || '',
      description: assignment.description || '',
      subjectId: assignment.subjectId || '',
      dueDate: assignment.dueDate ? assignment.dueDate.split('T')[0] : '',
      score: assignment.score || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (assignment) => {
    try {
      setDeleting(true);
      await teacherAPI.deleteAssignment(assignment.id);
      
      // Optimistic delete - remove from UI immediately
      setAssignments(prev => prev.filter(a => a.id !== assignment.id));
      setDeleteConfirm(null);
      toast.success('ลบงานสำเร็จ (ระบบกำลังคำนวณคะแนนในเบื้องหลัง)', { duration: 4000 });
      
      // Set deleting to false immediately after successful operation
      setDeleting(false);
      
      return; // Exit early to avoid going to catch block
    } catch (error) {
      console.error('Delete error:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('การลบใช้เวลานานเกินไป อาจลบสำเร็จแล้ว กรุณากดรีเฟรชเพื่อตรวจสอบ', { duration: 6000 });
        setDeleteConfirm(null);
      } else if (error.response?.status === 429) {
        const retryAfter = error.response?.data?.retryAfter || 60;
        toast.error(
          `Google Sheets ใช้งานเกินขีดจำกัด กรุณารอ ${retryAfter} วินาที แล้วลองใหม่`, 
          { duration: 8000 }
        );
      } else {
        const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบงาน';
        toast.error(errorMessage);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      subjectId: '',
      dueDate: '',
      score: 0
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'ไม่กำหนด';
    try {
      return new Date(dateString).toLocaleDateString('th-TH');
    } catch {
      return 'ไม่กำหนด';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดข้อมูล..." />
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
              <h1 className="text-2xl font-bold text-gray-900">
                จัดการงาน
              </h1>
              <p className="text-sm text-gray-600">
                ผู้ใช้: {user?.username} | งานทั้งหมด: {assignments.length}
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
                onClick={() => fetchData()}
                disabled={loading}
              >
                {loading ? 'โหลด...' : '🔄 รีเฟรช'}
              </Button>
              <Button onClick={() => setShowModal(true)}>
                เพิ่มงานใหม่
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Assignments Table */}
          <Card>
            <Card.Header>
              <Card.Title>รายการงาน</Card.Title>
            </Card.Header>
            <Card.Body>
              {assignments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ชื่องาน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          วิชา
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          กำหนดส่ง
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          คะแนน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          สร้างเมื่อ
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          การจัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {assignment.title}
                              </div>
                              {assignment.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {assignment.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {assignment.subjectName || 'ไม่ทราบ'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {assignment.subjectClass || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(assignment.dueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assignment.score || 0} คะแนน
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(assignment.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(assignment)}
                              >
                                แก้ไข
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => setDeleteConfirm(assignment)}
                              >
                                ลบ
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">ยังไม่มีงานที่มอบหมาย</p>
                  <Button 
                    className="mt-4"
                    onClick={() => setShowModal(true)}
                  >
                    เพิ่มงานแรก
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Assignment Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingAssignment ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ชื่องาน *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ระบุชื่องาน"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="คำอธิบายงาน (ไม่บังคับ)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วิชา *
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">เลือกวิชา</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} ({subject.class})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                กำหนดส่ง
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                คะแนนเต็ม (ไม่บังคับ - ระบบจะคำนวณอัตโนมัติ)
              </label>
              <input
                type="number"
                name="score"
                value={formData.score}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button type="submit" loading={submitting} disabled={submitting}>
              {submitting 
                ? (editingAssignment ? 'กำลังบันทึก...' : 'กำลังเพิ่ม...')
                : (editingAssignment ? 'บันทึก' : 'เพิ่ม')
              }
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="ยืนยันการลบ"
      >
        {deleteConfirm && (
          <div className="space-y-4">
            <p className="text-gray-700">
              คุณต้องการลบงาน <strong>"{deleteConfirm.title}"</strong> หรือไม่?
            </p>
            <p className="text-sm text-red-600">
              การลบจะไม่สามารถย้อนกลับได้
            </p>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                ยกเลิก
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteConfirm)}
                loading={deleting}
                disabled={deleting}
              >
                {deleting ? 'กำลังลบ...' : 'ลบ'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageAssignments;