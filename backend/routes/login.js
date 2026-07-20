import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // 1. Find the user (Include 2fa_enabled)
        const sqlQuery = `
            SELECT users.*, roles.role_name, teachers.verification_status, admins.admin_level 
            FROM users 
            JOIN roles ON users.role_id = roles.id 
            LEFT JOIN teachers ON users.id = teachers.user_id
            LEFT JOIN admins ON users.id = admins.user_id
            WHERE users.email = ?
        `;
        const results = await query(sqlQuery, [email]);

        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // 🌟 THE FIX: Intercept the login if 2FA is enabled!
        if (user['2fa_enabled']) {
            // DO NOT set the session yet. Tell the frontend to show the OTP screen.
            // (You would also trigger your Twilio/Nodemailer function here to send the code)
            return res.status(200).json({ 
                requires2FA: true, 
                userId: user.id,
                message: '2FA code sent to your device.' 
            });
        }

        // 3. Log the activity & Save Session (Normal Login)
        await query('INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', [user.id, 'login']);

        const normalizedRole = String(user.role_name || '').toLowerCase().trim();

        req.session.userId = user.id;
        req.session.userRole = normalizedRole; 
        req.session.userName = user.name;
        req.session.adminLevel = user.admin_level || null;
        req.session.userPicture = user.picture;

        // Initialize session roles and store role-specific details for tab isolation on localhost
        req.session.roles = req.session.roles || {};
        req.session.roles[normalizedRole] = {
            userId: user.id,
            userRole: normalizedRole,
            userName: user.name,
            adminLevel: user.admin_level || null,
            userPicture: user.picture
        };
        
        res.status(200).json({ 
            message: 'Logged in successfully!', 
            userId: user.id, 
            userRole: normalizedRole, 
            adminLevel: user.admin_level || null,
            userName: user.name,
            userPicture: user.picture,
            verificationStatus: user.verification_status || null
        });

    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

router.get('/status', (req, res) => {
    if (req.session.userRole) {
        res.json({ 
            isLoggedIn: true, 
            userId: req.session.userId,
            userRole: req.session.userRole,
            adminLevel: req.session.adminLevel || null,
            userName: req.session.userName,
            userPicture: req.session.userPicture
        });
    } else {
        res.json({ isLoggedIn: false, userId: null, userRole: null, adminLevel: null, userName: null });
    }
});

router.post('/logout', async (req, res) => {
    if (req.session && req.session.userId) {
        try {
            await query(
                'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
                [req.session.userId, 'logout']
            );
        } catch (logError) {
            console.error('Non-critical error: Failed to log logout activity:', logError);
        }
    }

    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

export default router;