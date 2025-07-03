import Booking from '../models/Booking.js';
import cron from 'node-cron';

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    const result = await Booking.updateMany(
      { invoiceLinkExpiresAt: { $lt: now }, invoiceLink: { $exists: true } },
      { $unset: { invoiceLink: "", invoiceLinkExpiresAt: "" } }
    );
    console.log(`🧹 Cleared ${result.modifiedCount} expired invoice links`);
  } catch (err) {
    console.error('❌ Failed to clear expired invoice links:', err);
  }
});
