import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';

const StudentLogin = () => {
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginStudent } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!studentId.trim()) {
      toast.error('กรุณากรอกเลขประจำตัวนักเรียน');
      return;
    }

    setLoading(true);
    const result = await loginStudent(studentId.trim());
    
    if (result.success) {
      toast.success('เข้าสู่ระบบสำเร็จ');
      navigate('/student/dashboard');
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleTeacherLogin = () => {
    navigate('/teacher/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-primary-600 rounded-full p-3">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          ระบบส่งการบ้านออนไลน์
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          สำหรับนักเรียน
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="studentId" className="form-label">
                เลขประจำตัวนักเรียน
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                required
                className="form-input"
                placeholder="กรุณากรอกเลขประจำตัวนักเรียน"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!studentId.trim()}
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
                onClick={handleTeacherLogin}
              >
                เข้าสู่ระบบสำหรับครู
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentLogin;