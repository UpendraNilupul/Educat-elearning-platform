import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Header from './Header';
import Hero from './Hero';
import WelcomeSection from './WelcomeSection';
import LatestUpdates from './LatestUpdates';
import MeetTeachers from './MeetTeachers';
import StatsCTA from './StatsCTA';
import Footer from './Footer';
import Login from './Login';

// Group all the landing page sections together
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
  return (
    // Wrap everything in the Router so routing works across the whole app
    <Router>
      <div className="min-h-screen bg-white">
        {/* Header stays outside Routes so it shows on every page */}
        <Header />
        
        {/* Routes act like a switch, showing only one element at a time */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
        </Routes>
        
        {/* Footer stays outside Routes so it shows on every page */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;