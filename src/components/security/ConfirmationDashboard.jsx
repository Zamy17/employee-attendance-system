import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSheetData, getPendingLeaveRequests } from '../../services/sheetsService';
import { getCurrentDate, isWithinSecurityConfirmationHours, formatDateForDisplay } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const SecurityDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [confirmedEmployees, setConfirmedEmployees] = useState([]);
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [error, setError] = useState(null);
  
  // Check if current time is within security confirmation hours
  const canConfirmAttendance = isWithinSecurityConfirmationHours();
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees data
        const employeesResult = await getSheetData('Employees');
        if (!employeesResult.success) {
          throw new Error('Failed to fetch employees data');
        }
        
        // Filter to only show actual employees (not security guards)
        const onlyEmployees = employeesResult.data.filter(emp => emp.Role === 'Employee');
        setEmployees(onlyEmployees);
        
        // Fetch today's security confirmations
        const confirmationsResult = await getSheetData('Security_Confirmations');
        if (!confirmationsResult.success) {
          throw new Error('Failed to fetch security confirmations');
        }
        
        // Filter to show only today's confirmations
        const todayDate = getCurrentDate();
        const todayConfirmations = confirmationsResult.data.filter(
          conf => conf.Date === todayDate
        );
        
        // Extract confirmed employee names
        const confirmedNames = todayConfirmations.map(conf => conf.EmployeeName);
        setConfirmedEmployees(confirmedNames);
        
        // Fetch pending leave requests
        const leaveResult = await getPendingLeaveRequests();
        if (leaveResult.success) {
          setPendingLeaveRequests(leaveResult.data);
        }
      } catch (error) {
        setError(error.message || 'An error occurred while fetching dashboard data');
        console.error('Security dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return <Loading message="Loading security dashboard..." />;
  }
  
  // Count unconfirmed employees
  const unconfirmedCount = employees.length - confirmedEmployees.length;
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Security Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Confirmation Status Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Today's Confirmation Status</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <p className="text-sm text-green-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-700">{confirmedEmployees.length}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <p className="text-sm text-yellow-600">Unconfirmed</p>
              <p className="text-2xl font-bold text-yellow-700">{unconfirmedCount}</p>
            </div>
          </div>
          
          {canConfirmAttendance ? (
            <Link 
              to="/confirm-attendance"
              className="block w-full text-center py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Confirm Employee Attendance
            </Link>
          ) : (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 text-sm">
              <p className="font-bold">Confirmation Hours</p>
              <p>Employee confirmation is only available between 06:00 and 09:00.</p>
            </div>
          )}
        </div>
        
        {/* Leave Requests Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pending Leave Requests</h2>
          
          {pendingLeaveRequests.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-2">
                You have {pendingLeaveRequests.length} pending leave requests to review.
              </p>
              
              <Link 
                to="/leave-approvals"
                className="block w-full text-center py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Review Leave Requests
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">No pending leave requests at this time.</p>
          )}
        </div>
      </div>
      
      {/* Today's Confirmation Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Today's Confirmation Summary</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Date: {formatDateForDisplay(getCurrentDate())}
        </p>
        
        {confirmedEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">#</th>
                  <th className="py-2 px-4 border-b text-left">Employee Name</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{employee.Name}</td>
                    <td className="py-2 px-4 border-b">
                      {confirmedEmployees.includes(employee.Name) ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          Confirmed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Not Confirmed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No employees have been confirmed yet today.</p>
        )}
      </div>
    </div>
  );
};

export default SecurityDashboard;