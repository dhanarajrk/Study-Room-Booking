/*  //This file was used for testing only, I no longer implement this instead i use paymentroute.js 

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Cashfree Configuration
const CASHFREE_CONFIG = {
  BASE_URL: 'https://sandbox.cashfree.com/pg', // Sandbox URL
  API_VERSION: '2023-08-01',
  CLIENT_ID: process.env.CASHFREE_CLIENT_ID || 'your_client_id_here',
  CLIENT_SECRET: process.env.CASHFREE_CLIENT_SECRET || 'your_client_secret_here'
};

// Create Order Route
router.post('/create-order', async (req, res) => {
  console.log('Incoming request body:', req.body);
  try {
    const {
      order_amount,
      order_currency = 'INR',
      customer_id,
      customer_phone,
      customer_email,
      customer_name
    } = req.body;

    // Validate required fields
    if (!order_amount || !customer_id || !customer_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_amount, customer_id, customer_phone'
      });
    }

    // Generate unique order ID
    const order_id = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Prepare order data
    const orderData = {
      order_id: order_id,
      order_amount: parseFloat(order_amount),
      order_currency: order_currency,
      customer_details: {
        customer_id: customer_id,
        customer_phone: customer_phone,
        ...(customer_email && { customer_email }),
        ...(customer_name && { customer_name })
      }
    };



    // Make request to Cashfree API
    const response = await axios.post(
      `${CASHFREE_CONFIG.BASE_URL}/orders`,
      orderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': CASHFREE_CONFIG.API_VERSION,
          'x-client-id': CASHFREE_CONFIG.CLIENT_ID,
          'x-client-secret': CASHFREE_CONFIG.CLIENT_SECRET
        }
      }
    );

    // Success response
    res.status(200).json({
      success: true,
      message: 'Order created successfully',
      data: response.data
    });

  } catch (error) {
    console.error('Cashfree API Error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response) {
      // API returned an error response
      res.status(error.response.status).json({
        success: false,
        error: 'Cashfree API Error',
        details: error.response.data
      });
    } else if (error.request) {
      // Network error
      res.status(500).json({
        success: false,
        error: 'Network error while connecting to Cashfree'
      });
    } else {
      // Other errors
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    }
  }
});

export default router;

*/