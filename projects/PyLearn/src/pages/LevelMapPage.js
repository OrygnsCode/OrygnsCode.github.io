import React from 'react';
import LevelCard from '../components/LevelCard'; // Will create this next

const levels = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  title: `Level ${i + 1}`,
  status: i === 0 ? 'unlocked' : i < 3 ? 'unlocked' : 'locked', // Mock status: first 3 unlocked
  // concept: "Python Concepts Placeholder" // Will add specific concepts later
}));

const LevelMapPage = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-center mb-8 text-cyan-400">Choose Your Challenge</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {levels.map(level => (
          <LevelCard key={level.id} level={level} />
        ))}
      </div>
    </div>
  );
};

export default LevelMapPage;
