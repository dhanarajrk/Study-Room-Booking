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

  // Send OTP Function:
  export const sendOTPEmail = async (email, otp) => {
    try {
      await transporter.sendMail({
        from: `"Study Table Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email',
        html: `<p>Your OTP for registration is: <strong>${otp}</strong></p>`,
      });
    } catch (err) {
      console.error('Error sending email:', err);
      throw new Error('Failed to send OTP');
    }
  };


  // Send Invoice Email Function:
  export const sendInvoiceEmail = async (email, invoiceLink) => {
    try {
      await transporter.sendMail({
        from: `"Study Table Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Booking Invoice',
        html: `
          <p>Hi!</p>
          <p>Thank you for your booking with Study Table Booking.</p>
          <p>You can view/download your invoice here:</p>
          <p><a href="${invoiceLink}" target="_blank">${invoiceLink}</a></p>
          <br/>
          <p>Regards,<br/>Study Table Booking Team</p>
        `,
      });
    } catch (err) {
      console.error('Error sending invoice email:', err);
      throw new Error('Failed to send invoice email');
    }
  };
