import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getPendingLeaveRequests, processLeaveRequest } from '../../services/sheetsService';
import { formatDateForDisplay } from '../../utils/dateUtils';
import Loading from '../common/Loading';

const LeaveApproval = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        
        // Fetch pending leave requests
        const result = await getPendingLeaveRequests();
        
        if (!result.success) {
          throw new Error('Failed to fetch leave requests');
        }
        
        setPendingRequests(result.data);
      } catch (error) {
        setError(error.message || 'An error occurred while fetching leave requests');
        console.error('Leave requests fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaveRequests();
  }, []);
  
  const handleAction = async (request, action) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccessMessage(null);
      
      // Process the leave request
      const result = await processLeaveRequest(
        request.Date,
        request.Name,
        action,
        currentUser.name
      );
      
      if (!result.success) {
        throw new Error(`Failed to ${action.toLowerCase()} leave request`);
      }
      
      // Update local state to remove the processed request
      setPendingRequests(prevRequests => 
        prevRequests.filter(req => 
          !(req.Date === request.Date && req.Name === request.Name)
        )
      );
      
      setSuccessMessage(`Successfully ${action.toLowerCase()}d ${request.Name}'s leave request`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      setError(error.message || `An error occurred while ${action.toLowerCase()}ing the request`);
      console.error(`${action} error:`, error);
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return <Loading message="Loading leave requests..." />;
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Leave Request Approvals</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {successMessage}
        </div>
      )}
      
      {pendingRequests.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Pending Leave Requests</h2>
          </div>
          
          <div className="divide-y">
            {pendingRequests.map((request, index) => (
              <div key={index} className="p-6">
                <div className="flex flex-wrap justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{request.Name}</h3>
                    <p className="text-sm text-gray-600">{request.Position}</p>
                  </div>
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {request.LeaveType}
                  </div>
                </div>
                
                <div className="mb-4">
                  <p>
                    <span className="font-medium">Date:</span>{' '}
                    {formatDateForDisplay(request.Date)}
                  </p>
                  <p>
                    <span className="font-medium">Reason:</span>{' '}
                    {request.Reason}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleAction(request, 'Approve')}
                    disabled={processing}
                    className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
                  >
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  
                  <button
                    onClick={() => handleAction(request, 'Reject')}
                    disabled={processing}
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 mb-4">No pending leave requests at this time.</p>
        </div>
      )}
      
      <button
        onClick={() => navigate('/security-dashboard')}
        className="py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default LeaveApproval;