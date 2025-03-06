import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { submitLeaveRequest } from '../../services/sheetsService';
import { getCurrentDate } from '../../utils/dateUtils';

const LeaveRequest = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: getCurrentDate(),
    leaveType: 'Sick Leave',
    reason: ''
  });
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setProcessing(true);
      setError(null);
      
      if (!formData.reason.trim()) {
        throw new Error('Please provide a reason for your leave request');
      }
      
      // Submit leave request
      const data = {
        date: formData.date,
        name: currentUser.name,
        position: currentUser.position,
        leaveType: formData.leaveType,
        reason: formData.reason
      };
      
      const result = await submitLeaveRequest(data);
      
      if (!result.success) {
        throw new Error('Failed to submit leave request: ' + result.error);
      }
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        date: getCurrentDate(),
        leaveType: 'Sick Leave',
        reason: ''
      });
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/employee-dashboard');
      }, 2000);
    } catch (error) {
      setError(error.message || 'An error occurred while submitting leave request');
      console.error('Leave request error:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Request Leave</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          Leave request submitted successfully! You will be redirected to the dashboard.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 font-medium mb-2">
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={getCurrentDate()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="leaveType" className="block text-gray-700 font-medium mb-2">
            Leave Type
          </label>
          <select
            id="leaveType"
            name="leaveType"
            value={formData.leaveType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="Sick Leave">Sick Leave</option>
            <option value="Vacation Leave">Vacation Leave</option>
            <option value="Personal Leave">Personal Leave</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="reason" className="block text-gray-700 font-medium mb-2">
            Reason
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Please provide a detailed reason for your leave request"
            required
          ></textarea>
        </div>
        
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/employee-dashboard')}
            className="flex-1 py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
            disabled={processing}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={processing || success}
          >
            {processing ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LeaveRequest;