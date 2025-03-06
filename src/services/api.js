import axios from 'axios';

const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

const sheetsBaseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}`;

console.log('API Configuration:');
console.log('Spreadsheet ID:', SPREADSHEET_ID);
console.log('API Key available:', !!API_KEY);

// Create an axios instance for Google Sheets API
export const sheetsApi = axios.create({
  baseURL: sheetsBaseUrl,
  params: {
    key: API_KEY
  }
});

// Create an axios instance for Google Drive API
export const driveApi = axios.create({
  baseURL: 'https://www.googleapis.com/drive/v3',
  params: {
    key: API_KEY
  }
});

// Handle API errors
export const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a non-2xx status
    console.error('API Error Response:', error.response.data);
    return {
      success: false,
      error: error.response.data.error || 'API request failed',
      status: error.response.status
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API No Response:', error.request);
    return {
      success: false,
      error: 'No response from server',
      status: 500
    };
  } else {
    // Something else happened in setting up the request
    console.error('API Error:', error.message);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      status: 500
    };
  }
};