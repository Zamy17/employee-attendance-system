import { driveApi, handleApiError } from './api';

const DRIVE_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID;

/**
 * Upload an image to Google Drive
 * @param {string} dataUrl - Base64 data URL of the image
 * @param {string} fileName - Name for the uploaded file
 * @returns {Promise<Object>} - Result with the file URL
 */
export const uploadImage = async (dataUrl, fileName) => {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create form data
    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify({
      name: fileName,
      mimeType: 'image/jpeg',
      parents: [DRIVE_FOLDER_ID]
    })], { type: 'application/json' }));
    
    formData.append('file', blob);
    
    // Upload to Google Drive
    const uploadResponse = await driveApi.post('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      params: {
        uploadType: 'multipart',
        fields: 'id,webViewLink'
      }
    });
    
    return { 
      success: true, 
      fileId: uploadResponse.data.id,
      fileUrl: uploadResponse.data.webViewLink 
    };
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Add a watermark to an image
 * @param {string} imageDataUrl - Base64 data URL of the image
 * @param {Object} watermarkData - Data for the watermark (location, time)
 * @returns {Promise<string>} - Data URL of the watermarked image
 */
export const addWatermark = async (imageDataUrl, watermarkData) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the original image
        ctx.drawImage(img, 0, 0);
        
        // Configure watermark text
        ctx.font = '16px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 0.5;
        
        // Add location text
        const locationText = `Location: ${watermarkData.location}`;
        ctx.fillText(locationText, 10, img.height - 40);
        ctx.strokeText(locationText, 10, img.height - 40);
        
        // Add time text
        const timeText = `Time: ${watermarkData.time}`;
        ctx.fillText(timeText, 10, img.height - 20);
        ctx.strokeText(timeText, 10, img.height - 20);
        
        // Convert back to data URL
        const watermarkedDataUrl = canvas.toDataURL('image/jpeg');
        resolve(watermarkedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    img.src = imageDataUrl;
  });
};