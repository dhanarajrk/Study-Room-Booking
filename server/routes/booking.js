import express from 'express';
import Booking from '../models/Booking.js';
import Table from '../models/Table.js';
import { authenticate, isAdmin } from '../middleware/auth.js';
import axios from 'axios';

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

    // Update cancellation details (soft update)
    booking.status = 'cancelled';
    booking.refundStatus = 'pending';
    booking.refundAmount = parseFloat((booking.totalPrice * 0.75).toFixed(2)); //deduct 25% from totalPrice for partial refund

    const refundId = `refund_${Date.now()}`; //I use presnt date to create a unique refundId
    booking.refundId = refundId; // Save for later status check in GET refund API

    await booking.save();

    //TRIGGER Create-Refund API call: (I reffered to their offical Docs)
    const createRefundResponse = await axios.post(
      `https://sandbox.cashfree.com/pg/orders/${booking.payment.orderId}/refunds`,
      {
        refund_amount: booking.refundAmount,
        refund_id: refundId,
        refund_note: 'User cancelled booking',
        refund_speed: 'STANDARD', //Can also use 'INSTANT' for now CashFree accepts only STANDARD for testing which takes 1-2hrs to processs the refund 
      },
      {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Refund created:', createRefundResponse.data);
    booking.refundStatus = createRefundResponse.data.refund_status; //(not a soft update, this is accurate update after create refund API response)
    await booking.save();


    //TRIGGER GET Refund Status for refund status verification (to fetch verified refund status)
    //This is useful only for Manual Refund status checking.
    //Note: Since we create refund_speed: 'STANDARD' ,we may not get refund status since it will take 1-2hrs to reflect the accurate refund status.
    //Below refund verification can be removed as immediately calling refund verification is not that useful.
    //So, I implemented Webhooks in webhookRoutes.js to get updated refund_stauts through my ngrok tunnel url set to my local host 5000 which i have set up. Open cmd and typ 'ngrok http 5000' to start ngrok server (5000 is my backend localhost PORT) 
    //using this webhooks response, I can get updated refund_status from cashfree server and get notified and received in my ngrok tunnel url then I can now accurately set refund_status in my database
    const refundStatusResponse = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${booking.payment.orderId}/refunds/${booking.refundId}`,
      {
        headers: {
          'x-api-version': '2023-08-01',
          'x-client-id': process.env.CASHFREE_CLIENT_ID,
          'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
        },
      }
    );
  
    //console.log('🔄 Refund status after fetch:', refundStatusResponse.data.refund_status);
    booking.refundStatus = refundStatusResponse.data.refund_status; //reupdate database refundStatus
    await booking.save();
    console.log('✅ booking.refundStatus saved as:', booking.refundStatus);

    //This res.json is optional. I actually send this to frontend for debugging purpose (but not actually implement/use these data in frontend)
    res.json({
      message: 'Booking cancelled successfully',
      orderId: booking.payment.orderId,
      refundStatus: booking.refundStatus,
      refundAmount: booking.refundAmount,
      refundId,
    });
  } catch (err) {
    console.error('❌ Booking cancellation/refund error:', err.response?.data || err);
    res.status(500).json({ message: 'Failed to cancel booking', error: err.message });
  }
});


export default router;
