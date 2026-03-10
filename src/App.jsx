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
import Login from './pages/Login';
import Teachers from './pages/Teachers';

// Page Imports
import Admin from './pages/Admin_dashboard';
import Teacher from './pages/Teacher_dashboard'; 
import Student from './pages/Student_dashboard';

// 1. The HomePage Component
const HomePage = () => {
  return (
    <>
      <Header />
      <Hero />
      <WelcomeSection />
      <LatestUpdates />
      <MeetTeachers />
      <StatsCTA />
    </>
  );
};

// 2. Layout Wrapper to keep Header and Footer off the Login page
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
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/teachers" element={<Teachers />} />
          {/* Wrap HomePage in MainLayout so it gets Header & Footer */}
          <Route 
            path="/" 
            element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } 
          />

          {/* DO NOT wrap Login. It will render entirely alone! */}
          <Route path="/login" element={<Login setUserRole={setUserRole} />} />

          {/* Protect the Admin Route and apply the Layout */}
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
          {/* Protect the Admin Route and apply the Layout */}
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
          {/* Protect the Admin Route and apply the Layout */}
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