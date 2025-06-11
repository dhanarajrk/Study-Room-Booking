import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/booking.js';
import tableRoutes from './routes/tables.js';

dotenv.config();

const app = express();
const httpServer = createServer(app); //since we use web socket

// Socket.io setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
    },
});

//Middleware
app.use(cors());
app.use(express.json());

//import routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/bookings', bookingRoutes);
app.use('/api/auth/tables', tableRoutes);

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