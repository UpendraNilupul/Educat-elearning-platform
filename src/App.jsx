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
import Teacher from './pages/Teacher_dashboard';
import Student from './pages/Student_dashboard';

// Home Page Component
const HomePage = () => {
  return (
    <>
      <Header />
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
const MainLayout = ({ children }) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

function App() {
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState('');
  const [isLoading, setIsLoading] = useState(true); // Added loading state!

  useEffect(() => {
    fetch('http://localhost:3000/api/status', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log("The server says this user's role is:", data.userRole);
        setUserRole(data.userRole);
        setUserName(data.userName);
      })
      .catch(err => console.log("User is likely not logged in yet."))
      .finally(() => {
        setIsLoading(false); // Stop loading once the check is done
      });
  }, []);

const handleLogout = async () => {
    try {
      await fetch('http://localhost:3000/api/logout', { 
        method: 'POST', 
        credentials: 'include' 
      });
      // Clear local storage and reset state
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      setUserRole(null);
      setUserName('');
      // Because userRole is now null, React Router will automatically redirect to "/"
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };


  // Don't render the routes until we know if the user is logged in
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>

          <Route path="/" element={<HomePage />} />

          {/* Fixed: Only ONE login route, properly passing setUserRole */}
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />

          <Route
            path="/register"
            element={
              <>
                <Header />
                <Register />
                <Footer />
              </>
            }
          />
          
          {/* Fixed: Only ONE teachers route */}
          <Route 
            path="/teachers" 
            element={
              <MainLayout>
                <Teachers />
              </MainLayout>
            } 
          />

          {/* Protected Route: Admin */}
          <Route
            path="/admin"
            element={
              userRole === 'admin' ? (
                <MainLayout>
                  <Admin userName={userName} onLogout={handleLogout} />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected Route: Teacher */}
          <Route
            path="/teacher"
            element={
              userRole === 'teacher' ? (
                <MainLayout>
                  <Teacher userName={userName} onLogout={handleLogout} />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected Route: Student */}
          <Route
            path="/student"
            element={
              userRole === 'student' ? (
                <MainLayout>
                  <Student userName={userName} onLogout={handleLogout} />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />

        </Routes>
      </div>
    </Router>
  );
}

export default App;