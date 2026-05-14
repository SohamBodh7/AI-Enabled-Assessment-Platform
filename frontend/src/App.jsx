import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminExams from './pages/admin/Exams';
import Users from './pages/admin/Users';
import ProctoringLogs from './pages/admin/ProctoringLogs';
import FacultyDashboard from './pages/faculty/Dashboard';
import CreateExam from './pages/faculty/CreateExam';
import ExamDetail from './pages/faculty/ExamDetail';
import FacultyResults from './pages/faculty/Results';
import LiveMonitor from './pages/faculty/LiveMonitor';
import StudentHome from './pages/student/Home';
import StudentDashboard from './pages/student/Dashboard';
import MCQExam from './pages/student/MCQExam';
import CodingExam from './pages/student/CodingExam';
import StudentResults from './pages/student/Results';
import Profile from './pages/Profile';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><span className="spinner" /></div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    let title = 'ExamAI';
    
    if (path === '/') title = 'ExamAI - Home';
    else if (path === '/login') title = 'ExamAI - Login';
    else if (path === '/register') title = 'ExamAI - Register';
    else if (path.startsWith('/admin')) {
      if (path === '/admin') title = 'ExamAI - Admin Dashboard';
      else if (path === '/admin/users') title = 'ExamAI - Users';
      else if (path === '/admin/exams') title = 'ExamAI - Exams';
      else if (path === '/admin/proctoring') title = 'ExamAI - Proctoring Logs';
    } else if (path.startsWith('/faculty')) {
      if (path === '/faculty') title = 'ExamAI - Faculty Dashboard';
      else if (path === '/faculty/create-exam') title = 'ExamAI - Create Exam';
      else if (path.includes('/exams/')) title = 'ExamAI - Exam Details';
      else if (path.includes('/results')) title = 'ExamAI - Results';
      else if (path === '/faculty/monitor') title = 'ExamAI - Live Monitor';
      else if (path === '/faculty/profile') title = 'ExamAI - Profile';
    } else if (path.startsWith('/student')) {
      if (path === '/student') title = 'ExamAI - Student Home';
      else if (path === '/student/exams') title = 'ExamAI - My Exams';
      else if (path.includes('/mcq/')) title = 'ExamAI - MCQ Exam';
      else if (path.includes('/coding/')) title = 'ExamAI - Coding Exam';
      else if (path === '/student/results') title = 'ExamAI - My Results';
      else if (path === '/student/profile') title = 'ExamAI - Profile';
    }
    
    document.title = title;
  }, [location.pathname]);

  if (loading) return null;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}`} /> : <Register />} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="exams" element={<AdminExams />} />
        <Route path="proctoring" element={<ProctoringLogs />} />
      </Route>

      <Route path="/faculty" element={<ProtectedRoute roles={['faculty', 'admin']}><Layout /></ProtectedRoute>}>
        <Route index element={<FacultyDashboard />} />
        <Route path="create-exam" element={<CreateExam />} />
        <Route path="exams/:id" element={<ExamDetail />} />
        <Route path="results" element={<FacultyResults />} />
        <Route path="results/:examId" element={<FacultyResults />} />
        <Route path="monitor" element={<LiveMonitor />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="/student" element={<ProtectedRoute roles={['student']}><Layout /></ProtectedRoute>}>
        <Route index element={<StudentHome />} />
        <Route path="exams" element={<StudentDashboard />} />
        <Route path="mcq/:id" element={<MCQExam />} />
        <Route path="coding/:id" element={<CodingExam />} />
        <Route path="results" element={<StudentResults />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, rgba(22, 33, 62, 0.95), rgba(15, 52, 96, 0.9))',
              color: '#e8eaf6',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              fontSize: '0.8125rem',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
