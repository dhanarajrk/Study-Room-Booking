import express from 'express';
import Booking from '../models/Booking.js';
//import crypto from 'crypto';

const router = express.Router();

//THIS REFUND WEBHOOK ENDPOINT WILL TRIGGER AUTOMATICALLY WHEN AN ORDER REFUND IS INITIATED when CLICKED CANCEL ORDER BUTTON.
//For every cancel order, this will run in parallel to keep track of the status sent by CashFree to our webhook url to get accurate status
router.post('/cashfree/webhook', express.json({ type: 'application/json' }), async (req, res) => {
    try {
        // ⛔ Signature verification skipped for testing!
        // const signature = req.headers['x-webhook-signature'];
        // const payload = JSON.stringify(req.body);
        // const secret = process.env.CASHFREE_CLIENT_SECRET;

        // const expectedSignature = crypto
        //   .createHmac('sha256', secret)
        //   .update(payload)
        //   .digest('base64');

        // if (signature !== expectedSignature) {
        //   console.warn('❌ Invalid webhook signature!');
        //   return res.status(400).send('Invalid signature');
        // }

        const { type, data } = req.body;

        if (type === 'REFUND_STATUS_WEBHOOK' && data?.refund) {
            const refundData = data.refund;
            const { order_id, refund_id, refund_status } = refundData;

            const booking = await Booking.findOne({
                'payment.orderId': order_id,
                refundId: refund_id
            });

            if (booking) {
                booking.refundStatus = refund_status;
                await booking.save();
                console.log(`✅ Updated booking ${booking._id} to refundStatus: ${refund_status}`);
            } else {
                console.warn(`⚠️ Booking not found for order: ${order_id}, refund: ${refund_id}`);
            }
        }

        res.status(200).send('Webhook received');

    } catch (err) {
        console.error('❌ Error handling webhook:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
