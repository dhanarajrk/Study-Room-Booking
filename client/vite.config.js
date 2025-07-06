import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'     //Whenever frontend wants to send API req to backend, suppose /api/bookings will automatically use 'http://localhost:5000' as prefix so final url will become http://localhost:5000/api/bookings .  It will add backend localhost prefix to every api req that includes /api in the url
    }
  }
});