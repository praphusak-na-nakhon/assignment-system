import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { teacherAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    description: '',
    maxScore: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await teacherAPI.getSubjects();
      setSubjects(response.data.data || []);
    } catch (error) {
      console.error('Fetch subjects error:', error);
      toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูลวิชา');
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

  const openAddModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      class: '',
      description: '',
      maxScore: ''
    });
    setShowModal(true);
  };

  const openEditModal = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '',
      class: subject.class || '',
      description: subject.description || '',
      maxScore: subject.maxScore || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSubject(null);
    setFormData({
      name: '',
      class: '',
      description: '',
      maxScore: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.class.trim()) {
      toast.error('กรุณากรอกชื่อวิชาและชั้นเรียน');
      return;
    }

    if (formData.maxScore && (isNaN(formData.maxScore) || Number(formData.maxScore) <= 0)) {
      toast.error('กรุณากรอกคะแนนเต็มที่ถูกต้อง');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        maxScore: formData.maxScore ? Number(formData.maxScore) : undefined
      };

      if (editingSubject) {
        // Update existing subject
        await teacherAPI.updateSubject(editingSubject.id, submitData);
        
        // Optimistic update for edit
        setSubjects(prev => prev.map(s => 
          s.id === editingSubject.id 
            ? { ...s, ...submitData }
            : s
        ));
        toast.success('แก้ไขวิชาเรียบร้อยแล้ว');
      } else {
        // Create new subject
        await teacherAPI.createSubject(submitData);
        
        // Optimistic update for create (temporary ID)
        const tempId = Date.now().toString();
        setSubjects(prev => [...prev, {
          ...submitData,
          id: tempId
        }]);
        toast.success('เพิ่มวิชาเรียบร้อยแล้ว');
      }
      
      closeModal();
    } catch (error) {
      console.error('Submit subject error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกวิชา');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`คุณแน่ใจที่จะลบวิชา "${subject.name} - ${subject.class}" หรือไม่?`)) {
      return;
    }

    try {
      await teacherAPI.deleteSubject(subject.id);
      
      // Optimistic delete - remove from UI immediately
      setSubjects(prev => prev.filter(s => s.id !== subject.id));
      toast.success('ลบวิชาเรียบร้อยแล้ว');
    } catch (error) {
      console.error('Delete subject error:', error);
      toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการลบวิชา');
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="secondary" 
                onClick={() => navigate('/teacher/dashboard')}
              >
                ← กลับ
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">จัดการวิชา</h1>
                <p className="text-sm text-gray-600">เพิ่ม แก้ไข และลบวิชาเรียน</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">สวัสดี {user?.username}</span>
              <Button variant="secondary" onClick={handleLogout}>
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Add Subject Button */}
          <div className="mb-6">
            <Button onClick={openAddModal}>
              + เพิ่มวิชาใหม่
            </Button>
          </div>

          {/* Subjects List */}
          {subjects.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-12">
                <p className="text-gray-500 text-lg mb-4">ยังไม่มีวิชาในระบบ</p>
                <Button onClick={openAddModal}>
                  เพิ่มวิชาแรก
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <Card key={subject.id}>
                  <Card.Header>
                    <Card.Title>{subject.name}</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm">
                        <span className="font-medium">ชั้น:</span> {subject.class}
                      </p>
                      {subject.description && (
                        <p className="text-sm">
                          <span className="font-medium">คำอธิบาย:</span> {subject.description}
                        </p>
                      )}
                      {subject.maxScore && (
                        <p className="text-sm">
                          <span className="font-medium">คะแนนเต็ม:</span> {subject.maxScore}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => openEditModal(subject)}
                        className="flex-1"
                      >
                        แก้ไข
                      </Button>
                      <Button 
                        size="sm" 
                        variant="danger"
                        onClick={() => handleDelete(subject)}
                        className="flex-1"
                      >
                        ลบ
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Subject Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingSubject ? 'แก้ไขวิชา' : 'เพิ่มวิชาใหม่'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">ชื่อวิชา *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="เช่น คณิตศาสตร์"
              required
            />
          </div>

          <div>
            <label className="form-label">ชั้นเรียน *</label>
            <input
              type="text"
              name="class"
              value={formData.class}
              onChange={handleInputChange}
              className="form-input"
              placeholder="เช่น ม.1/1"
              required
            />
          </div>

          <div>
            <label className="form-label">คำอธิบาย</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows={3}
              placeholder="คำอธิบายเกี่ยวกับวิชา (ไม่บังคับ)"
            />
          </div>

          <div>
            <label className="form-label">คะแนนเต็ม</label>
            <input
              type="number"
              name="maxScore"
              value={formData.maxScore}
              onChange={handleInputChange}
              className="form-input"
              placeholder="เช่น 100"
              min="1"
            />
          </div>


          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              className="flex-1"
              disabled={submitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              className="flex-1"
              loading={submitting}
            >
              {editingSubject ? 'บันทึกการแก้ไข' : 'เพิ่มวิชา'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManageSubjects;