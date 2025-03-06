import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { addWatermark } from '../../services/driveService';

const Camera = ({ onCapture, watermarkData }) => {
  const webcamRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle user media success
  const handleUserMediaSuccess = useCallback(() => {
    setIsCameraReady(true);
    setError(null);
  }, []);
  
  // Handle user media error
  const handleUserMediaError = useCallback((error) => {
    setIsCameraReady(false);
    setError('Failed to access camera: ' + error.message);
    console.error('Camera access error:', error);
  }, []);
  
  // Capture photo
  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || !isCameraReady) return;
    
    try {
      // Capture image
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }
      
      // Add watermark if watermark data is provided
      const finalImage = watermarkData 
        ? await addWatermark(imageSrc, watermarkData) 
        : imageSrc;
      
      // Pass the image to parent component
      onCapture(finalImage);
    } catch (error) {
      setError('Error capturing photo: ' + error.message);
      console.error('Photo capture error:', error);
    }
  }, [webcamRef, isCameraReady, onCapture, watermarkData]);
  
  // Camera constraints
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user"
  };
  
  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="relative mb-4 bg-gray-200 rounded overflow-hidden">
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMediaSuccess}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full"
        />
        
        {!isCameraReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 text-white">
            Loading camera...
          </div>
        )}
      </div>
      
      <button
        onClick={capturePhoto}
        disabled={!isCameraReady}
        className={`px-4 py-2 rounded font-medium ${
          isCameraReady
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-400 text-gray-700 cursor-not-allowed'
        }`}
      >
        Capture Photo
      </button>
    </div>
  );
};

export default Camera;