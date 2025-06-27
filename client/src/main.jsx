import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Toaster } from 'react-hot-toast';
import './index.css';
import useThemeStore from './store/themeStore';

const Root = () => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    // Apply theme class to HTML element
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      console.log('Applied dark theme class'); // Debug log
    } else {
      html.classList.remove('dark');
      console.log('Removed dark theme class'); // Debug log
    }
  }, [isDark]);

  return (
    <React.StrictMode>
      <App />
      <Toaster position="top-center" />
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);