import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0f172a] text-white text-center py-6 mt-12">
      <div className="container mx-auto px-4">
        <p className="text-sm">
          &copy; {new Date().getFullYear()} ForeScore. All rights reserved.
        </p>
        <p className="text-xs mt-1 text-gray-400">
          Built for unforgettable golf trips.
        </p>
      </div>
    </footer>
  );
};

export default Footer;