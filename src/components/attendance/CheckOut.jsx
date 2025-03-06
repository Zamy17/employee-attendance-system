import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getAttendanceHistory, recordAttendance } from '../../services/sheetsService';
import { uploadImage } from '../../services/driveService';
import { getCurrentDate, getCurrentTime, canCheckOut } from '../../utils/dateUtils';
import Camera from '../common/Camera';
import Loading from '../common/Loading';

const CheckOut = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [location, setLocation] = useState('');
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isAllowedToCheckOut, setIsAllowedToCheckOut] = useState(false);
  
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      try {
        setLoading(true);
        
        // Get today's attendance record
        const attendanceResult = await getAttendanceHistory(currentUser.name, 1);
        
        if (!attendanceResult.success) {
          throw new Error('Failed to fetch attendance data');
        }
        
        const attendance = attendanceResult.data.find(
          entry => entry.Date === getCurrentDate()
        );
        
        setTodayAttendance(attendance);
        
        // Check if user can check out (has checked in and hasn't checked out yet)
        setIsAllowedToCheckOut(
          attendance && 
          attendance.CheckInTime && 
          !attendance.CheckOutTime && 
          attendance.CheckInStatus !== 'Leave'
        );
        
        // Check if it's after work hours
        const isAfterWorkHours = canCheckOut();
        
        if (!isAfterWorkHours) {
          setError('Check-out is only allowed after 17:00');
        }
        
        // Get user's location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
            },
            (error) => {
              console.error('Error getting location:', error);
              setLocation('Location unavailable');
            }
          );
        } else {
          setLocation('Geolocation not supported');
        }
      } catch (error) {
        setError(error.message || 'An error occurred while checking attendance status');
        console.error('Attendance status check error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAttendanceStatus();
  }, [currentUser.name]);
  
  const handleCapture = (imageDataUrl) => {
    setCapturedImage(imageDataUrl);
  };
  
  const handleSubmit = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      if (!capturedImage) {
        setError('Please capture a photo first');
        return;
      }
      
      // Upload photo to Google Drive
      const currentDate = getCurrentDate();
      const currentTime = getCurrentTime();
      const fileName = `${currentUser.name.replace(/\s+/g, '_')}_checkout_${currentDate}_${currentTime.replace(':', '-')}.jpg`;
      
      const uploadResult = await uploadImage(capturedImage, fileName);
      
      if (!uploadResult.success) {
        throw new Error('Failed to upload image: ' + uploadResult.error);
      }
      
      // Record the checkout
      const attendanceData = {
        date: currentDate,
        name: currentUser.name,
        position: currentUser.position,
        time: currentTime,
        type: 'check-out',
        photoUrl: uploadResult.fileUrl,
        location: location
      };
      
      const recordResult = await recordAttendance(attendanceData);
      
      if (!recordResult.success) {
        throw new Error('Failed to record check-out: ' + recordResult.error);
      }
      
      // Redirect to dashboard on success
      navigate('/employee-dashboard');
    } catch (error) {
      setError(error.message || 'An error occurred during check-out');
      console.error('Check-out error:', error);
    } finally {
      setProcessing(false);
    }
  };
  
  const retakePhoto = () => {
    setCapturedImage(null);
  };
  
  if (loading) {
    return <Loading message="Checking attendance status..." />;
  }
  
  if (!isAllowedToCheckOut) {
    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Check Out</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-bold">Cannot Check Out</p>
          <p>
            {!todayAttendance 
              ? "You haven't checked in today."
              : todayAttendance.CheckOutTime 
              ? "You've already checked out today."
              : "There was an issue with your check-in record."
            }
          </p>
        </div>
        <button
          onClick={() => navigate('/employee-dashboard')}
          className="w-full py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Check Out</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-4">
        <p className="font-medium">Date: <span className="font-normal">{getCurrentDate()}</span></p>
        <p className="font-medium">Time: <span className="font-normal">{getCurrentTime()}</span></p>
        <p className="font-medium">Location: <span className="font-normal">{location}</span></p>
        <p className="font-medium">Check-in Time: <span className="font-normal">{todayAttendance?.CheckInTime || 'N/A'}</span></p>
      </div>
      
      {!capturedImage ? (
        <Camera 
          onCapture={handleCapture}
          watermarkData={{
            location: location,
            time: `${getCurrentDate()} ${getCurrentTime()}`
          }}
        />
      ) : (
        <div className="mb-4">
          <div className="mb-2 border rounded overflow-hidden">
            <img src={capturedImage} alt="Captured" className="w-full" />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={retakePhoto}
              className="flex-1 py-2 px-4 bg-gray-600 text-white rounded hover:bg-gray-700"
              disabled={processing}
            >
              Retake
            </button>
            
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Submit Check-Out'}
            </button>
          </div>
        </div>
      )}
      
      <button
        onClick={() => navigate('/employee-dashboard')}
        className="w-full py-2 px-4 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 mt-4"
        disabled={processing}
      >
        Cancel
      </button>
    </div>
  );
};

export default CheckOut;