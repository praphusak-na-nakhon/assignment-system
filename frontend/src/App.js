import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import SubmitAssignment from './pages/SubmitAssignment';
import ViewScores from './pages/ViewScores';
import DownloadDocs from './pages/DownloadDocs';
import TeacherLogin from './pages/TeacherLogin';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageSubjects from './pages/ManageSubjects';
import ManageAssignments from './pages/ManageAssignments';
import ViewStudentScores from './pages/ViewStudentScores';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children, requiredUserType }) => {
  const { isAuthenticated, userType, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="xl" message="กำลังตรวจสอบสิทธิ์..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredUserType && userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<StudentLogin />} />
        
        {/* Student Routes */}
        <Route 
          path="/student/dashboard" 
          element={
            <ProtectedRoute requiredUserType="student">
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/submit" 
          element={
            <ProtectedRoute requiredUserType="student">
              <SubmitAssignment />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/scores" 
          element={
            <ProtectedRoute requiredUserType="student">
              <ViewScores />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student/documents" 
          element={
            <ProtectedRoute requiredUserType="student">
              <DownloadDocs />
            </ProtectedRoute>
          } 
        />
        
        {/* Teacher Routes */}
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/subjects" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <ManageSubjects />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/students" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <div>จัดการนักเรียน (Coming Soon)</div>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/assignments" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <ManageAssignments />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/teacher/submissions" 
          element={
            <ProtectedRoute requiredUserType="teacher">
              <ViewStudentScores />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

// Main App Component
function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;