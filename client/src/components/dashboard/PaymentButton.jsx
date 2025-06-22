import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { load } from '@cashfreepayments/cashfree-js';

let cashfree; // keep top-level SDK reference, as it will be used in handlePayment function

export default function PaymentButton({ user, totalAmount, onBookingSuccess }) {
  const [sdkReady, setSdkReady] = useState(false);

  // Load SDK inside useEffect only once for safe and prevent double call
  useEffect(() => {
    var initializeSDK = async function () {
      try {
        cashfree = await load({ mode: 'sandbox' });
        setSdkReady(true);
      } catch (error) {
        console.error('❌ Failed to load Cashfree SDK:', error);
        toast.error('Failed to load payment SDK');
      }
    };
    initializeSDK();
  }, []);

  const handlePayment = async () => {
    if (!sdkReady || !cashfree) {
      toast.error('Payment SDK not ready');
      return;
    }

    try {
        //send these user details to paymentroute.js in backend and store response in {data}
      const { data } = await axios.post('http://localhost:5000/api/payments/create-order', {
        order_amount: totalAmount,
        customer_id: user.email.replace(/[^a-zA-Z0-9_-]/g, '_'),
        customer_phone: user.phoneNumber,
        customer_email: user.email,
        customer_name: user.name,
      });

      const paymentSessionId = data?.payment_session_id;
      if (!paymentSessionId) {
        toast.error('Invalid session ID');
        return;
      }

      //console.log("PaymentButton received create-order data:", data);

      //checkoutOptions format as given in cashfree offical docs
      const checkoutOptions = {
        paymentSessionId,
        redirectTarget: '_modal' // '_modal'=pop up checkout  or '_self' = new page checkout
      };
      await cashfree.checkout(checkoutOptions);

      //After cashfree.checkout we can't actually know if the Create-order is done successfully or not
      //So, fetch payment status using Cashfree.PGOrderFetchPayments("2023-08-01", orderId) in backend for verification using orderId:
      const paymentStatusResponse = await axios.post(`http://localhost:5000/api/payments/check-payment-status/${data.order_id}`);
      console.log("Payment status response received after checking:", paymentStatusResponse);

      const payment_status = paymentStatusResponse.data.paymentStatus; //extract the status string and pass in onBookingSuccess() status prop below

      toast.success('Payment successful!');
      if (onBookingSuccess){
        onBookingSuccess({orderId: data.order_id, sessionId: data.payment_session_id, status: payment_status});
      }                  //these details are passed as (payment) in <PaymentButton onBookingSuccess={async (payment) => {await submitBooking(user._id, payment);} />

    } catch (error) {
      console.error('❌ Payment Error:', error);
      toast.error('Payment failed. Try again.');
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={!sdkReady}
      className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
    >
      Pay ₹{totalAmount}
    </button>
  );
}
