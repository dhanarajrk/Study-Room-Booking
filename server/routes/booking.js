import express from 'express';
import Booking from '../models/Booking.js';
import Table from '../models/Table.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create a new booking
router.post('/', authenticate, async (req, res) => {
  try {
    const { table, user, startTime, endTime } = req.body; // Note field names
    
    // Validate table exists
    const tableDoc = await Table.findById(table);
    if (!tableDoc) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check for conflicts
    const conflict = await Booking.findOne({
      table,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
      ]
    });

    if (conflict) {
      return res.status(409).json({ 
        message: 'Time slot already booked',
        conflictingBooking: conflict 
      });
    }

     // Calculate duration in hours
     const start = new Date(startTime);
     const end = new Date(endTime);
     const durationHours = (end - start) / (1000 * 60 * 60);
 
     // Calculate total price
     const totalPrice = tableDoc.hourlyRate * durationHours;

    // Create booking
    const booking = new Booking({
      table,
      user,
      startTime,
      endTime,
      hours: durationHours,
      totalPrice: parseFloat(totalPrice.toFixed(2))
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bookings for a table
router.get('/', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;
    
    const bookings = await Booking.find({
      startTime: { $gte: new Date(startTime) },
      endTime: { $lte: new Date(endTime) }
    }).populate('table', 'tableNumber hourlyRate');
    
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;