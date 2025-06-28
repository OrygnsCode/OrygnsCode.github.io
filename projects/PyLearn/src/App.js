import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LevelMap from './components/LevelMap';
import LevelPage from './components/LevelPage';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen'; 
import ErrorBoundary from './components/ErrorBoundary'; // Import ErrorBoundary

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <ErrorBoundary>
        {isLoading && <LoadingScreen />}
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans antialiased">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<LevelMap />} />
              <Route path="/level/:levelId" element={<LevelPage />} />
            </Routes>
          </main>
        </div>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
