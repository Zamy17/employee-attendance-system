import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getCurrentDate, getCurrentTime } from '../../utils/dateUtils';

const Header = () => {
  const { currentUser, logout, isSecurityGuard, isEmployee } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  // Only render header if user is logged in
  if (!currentUser) return null;
  
  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-bold">Employee Attendance System</h1>
            <div className="ml-8 text-sm hidden md:block">
              <div>{getCurrentDate()}</div>
              <div>{getCurrentTime()}</div>
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 text-right hidden sm:block">
              <div className="font-medium">{currentUser.name}</div>
              <div className="text-sm text-blue-200">{currentUser.position} ({currentUser.role})</div>
            </div>
            
            <div className="relative group">
              <button className="p-2 rounded-full hover:bg-blue-700 focus:outline-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                {isSecurityGuard && (
                  <>
                    <Link to="/security-dashboard" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Dashboard</Link>
                    <Link to="/confirm-attendance" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Confirm Attendance</Link>
                    <Link to="/leave-approvals" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Leave Approvals</Link>
                  </>
                )}
                
                {isEmployee && (
                  <>
                    <Link to="/employee-dashboard" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Dashboard</Link>
                    <Link to="/check-in" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Check In</Link>
                    <Link to="/check-out" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Check Out</Link>
                    <Link to="/leave-request" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Request Leave</Link>
                    <Link to="/attendance-history" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Attendance History</Link>
                  </>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;