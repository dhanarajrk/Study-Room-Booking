import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import ThemeToggleBtn from './ThemeToggleBtn';

const Layout = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  console.log(user);

  /* //Normal Theme
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-gray-900">
            Library Booking
          </Link>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-lg font-semibold"
              >
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-50 text-sm">
                  <div className="px-4 py-2 border-b text-gray-700">
                    Welcome! <strong>{user?.username}</strong>
                  </div>
                  <Link
                    to="/my-bookings"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Bookings
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
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
        </div>
      </header>

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
  */
  
  //with Theme toggle mode:
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="bg-[var(--bg-light)] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/dashboard" className="text-2xl font-bold text-[var(--text)]">
            Study Table Booking
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggleBtn />

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-lg font-semibold"
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-light)] border border-[var(--border)] rounded-lg shadow-lg z-50 text-sm">
                    <div className="px-4 py-2 border-b border-[var(--border)] text-[var(--text)]">
                      Welcome! <strong>{user?.username}</strong>
                    </div>
                    <Link
                      to="/my-bookings"
                      className="block px-4 py-2 hover:bg-[var(--highlight)] text-[var(--text)]"
                      onClick={() => setDropdownOpen(false)}
                    >
                      My Bookings
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[var(--highlight)] text-[var(--text)]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="text-[var(--primary)] hover:opacity-80"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-[var(--primary)] hover:opacity-80"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );

};

export default Layout;
