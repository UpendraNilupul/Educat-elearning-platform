import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Temporary in-memory store for OTPs
const otpStore = new Map();

// 1. Configure Email Transporter using Environment Variables
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// 2. Configure Twilio Client
const twilioClient = new twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// --- 1. SEND OTP ---
router.post('/send-otp', (req, res) => {
    const { email } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with 10-minute expiration
        otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });

        // A. Send via Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Educat Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email error:", error);
            } else {
                console.log(`Email sent: ${info.response}`);
            }
        });

        // B. Send via SMS (Twilio)
        // Note: user.phone_number must be in E.164 format (e.g., +94760500141)
        twilioClient.messages.create({
            body: `Your Educat password reset OTP is: ${otp}`,
            from: process.env.TWILIO_PHONE,
            to: user.phone_number 
        })
        .then(message => console.log("SMS sent successfully, SID:", message.sid))
        .catch(smsErr => console.error("Twilio SMS error:", smsErr));

        res.status(200).json({ message: 'OTP sent to email and phone.' });
    });
});

// --- 2. VERIFY OTP ---
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) return res.status(400).json({ message: 'OTP not requested or expired.' });
    
    if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'OTP has expired.' });
    }

    if (storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP.' });
    }

    res.status(200).json({ message: 'OTP verified successfully.' });
});

// --- 3. RESET PASSWORD ---
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData || storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid or expired session.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            
            otpStore.delete(email);
            res.status(200).json({ message: 'Password reset successfully!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

export default router;