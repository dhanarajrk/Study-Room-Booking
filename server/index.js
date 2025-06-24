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

dotenv.config();

const app = express();
const httpServer = createServer(app); //since we use web socket

// Socket.io setup (i use global.io so that io can be imported in any files)
global.io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL, //Vite port
    methods: ["GET", "POST"],
    credentials: true,
  },
});

//Middleware
app.use(cors());
app.use(express.json());

//import routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/bookings', bookingRoutes);  
app.use('/api/auth/tables', tableRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes (will be added in later steps)
app.get("/", (req, res) => res.send("Library Booking API"));

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);
  socket.on("disconnect", () => console.log("❌ Client disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));