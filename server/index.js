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
import './utils/clearExpiredInvoices.js'; //invoice link expired clear cron to run automatically when server starts

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const httpServer = createServer(app); //since we use web socket

// Socket.io setup (i use global.io so that io can be imported in any files)
global.io = new Server(httpServer, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.FRONTEND_URL], //Vite/Frontend LIVE URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//Middleware
const allowedOrigins = [
  process.env.CLIENT_URL, // For local dev
  process.env.FRONTEND_URL // For production
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

//import routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/bookings', bookingRoutes);  
app.use('/api/auth/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// Needed for ES Modules
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist'))); // (front end static folder called /dist )

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist', 'index.html')); // redirect any unkown routes to main page /
  });
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes (will be added in later steps)
app.get("/", (req, res) => res.send("Study Table Booking API"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000; //For production Render assigns random PORT; for Dev use 5000 when process.env.PORT is missing
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));