import React from 'react';
import Header from './Header';

const Layout = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={title} />
      <main className="flex-grow container mx-auto px-4 py-6 pt-8">
        {children}
      </main>
    </div>
  );
};

export default Layout; 