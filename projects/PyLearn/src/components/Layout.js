import React from 'react';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header: Will eventually contain progress bar, navigation, etc. */}
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-cyan-400">PyLearn</h1>
          {/* Placeholder for future navigation or user info */}
          <div></div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow container mx-auto p-4">
        {children}
      </main>

      {/* Footer: Optional, can be added later if needed */}
      {/* <footer className="bg-gray-800 p-4 text-center text-gray-500">
        © {new Date().getFullYear()} PyLearn
      </footer> */}
    </div>
  );
};

export default Layout;
