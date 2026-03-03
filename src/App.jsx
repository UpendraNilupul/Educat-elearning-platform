import React from 'react';
import Header from './Header';
import Hero from './Hero';
import WelcomeSection from './WelcomeSection';
import LatestUpdates from './LatestUpdates';
import MeetTeachers from './MeetTeachers';
import StatsCTA from './StatsCTA';
import Footer from './Footer';
import Login from './Login';

function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <WelcomeSection />
      <LatestUpdates />
      <MeetTeachers />
      <StatsCTA />
      <Footer />
    </div>
  );
}

export default App;
