import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-2 md:mb-0">
            <p className="text-sm">
              © {new Date().getFullYear()} Employee Attendance System
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <p>Version 1.0.0</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;