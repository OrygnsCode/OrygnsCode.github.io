import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePyLearn } from '../context/PyLearnContext';

function Header() {
  const { completionPercentage } = usePyLearn();

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="bg-gray-800 p-4 shadow-lg z-10"
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-purple-400 hover:text-purple-300 transition-colors duration-300">
          PyLearn
        </Link>
        
        {/* Progress Bar */}
        <div className="w-1/2 bg-gray-700 rounded-full h-4 relative overflow-hidden">
          <motion.div
            className="h-full bg-green-500 rounded-full shadow-md"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          ></motion.div>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
            {completionPercentage}%
          </span>
        </div>

        <nav>
          {/* Future navigation items can go here */}
        </nav>
      </div>
    </motion.header>
  );
}

export default Header;
