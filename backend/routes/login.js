import express from 'express';
import db from '../db.js'; // IMPORTANT: Added .js extension
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    const query = 'SELECT * FROM users WHERE email = ?'; // Changed to SELECT * to get the whole user object
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

        
        req.session.userId = user.id;
        req.session.userRole = user.role;
        res.status(200).json({ message: 'Logged in successfully!', userId: user.id, userRole: user.role});
    });
});

router.get('/status', (req, res) => {
    if (req.session.userRole) {
        res.json({ 
            isLoggedIn: true, 
            userRole: req.session.userRole 
        });
    } else {
        res.json({ 
            isLoggedIn: false, 
            userRole: null 
        });
    }
});

export default router; // IMPORTANT: Replaced module.exports with ES export