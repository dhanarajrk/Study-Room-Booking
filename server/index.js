import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/booking.js';
import tableRoutes from './routes/tables.js';
import paymentRoutes from './routes/paymentroute.js';
import webhookRoutes from './routes/webhookRoutes.js';
import './utils/clearExpiredInvoices.js'; // Auto-clear expired invoice links when server starts

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const httpServer = createServer(app); // Create HTTP server for Socket.IO support

// Socket.io setup (using global.io to import in any file)
global.io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.FRONTEND_URL], // accepts Vite dev URL and Frontend production URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL, // Local frontend (dev)
  process.env.FRONTEND_URL // Frontend live URL (production)
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json()); // For JSON parsing in requests

// Import API routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/bookings', bookingRoutes);
app.use('/api/auth/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);


// Needed for ES Modules 
const __filename = fileURLToPath(import.meta.url);   //real index.js file path   projectname/server/index.js
const __dirname = path.dirname(__filename);         //extract only index.js folder path   projectname/server/
// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist'))); // Join extracted working directory path with React dist folder like this projectname/client/dist

  // React fallback route: redirect unknown paths (excluding /api) to index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
  });
}

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000; // Render provides PORT automatically; and for dev mode fallback to 5000 locally if we are running on localhost
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
