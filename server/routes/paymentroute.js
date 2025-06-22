import express from 'express';
import crypto from 'crypto';
import { Cashfree, CFEnvironment } from "cashfree-pg";
import axios from 'axios';

const router = express.Router();

//For older version, (Version<5) my cashfreepg version is cashfree-pg@4.3.10
Cashfree.XClientId = process.env.CASHFREE_CLIENT_ID;
Cashfree.XClientSecret = process.env.CASHFREE_CLIENT_SECRET;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX; //For testing = SANDBOX environment 

function generateOrderId() {
    const uniqueId = crypto.randomUUID(); //generate UUID
    const orderId = uniqueId.replace(/-/g, '_').slice(0, 12); //replace - with _ and slice the length to 12
    return orderId;
}

//Helper function to fetch payment status after creating an order:
async function getPaymentStatusFromCashfree(orderId) {
    try {
        // Use the static method approach consistently
        const res = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        console.log('Payment Status fetched successfully:', res.data);

        const payments = res.data;

        if (payments && payments.length > 0) {
            if (payments.some(txn => txn.payment_status === 'SUCCESS')) {
                return 'SUCCESS';
            } else if (payments.some(txn => txn.payment_status === 'PENDING')) {
                return 'PENDING';
            } else {
                return 'FAILED';
            }
        } else {
            // No payments found yet (order just created)
            return 'NOT_ATTEMPTED';
        }
    } catch (err) {
        console.error('❌ Error fetching payment status:', err.response?.data || err.message);
        return 'UNKNOWN';
    }
}

//Create-Order using cashfree and send the response details to frontend
router.post('/create-order', async (req, res) => {
    const { order_amount, customer_id, customer_phone, customer_email, customer_name } = req.body;
    const orderId = generateOrderId();

    try {
        var request = {
            "order_amount": order_amount,
            "order_currency": "INR",
            "order_id": orderId,
            "customer_details": {
                customer_id,
                customer_phone,
                customer_email,
                customer_name
            },
            "order_meta": {
                "return_url": "https://www.cashfree.com/devstudio/preview/pg/web/checkout?order_id={order_id}"
            }
        };

        const createOrderResponse = await Cashfree.PGCreateOrder("2023-08-01", request);
        console.log('Order Created successfully:', createOrderResponse.data);

        res.json(createOrderResponse.data);
    }
    catch (error) {
        console.error('❌ Order creation error:', error.response?.data || error.message);
        res.status(500).json({ message: "Order creation or status fetch failed" });
    }
});


//Seperate endpoint to fetch payment status
router.post('/check-payment-status/:orderId', async (req, res) => {

    const { orderId } = req.params; // I use req.params since i want extract orderId from the url's :orderId

    try {
        const paymentStatus = await getPaymentStatusFromCashfree(orderId);
        console.log("paymentStatus: ", paymentStatus);

        res.json({ paymentStatus }); //send as object for better usability, frontend will receive like this { paymentStatus: "SUCCESS" }
    }
    catch (error) {
        console.error('❌ Error checking payment status:', error.message);
        res.status(500).json({ message: "Failed to fetch payment status" });
    }

});


export default router;