import express from 'express';
import Booking from '../models/Booking.js';
import Table from '../models/Table.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Create a new booking (user or admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { table, user, startTime, endTime, payment } = req.body;

    console.log("📦 Full request body:", req.body);

    const tableDoc = await Table.findById(table);
    if (!tableDoc) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Check for conflicts
    const conflict = await Booking.findOne({
      table,
      status: { $ne: 'cancelled' }, // ignore cancelled bookings so that another user can book the same cancelled slot
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

    // Calculate duration & price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalPrice = tableDoc.hourlyRate * durationHours;

    const booking = new Booking({
      table,
      user,
      startTime,
      endTime,
      hours: durationHours,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      ...(payment && {
        payment: {
          orderId: payment.orderId,
          sessionId: payment.sessionId,
          status: payment.status
        }
      })
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get bookings within a date range
router.get('/', async (req, res) => {
  try {
    const { startTime, endTime } = req.query;

    const bookings = await Booking.find({
      startTime: { $gte: new Date(startTime) },
      endTime: { $lte: new Date(endTime) }
    })
      .populate('table', 'tableNumber hourlyRate')
      .populate('user', 'username');

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Fetch bookings for MyBookings (for a specific user)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId })
      .populate('table', 'tableNumber');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//  Admin: Update a booking's time
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { startTime, endTime } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const tableDoc = await Table.findById(booking.table);
    if (!tableDoc) {
      return res.status(404).json({ message: 'Table not found' });
    }

    // Calculate new price
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationHours = (end - start) / (1000 * 60 * 60);
    const totalPrice = tableDoc.hourlyRate * durationHours;

    booking.startTime = start;
    booking.endTime = end;
    booking.hours = durationHours;
    booking.totalPrice = parseFloat(totalPrice.toFixed(2));

    await booking.save();
    res.json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update booking', error: err.message });
  }
});

// User or Admin: Cancel a booking (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Allow user to cancel only their own booking
    const isAdminUser = req.user.role === 'admin';
    const isOwner = booking.user.toString() === req.user.id;

    if (!isAdminUser && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Prevent cancelling already-cancelled booking
    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    // Update cancellation details
    booking.status = 'cancelled';
    booking.refundStatus = 'pending';
    booking.refundAmount = booking.totalPrice;

    await booking.save();

    res.json({
      message: 'Booking cancelled successfully',
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to cancel booking', error: err.message });
  }
});


export default router;
