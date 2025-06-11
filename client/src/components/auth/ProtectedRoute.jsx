import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = () => {
  const { isAuthenticated, user } = useAuthStore();
  return isAuthenticated && user ? <Outlet /> : <Navigate to="/login" replace />;    //If isAuthenticated is true, it renders whatever child routes are defined inside. If false, it redirects to the /login page.
};

export default ProtectedRoute;