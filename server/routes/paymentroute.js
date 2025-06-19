import express from 'express';
import { Cashfree } from "cashfree-pg";

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


router.post('/create-order', async (req, res) => {  //can write any name (there is no fixed route name)

    const { order_amount, customer_id, customer_phone, customer_email, customer_name } = req.body; //user details from frontend that made the payment 

    const orderId = generateOrderId(); //Generate a unique Order ID to create new order

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

        Cashfree.PGCreateOrder("2023-08-01", request).then((response) => {
            console.log('Order Created successfully:', response.data)
            res.json(response.data);
        })
        .catch((error) => {
            console.error('Error:', error.response.data.message);
        });

    }
    catch (error) {
        console.log(error);
    }
})

export default router;