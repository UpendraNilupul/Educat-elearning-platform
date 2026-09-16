import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import dns from 'dns';
import twilio from 'twilio';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import util from 'util';

if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// 🌟 THE FIX: Prevent SMS Spam / DDoS attacks
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 OTP requests per window
    message: { message: "Too many password reset attempts from this IP. Please try again after 15 minutes." }
});

// 1. Configure Email Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    lookup: (hostname, options, callback) => dns.lookup(hostname, { family: 4 }, callback),
    auth: {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '',
        pass: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '',
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// 2. Configure Twilio Client
const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// --- 1. SEND OTP ---
router.post('/send-otp', otpLimiter, async (req, res) => {
    const { email } = req.body;

    try {
        const users = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = users[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // 🌟 THE FIX: Save OTP securely to the Database (Expires in 10 mins)
        await query(`
            INSERT INTO password_resets (email, otp, expires_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
            ON DUPLICATE KEY UPDATE otp = VALUES(otp), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
        `, [email, otp]);

        // A. Send via Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Educat Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.error("Email error:", error);
            else console.log(`Email sent: ${info.response}`);
        });

        // B. Send via SMS (Twilio)
        if (user.phone_number) {
            twilioClient.messages.create({
                body: `Your Educat password reset OTP is: ${otp}`,
                from: process.env.TWILIO_PHONE,
                to: user.phone_number 
            })
            .then(message => console.log("SMS sent successfully, SID:", message.sid))
            .catch(smsErr => console.error("Twilio SMS error:", smsErr));
        }

        res.status(200).json({ message: 'OTP sent to email and phone.' });

    } catch (error) {
        console.error("Error sending OTP:", error);
        res.status(500).json({ message: 'Server error processing request.' });
    }
});

// --- 2. VERIFY OTP ---
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    try {
        // 🌟 THE FIX: Fetch from database instead of memory Map
        const results = await query('SELECT otp, expires_at FROM password_resets WHERE email = ?', [email]);
        
        if (results.length === 0) {
            return res.status(400).json({ message: 'OTP not requested or has expired.' });
        }

        const storedData = results[0];

        // Check Expiration
        if (new Date() > new Date(storedData.expires_at)) {
            await query('DELETE FROM password_resets WHERE email = ?', [email]); // Clean up expired OTP
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Check Match
        if (storedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        res.status(200).json({ message: 'OTP verified successfully.' });

    } catch (error) {
        console.error("Error verifying OTP:", error);
        res.status(500).json({ message: 'Server error verifying OTP.' });
    }
});

// --- 3. RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        // 🌟 THE FIX: Verify Database one last time before changing password
        const results = await query('SELECT otp, expires_at FROM password_resets WHERE email = ?', [email]);

        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired session.' });
        }

        const storedData = results[0];

        if (new Date() > new Date(storedData.expires_at) || storedData.otp !== otp) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // Hash and Update Password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
        
        // Clean up the used OTP so it can't be reused
        await query('DELETE FROM password_resets WHERE email = ?', [email]);
        
        res.status(200).json({ message: 'Password reset successfully!' });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: 'Server error resetting password.' });
    }
});

export default router;