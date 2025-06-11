import { Link, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const Layout = () => {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Library Booking
          </Link>
          <nav>
            {isAuthenticated ? (
              <button onClick={logout} className="text-blue-600 hover:text-blue-800">
                Logout
              </button>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-blue-600 hover:text-blue-800">
                  Login
                </Link>
                <Link to="/register" className="text-blue-600 hover:text-blue-800">
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Outlet /> {/* <-- use this to render nested routes */}
      </main>
    </div>
  );
};

export default Layout;
