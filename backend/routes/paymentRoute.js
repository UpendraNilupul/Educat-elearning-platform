import express from 'express';
import crypto from 'crypto';
import db from '../db.js'; 
import util from 'util';

const query = util.promisify(db.query).bind(db);
const router = express.Router();

// 1. ROUTE TO GENERATE HASH
router.post('/payment/generate-hash', (req, res) => {
    const { order_id, amount, currency } = req.body;

    const merchant_id = '1234834'; 
    // 🌟 METHANA THIYENA SECRET EKA
    const merchantSecret = 'MTM4MDI1MTA5MDIzNTk2OTY3MjcyNDYwNjMzODc3MzQ4ODk0MDA5Nw=='; 

    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(amount).toFixed(2);

    const hash = crypto.createHash('md5').update(
        merchant_id + order_id + amountFormatted + currency + hashedSecret
    ).digest('hex').toUpperCase();

    res.status(200).json({ hash: hash });
});

// 2. ROUTE FOR PAYHERE WEBHOOK
router.post('/payment/notify', async (req, res) => {
    console.log("🚨 PAYHERE EKEN MESSAGE EKAK AAWA!");
    
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = req.body || {};

    // 🌟 UDATH EKKA MATCH WENNA METHANATATH E SECRET EKAMA DAMMA
    const merchantSecret = 'MTM4MDI1MTA5MDIzNTk2OTY3MjcyNDYwNjMzODc3MzQ4ODk0MDA5Nw=='; 
    const hashedSecret = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const amountFormatted = parseFloat(payhere_amount).toFixed(2);
    
    const localMd5sig = crypto.createHash('md5').update(
        merchant_id + order_id + amountFormatted + payhere_currency + status_code + hashedSecret
    ).digest('hex').toUpperCase();

    if (localMd5sig === md5sig) {
        if (status_code === '2' || status_code === 2) {
            const [classId, moduleId, userId, timestamp] = order_id.split('_');

            try {
                const studentData = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
                
                if (studentData.length > 0) {
                    const actualStudentId = studentData[0].id;

                    await query(`
                        INSERT INTO payments (invoice_link, amount, status, c_id, s_id) 
                        VALUES (?, ?, 'completed', ?, ?)
                    `, [order_id, payhere_amount, classId, actualStudentId]);

                    console.log("✅ Payment Saved to DB Successfully! Class Unlocked.");
                    res.status(200).send("OK"); 
                } else {
                    console.error("❌ ERROR: Me user_id ekata galapena Student kenek database eke naha:", userId);
                    res.status(500).send("Student Not Found");
                }
            } catch (error) {
                console.error("❌ DB Error during payment save:", error);
                res.status(500).send("DB Error");
            }
        } else {
            console.log("⚠️ Payment not successful. Status:", status_code);
            res.status(200).send("Ignored"); 
        }
    } else {
        console.log("❌ Hash mismatch! Fake request detected.");
        res.status(400).send("Hash mismatch");
    }
});

export default router;