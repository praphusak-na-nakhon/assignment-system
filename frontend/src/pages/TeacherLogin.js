import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { loginTeacher } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setLoading(true);
    try {
      const result = await loginTeacher(formData.username, formData.password);
      if (result.success) {
        toast.success('เข้าสู่ระบบสำเร็จ');
        navigate('/teacher/dashboard');
      } else {
        toast.error(result.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Teacher login error:', error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentLogin = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังเข้าสู่ระบบ..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-white">📚</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          เข้าสู่ระบบครู
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ระบบจัดการการส่งงานออนไลน์
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <Card.Body className="py-8 px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="form-label">ชื่อผู้ใช้</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="กรอกชื่อผู้ใช้"
                  required
                />
              </div>

              <div>
                <label className="form-label">รหัสผ่าน</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="กรอกรหัสผ่าน"
                  required
                />
              </div>

              <div>
                <Button
                  type="submit"
                  fullWidth
                  loading={loading}
                >
                  เข้าสู่ระบบ
                </Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">หรือ</span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={handleStudentLogin}
                >
                  เข้าสู่ระบบสำหรับนักเรียน
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          © 2024 Assignment Submission System. สร้างด้วย React & Node.js
        </p>
      </div>
    </div>
  );
};

export default TeacherLogin;