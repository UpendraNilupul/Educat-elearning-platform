import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import twilio from 'twilio';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import util from 'util';
import { sendOtpEmail } from '../emailService.js';

dotenv.config();

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// Ensure password_resets table exists
(async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL UNIQUE,
                otp VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        console.error("Failed to ensure password_resets table exists:", e);
    }
})();

// Prevent SMS/Email Spam / DDoS attacks
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 OTP requests per window
    message: { success: false, message: "Too many password reset attempts. Please try again after 15 minutes." }
});

// Configure Twilio Client safely (optional)
let twilioClient = null;
if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_SID.startsWith('AC')) {
    try {
        twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    } catch (err) {
        console.warn("Twilio client initialization failed:", err.message);
    }
}

// --- 1. SEND OTP ---
router.post('/send-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    try {
        // Step 1: Verify the email exists in the users table
        const users = await query('SELECT * FROM users WHERE email = ?', [email.trim()]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found with this email address.' });
        }

        const user = users[0];

        // Step 2: Generate a 6-digit OTP code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Step 3: Store the OTP and expiry in the database (10 min expiry)
        await query(`
            INSERT INTO password_resets (email, otp, expires_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        `, [email.trim(), otp]);

        // Step 4: Call await sendOtpEmail(email, otp)
        await sendOtpEmail(email.trim(), otp);

        // Optional SMS via Twilio if available
        if (twilioClient && user.phone_number && process.env.TWILIO_PHONE) {
            twilioClient.messages.create({
                body: `Your Educat password reset OTP is: ${otp}. It expires in 10 minutes.`,
                from: process.env.TWILIO_PHONE,
                to: user.phone_number 
            })
            .then(message => console.log("SMS sent successfully, SID:", message.sid))
            .catch(smsErr => console.error("Twilio SMS error (non-fatal):", smsErr.message));
        }

        // Step 5: Return status 200 with { success: true, message: "OTP sent to your email address" }
        return res.status(200).json({ success: true, message: "OTP sent to your email address" });

    } catch (error) {
        console.error("Error sending OTP / processing password reset:", error.response?.body || error.message || error);
        return res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error processing password reset request.' 
        });
    }
});

// --- 2. VERIFY OTP ---
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    try {
        const results = await query('SELECT otp, expires_at FROM password_resets WHERE email = ?', [email.trim()]);
        
        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'OTP not requested or has expired.' });
        }

        const storedData = results[0];

        // Check Expiration
        if (new Date() > new Date(storedData.expires_at)) {
            await query('DELETE FROM password_resets WHERE email = ?', [email.trim()]);
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        // Check Match
        if (String(storedData.otp).trim() !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }

        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).json({ success: false, message: 'Server error verifying OTP.' });
    }
});

// --- 3. RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required.' });
    }

    try {
        const results = await query('SELECT otp, expires_at FROM password_resets WHERE email = ?', [email.trim()]);

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset session.' });
        }

        const storedData = results[0];

        if (new Date() > new Date(storedData.expires_at) || String(storedData.otp).trim() !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        // Hash and Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email.trim()]);
        
        // Clean up the used OTP so it cannot be reused
        await query('DELETE FROM password_resets WHERE email = ?', [email.trim()]);
        
        return res.status(200).json({ success: true, message: 'Password reset successfully!' });

    } catch (error) {
        console.error("Error resetting password:", error);
        return res.status(500).json({ success: false, message: 'Server error resetting password.' });
    }
});

export default router;