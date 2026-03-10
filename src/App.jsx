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

          <Route
            path="/teachers"
            element={
              <MainLayout>
                <Teachers />
              </MainLayout>
            }
          />

          {/* Admin Route */}
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

          {/* Teacher Route */}
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

          {/* Student Route */}
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