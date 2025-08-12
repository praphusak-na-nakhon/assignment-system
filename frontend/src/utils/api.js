import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // Increase timeout to 60 seconds for Google Sheets operations
});

// Get auth headers
const getAuthHeaders = () => {
  const authData = localStorage.getItem('authData');
  if (!authData) return {};
  
  try {
    const { user, userType } = JSON.parse(authData);
    if (userType === 'teacher') {
      return {
        username: user.username,
        password: process.env.REACT_APP_ADMIN_PASSWORD || 'password123'
      };
    } else if (userType === 'student') {
      return {
        studentId: user.studentId
      };
    }
  } catch (error) {
    console.error('Error parsing auth data:', error);
  }
  return {};
};

// Add request interceptor to include auth headers
api.interceptors.request.use((config) => {
  const authHeaders = getAuthHeaders();
  config.headers = { ...config.headers, ...authHeaders };
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  loginStudent: (studentId) => 
    api.post('/student/login', {}, { 
      headers: { studentId } 
    }),
  
  loginTeacher: (username, password) =>
    api.get('/teacher/subjects', {
      headers: { username, password }
    }),
};

// Student API
export const studentAPI = {
  getDashboard: () => api.get('/student/dashboard'),
  submitAssignment: (formData) => api.post('/student/submit', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: () => api.get('/student/documents'),
  getScores: () => api.get('/student/scores'),
};

// Teacher API
export const teacherAPI = {
  // Subjects
  getSubjects: () => api.get('/teacher/subjects'),
  createSubject: (data) => api.post('/teacher/subjects', data),
  updateSubject: (id, data) => api.put(`/teacher/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/teacher/subjects/${id}`),
  updateSubjectScore: (id, data) => api.put(`/teacher/subjects/${id}/score`, data),
  
  // Students
  getStudents: () => api.get('/teacher/students'),
  createStudent: (data) => api.post('/teacher/students', data),
  
  // Assignments
  getAssignments: () => api.get('/teacher/assignments'),
  createAssignment: (data) => api.post('/teacher/assignments', data),
  updateAssignment: (id, data) => api.put(`/teacher/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/teacher/assignments/${id}`),
  
  // Documents
  getDocuments: () => api.get('/teacher/documents'),
  uploadDocument: (formData) => api.post('/teacher/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Submissions
  getSubmissions: () => api.get('/teacher/submissions'),
};

export default api;