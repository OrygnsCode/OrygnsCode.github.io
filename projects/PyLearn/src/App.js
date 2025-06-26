import React from 'react';
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
  );
}

export default App;
