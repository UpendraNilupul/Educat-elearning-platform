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
import CoursesPage from './pages/Course';

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
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/status', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        setUserRole(data.userRole);
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

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
          <Route path="/" element={<HomePage userRole={userRole} userName={userName} onLogout={handleLogout} />} />
          
          <Route path="/login" element={<Login setUserRole={setUserRole} setUserName={setUserName} userName={userName} />} />
          
          <Route
            path="/register"
            element={
              <>
                <Header userRole={userRole} userName={userName} onLogout={handleLogout} />
                <Register />
                <Footer />
              </>
            }
          />
          
          <Route
            path="/teachers"
            element={
              <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
                <Teachers />
              </MainLayout>
            }
          />
          
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

          {/* Protected Route: Teacher - no header/footer layout */}
          <Route
            path="/teacher"
            element={
              userRole === 'teacher' ? (
                <TeacherDashboard userName={userName} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          
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
          
          <Route
            path="/courses"
            element={
              <MainLayout userRole={userRole} userName={userName} onLogout={handleLogout}>
                <CoursesPage />
              </MainLayout>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;