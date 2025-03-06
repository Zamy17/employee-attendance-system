import { format, parse, isWithinInterval, addMinutes, differenceInMinutes } from 'date-fns';

/**
 * Get the current date in YYYY-MM-DD format
 * @returns {string} - Formatted date
 */
export const getCurrentDate = () => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Get the current time in HH:mm format
 * @returns {string} - Formatted time
 */
export const getCurrentTime = () => {
  return format(new Date(), 'HH:mm');
};

/**
 * Check if the current time is within the security confirmation window (06:00 - 09:00)
 * @returns {boolean} - True if within the confirmation window
 */
export const isWithinSecurityConfirmationHours = () => {
  const now = new Date();
  const sixAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0);
  const nineAM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  
  return isWithinInterval(now, { start: sixAM, end: nineAM });
};

/**
 * Check if employee can check out (after 17:00)
 * @returns {boolean} - True if check-out is allowed
 */
export const canCheckOut = () => {
  const now = new Date();
  const fivePM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0);
  
  return now >= fivePM;
};

/**
 * Determine attendance status based on check-in time
 * @param {string} checkInTime - Check-in time in HH:mm format
 * @returns {string} - Attendance status
 */
export const getAttendanceStatus = (checkInTime) => {
  const timeObj = parse(checkInTime, 'HH:mm', new Date());
  const standardTime = new Date(timeObj.getFullYear(), timeObj.getMonth(), timeObj.getDate(), 8, 0);
  const toleranceTime = addMinutes(standardTime, 10);
  const lateThreshold = addMinutes(standardTime, 30);
  
  if (timeObj <= toleranceTime) {
    return 'On Time';
  } else if (timeObj <= lateThreshold) {
    return 'Late';
  } else {
    return 'Very Late';
  }
};

/**
 * Calculate work duration between check-in and check-out times
 * @param {string} checkInTime - Check-in time in HH:mm format
 * @param {string} checkOutTime - Check-out time in HH:mm format
 * @returns {string} - Formatted duration
 */
export const calculateWorkDuration = (checkInTime, checkOutTime) => {
  const checkIn = parse(checkInTime, 'HH:mm', new Date());
  const checkOut = parse(checkOutTime, 'HH:mm', new Date());
  
  // If check-out is before check-in, assume it's the next day
  let adjustedCheckOut = checkOut;
  if (checkOut < checkIn) {
    adjustedCheckOut = new Date(
      checkOut.getFullYear(),
      checkOut.getMonth(),
      checkOut.getDate() + 1,
      checkOut.getHours(),
      checkOut.getMinutes()
    );
  }
  
  const minutes = differenceInMinutes(adjustedCheckOut, checkIn);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours} hours ${remainingMinutes} minutes`;
};

/**
 * Format a date for display
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {string} - Formatted date for display
 */
export const formatDateForDisplay = (dateString) => {
  const date = parse(dateString, 'yyyy-MM-dd', new Date());
  return format(date, 'MMMM d, yyyy');
};

/**
 * Get the current month in YYYY-MM format
 * @returns {string} - Current month
 */
export const getCurrentMonth = () => {
  return format(new Date(), 'yyyy-MM');
};