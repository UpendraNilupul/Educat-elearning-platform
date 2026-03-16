import express from 'express';
import db from '../db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // 🌟 UPDATED: Join the roles table to get the string role_name instead of just role_id
    const query = `
        SELECT users.*, roles.role_name 
        FROM users 
        JOIN roles ON users.role_id = roles.id 
        WHERE users.email = ?
    `;
    
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Save session data using the newly joined role_name
        req.session.userId = user.id;
        req.session.userRole = user.role_name; 
        req.session.userName = user.name;
        
        res.status(200).json({ 
            message: 'Logged in successfully!', 
            userId: user.id, 
            userRole: user.role_name, 
            userName: user.name
        });
    });
});

router.get('/status', (req, res) => {
    if (req.session.userRole) {
        res.json({ 
            isLoggedIn: true, 
            userRole: req.session.userRole,
            userName: req.session.userName
        });
    } else {
        res.json({ 
            isLoggedIn: false, 
            userRole: null,
            userName: null
        });
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