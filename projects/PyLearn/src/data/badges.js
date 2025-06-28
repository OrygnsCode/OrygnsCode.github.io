export const badges = [
  {
    id: 1,
    name: "First Step",
    description: "Completed your very first PyLearn level.",
    criteria: (progress) => progress[1]?.completed, // Completed Level 1
    image: "/assets/badges/badge-first-step.svg" // Placeholder path
  },
  {
    id: 2,
    name: "Halfway There",
    description: "Completed 8 levels of PyLearn.",
    criteria: (progress) => Object.values(progress).filter(lvl => lvl.completed).length >= 8,
    image: "/assets/badges/badge-halfway.svg"
  },
  {
    id: 3,
    name: "Python Prodigy",
    description: "Completed all 15 levels of PyLearn.",
    criteria: (progress, totalLevels) => Object.values(progress).filter(lvl => lvl.completed).length === totalLevels,
    image: "/assets/badges/badge-prodigy.svg"
  },
  {
    id: 4,
    name: "Streak Master",
    description: "Achieved a streak of 3 consecutive correct submissions.",
    criteria: (progress, totalLevels, streak) => streak >= 3,
    image: "/assets/badges/badge-streak.svg"
  },
  // Add more badges as ideas come up
];
