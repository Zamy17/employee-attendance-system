import { sheetsApi, handleApiError } from './api';

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;

/**
 * Get all data from a specific sheet
 * @param {string} sheetName - Name of the sheet to fetch
 * @returns {Promise<Array>} - Array of objects with sheet data
 */
export const getSheetData = async (sheetName) => {
  try {
    console.log(`Fetching data from sheet: ${sheetName}, Spreadsheet ID: ${SPREADSHEET_ID}`);
    const response = await sheetsApi.get(`/values/${sheetName}`);
    console.log(`API response for ${sheetName}:`, response);
    
    if (!response.data || !response.data.values || response.data.values.length < 2) {
      console.error('No data or invalid format in response:', response.data);
      return { success: false, data: [], error: 'No data found or invalid format' };
    }

    // The first row contains headers
    const headers = response.data.values[0];
    console.log('Sheet headers:', headers);
    
    const rows = response.data.values.slice(1);
    console.log(`Found ${rows.length} data rows`);

    // Convert rows to array of objects with header keys
    const formattedData = rows.map(row => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = row[index] || '';
      });
      return item;
    });

    console.log('Formatted data sample:', formattedData.slice(0, 2));
    return { success: true, data: formattedData };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return handleApiError(error);
  }
};

/**
 * Append a row to a specific sheet
 * @param {string} sheetName - Name of the sheet
 * @param {Array} rowData - Array of values to append
 * @returns {Promise<Object>} - Result of the operation
 */
export const appendRow = async (sheetName, rowData) => {
  try {
    console.log(`Appending row to sheet ${sheetName}:`, rowData);
    const response = await sheetsApi.post(`/values/${sheetName}:append`, {
      values: [rowData]
    }, {
      params: {
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS'
      }
    });

    console.log('Append row response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error appending row:', error);
    return handleApiError(error);
  }
};

/**
 * Update a specific cell in a sheet
 * @param {string} sheetName - Name of the sheet
 * @param {string} cellRange - Cell range (e.g., 'A2:A2')
 * @param {string} value - New value
 * @returns {Promise<Object>} - Result of the operation
 */
export const updateCell = async (sheetName, cellRange, value) => {
  try {
    console.log(`Updating cell ${sheetName}!${cellRange} to value:`, value);
    const response = await sheetsApi.put(`/values/${sheetName}!${cellRange}`, {
      values: [[value]]
    }, {
      params: {
        valueInputOption: 'USER_ENTERED'
      }
    });

    console.log('Update cell response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating cell:', error);
    return handleApiError(error);
  }
};

/**
 * Verify PIN against employee data
 * @param {string} pin - 4-digit PIN
 * @returns {Promise<Object>} - User data if valid, error otherwise
 */
export const verifyPIN = async (pin) => {
  try {
    console.log('Verifying PIN:', pin);
    // Fetch employees data
    const result = await getSheetData('Employees');
    
    if (!result.success) {
      console.error('Failed to fetch employee data:', result.error);
      return { success: false, error: 'Failed to fetch employee data' };
    }

    console.log('Employees data received, searching for matching PIN');
    
    if (result.data.length > 0) {
      console.log('First employee PIN type:', typeof result.data[0].PIN);
      console.log('Sample PIN from data:', result.data[0].PIN);
    }

    // Find employee with matching PIN - trying different comparisons
    const user = result.data.find(emp => 
      emp.PIN === pin || 
      emp.PIN === Number(pin) || 
      String(emp.PIN) === pin
    );
    
    console.log('User found with matching PIN:', user);
    
    if (!user) {
      console.log('No user found with PIN:', pin);
      return { success: false, error: 'Invalid PIN' };
    }

    console.log('User verified successfully:', user.Name);
    return { 
      success: true, 
      data: {
        name: user.Name,
        position: user.Position,
        role: user.Role, // 'Employee' or 'Security'
      }
    };
  } catch (error) {
    console.error('PIN verification error:', error);
    return handleApiError(error);
  }
};

/**
 * Add security confirmation for an employee
 * @param {Object} data - Security confirmation data
 * @returns {Promise<Object>} - Result of the operation
 */
export const addSecurityConfirmation = async (data) => {
  try {
    console.log('Adding security confirmation:', data);
    const rowData = [
      data.date,
      data.securityName,
      data.employeeName,
      data.position,
      data.confirmationTime
    ];

    return await appendRow('Security_Confirmations', rowData);
  } catch (error) {
    console.error('Error adding security confirmation:', error);
    return handleApiError(error);
  }
};

/**
 * Check if an employee has been confirmed by security
 * @param {string} date - Current date (YYYY-MM-DD)
 * @param {string} employeeName - Employee name
 * @returns {Promise<Object>} - Result of the check
 */
