import React, { useState, useEffect } from 'react';
import LandingPage from './pages/LandingPage';
import StudioPage from './pages/StudioPage';
import './styles/globals.css';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'landing' | 'studio'>('landing');

  // Simple hash-based routing for demo purposes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#studio') {
        setCurrentPage('studio');
      } else {
        setCurrentPage('landing');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="app-root">
      {currentPage === 'landing' ? (
        <LandingPage />
      ) : (
        <StudioPage />
      )}
    </div>
  );
};

export default App;
