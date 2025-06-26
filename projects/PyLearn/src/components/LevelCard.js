import React from 'react';
import { Link } from 'react-router-dom';

const LevelCard = ({ level }) => {
  const getStatusStyles = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 hover:bg-green-600 border-green-700';
      case 'unlocked':
        return 'bg-sky-500 hover:bg-sky-600 border-sky-700';
      case 'locked':
      default:
        return 'bg-gray-700 cursor-not-allowed opacity-60 border-gray-800';
    }
  };

  const cardContent = (
    <div className={`p-6 rounded-lg shadow-xl text-center transition-all duration-300 ease-in-out transform hover:scale-105 border-b-4 ${getStatusStyles(level.status)}`}>
      <h3 className="text-2xl font-bold mb-2">{level.title}</h3>
      {/* <p className="text-sm text-gray-300 mb-3">{level.concept}</p> */}
      {level.status === 'locked' ? (
        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-200 bg-gray-600">
          Locked
        </span>
      ) : level.status === 'completed' ? (
        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-200 bg-green-700">
          Completed
        </span>
      ) : (
         <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-sky-200 bg-sky-700">
          Start Level
        </span>
      )}
    </div>
  );

  if (level.status === 'locked') {
    return <div className="opacity-70">{cardContent}</div>;
  }

  return <Link to={`/level/${level.id}`} className="block">{cardContent}</Link>;
};

export default LevelCard;
