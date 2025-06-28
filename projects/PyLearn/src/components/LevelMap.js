import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePyLearn } from '../context/PyLearnContext';
import { levels } from '../data/levels';
import Badges from './Badges'; // Import the Badges component

function LevelMap() {
  const { getLevelStatus, progress } = usePyLearn();

  return (
    <div className="py-8">
      <h2 className="text-4xl font-extrabold text-center text-purple-400 mb-12 drop-shadow-lg">
        Choose Your Adventure
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 justify-items-center">
        {levels.map((level) => {
          const isCompleted = getLevelStatus(level.id);
          const isPreviousLevelCompleted = level.id === 1 ? true : getLevelStatus(level.id - 1);
          const isLocked = !isPreviousLevelCompleted && level.id !== 1; 

          return (
            <motion.div
              key={level.id}
              className={`w-32 h-32 rounded-lg flex items-center justify-center cursor-pointer shadow-xl border-2 
                ${isCompleted ? 'bg-green-700 border-green-600' : 'bg-gray-800 border-gray-700'}
                ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:border-purple-500 transition-all duration-300 transform hover:scale-105'}
              `}
              whileHover={{ scale: isLocked ? 1 : 1.05, boxShadow: isLocked ? "none" : "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
              whileTap={{ scale: isLocked ? 1 : 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: level.id * 0.05 }}
            >
              {isLocked ? (
                <span className="text-3xl font-bold text-gray-500">
                  🔒 Level {level.id}
                </span>
              ) : (
                <Link 
                  to={`/level/${level.id}`}
                  className={`text-3xl font-bold ${isCompleted ? 'text-white' : 'text-teal-400 hover:text-teal-300'}`}
                >
                  Level {level.id}
                  {isCompleted && <span className="block text-sm">✅ Completed</span>}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Badges Section */}
      <Badges />
    </div>
  );
}

export default LevelMap;
