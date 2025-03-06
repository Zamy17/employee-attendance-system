/**
 * Validates that a PIN is exactly 4 digits
 * @param {string} pin - The PIN to validate
 * @returns {boolean} - Whether the PIN is valid
 */
export const isValidPIN = (pin) => {
    return /^\d{4}$/.test(pin);
  };
  
  /**
   * Validates that a date is in YYYY-MM-DD format
   * @param {string} date - The date to validate
   * @returns {boolean} - Whether the date is valid
   */
  export const isValidDate = (date) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  };
  
  /**
   * Validates that a time is in HH:MM format
   * @param {string} time - The time to validate
   * @returns {boolean} - Whether the time is valid
   */
  export const isValidTime = (time) => {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return false;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };
  
  /**
   * Validates that a string is not empty after trimming
   * @param {string} str - The string to validate
   * @returns {boolean} - Whether the string is not empty
   */
  export const isNotEmpty = (str) => {
    return str && str.trim() !== '';
  };
  
  /**
   * Validates that a value is a non-negative number
   * @param {any} value - The value to validate
   * @returns {boolean} - Whether the value is a non-negative number
   */
  export const isNonNegativeNumber = (value) => {
    const num = Number(value);
    return !isNaN(num) && num >= 0;
  };
  
  /**
   * Validates an email address format
   * @param {string} email - The email to validate
   * @returns {boolean} - Whether the email is valid
   */
  export const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  /**
   * Validates that a string has a minimum and maximum length
   * @param {string} str - The string to validate
   * @param {number} min - Minimum length
   * @param {number} max - Maximum length
   * @returns {boolean} - Whether the string is within the length constraints
   */
  export const isValidLength = (str, min, max) => {
    return str && str.length >= min && str.length <= max;
  };