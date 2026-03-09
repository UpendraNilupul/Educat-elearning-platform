import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import WelcomeSection from './components/WelcomeSection';
import LatestUpdates from './components/LatestUpdates';
import MeetTeachers from './components/MeetTeachers';
import StatsCTA from './components/StatsCTA';
import Footer from './components/Footer';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Register from './pages/Register';

const HomePage = () => {
  return (
    <>
      <Hero />
      <WelcomeSection />
      <LatestUpdates />
      <MeetTeachers />
      <StatsCTA />
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
        // We save the role into React's memory
        setUserRole(data.userRole);
      })
      .catch(err => console.log("User is likely not logged in yet."));
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Header />

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protect the Admin Route */}
          <Route
            path="/admin"
            element={
              userRole === 'admin' ? <Admin /> : <Navigate to="/admin" />
            }
          />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;