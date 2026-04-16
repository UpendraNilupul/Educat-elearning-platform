import { Router } from 'express';
import { createHash } from 'crypto';
const router = Router();

// 🔴 REPLACE THESE WITH YOUR ACTUAL PAYHERE KEYS
// (In a real production app, keep these safely inside a .env file)
const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID; 
const MERCHANT_SECRET = process.env.PAYHERE_SECRET;

// ==========================================
// 1. GENERATE PAYMENT HASH API
// ==========================================
// This route creates a secure MD5 hash so the payment amount cannot be tampered with.
router.post('/api/student/pay/hash', (req, res) => {
    const { order_id, amount, currency } = req.body;

    // PayHere requires the amount to be formatted to exactly 2 decimal places (e.g., 2000.00)
    const formattedAmount = parseFloat(amount).toFixed(2);

    // Step 1: Generate an MD5 hash of the Merchant Secret and convert it to Uppercase
    const hashedSecret = createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
    
    // Step 2: Concatenate the required parameters
    const hashString = `${MERCHANT_ID}${order_id}${formattedAmount}${currency}${hashedSecret}`;
    
    // Step 3: Generate the final MD5 hash
    const finalHash = createHash('md5').update(hashString).digest('hex').toUpperCase();

    // Send the generated hash back to the React frontend
    res.json({ hash: finalHash });
});

// ==========================================
// 2. PAYHERE WEBHOOK (NOTIFY API)
// ==========================================
// PayHere will silently call this route in the background when a payment is successful.
router.post('/api/student/pay/notify', (req, res) => {
    // Extract data sent by PayHere
    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = req.body;

    // Security Check: Verify that this request actually came from PayHere
    const hashedSecret = createHash('md5').update(MERCHANT_SECRET).digest('hex').toUpperCase();
    const hashString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
    const expectedMd5sig = createHash('md5').update(hashString).digest('hex').toUpperCase();

    // status_code '2' means "Payment Success"
    if (md5sig === expectedMd5sig && status_code === '2') {
        console.log(`Payment successful for Order ID: ${order_id}`);
        
        // 🌟 UPDATE YOUR DATABASE HERE 🌟
        // Example: Update the 'payments' table to mark this class as paid
        // db.query('UPDATE payments SET isPaid = true WHERE order_id = ?', [order_id]);
        
        // Send a 200 OK response to let PayHere know we received the message successfully
        res.status(200).send('OK'); 
    } else {
        console.error('Payment verification failed or payment was not successful!');
        // Send a 400 Bad Request response if verification fails
        res.status(400).send('Verification Failed');
    }
});

export default router;