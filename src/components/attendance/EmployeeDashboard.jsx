import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceHistory } from '../../services/sheetsService';
import { checkSecurityConfirmation } from '../../services/sheetsService';
import { getCurrentDate, formatDateForDisplay } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const EmployeeDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [isConfirmedBySecurityToday, setIsConfirmedBySecurityToday] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Check if the employee has been confirmed by security today
        const confirmationResult = await checkSecurityConfirmation(
          getCurrentDate(),
          currentUser.name
        );
        
        setIsConfirmedBySecurityToday(confirmationResult.confirmed);
        
        // Get recent attendance history (last 5 days)
        const attendanceResult = await getAttendanceHistory(currentUser.name, 5);
        
        if (attendanceResult.success) {
          setRecentAttendance(attendanceResult.data);
        } else {
          setError('Failed to fetch attendance history');
        }
      } catch (error) {
        setError('An error occurred while fetching dashboard data');
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser.name]);
  
  // Find today's attendance (if any)
  const todayAttendance = recentAttendance.find(
    entry => entry.Date === getCurrentDate()
  );
  
  // Determine available actions
  const canCheckIn = isConfirmedBySecurityToday && !todayAttendance;
  const canCheckOut = todayAttendance && 
                     todayAttendance.CheckInStatus !== 'Leave' && 
                     !todayAttendance.CheckOutTime;
  
  if (loading) {
    return <Loading message="Loading dashboard..." />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Welcome, {currentUser.name}</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Status</h2>
          
          {todayAttendance ? (
            <div>
              <p className="mb-2">
                <span className="font-medium">Date:</span> {formatDateForDisplay(todayAttendance.Date)}
              </p>
              <p className="mb-2">
                <span className="font-medium">Check-in:</span>{' '}
                {todayAttendance.CheckInTime ? (
                  <>
                    {todayAttendance.CheckInTime} 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      todayAttendance.CheckInStatus === 'On Time' 
                        ? 'bg-green-100 text-green-800' 
                        : todayAttendance.CheckInStatus === 'Late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {todayAttendance.CheckInStatus}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Not checked in</span>
                )}
              </p>
              <p className="mb-2">
                <span className="font-medium">Check-out:</span>{' '}
                {todayAttendance.CheckOutTime ? (
                  todayAttendance.CheckOutTime
                ) : (
                  <span className="text-gray-500">Not checked out</span>
                )}
              </p>
              {todayAttendance.WorkDuration && (
                <p className="mb-2">
                  <span className="font-medium">Duration:</span> {todayAttendance.WorkDuration}
                </p>
              )}
            </div>
          ) : isConfirmedBySecurityToday ? (
            <div className="text-blue-600">
              You're confirmed by security for today. Please check in.
            </div>
          ) : (
            <div className="text-yellow-600">
              Waiting for security confirmation. You cannot check in until confirmed.
            </div>
          )}
        </div>
        
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          
          <div className="space-y-2">
            {canCheckIn && (
              <Link 
                to="/check-in"
                className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Check In
              </Link>
            )}
            
            {canCheckOut && (
              <Link 
                to="/check-out"
                className="block w-full text-center py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Check Out
              </Link>
            )}
            
            <Link 
              to="/leave-request"
              className="block w-full text-center py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Request Leave
            </Link>
            
            <Link 
              to="/attendance-history"
              className="block w-full text-center py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              View Attendance History
            </Link>
          </div>
        </div>
      </div>
      
      {/* Recent Attendance Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Attendance</h2>
        
        {recentAttendance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">Date</th>
                  <th className="py-2 px-4 border-b text-left">Check-in</th>
                  <th className="py-2 px-4 border-b text-left">Check-out</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Duration</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b">{formatDateForDisplay(entry.Date)}</td>
                    <td className="py-2 px-4 border-b">{entry.CheckInTime || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">{entry.CheckOutTime || 'N/A'}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                        entry.CheckInStatus === 'On Time' 
                          ? 'bg-green-100 text-green-800' 
                          : entry.CheckInStatus === 'Late'
                          ? 'bg-yellow-100 text-yellow-800'
                          : entry.CheckInStatus === 'Leave'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {entry.CheckInStatus}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{entry.WorkDuration || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No recent attendance records found.</p>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;