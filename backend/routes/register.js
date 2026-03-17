import express from 'express';
import db from '../db.js'; 
import bcrypt from 'bcryptjs';
import util from 'util';

const router = express.Router();
// Promisify the database query to escape "callback hell"
const query = util.promisify(db.query).bind(db);

router.post('/register', async (req, res) => {
    const { name, email, password, phoneNumber, address, dob, gender, role } = req.body;
    
    if (!name || !email || !password || !phoneNumber || !dob || !gender || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // 1. Find the role_id 
        const roleResults = await query('SELECT id FROM roles WHERE role_name = ?', [role]);
        if (roleResults.length === 0) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }
        const roleId = roleResults[0].id;

        // 2. Check if the email already exists
        const existingUsers = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        // 3. Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Insert the new user
        const insertQuery = `
            INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        await query(insertQuery, [name, email, hashedPassword, phoneNumber, address, dob, gender, roleId]);

        res.status(201).json({ message: 'User registered successfully!' });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

export default router;