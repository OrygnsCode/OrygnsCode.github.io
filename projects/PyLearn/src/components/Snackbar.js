import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSnackbar } from '../context/SnackbarContext';

function Snackbar() {
  const { snackbar, hideSnackbar } = useSnackbar();

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }[snackbar.type] || 'bg-gray-700';

  return (
    <AnimatePresence>
      {snackbar.isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 10 }}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-xl text-white z-50 min-w-[300px] max-w-md text-center ${bgColor}`}
          role="alert"
        >
          <p className="font-medium">{snackbar.message}</p>
          <button 
            onClick={hideSnackbar} 
            className="absolute top-1 right-2 text-white text-lg font-bold p-1 leading-none hover:text-gray-200"
            aria-label="Close notification"
          >
            &times;
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Snackbar;
