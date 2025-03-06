import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceHistory } from '../../services/sheetsService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const AttendanceHistory = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState([]);
  const [error, setError] = useState(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    onTime: 0,
    late: 0,
    veryLate: 0,
    leave: 0,
    absent: 0
  });
  
  useEffect(() => {
    const fetchAttendanceHistory = async () => {
      try {
        setLoading(true);
        
        // Get attendance history (last 30 days)
        const result = await getAttendanceHistory(currentUser.name, 30);
        
        if (!result.success) {
          throw new Error('Failed to fetch attendance data');
        }
        
        setAttendanceData(result.data);
        
        // Calculate stats
        const calculatedStats = {
          total: result.data.length,
          onTime: result.data.filter(entry => entry.CheckInStatus === 'On Time').length,
          late: result.data.filter(entry => entry.CheckInStatus === 'Late').length,
          veryLate: result.data.filter(entry => entry.CheckInStatus === 'Very Late').length,
          leave: result.data.filter(entry => entry.CheckInStatus === 'Leave').length,
          absent: 0 // This would need to be calculated differently, as absences might not be in the data
        };
        
        setStats(calculatedStats);
      } catch (error) {
        setError(error.message || 'An error occurred while fetching attendance history');
        console.error('Attendance history fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceHistory();
  }, [currentUser.name]);
  
  if (loading) {
    return <Loading message="Loading attendance history..." />;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Attendance History</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {/* Stats Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Attendance Summary (Last 30 Days)</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-blue-600">Total</p>
            <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-green-600">On Time</p>
            <p className="text-2xl font-bold text-green-700">{stats.onTime}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-sm text-yellow-600">Late</p>
            <p className="text-2xl font-bold text-yellow-700">{stats.late}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <p className="text-sm text-red-600">Very Late</p>
            <p className="text-2xl font-bold text-red-700">{stats.veryLate}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-purple-600">Leave</p>
            <p className="text-2xl font-bold text-purple-700">{stats.leave}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Absent</p>
            <p className="text-2xl font-bold text-gray-700">{stats.absent}</p>
          </div>
        </div>
      </div>
      
      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Detailed History</h2>
        </div>
        
        {attendanceData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left font-semibold">Date</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Check-in</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Status</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Check-out</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Duration</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Check-in Photo</th>
                  <th className="py-3 px-4 border-b text-left font-semibold">Check-out Photo</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.map((entry, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-3 px-4 border-b">{formatDateForDisplay(entry.Date)}</td>
                    <td className="py-3 px-4 border-b">{entry.CheckInTime || 'N/A'}</td>
                    <td className="py-3 px-4 border-b">
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
                    <td className="py-3 px-4 border-b">{entry.CheckOutTime || 'N/A'}</td>
                    <td className="py-3 px-4 border-b">{entry.WorkDuration || 'N/A'}</td>
                    <td className="py-3 px-4 border-b">
                      {entry.CheckInPhotoUrl ? (
                        <a 
                          href={entry.CheckInPhotoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3 px-4 border-b">
                      {entry.CheckOutPhotoUrl ? (
                        <a 
                          href={entry.CheckOutPhotoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No attendance records found for the last 30 days.
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;