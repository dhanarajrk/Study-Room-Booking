import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // or your SMTP provider
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  export const sendOTPEmail = async (email, otp) => {
    try {
      await transporter.sendMail({
        from: `"Library Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Your OTP for registration is: <strong>${otp}</strong></p>`,
      });
    } catch (err) {
      console.error('Error sending email:', err);
      throw new Error('Failed to send OTP');
    }
  };