export const checkSecurityConfirmation = async (date, employeeName) => {
  try {
    console.log(`Checking security confirmation for ${employeeName} on ${date}`);
    const result = await getSheetData('Security_Confirmations');
    
    if (!result.success) {
      console.error('Failed to fetch security confirmations:', result.error);
      return { success: false, error: 'Failed to fetch security confirmations' };
    }

    // Find confirmation for this employee on this date
    const confirmation = result.data.find(conf => 
      conf.Date === date && conf.EmployeeName === employeeName
    );
    
    console.log('Confirmation found:', confirmation);
    
    return { 
      success: true, 
      confirmed: !!confirmation,
      data: confirmation || null
    };
  } catch (error) {
    console.error('Error checking security confirmation:', error);
    return handleApiError(error);
  }
};

/**
 * Record attendance (check-in or check-out)
 * @param {Object} data - Attendance data
 * @returns {Promise<Object>} - Result of the operation
 */
export const recordAttendance = async (data) => {
  try {
    console.log('Recording attendance:', data);
    
    // Check if there's already an entry for today
    const attendanceResult = await getSheetData('Attendance');
    
    if (!attendanceResult.success) {
      console.error('Failed to fetch attendance data:', attendanceResult.error);
      return { success: false, error: 'Failed to fetch attendance data' };
    }

    const todayEntry = attendanceResult.data.find(entry => 
      entry.Date === data.date && entry.Name === data.name
    );
    
    console.log('Today\'s existing entry:', todayEntry);
    
    if (data.type === 'check-in') {
      // For check-in, add a new row
      if (todayEntry && todayEntry.CheckInTime) {
        console.log('Already checked in today');
        return { success: false, error: 'Already checked in today' };
      }
      
      // Calculate status based on check-in time
      const checkInHour = parseInt(data.time.split(':')[0]);
      const checkInMinute = parseInt(data.time.split(':')[1]);
      
      let status = 'On Time';
      if (checkInHour > 8 || (checkInHour === 8 && checkInMinute > 10)) {
        status = 'Late';
      }
      if (checkInHour > 8 || (checkInHour === 8 && checkInMinute > 30)) {
        status = 'Very Late';
      }
      
      console.log('Check-in status calculated:', status);
      
      const rowData = [
        data.date,
        data.name,
        data.position,
        data.time,
        status,
        '', // Check-out time (empty)
        'Pending', // Check-out status
        data.photoUrl,
        '', // Check-out photo URL (empty)
        data.location,
        '', // Check-out location (empty)
        '' // Work duration (empty)
      ];
      
      return await appendRow('Attendance', rowData);
    } else if (data.type === 'check-out') {
      // For check-out, update the existing row
      if (!todayEntry) {
        console.log('No check-in record found for today');
        return { success: false, error: 'No check-in record found for today' };
      }
      
      if (todayEntry.CheckOutTime) {
        console.log('Already checked out today');
        return { success: false, error: 'Already checked out today' };
      }
      
      // Find the row index for today's entry
      const rowIndex = attendanceResult.data.indexOf(todayEntry) + 2; // +2 because of 0-indexing and header row
      console.log('Row index for update:', rowIndex);
      
      // Calculate work duration
      const checkInTime = todayEntry.CheckInTime.split(':');
      const checkOutTime = data.time.split(':');
      const startHours = parseInt(checkInTime[0]);
      const startMinutes = parseInt(checkInTime[1]);
      const endHours = parseInt(checkOutTime[0]);
      const endMinutes = parseInt(checkOutTime[1]);
      
      let durationHours = endHours - startHours;
      let durationMinutes = endMinutes - startMinutes;
      
      if (durationMinutes < 0) {
        durationHours--;
        durationMinutes += 60;
      }
      
      const duration = `${durationHours} hours ${durationMinutes} minutes`;
      console.log('Calculated work duration:', duration);
      
      // Update the cells for check-out data
      await updateCell('Attendance', `F${rowIndex}`, data.time);
      await updateCell('Attendance', `G${rowIndex}`, 'Present');
      await updateCell('Attendance', `I${rowIndex}`, data.photoUrl);
      await updateCell('Attendance', `K${rowIndex}`, data.location);
      await updateCell('Attendance', `L${rowIndex}`, duration);
      
      return { success: true };
    }
    
    console.log('Invalid attendance type');
    return { success: false, error: 'Invalid attendance type' };
  } catch (error) {
    console.error('Error recording attendance:', error);
    return handleApiError(error);
  }
};

/**
 * Get attendance history for an employee
 * @param {string} employeeName - Employee name
 * @param {number} days - Number of days to retrieve (default: 30)
 * @returns {Promise<Object>} - Attendance history
 */
export const getAttendanceHistory = async (employeeName, days = 30) => {
  try {
    console.log(`Getting ${days} days of attendance history for ${employeeName}`);
    const result = await getSheetData('Attendance');
    
    if (!result.success) {
      console.error('Failed to fetch attendance data:', result.error);
      return { success: false, error: 'Failed to fetch attendance data' };
    }
    
    // Filter entries for this employee
    const employeeEntries = result.data.filter(entry => entry.Name === employeeName);
    console.log(`Found ${employeeEntries.length} entries for ${employeeName}`);
    
    // Sort by date (newest first) and limit to specified days
    const sortedEntries = employeeEntries
      .sort((a, b) => new Date(b.Date) - new Date(a.Date))
      .slice(0, days);
    
    console.log(`Returning ${sortedEntries.length} entries after sorting`);
    return { success: true, data: sortedEntries };
  } catch (error) {
    console.error('Error getting attendance history:', error);
    return handleApiError(error);
  }
};

