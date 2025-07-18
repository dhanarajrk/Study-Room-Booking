import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import OtpInput from '../../components/auth/OtpInput';
import useAuthStore from '../../store/authStore';
import ThemeToggleBtn from '../../components/ui/ThemeToggleBtn';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [showOtpInput, setShowOtpInput] = useState(false);
  const { register, verifyOtp, loading } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await register(formData);
    setShowOtpInput(true); // Show OTP input after registration
  };

  const handleVerify = async (email, otp) => {
    await verifyOtp(email, otp);
    navigate('/dashboard'); // Redirect after successful verification
  };

  /* Normal Theme 
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Register</h1>
      
      {!showOtpInput ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="tel"
            name="phoneNumber"
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded ${
              loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {loading ? 'Sending OTP...' : 'Register'}
          </button>
        </form>
      ) : (
        <OtpInput 
          email={formData.email} 
          onVerify={handleVerify} 
        />
      )}
    </div>
  );
  */

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[var(--bg-light)] p-8 rounded-lg shadow-md">
        <div className="flex justify-end">
          <ThemeToggleBtn />
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center text-[var(--text)]">Register</h1>
        
        {!showOtpInput ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              required
            />
            <input
              type="tel"
              name="phoneNumber"
              placeholder="Phone Number"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="w-full p-2 border border-[var(--border)] rounded bg-[var(--bg)] text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-[var(--primary)] focus:border-[var(--primary)]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded ${
                loading ? 'bg-[var(--text-muted)]' : 'bg-[var(--primary)] hover:opacity-90'
              } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]`}
            >
              {loading ? 'Sending OTP...' : 'Register'}
            </button>
          </form>
        ) : (
          <OtpInput 
            email={formData.email} 
            onVerify={handleVerify} 
          />
        )}
      </div>
    </div>
  );

};

export default RegisterPage;      