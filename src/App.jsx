import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

// Component Imports
import Header from './components/Header';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import LatestUpdates from './components/LatestUpdates';
import MeetTeachers from './components/MeetTeachers';
import StatsCTA from './components/StatsCTA';
import Footer from './components/Footer';

// Page Imports
import Login from './pages/Login';
import Register from './pages/Register';
import Teachers from './pages/Teachers';
import Admin from './pages/Admin_dashboard';
import SubAdmin_dashboard from './pages/SubAdmin_dashboard';
import TeacherDashboard from './pages/Teacher_dashboard';
import Student from './pages/Student_dashboard';
import TeacherProfileEdit from './pages/TeacherProfileEdit';
import TeacherReview from './pages/TeacherReview';
import Admin_Teachers from './pages/Admin_Teachers';
import Admin_TeacherAnalytics from './pages/Admin_TeacherAnalytics';
import Admin_Students from './pages/Admin_Students';
import Admin_StudentProfile from './pages/Admin_StudentProfile';
import Admin_PromoCodes from './pages/Admin_PromoCodes';
import VerifyTeacher from './pages/VerifyTeacher';
import Admin_Courses from './pages/Admin_Courses';
import Admin_Announcements from './pages/Admin_Announcements';
import Admin_Settings from './pages/Admin_Settings';
import AssignmentSubmissions from './pages/AssignmentSubmissions';
import Admin_Team from './pages/Admin_Team';
import Admin_SystemLogs from './pages/Admin_SystemLogs';
import CoursesPage from './pages/Course';
import AssessmentsPage from './pages/AssessmentsPage';
import Admin_Communications from './pages/Admin_Communications';
import Admin_Escalations from './pages/Admin_Escalations';

// Home Page Component
const HomePage = ({ userRole, userName, onLogout }) => {
  return (
    <>
      <Header userRole={userRole} userName={userName} onLogout={onLogout} />
      <Hero />
      <WelcomeSection />
      <LatestUpdates />
      <MeetTeachers />
      <StatsCTA />
      <Footer />
    </>
  );
};

// Layout Wrapper
const MainLayout = ({ children, userRole, userName, onLogout }) => {
  return (
    <>
      <Header userRole={userRole} userName={userName} onLogout={onLogout} />
      {children}
      <Footer />
    </>
  );
};

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [adminLevel, setAdminLevel] = useState(localStorage.getItem('adminLevel') || 'super');
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [userPicture, setUserPicture] = useState(localStorage.getItem('userPicture') || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/status', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        const safeRole = String(data.userRole || '').toLowerCase().trim();
        setUserRole(safeRole);
        setUserName(data.userName);
        if (data.adminLevel) setAdminLevel(data.adminLevel);
        if (data.userPicture) {
          setUserPicture(data.userPicture);
          localStorage.setItem('userPicture', data.userPicture);
        }
      })
      .catch(err => console.log("User is likely not logged in yet."))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // THE HEARTBEAT
  useEffect(() => {
    if (!userRole) return;

    const heartbeatInterval = setInterval(() => {
      fetch('http://localhost:3000/api/heartbeat', {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.log("Heartbeat skipped"));
    }, 60000);

    return () => clearInterval(heartbeatInterval);
  }, [userRole]);

  // Global Socket Connection for Real-Time Notifications
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId && userRole) {
      const socket = io('http://localhost:3000');

      socket.emit('join_notification_room', userId);

      socket.on('new_notification', (data) => {
        toast.success(
          <div>
            <strong>{data.title}</strong>
            <p className="text-sm text-gray-600 mt-1">{data.description}</p>
          </div>,
          { duration: 6000 }
        );
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [userRole]);

  // Logout Logic
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userPicture');
      localStorage.removeItem('adminLevel');
      localStorage.removeItem('verificationStatus');
      setUserRole(null);
      setUserName('');
      setUserPicture('');
      setAdminLevel('super');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const verificationStatus = localStorage.getItem('verificationStatus');

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<HomePage userRole={userRole} userName={userName} onLogout={handleLogout} />} />

          <Route
            path="/login"
            element={<Login setUserRole={setUserRole} setUserName={setUserName} setUserPicture={setUserPicture} setAdminLevel={setAdminLevel} userName={userName} />}
          />

          <Route
            path="/register"
            element={<Register setUserRole={setUserRole} setUserName={setUserName} />}
          />

          <Route
            path="/teachers"
            element={
              <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
                <Teachers />
              </MainLayout>
            }
          />

          {/* Verification Route */}
          <Route
            path="/verify-teacher/:id"
            element={userRole === 'teacher' ? <VerifyTeacher /> : <Navigate to="/" />}
          />

          {/* Protected Route: Admin Traffic Cop */}
          <Route
            path="/admin"
            element={
              userRole === 'admin' ? (
                adminLevel === 'sub' ? (
                  <SubAdmin_dashboard userName={userName} onLogout={handleLogout} />
                ) : (
                  <Admin userName={userName} onLogout={handleLogout} />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/admin/teachers"
            element={userRole === 'admin' ? <Admin_Teachers userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/teacher-analytics/:id"
            element={userRole === 'admin' ? <Admin_TeacherAnalytics userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/review-teacher/:id"
            element={userRole === 'admin' ? <TeacherReview userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/students"
            element={userRole === 'admin' ? <Admin_Students userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/student-profile/:id"
            element={userRole === 'admin' ? <Admin_StudentProfile userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/promos"
            element={userRole === 'admin' ? <Admin_PromoCodes userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/courses"
            element={userRole === 'admin' ? <Admin_Courses userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/announcements"
            element={userRole === 'admin' ? <Admin_Announcements userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/team"
            element={userRole === 'admin' ? <Admin_Team userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/settings"
            element={userRole === 'admin' ? <Admin_Settings userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          <Route
            path="/admin/system-logs"
            element={userRole === 'admin' && adminLevel === 'super' ? <Admin_SystemLogs userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/communications"
            element={userRole === 'admin' ? <Admin_Communications userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />
          <Route
            path="/admin/escalations"
            element={userRole === 'admin' && adminLevel === 'super' ? <Admin_Escalations userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Teacher */}
          <Route path="/teacher" element={
            (userRole === 'teacher' && verificationStatus === 'approved')
              ? <TeacherDashboard userName={userName} userPicture={userPicture} onLogout={handleLogout} />
              : <Navigate to={`/verify-teacher/${localStorage.getItem('userId')}`} />
          } />

          {/* Protected Route: Student */}
          <Route
            path="/student"
            element={
              userRole === 'student' ? (
                <Student userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Teacher Profile Edit */}
          <Route path="/teacher-profile-edit/:id?" element={
            (userRole === 'teacher' || localStorage.getItem('userRole') === 'teacher')
              ? <TeacherProfileEdit teacherId={localStorage.getItem('userId')} setUserName={setUserName} setUserPicture={setUserPicture} />
              : <Navigate to="/" />
          } />

          {/* Courses */}
          <Route path="/courses" element={
            <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
              <CoursesPage />
            </MainLayout>
          } />

          {/* Assessments */}
          <Route path="/assessments" element={
            <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
              <AssessmentsPage />
            </MainLayout>
          } />

        </Routes>
      </div>
    </Router>
  );
}

export default App;