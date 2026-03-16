import express from 'express';
import db from '../db.js'; 
import bcrypt from 'bcryptjs'; // 🌟 Added bcrypt for secure passwords

const router = express.Router();

router.post('/register', (req, res) => {
    const { name, email, password, phoneNumber, address, dob, gender, role } = req.body;
    
    if (!name || !email || !password || !phoneNumber || !dob || !gender || !role) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    // 1. Find the role_id from the roles table based on the string (e.g., 'student')
    const getRoleQuery = 'SELECT id FROM roles WHERE role_name = ?';
    db.query(getRoleQuery, [role], (err, roleResults) => {
        if (err) return res.status(500).json({ message: 'Database error.', error: err });
        
        if (roleResults.length === 0) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }
        
        const roleId = roleResults[0].id;

        // 2. Check if the email already exists
        const checkEmailQuery = 'SELECT * FROM users WHERE email = ?';
        db.query(checkEmailQuery, [email], async (err, results) => {
            if (err) return res.status(500).json({ message: 'Database error.', error: err });

            if (results.length > 0) {
                return res.status(400).json({ message: 'Email is already registered.' });
            }

            // 3. Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);

            // 4. Insert the new user with role_id and CURDATE() for join_date
            const insertQuery = `
                INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
            `;

            db.query(insertQuery, [name, email, hashedPassword, phoneNumber, address, dob, gender, roleId], (err, result) => {
                if (err) {
                    console.error('Registration error:', err);
                    return res.status(500).json({ message: 'Failed to register user.', error: err });
                }

                res.status(201).json({ message: 'User registered successfully!' });
            });
        });
    });
});

export default router;