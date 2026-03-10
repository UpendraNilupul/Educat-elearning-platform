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

  useEffect(() => {
    fetch('http://localhost:3000/api/status', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        console.log("The server says this user's role is:", data.userRole);
        setUserRole(data.userRole);
      })
      .catch(err => console.log("User is likely not logged in yet."));
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Routes>
<<<<<<< HEAD
          {/* Main Pages with Header and Footer */}
          <Route 
            path="/" 
=======

          <Route path="/" element={<HomePage />} />

          <Route path="/login" element={<Login />} />

          <Route
            path="/register"
>>>>>>> a913d61b0500fffc60931c89f1372ae93c3a10be
            element={
              <>
                <Header />
                <Register />
                <Footer />
              </>
            }
          />
          <Route 
            path="/teachers" 
            element={
              <MainLayout>
                <Teachers />
              </MainLayout>
            } 
          />

<<<<<<< HEAD
          {/* Login Page - NO Header/Footer */}
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />

          {/* Protected Routes with Header and Footer */}
=======
          <Route
            path="/teachers"
            element={
              <MainLayout>
                <Teachers />
              </MainLayout>
            }
          />

          {/* Admin Route */}
>>>>>>> a913d61b0500fffc60931c89f1372ae93c3a10be
          <Route
            path="/admin"
            element={
              userRole === 'admin' ? (
                <MainLayout>
                  <Admin />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
<<<<<<< HEAD
=======

          {/* Teacher Route */}
>>>>>>> a913d61b0500fffc60931c89f1372ae93c3a10be
          <Route
            path="/teacher"
            element={
              userRole === 'teacher' ? (
                <MainLayout>
                  <Teacher />
                </MainLayout>
              ) : (
                <Navigate to="/" />
              )
            }
          />
<<<<<<< HEAD
=======

          {/* Student Route */}
>>>>>>> a913d61b0500fffc60931c89f1372ae93c3a10be
          <Route
            path="/student"
            element={
              userRole === 'student' ? (
                <MainLayout>
                  <Student />
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