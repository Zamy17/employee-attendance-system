import React, { useState } from 'react';

const PINInput = ({ onComplete }) => {
  const [pin, setPin] = useState('');
  
  const handleChange = (e) => {
    const value = e.target.value;
    
    // Hanya terima angka dan batasi panjang hingga 4 digit
    if (/^\d*$/.test(value) && value.length <= 4) {
      setPin(value);
    }
  };
  
  const handleLoginClick = () => {
    console.log('Current PIN:', pin);
    
    if (pin.length === 4) {
      console.log('PIN lengkap, memanggil onComplete');
      onComplete(pin);
    } else {
      alert('Mohon masukkan 4 digit PIN');
    }
  };

  return (
    <div className="flex flex-col items-center">
      <input
        type="password"
        value={pin}
        onChange={handleChange}
        placeholder="Masukkan 4 digit PIN"
        className="w-full max-w-xs p-2 text-center text-xl font-bold border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none mb-4"
        maxLength={4}
        autoFocus
      />
      
      <button
        onClick={handleLoginClick}
        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Login
      </button>
    </div>
  );
};

export default PINInput;