import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

const router = express.Router();

// Temporary in-memory store for OTPs (In a production app, store this in your database or Redis)
const otpStore = new Map();

// Configure your email sender (Replace with your real email/password later)
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: 'your-email@gmail.com', // ⚠️ REPLACE THIS
        pass: 'your-app-password'     // ⚠️ REPLACE THIS (Use Google App Passwords, not your normal password)
    }
});

// 1. SEND OTP
router.post('/send-otp', (req, res) => {
    const { email } = req.body;

    // Check if user exists
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (results.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = results[0];
        
        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP with an expiration time (e.g., 10 minutes)
        otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });

        // Email Options
        const mailOptions = {
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Educat Password Reset OTP',
            text: `Your OTP for password reset is: ${otp}. It expires in 10 minutes.`
        };

        // Send Email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Email error:", error);
                // For testing purposes, we'll still succeed even if the email fails to send due to bad credentials
                console.log(`[TESTING] Email OTP for ${email} is: ${otp}`); 
            }
        });

        // Simulate SMS (Replace with Twilio logic when you get an account)
        console.log(`[SMS SIMULATION] Sending OTP ${otp} to phone number: ${user.phone_number}`);

        res.status(200).json({ message: 'OTP sent to email and phone.' });
    });
});

// 2. VERIFY OTP
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    const storedData = otpStore.get(email);

    if (!storedData) return res.status(400).json({ message: 'OTP not requested or expired.' });
    if (Date.now() > storedData.expires) {
        otpStore.delete(email);
        return res.status(400).json({ message: 'OTP has expired.' });
    }
    if (storedData.otp !== otp) return res.status(400).json({ message: 'Invalid OTP.' });

    res.status(200).json({ message: 'OTP verified successfully.' });
});

// 3. RESET PASSWORD
router.post('/reset-password', async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const storedData = otpStore.get(email);

    // Double-check OTP just in case
    if (!storedData || storedData.otp !== otp) {
        return res.status(400).json({ message: 'Invalid or expired session.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email], (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error' });
            
            // Clear the OTP so it can't be reused
            otpStore.delete(email);
            res.status(200).json({ message: 'Password reset successfully!' });
        });
    } catch (error) {
        res.status(500).json({ message: 'Error hashing password' });
    }
});

export default router;