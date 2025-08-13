import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { studentAPI } from '../utils/api';
import Button from '../components/Button';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

const DownloadDocs = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await studentAPI.getDocuments();
      setDocuments(response.data.data || []);
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการโหลดเอกสาร');
      console.error('Documents fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl) {
      toast.error('ไม่สามารถดาวน์โหลดไฟล์ได้');
      return;
    }
    
    // Create a temporary link element to trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังโหลดเอกสาร..." />
      </div>
    );
  }

  // Group documents by category
  const categories = ['all', ...new Set(documents.map(doc => doc.category || 'ทั่วไป'))];
  const filteredDocuments = selectedCategory === 'all' 
    ? documents 
    : documents.filter(doc => (doc.category || 'ทั่วไป') === selectedCategory);

  // Group filtered documents by subject
  const groupedDocs = filteredDocuments.reduce((acc, doc) => {
    const key = doc.subjectName || 'ทั่วไป';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(doc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ดาวน์โหลดเอกสาร</h1>
              <p className="text-sm text-gray-600">เอกสารและไฟล์จากครู</p>
            </div>
            <Button variant="secondary" onClick={() => navigate('/student/dashboard')}>
              กลับหน้าหลัก
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category === 'all' ? 'ทั้งหมด' : category}
                  {category !== 'all' && (
                    <span className="ml-1 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {documents.filter(doc => (doc.category || 'ทั่วไป') === category).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredDocuments.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีเอกสาร</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedCategory === 'all' 
                    ? 'ยังไม่มีเอกสารที่อัปโหลดไว้'
                    : `ไม่มีเอกสารในหมวดหมู่ "${selectedCategory}"`
                  }
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedDocs).map(([subjectName, docs]) => (
                <Card key={subjectName}>
                  <Card.Header>
                    <Card.Title className="flex items-center">
                      <svg className="h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {subjectName}
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({docs.length} ไฟล์)
                      </span>
                    </Card.Title>
                  </Card.Header>
                  <Card.Body>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {docs.map((document) => (
                        <div
                          key={document.id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                            <div className="ml-3 flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {document.title}
                              </h4>
                              {document.description && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                  {document.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex items-center text-xs text-gray-500">
                                  {document.category && (
                                    <span className="bg-gray-100 px-2 py-1 rounded-full mr-2">
                                      {document.category}
                                    </span>
                                  )}
                                  <span>
                                    {new Date(document.uploadedAt).toLocaleDateString('th-TH')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Button
                              size="sm"
                              fullWidth
                              onClick={() => handleDownload(document.fileUrl, document.title)}
                            >
                              ดาวน์โหลด
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-8">
            <Card.Header>
              <Card.Title className="flex items-center">
                <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                คำแนะนำการใช้งาน
              </Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• คลิกปุ่ม "ดาวน์โหลด" เพื่อเปิดไฟล์ในหน้าต่างใหม่</p>
                <p>• ใช้ตัวกรองหมวดหมู่เพื่อค้นหาเอกสารได้ง่ายขึ้น</p>
                <p>• เอกสารจะถูกจัดกลุ่มตามวิชาเรียน</p>
                <p>• หากไม่สามารถดาวน์โหลดได้ กรุณาติดต่อครู</p>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DownloadDocs;