import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  hours: { type: Number, required: true },
  totalPrice: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  refundStatus: { type: String, default: 'none' },
  refundAmount: { type: Number, default: 0 },
  refundId: { type: String, default: null },

  payment: {
    orderId: { type: String },           
    sessionId: { type: String },    
    status: { type: String, default: 'PENDING' } 
  },

  manualBookedUser: {
    username: String,
    email: String,
    phone: String
  },

  invoiceLink: { type: String },
  invoiceLinkExpiresAt: { type: Date },
  
}, { timestamps: true });

//Add index for efficient conflict checking (1 represents sorting in ascending for efficient search)
bookingSchema.index({ table: 1, startTime: 1, endTime: 1 });

export default mongoose.model('Booking', bookingSchema);