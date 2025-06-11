import { useState } from 'react';
import toast from 'react-hot-toast';

const OtpInput = ({ email, onVerify }) => {
  const [otp, setOtp] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }
    onVerify(email, otp);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center">Verify Email</h2>
      <p className="text-gray-600">Enter the OTP sent to {email}</p>
      
      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
        placeholder="123456"
        className="w-full p-3 border rounded-lg text-center text-xl font-mono"
      />
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Verify
      </button>
    </form>
  );
};

export default OtpInput;