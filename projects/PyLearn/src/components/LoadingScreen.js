import React from 'react';
import { motion } from 'framer-motion';

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-gray-950 flex flex-col items-center justify-center z-50"
    >
      <motion.div
        className="w-24 h-24 border-4 border-t-4 border-purple-500 border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ ease: "linear", duration: 1, repeat: Infinity }}
      ></motion.div>
      <p className="text-purple-400 text-xl mt-6 font-semibold">Loading PyLearn...</p>
    </motion.div>
  );
}

export default LoadingScreen;
