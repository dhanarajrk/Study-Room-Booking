import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { sendOTPEmail } from '../utils/emailService.js';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { getAdminMetrics } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();


//Register route
router.post('/register', async (req, res) => {
    const { username, email, password, role, phoneNumber } = req.body;

    // Validate phone number BEFORE try (using libphonenumber-js npm)
    if (phoneNumber) {
        const phoneNumberObj = parsePhoneNumberFromString(phoneNumber);
        if (!phoneNumberObj || !phoneNumberObj.isValid()) {
            return res.status(400).json({ message: 'Invalid phone number format' });
        }
    }

    try {
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            if (existingUser.isVerified) {
                // User already verified, block registration
                return res.status(400).json({ message: 'User already exists' });
            } else {
                // User exists but NOT verified → resend OTP
                const otp = generateOTP();
                const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins from now

                existingUser.otp = otp;
                existingUser.otpExpiry = otpExpiry;

                await existingUser.save();
                await sendOTPEmail(email, otp);

                return res.status(200).json({ message: 'OTP resent to your email', email });
            }
        }

        // If user doesn't exist → create new
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 mins

        const user = new User({ username, email, password, phoneNumber, role, otp, otpExpiry });
        await user.save();
        await sendOTPEmail(email, otp);

        res.status(201).json({ message: 'OTP sent to your email', email });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//OTP Verification Route
router.post('/verify-otp', async (req, res) => {
    console.log('Entered email and otp:', req.body);
    const { email, otp } = req.body; //get entered otp by user

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email already verified' });
        }

        if (user.otp !== otp || user.otpExpiry < new Date()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        user.isVerified = true; //mark veririfed
        user.otp = undefined;   //once the user is verified clear his otp record
        user.otpExpiry = undefined;
        await user.save();

        // Include userid, email, username in JWT payload
        const token = jwt.sign({ 
            id: user._id, 
            email: user.email, 
            username: user.username,
            role: user.role 
        }, process.env.JWT_SECRET, { expiresIn: '12h' });
        
        res.json({ message: 'Email verified successfully', user, token, });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

//Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        if (!user.isVerified) return res.status(403).json({ message: 'Email not verified. Please verify first.' });

         // Include userid, email, username in JWT payload
        const token = jwt.sign({ 
            id: user._id, 
            email: user.email, 
            username: user.username,
            role: user.role 
        }, process.env.JWT_SECRET, { expiresIn: '12h' });
        
        res.json({
            message: `${user.email} logged in successfully`,
            user: { _id: user._id, username: user.username, email: user.email, role: user.role, phoneNumber: user.phoneNumber },
            token
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});


//Admin Metrics Route
router.get('/admin-metrics', authenticate, isAdmin, getAdminMetrics); //This is another clean way to trigger a function from another file when the route path is entered

export default router;