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
        const sqlQuery = `
            SELECT users.*, roles.role_name 
            FROM users 
            JOIN roles ON users.role_id = roles.id 
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

        // Save session data
        req.session.userId = user.id;
        req.session.userRole = user.role_name; 
        req.session.userName = user.name;
        
        res.status(200).json({ 
            message: 'Logged in successfully!', 
            userId: user.id, 
            userRole: user.role_name, 
            userName: user.name
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
            userRole: req.session.userRole,
            userName: req.session.userName
        });
    } else {
        res.json({ isLoggedIn: false, userRole: null, userName: null });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ message: 'Could not log out.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Logged out successfully' });
    });
});

export default router;