import express from 'express';
import db from '../db.js'; 
import bcrypt from 'bcryptjs';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// Helper function to generate the Code (e.g., SCKA000234)
const generateUserCode = (role, province, district, specificId) => {
    // 1. Role Prefix (S or T)
    const rolePrefix = role === 'student' ? 'S' : 'T';
    
    // 2. Province First Letter 
    const provLetter = (province && province.length > 0) ? province.charAt(0).toUpperCase() : 'X';
    
    // 3. District First Two Letters 
    const distLetters = (district && district.length >= 2) ? district.substring(0, 2).toUpperCase() : 'XX';
    
    // 4. Pad the ID with leading zeros to make it 6 digits
    const paddedId = String(specificId).padStart(6, '0');
    
    // Combine them all
    return `${rolePrefix}${provLetter}${distLetters}${paddedId}`;
};

router.post('/register', async (req, res) => {
    // 🌟 ADDED province and district to the destructured body
    const { name, email, password, phoneNumber, address, dob, gender, role, province, district } = req.body;
    
    // Updated validation to require the new location fields
    if (!name || !email || !password || !phoneNumber || !dob || !gender || !role || !province || !district) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const roleResults = await query('SELECT id FROM roles WHERE role_name = ?', [role]);
        if (roleResults.length === 0) {
            return res.status(400).json({ message: 'Invalid role selected.' });
        }
        const roleId = roleResults[0].id;

        const existingUsers = await query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Insert the new user into the core USERS table
        const insertUserQuery = `
            INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `;
        const userResult = await query(insertUserQuery, [name, email, hashedPassword, phoneNumber, address || 'Not provided', dob, gender, roleId]);

        const newUserId = userResult.insertId; 
        let finalUserCode = '';

        // 🌟 2. Insert into specific tables and generate the Code
        if (role === 'student') {
            const studentResult = await query('INSERT INTO students (user_id) VALUES (?)', [newUserId]);
            const studentId = studentResult.insertId;
            
            finalUserCode = generateUserCode('student', province, district, studentId);
            await query('UPDATE students SET user_code = ? WHERE id = ?', [finalUserCode, studentId]);

        } else if (role === 'teacher') {
            const teacherResult = await query('INSERT INTO teachers (user_id) VALUES (?)', [newUserId]);
            const teacherId = teacherResult.insertId;
            
            finalUserCode = generateUserCode('teacher', province, district, teacherId);
            await query('UPDATE teachers SET user_code = ? WHERE id = ?', [finalUserCode, teacherId]);
        }

        req.session.userId = newUserId;
        req.session.userRole = role;
        req.session.userName = name;

        res.status(201).json({ 
            message: 'User registered successfully!',
            userId: newUserId,
            userRole: role,
            userName: name,
            userCode: finalUserCode // Send the code back to the client if needed
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

export default router;