/**
 * Submit a leave request
 * @param {Object} data - Leave request data
 * @returns {Promise<Object>} - Result of the operation
 */
export const submitLeaveRequest = async (data) => {
  try {
    console.log('Submitting leave request:', data);
    const rowData = [
      data.date,
      data.name,
      data.position,
      data.leaveType,
      data.reason,
      'Pending',
      ''
    ];
    
    return await appendRow('Leave_Requests', rowData);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return handleApiError(error);
  }
};

/**
 * Approve or reject a leave request
 * @param {string} date - Date of the leave request
 * @param {string} employeeName - Employee name
 * @param {string} action - 'Approve' or 'Reject'
 * @param {string} securityName - Name of the security personnel
 * @returns {Promise<Object>} - Result of the operation
 */
export const processLeaveRequest = async (date, employeeName, action, securityName) => {
  try {
    console.log(`Processing leave request for ${employeeName} on ${date}, action: ${action}`);
    // Get leave requests
    const result = await getSheetData('Leave_Requests');
    
    if (!result.success) {
      console.error('Failed to fetch leave requests:', result.error);
      return { success: false, error: 'Failed to fetch leave requests' };
    }
    
    // Find the specific leave request
    const leaveRequest = result.data.find(req => 
      req.Date === date && req.Name === employeeName && req.ApprovalStatus === 'Pending'
    );
    
    if (!leaveRequest) {
      console.log('Leave request not found or already processed');
      return { success: false, error: 'Leave request not found or already processed' };
    }
    
    // Find the row index
    const rowIndex = result.data.indexOf(leaveRequest) + 2;
    console.log('Row index for leave request update:', rowIndex);
    
    // Update approval status and approver
    await updateCell('Leave_Requests', `F${rowIndex}`, action === 'Approve' ? 'Approved' : 'Rejected');
    await updateCell('Leave_Requests', `G${rowIndex}`, securityName);
    
    // If approved, update the attendance sheet as well
    if (action === 'Approve') {
      console.log('Approved leave, updating attendance records');
      const attendanceResult = await getSheetData('Attendance');
      
      if (attendanceResult.success) {
        const todayAttendance = attendanceResult.data.find(entry => 
          entry.Date === date && entry.Name === employeeName
        );
        
        if (!todayAttendance) {
          console.log('No attendance record exists, creating one with Leave status');
          // Add a new attendance entry with 'Leave' status
          const rowData = [
            date,
            employeeName,
            leaveRequest.Position,
            '',
            leaveRequest.LeaveType,
            '',
            'Leave',
            '',
            '',
            '',
            '',
            ''
          ];
          
          await appendRow('Attendance', rowData);
        } else {
          console.log('Updating existing attendance record with Leave status');
          // Update existing attendance entry
          const rowIndex = attendanceResult.data.indexOf(todayAttendance) + 2;
          await updateCell('Attendance', `E${rowIndex}`, leaveRequest.LeaveType);
          await updateCell('Attendance', `G${rowIndex}`, 'Leave');
        }
      }
    }
    
    return { success: true, action };
  } catch (error) {
    console.error('Error processing leave request:', error);
    return handleApiError(error);
  }
};

/**
 * Get pending leave requests
 * @returns {Promise<Object>} - List of pending leave requests
 */
export const getPendingLeaveRequests = async () => {
  try {
    console.log('Getting pending leave requests');
    const result = await getSheetData('Leave_Requests');
    
    if (!result.success) {
      console.error('Failed to fetch leave requests:', result.error);
      return { success: false, error: 'Failed to fetch leave requests' };
    }
    
    // Filter for pending requests
    const pendingRequests = result.data.filter(req => req.ApprovalStatus === 'Pending');
    console.log(`Found ${pendingRequests.length} pending leave requests`);
    
    return { success: true, data: pendingRequests };
  } catch (error) {
    console.error('Error getting pending leave requests:', error);
    return handleApiError(error);
  }
};

/**
 * Get monthly attendance recap
 * @param {string} month - Month in format 'YYYY-MM'
 * @returns {Promise<Object>} - Monthly recap data
 */
export const getMonthlyRecap = async (month) => {
  try {
    console.log(`Getting monthly recap for ${month}`);
    const result = await getSheetData('Monthly_Recap');
    
    if (!result.success) {
      console.error('Failed to fetch monthly recap:', result.error);
      return { success: false, error: 'Failed to fetch monthly recap' };
    }
    
    // Filter for the specified month
    const monthlyData = result.data.filter(entry => entry.Month === month);
    console.log(`Found ${monthlyData.length} entries for month ${month}`);
    
    return { success: true, data: monthlyData };
  } catch (error) {
    console.error('Error getting monthly recap:', error);
    return handleApiError(error);
  }
};