import React, { createContext, useState, useContext, useCallback } from 'react';

const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [snackbar, setSnackbar] = useState({
    message: '',
    type: 'info', // 'success', 'error', 'info', 'warning'
    isVisible: false,
  });

  const showSnackbar = useCallback((message, type = 'info', duration = 3000) => {
    setSnackbar({
      message,
      type,
      isVisible: true,
    });

    const timer = setTimeout(() => {
      setSnackbar(prev => ({ ...prev, isVisible: false }));
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <SnackbarContext.Provider value={{ snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};
