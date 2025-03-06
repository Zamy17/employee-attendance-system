import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Camera from '../common/Camera';
import Loading from '../common/Loading';
import { 
  checkSecurityConfirmation,
  recordAttendance
} from '../../services/sheetsService';
import { uploadImage } from '../../services/driveService';
import { 
  getCurrentDate, 
  getCurrentTime,
  getAttendanceStatus
} from '../../utils/dateUtils';

const CheckIn = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [isConfirmedBySecurityToday, setIsConfirmedBySecurityToday] = useState(false);
  
  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation(`${position.coords.latitude}, ${position.coords.longitude}`);
        },
        (error) => {
          console.error('Error getting location:', error);
          setCurrentLocation('Location unavailable');
        }
      );
    } else {
      setCurrentLocation('Geolocation not supported');
    }
  }, []);
  
  // Check if employee is confirmed by security
  useEffect(() => {
    const checkSecurityStatus = async () => {
      try {
        setLoading(true);
        
        // Check if already checked in today
        const currentDate = getCurrentDate();
        const confirmationResult = await checkSecurityConfirmation(
          currentDate,
          currentUser.name
        );
        
        setIsConfirmedBySecurityToday(confirmationResult.confirmed);
        
        if (!confirmationResult.confirmed) {
          setError('You have not been confirmed by security today. Please contact the security personnel.');
        }
      } catch (error) {
        setError('An error occurred while checking security confirmation.');
        console.error('Security confirmation check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkSecurityStatus();
  }, [currentUser.name]);
  
  // Handle camera capture
  const handleCapture = (imageData) => {
    setCapturedImage(imageData);
  };
  
  // Handle check-in submission
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      
      if (!capturedImage) {
        setError('Please take a photo for check-in.');
        return;
      }
      
      const currentDate = getCurrentDate();
      const currentTimeStr = getCurrentTime();
      
      // Upload image to Google Drive
      const fileName = `${currentUser.name}_check_in_${currentDate.replace(/-/g, '')}_${currentTimeStr.replace(':', '')}.jpg`;
      const uploadResult = await uploadImage(capturedImage, fileName);
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload check-in photo');
      }
      
      // Record attendance in Google Sheets
      const attendanceData = {
        type: 'check-in',
        date: currentDate,
        name: currentUser.name,
        position: currentUser.position,
        time: currentTimeStr,
        photoUrl: uploadResult.fileUrl,
        location: currentLocation
      };
      
      const recordResult = await recordAttendance(attendanceData);
      
      if (!recordResult.success) {
        throw new Error(recordResult.error || 'Failed to record check-in');
      }
      
      // Show success message
      setSuccessMessage(`Successfully checked in at ${currentTimeStr}`);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/employee-dashboard');
      }, 2000);
      
    } catch (error) {
      setError(error.message || 'An error occurred during check-in');
      console.error('Check-in error:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle retake photo
  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  if (loading) {
    return <Loading message="Checking security confirmation..." />;
  }
  
  if (!isConfirmedBySecurityToday) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold mb-4">Check In</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>{error || 'You have not been confirmed by security today.'}</p>
        </div>
        <button
          onClick={() => navigate('/employee-dashboard')}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
      <h1 className="text-xl font-bold mb-4">Check In</h1>
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          <p>{successMessage}</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <div className="mb-4">
        <p><strong>Date:</strong> {getCurrentDate()}</p>
        <p><strong>Current Time:</strong> {getCurrentTime()}</p>
        <p><strong>Location:</strong> {currentLocation || 'Detecting location...'}</p>
      </div>
      
      {!capturedImage ? (
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">Please take a selfie for check-in:</p>
          <Camera 
            onCapture={handleCapture} 
            watermarkData={{
              location: currentLocation || 'Unknown',
              time: `${getCurrentDate()} ${getCurrentTime()}`
            }}
          />
        </div>
      ) : (
        <div className="mb-4">
          <p className="mb-2 text-sm text-gray-600">Captured photo:</p>
          <div className="relative">
            <img 
              src={capturedImage} 
              alt="Check-in" 
              className="w-full h-auto rounded"
            />
            <button
              onClick={handleRetake}
              className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      <div className="flex space-x-4">
        <button
          onClick={() => navigate('/employee-dashboard')}
          className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className={`flex-1 px-4 py-2 rounded ${
            capturedImage && !submitting
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!capturedImage || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

export default CheckIn;