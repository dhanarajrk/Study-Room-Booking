import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import Dashboard from './pages/Dashboard';
import Layout from './components/ui/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import useBookingStore from './store/bookingStore';
import { useEffect } from 'react';
import MyBookings from './pages/MyBookings';
import AdminMetrics from './pages/AdminMetrics';

function App() {

  useEffect(() => {
    const { initialize } = useBookingStore.getState();
    initialize();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes with Layout */}
        <Route element={<ProtectedRoute />}>  // User must be logged in
          <Route element={<Layout />}>        // Layout will apply for all protected pages
            <Route path="/" element={<Dashboard/>} />  //Home/Dashboard page
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/metrics" element={<AdminMetrics />} />
          </Route>
        </Route>

        {/* Catch-all unkown Route*/}
        <Route path="*" element={ <h1 className="text-center mt-20 text-3xl font-bold text-gray-700">404 - Page Not Found</h1>} /> {/* Fallback route for unkown routes*/}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
