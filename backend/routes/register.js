import express from 'express';
import db from '../db.js'; 
import bcrypt from 'bcryptjs';
import util from 'util';

const router = express.Router();
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

        // 4. Insert the new user into the core USERS table
        const insertUserQuery = `
            INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        const userResult = await query(insertUserQuery, [name, email, hashedPassword, phoneNumber, address, dob, gender, roleId]);

        // 🌟 5. NEW: Grab their brand new ID and assign them to their specific profile table!
        const newUserId = userResult.insertId; // This grabs the ID MySQL just generated

        if (role === 'student') {
            await query('INSERT INTO students (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'teacher') {
            await query('INSERT INTO teachers (user_id) VALUES (?)', [newUserId]);
        }

        res.status(201).json({ 
            message: 'User registered successfully!',
            userId: newUserId,
            userRole: role,
            userName: name
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

export default router;