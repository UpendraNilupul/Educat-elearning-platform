import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

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
import TeacherDashboard from './pages/Teacher_dashboard';
import Student from './pages/Student_dashboard';
import TeacherProfileEdit from './pages/TeacherProfileEdit';
import TeacherReview from './pages/TeacherReview';
import Admin_Teachers from './pages/Admin_Teachers';
import Admin_TeacherAnalytics from './pages/Admin_TeacherAnalytics';
import Admin_Students from './pages/Admin_Students';
import Admin_StudentProfile from './pages/Admin_StudentProfile';
import Admin_PromoCodes from './pages/Admin_PromoCodes';
import VerifyTeacher from './pages/verifyTeacher';
import Admin_Courses from './pages/Admin_Courses';
import Admin_Announcements from './pages/Admin_Announcements';
import Admin_Settings from './pages/Admin_Settings';

import CoursesPage from './pages/Course';
import AssessmentsPage from './pages/AssessmentsPage';

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
  const [userName, setUserName] = useState(localStorage.getItem('userName') || '');
  const [isLoading, setIsLoading] = useState(true); // Added loading state!

  useEffect(() => {
    fetch('http://localhost:3000/api/status', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        // 🌟 THE FIX: Ensure the role from the session check is also forced to lowercase
        const safeRole = String(data.userRole || '').toLowerCase().trim();
        setUserRole(safeRole);
        setUserName(data.userName);
      })
      .catch(err => console.log("User is likely not logged in yet."))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // 🌟 THE HEARTBEAT
  useEffect(() => {
    // If no one is logged in, don't send a heartbeat
    if (!userRole) return;

    // Set up a timer to ping the server every 60 seconds (60000 milliseconds)
    const heartbeatInterval = setInterval(() => {
      fetch('http://localhost:3000/api/heartbeat', {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.log("Heartbeat skipped"));
    }, 60000);

    // Cleanup: Stop the heartbeat if the user logs out or closes the app
    return () => clearInterval(heartbeatInterval);
  }, [userRole]); // This effect restarts anytime the userRole changes

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      setUserRole(null);
      setUserName('');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  //verification status
  const verificationStatus = localStorage.getItem('verificationStatus');

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<HomePage userRole={userRole} userName={userName} onLogout={handleLogout} />} />
          <Route path="/login" element={<Login setUserRole={setUserRole} setUserName={setUserName} userName={userName} />} />

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

          {/* Protected Route: Admin */}
          <Route
            path="/admin"
            element={
              userRole === 'admin' ? (
                <Admin userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/*Admin's teacher page*/}
          <Route
            path="/admin/teachers"
            element={userRole === 'admin' ? <Admin_Teachers userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* 🌟 UPDATED: Admin Teacher Analytics Dashboard */}
          <Route
            path="/admin/teacher-analytics/:id"
            element={userRole === 'admin' ? <Admin_TeacherAnalytics userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* 🌟 NEW: The Dedicated Admin Review Page */}
          <Route
            path="/admin/review-teacher/:id"
            element={userRole === 'admin' ? <TeacherReview userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Students Page */}
          <Route
            path="/admin/students"
            element={userRole === 'admin' ? <Admin_Students userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Student Profile Page */}
          <Route
            path="/admin/student-profile/:id"
            element={userRole === 'admin' ? <Admin_StudentProfile userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Promo Codes Page */}
          <Route
            path="/admin/promos"
            element={userRole === 'admin' ? <Admin_PromoCodes userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Course Management Page */}
          <Route
            path="/admin/courses"
            element={userRole === 'admin' ? <Admin_Courses userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Global Announcements Page */}
          <Route
            path="/admin/announcements"
            element={userRole === 'admin' ? <Admin_Announcements userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Admin's Settings Page */}
          <Route
            path="/admin/settings"
            element={userRole === 'admin' ? <Admin_Settings userName={userName} onLogout={handleLogout} /> : <Navigate to="/" />}
          />

          {/* Protected Route: Teacher */}
          <Route
            path="/teacher"
            element={
              userRole === 'teacher' ? (
                verificationStatus === 'approved' ? (
                  <TeacherDashboard userName={userName} onLogout={handleLogout} />
                ) : (
                  <Navigate to={`/verify-teacher/${localStorage.getItem('userId')}`} />
                )
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected Route: Student */}
          <Route
            path="/student"
            element={
              (userRole === 'student' || localStorage.getItem('userRole') === 'student') ? (
                <Student userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Teacher profile edit route */}
          <Route
            path="/teacher-profile-edit/:id?"
            element={
              (userRole === 'teacher' || localStorage.getItem('userRole') === 'teacher') ? (
                <TeacherProfileEdit teacherId={localStorage.getItem('userId')} />
              ) : (
                <Navigate to="/" />
              )} />
          {/* Route for Courses page */}
          <Route
            path="/courses"
            element={
              <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
                <CoursesPage />
              </MainLayout>
            }
          />
          <Route
            path="/assessments"
            element={
              <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
                <AssessmentsPage />
              </MainLayout>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
