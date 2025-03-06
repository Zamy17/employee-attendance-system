import React, { createContext, useState, useContext, useEffect } from 'react';
import { verifyPIN } from '../services/sheetsService';

// Create context
const AuthContext = createContext();

// Custom hook for using auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      console.log('Found user in localStorage:', storedUser);
      setCurrentUser(JSON.parse(storedUser));
    } else {
      console.log('No user found in localStorage');
    }
    setLoading(false);
  }, []);

  // Login with PIN
  const login = async (pin) => {
    console.log('Login attempt with PIN:', pin);
    try {
      setLoading(true);
      setError(null);
      
      // Call API to verify PIN
      console.log('Calling verifyPIN service');
      const response = await verifyPIN(pin);
      console.log('PIN verification response:', response);
      
      if (!response.success) {
        console.log('PIN verification failed:', response.error);
        setError(response.error || 'Invalid PIN');
        return false;
      }
      
      console.log('PIN verification successful:', response.data);
      
      // Store user in state and localStorage
      const userData = {
        ...response.data,
        pin: pin // Store PIN for potential re-auth needs
      };
      
      console.log('Setting user data:', userData);
      setCurrentUser(userData);
      localStorage.setItem('authUser', JSON.stringify(userData));
      return true;
    } catch (err) {
      console.error('Login error details:', err);
      setError('An error occurred during login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    console.log('Logging out user');
    setCurrentUser(null);
    localStorage.removeItem('authUser');
  };

  // Value to provide
  const value = {
    currentUser,
    loading,
    error,
    login,
    logout,
    isSecurityGuard: currentUser?.role === 'Security',
    isEmployee: currentUser?.role === 'Employee'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;