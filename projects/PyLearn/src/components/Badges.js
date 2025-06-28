import React from 'react';
import { motion } from 'framer-motion';
import { usePyLearn } from '../context/PyLearnContext';
import { badges as allBadges } from '../data/badges';
import { levels } from '../data/levels';

function Badges() {
  const { progress, streak } = usePyLearn();
  const totalLevels = levels.length;

  return (
    <div className="mt-12">
      <h3 className="text-3xl font-extrabold text-center text-yellow-400 mb-8 drop-shadow-lg">
        Your Achievements
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {allBadges.map(badge => {
          const isUnlocked = badge.criteria(progress, totalLevels, streak);

          return (
            <motion.div
              key={badge.id}
              className={`bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col items-center justify-center text-center 
                ${isUnlocked ? 'border-2 border-yellow-500' : 'border border-gray-700 opacity-60 grayscale'}
              `}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: isUnlocked ? 1.03 : 1 }}
            >
              {/* Placeholder for badge image - would typically load from `badge.image` */}
              <motion.div
                className="w-24 h-24 mb-4 flex items-center justify-center text-5xl"
                initial={isUnlocked ? { rotate: 0 } : {}}
                animate={isUnlocked ? { rotate: [0, 10, -10, 0] } : {}}
                transition={isUnlocked ? { duration: 0.8, ease: "easeInOut", repeat: 0 } : {}}
              >
                {isUnlocked ? '🏆' : '🔒'}
              </motion.div>
              <h4 className={`text-xl font-bold mb-2 ${isUnlocked ? 'text-yellow-300' : 'text-gray-400'}`}>
                {badge.name}
              </h4>
              <p className={`text-sm ${isUnlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                {badge.description}
              </p>
              {!isUnlocked && <p className="text-xs text-gray-500 mt-2">(Complete criteria to unlock)</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default Badges;
