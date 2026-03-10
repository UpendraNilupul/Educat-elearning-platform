import express from 'express';
import db from '../db.js'; 

const router = express.Router();

// POST /api/register
router.post('/register', (req, res) => {
    const { name, email, password, phoneNumber, address, dob, gender, role } = req.body;

    
    if (!name || !email || !password || !phoneNumber || !dob || !gender || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    
    const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
    db.query(checkEmailQuery, [email], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err });

        if (results.length > 0) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        
        const insertQuery = `
            INSERT INTO users (name, email, password, phoneNumber, address, dob, gender, role)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertQuery, [name, email, password, phoneNumber, address, dob, gender, role], (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed to register user.', error: err });

            res.status(201).json({ message: 'User registered successfully!' });
        });
    });
});

export default router;