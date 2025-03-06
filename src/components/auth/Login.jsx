import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PINInput from './PINInput';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();
  
  const handlePINComplete = async (pin) => {
    console.log('PIN diterima di Login component:', pin);
    setIsLoggingIn(true);
    try {
      console.log('Mencoba login dengan PIN:', pin);
      const success = await login(pin);
      console.log('Hasil login:', success);
      
      if (success) {
        console.log('Login berhasil, mengambil data user dari localStorage');
        // Redirect based on user role
        const user = JSON.parse(localStorage.getItem('authUser'));
        console.log('Data user dari localStorage:', user);
        
        if (user.role === 'Security') {
          console.log('Navigasi ke security dashboard');
          navigate('/security-dashboard');
        } else {
          console.log('Navigasi ke employee dashboard');
          navigate('/employee-dashboard');
        }
      } else {
        console.log('Login gagal');
      }
    } catch (err) {
      console.error('Error dalam handlePINComplete:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Attendance System</h1>
          <p className="text-gray-600 mb-6">Enter your 4-digit PIN to login</p>
          
          <PINInput onComplete={handlePINComplete} />
          
          {error && (
            <div className="text-red-500 mt-4">
              {error}
            </div>
          )}
          
          {isLoggingIn && (
            <div className="mt-4 text-blue-500">
              Verifying PIN...
            </div>
          )}
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Please contact your administrator if you forgot your PIN.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;