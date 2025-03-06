import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getSheetData, addSecurityConfirmation } from '../../services/sheetsService';
import { getCurrentDate, getCurrentTime, isWithinSecurityConfirmationHours } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const ConfirmAttendance = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [confirmedEmployees, setConfirmedEmployees] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Check if current time is within security confirmation hours
  const canConfirmAttendance = isWithinSecurityConfirmationHours();
  
  useEffect(() => {
    const fetchEmployeeData = async () => {
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
      } catch (error) {
        setError(error.message || 'An error occurred while fetching employee data');
        console.error('Employee data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmployeeData();
  }, []);
  
  const handleConfirm = async (employee) => {
    if (!canConfirmAttendance) {
      setError('Confirmation is only allowed between 06:00 and 09:00');
      return;
    }
    
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);
      
      // Add security confirmation
      const confirmationData = {
        date: getCurrentDate(),
        securityName: currentUser.name,
        employeeName: employee.Name,
        position: employee.Position,
        confirmationTime: getCurrentTime()
      };
      
      const result = await addSecurityConfirmation(confirmationData);
      
      if (!result.success) {
        throw new Error('Failed to confirm employee: ' + result.error);
      }
      
      // Update local state
      setConfirmedEmployees(prev => [...prev, employee.Name]);
      setSuccess(`Successfully confirmed ${employee.Name}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      setError(error.message || 'An error occurred during confirmation');
      console.error('Confirmation error:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return <Loading message="Loading employee data..." />;
  }
  
  if (!canConfirmAttendance) {
    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Confirm Employee Attendance</h1>
        
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p className="font-bold">Outside Confirmation Hours</p>
          <p>Employee confirmation is only available between 06:00 and 09:00.</p>
          <p>Current time: {getCurrentTime()}</p>
        </div>
        
        <button
          onClick={() => navigate('/security-dashboard')}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Confirm Employee Attendance</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {success}
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold">Employee List</h2>
          <p className="text-sm text-gray-600">
            Current Date: {getCurrentDate()} | Time: {getCurrentTime()}
          </p>
        </div>
        
        {employees.length > 0 ? (
          <div className="divide-y">
            {employees.map((employee, index) => {
              const isConfirmed = confirmedEmployees.includes(employee.Name);
              
              return (
                <div 
                  key={index} 
                  className={`p-4 flex justify-between items-center ${isConfirmed ? 'bg-green-50' : ''}`}
                >
                  <div>
                    <p className="font-medium">{employee.Name}</p>
                    <p className="text-sm text-gray-600">{employee.Position}</p>
                  </div>
                  
                  {isConfirmed ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      Confirmed
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConfirm(employee)}
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {processing ? 'Processing...' : 'Confirm'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No employees found in the system.
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/security-dashboard')}
          className="py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
        >
          Back to Dashboard
        </button>
        
        <div className="text-sm text-gray-600 flex items-center">
          <span className="mr-2">Total Confirmed:</span>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
            {confirmedEmployees.length} / {employees.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAttendance;