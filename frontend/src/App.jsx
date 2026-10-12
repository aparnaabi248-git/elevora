import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManageUsers from './pages/ManageUsers';
import PostJob from './pages/PostJob';
import Profile from './pages/Profile';
import ResumeUpload from './pages/ResumeUpload';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import SavedJobs from './pages/SavedJobs';
import CareerInsights from './pages/CareerInsights';
import CareerChatbot from './pages/CareerChatbot';
import InterviewPrep from './pages/InterviewPrep';
import CoverLetterGenerator from './pages/CoverLetterGenerator';
import CareerConsultancy from './pages/CareerConsultancy';
import NotFound from './pages/NotFound';

function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }
  if (user?.role === 'recruiter') {
    return <RecruiterDashboard />;
  }
  return <StudentDashboard />;
}

function MainLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <div className="min-h-screen animated-mesh-bg text-slate-800 dark:text-slate-100 flex flex-col justify-center">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-mesh-bg text-slate-800 dark:text-slate-100 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 relative overflow-hidden">
        {user && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className={`flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full ${!user ? 'w-full max-w-full' : ''}`}>
          <Routes>
            <Route path="/" element={user ? <DashboardRouter /> : <LandingPage />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/upload-resume" element={<ProtectedRoute allowedRoles={['student']}><ResumeUpload /></ProtectedRoute>} />
            <Route path="/jobs" element={<ProtectedRoute><Jobs /></ProtectedRoute>} />
            <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
            <Route path="/saved-jobs" element={<ProtectedRoute allowedRoles={['student']}><SavedJobs /></ProtectedRoute>} />
            <Route path="/career-insights" element={<ProtectedRoute allowedRoles={['student']}><CareerInsights /></ProtectedRoute>} />
            <Route path="/chat-mentor" element={<ProtectedRoute allowedRoles={['student']}><CareerChatbot /></ProtectedRoute>} />
            <Route path="/interview-prep" element={<ProtectedRoute allowedRoles={['student']}><InterviewPrep /></ProtectedRoute>} />
            <Route path="/cover-letter" element={<ProtectedRoute allowedRoles={['student']}><CoverLetterGenerator /></ProtectedRoute>} />
            <Route path="/consultancy" element={<ProtectedRoute allowedRoles={['student']}><CareerConsultancy /></ProtectedRoute>} />
            <Route path="/post-job" element={<ProtectedRoute allowedRoles={['recruiter', 'admin']}><PostJob /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><ManageUsers /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MainLayout />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
