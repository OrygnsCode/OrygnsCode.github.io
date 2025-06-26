import React from 'react';
<<<<<<< feat/pylearn-initial-setup
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LevelMapPage from './pages/LevelMapPage';
import LevelPage from './pages/LevelPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate replace to="/levels" />} />
          <Route path="/levels" element={<LevelMapPage />} />
          <Route path="/level/:levelId" element={<LevelPage />} />
          {/* Fallback route for unmatched paths, could be a 404 component later */}
          <Route path="*" element={<Navigate replace to="/levels" />} />
        </Routes>
      </Layout>
    </Router>
=======

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center">
      <header className="text-center">
        <h1 className="text-5xl font-bold mb-4">Welcome to PyLearn</h1>
        <p className="text-xl text-gray-400">Your gamified Python learning journey starts here!</p>
      </header>
    </div>
>>>>>>> main
  );
}

export default App;
