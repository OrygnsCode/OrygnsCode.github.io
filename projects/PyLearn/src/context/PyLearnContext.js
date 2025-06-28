import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { levels } from '../data/levels.js'; // Added .js extension

const PyLearnContext = createContext();

const LOCAL_STORAGE_KEY = 'pylearnProgress';

export const PyLearnProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    try {
      const storedProgress = localStorage.getItem(LOCAL_STORAGE_KEY);
      return storedProgress ? JSON.parse(storedProgress) : {};
    } catch (error) {
      console.error("Failed to read from localStorage", error);
      return {};
    }
  });
  const [streak, setStreak] = useState(0);
  const [currentLevelId, setCurrentLevelId] = useState(1);

  // Save progress to local storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error("Failed to write to localStorage", error);
      // Optionally, set an error state or show a user-friendly message
    }
  }, [progress]);

  // Calculate overall completion percentage
  const totalLevels = levels.length;
  const completedLevels = Object.values(progress).filter(level => level.completed).length;
  const completionPercentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;

  const updateLevelProgress = useCallback((levelId, isCompleted) => {
    setProgress(prevProgress => {
      const newProgress = {
        ...prevProgress,
        [levelId]: { ...prevProgress[levelId], completed: isCompleted, attempts: (prevProgress[levelId]?.attempts || 0) + 1 }
      };

      // Update streak
      if (isCompleted) {
        setStreak(prevStreak => prevStreak + 1);
      } else {
        setStreak(0); // Reset streak on incorrect answer
      }
      return newProgress;
    });
  }, []);

  const getLevelStatus = useCallback((levelId) => {
    return progress[levelId]?.completed || false;
  }, [progress]);

  const resetAllProgress = useCallback(() => {
    if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setProgress({});
        setStreak(0);
        setCurrentLevelId(1);
        console.log("All progress reset.");
      } catch (error) {
        console.error("Failed to clear localStorage", error);
      }
    }
  }, []);

  const value = {
    progress,
    updateLevelProgress,
    getLevelStatus,
    streak,
    completionPercentage,
    currentLevelId,
    setCurrentLevelId, // For future use, e.g., to advance automatically
    resetAllProgress,
  };

  return (
    <PyLearnContext.Provider value={value}>
      {children}
    </PyLearnContext.Provider>
  );
};

export const usePyLearn = () => {
  const context = useContext(PyLearnContext);
  if (context === undefined) {
    throw new Error('usePyLearn must be used within a PyLearnProvider');
  }
  return context;
};
