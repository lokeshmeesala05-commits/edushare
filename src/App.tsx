import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthGuard from './components/auth/AuthGuard';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Dashboard from './pages/dashboard/Dashboard';
import BrowseNotes from './pages/notes/BrowseNotes';
import UploadNote from './pages/notes/UploadNote';
import NoteDetail from './pages/notes/NoteDetail';
import StudentDownloads from './pages/dashboard/StudentDownloads';
import StudentRequests from './pages/dashboard/StudentRequests';
import MissingResourcesAnalytics from './pages/admin/MissingResourcesAnalytics';
import ManageNoteRequests from './pages/admin/ManageNoteRequests';
import ManageUsers from './pages/admin/ManageUsers';
import Profile from './pages/dashboard/Profile';

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white flex flex-col font-sans transition-colors duration-200">
          {/* Offline banner */}
          {!isOnline && (
            <div className="bg-orange-500 text-white text-center text-sm py-2 px-4 font-medium flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a4 4 0 010-5.656M9.172 9.172a4 4 0 000 5.656m-3.536 3.536A9 9 0 015.636 5.636M3 3l18 18" />
              </svg>
              You're offline — showing cached content
            </div>
          )}
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/notes" element={<BrowseNotes />} />
              <Route path="/notes/:id" element={<NoteDetail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Protected routes (require login) */}
              <Route path="/upload" element={
                <AuthGuard>
                  <UploadNote />
                </AuthGuard>
              } />
              <Route path="/dashboard" element={
                <AuthGuard>
                  <Dashboard />
                </AuthGuard>
              } />
              <Route path="/student/downloads" element={
                <AuthGuard>
                  <StudentDownloads />
                </AuthGuard>
              } />
              <Route path="/student/requests" element={
                <AuthGuard>
                  <StudentRequests />
                </AuthGuard>
              } />
              <Route path="/profile" element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              } />
              <Route path="/admin/missing-resources" element={
                <AuthGuard>
                  <MissingResourcesAnalytics />
                </AuthGuard>
              } />
              <Route path="/admin/note-requests" element={
                <AuthGuard>
                  <ManageNoteRequests />
                </AuthGuard>
              } />
              <Route path="/admin/users" element={
                <AuthGuard>
                  <ManageUsers />
                </AuthGuard>
              } />
            </Routes>
          </main>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
