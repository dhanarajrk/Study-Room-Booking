import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'],
      },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email address'],
      },
    password: { type: String, required: true },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,    
      },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
    bookings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Booking' }],
    isVerified: { type: Boolean, default: false },
    otp: String,
    otpExpiry: Date,
});

//Hash password pre saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next(); //if old password is unchanged skip hashing & move to next middleware operation
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

export default mongoose.model("User", userSchema);