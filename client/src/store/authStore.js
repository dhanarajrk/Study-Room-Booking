import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const useAuthStore = create(
  persist(    //I use persist because I want the browser to remember isAuthenticated for logged in user so that isAuthenticated in authStore wont reset everytime I refresh the page, it will avoid bringing me back to '/login'
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,

      register: async (userData) => {
        set({ loading: true });
        try {
          const res = await axios.post(`${API_BASE_URL}/register`, userData);
          toast.success('OTP sent to your email!');
          return res.data;
        } catch (err) {
          toast.error(err.response?.data?.message || 'Registration failed');
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      verifyOtp: async (email, otp) => {
        set({ loading: true });
        try {
          const res = await axios.post(`${API_BASE_URL}/verify-otp`, { email, otp });
          set({ user: res.data.user, isAuthenticated: true });
          toast.success('Account verified!');
          return res.data;
        } catch (err) {
          toast.error(err.response?.data?.message || 'OTP verification failed');
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      login: async (credentials) => {
        set({ loading: true });
        try {
          const res = await axios.post(`${API_BASE_URL}/login`, credentials);
          localStorage.setItem('token', res.data.token);

          const user = res.data.user;
          if (user.id && !user._id) {
            user._id = user.id;
          }

          set({ user, isAuthenticated: true });
          toast.success('Logged in successfully!');
          return res.data;
        } catch (err) {
          toast.error(err.response?.data?.message || 'Login failed');
          throw err;
        } finally {
          set({ loading: false });
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },
    }),
    {
      name: 'auth-storage', // Key used in localStorage
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }), // Only persist what’s needed
    }
  )
);

export default useAuthStore;
