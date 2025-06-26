import React from 'react';
import { useParams } from 'react-router-dom';

const LevelPage = () => {
  const { levelId } = useParams();

  // Placeholder level data - this will eventually come from a data source or context
  const levelData = {
    title: `Level ${levelId}: Introduction to Variables`,
    description: "In this level, you'll learn the basics of Python variables. Your task is to create a variable named 'greeting' and assign it the string 'Hello, PyLearn!'. Then, print this variable.",
    visualContext: "Imagine you're sending a message. Variables are like envelopes holding these messages.", // Optional
    goal: "Declare a variable 'greeting' with the value 'Hello, PyLearn!' and print it."
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold text-cyan-400 mb-2">{levelData.title}</h2>

      {/* Task Description Area */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold text-sky-300 mb-3">Task Description</h3>
        <p className="text-gray-300 mb-2">{levelData.description}</p>
        {levelData.visualContext && <p className="text-sm text-gray-400 italic mb-2">Visual Context: {levelData.visualContext}</p>}
        <p className="font-semibold text-gray-200">Goal: <span className="font-normal">{levelData.goal}</span></p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column: Code Editor and Controls */}
        <div className="lg:w-2/3 flex flex-col">
          {/* Code Editor Placeholder */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 flex-grow">
            <h3 className="text-xl font-semibold text-sky-300 mb-3">Code Editor</h3>
            <div className="bg-gray-900 h-64 rounded p-2 border border-gray-700">
              {/* Actual editor will go here */}
              <textarea className="w-full h-full bg-transparent text-white font-mono resize-none" placeholder="Write your Python code here..."></textarea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mb-6 lg:mb-0">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-150">
              Submit Code
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-150">
              Hint (0/3)
            </button>
            <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors duration-150">
              Reset Level
            </button>
          </div>
        </div>

        {/* Right Column: Output/Feedback */}
        <div className="lg:w-1/3">
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-sky-300 mb-3">Output / Feedback</h3>
            <div className="bg-gray-900 h-48 rounded p-2 border border-gray-700 text-gray-400">
              {/* Output and feedback messages will appear here */}
              Your code's output will be shown here.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelPage;
