import 'dotenv/config';
import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'educat_profiles',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => Date.now() + '-' + Math.round(Math.random() * 1E9)
    }
});

const upload = multer({ storage: storage });

/**
 * @route   GET /api/student/profile/:userId
 * @desc    Get student profile data for editing
 */
router.get('/profile/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const [rows] = await db.promise().query(`
            SELECT 
                u.name, u.email, u.phone_number, u.address, 
                DATE_FORMAT(u.dob, '%Y-%m-%d') AS dob, 
                u.gender, u.picture,
                s.school_name, s.grade_level, s.guardian_name, s.guardian_phone
            FROM users u
            LEFT JOIN students s ON u.id = s.user_id
            WHERE u.id = ?
        `, [userId]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ Error fetching student profile:', error);
        res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
});

/**
 * @route   GET /api/student/basic-info/:userId
 * @desc    Get student name and profile picture (lean request)
 */
router.get('/basic-info/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const [rows] = await db.promise().query(
            'SELECT name, picture FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ 
            success: true, 
            name: rows[0].name, 
            picture: rows[0].picture 
        });
    } catch (error) {
        console.error('❌ Error fetching basic info:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * @route   PUT /api/student/profile/:userId
 * @desc    Update student profile (Personal & Academic info)
 * @access  Private (Assume session/auth middleware exists or handled differently)
 */
router.put('/profile/:userId', (req, res, next) => {
    upload.single('picture')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error('❌ Multer Error:', err);
            return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
        } else if (err) {
            console.error('❌ Cloudinary/Upload Error:', err);
            return res.status(500).json({ success: false, message: 'Image upload failed', error: err.message });
        }
        next();
    });
}, async (req, res) => {
    const userId = req.params.userId;
    const {
        name, email, phone_number, address, dob, gender,
        school_name, grade_level, guardian_name, guardian_phone,
        removePhoto
    } = req.body;

    let connection;

    try {
        // Use connection pool with promise wrapper as requested
        connection = await db.promise().getConnection();

        // Start Transaction
        await connection.beginTransaction();

        // 1. Update USERS table (Personal Info)
        let userSQL = `
            UPDATE users 
            SET name = ?, email = ?, phone_number = ?, address = ?, dob = ?, gender = ?
        `;
        const userParams = [name, email, phone_number, address, dob, gender];

        if (req.file) {
            userSQL += `, picture = ?`;
            // Save the secure Cloudinary URL (path) instead of just the filename
            userParams.push(req.file.path);
        } else if (removePhoto === 'true') {
            userSQL += `, picture = NULL`;
        }

        userSQL += ` WHERE id = ?`;
        userParams.push(userId);

        await connection.query(userSQL, userParams);

        // 2. Update STUDENTS table (Academic Info)
        const studentSQL = `
            UPDATE students 
            SET school_name = ?, grade_level = ?, guardian_name = ?, guardian_phone = ? 
            WHERE user_id = ?
        `;
        const studentParams = [school_name, grade_level, guardian_name, guardian_phone, userId];

        await connection.query(studentSQL, studentParams);

        // Commit Transaction
        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Student profile updated successfully!',
            picture: req.file ? req.file.path : undefined
        });

    } catch (error) {
        // Rollback Transaction if anything fails
        if (connection) await connection.rollback();

        console.error('❌ Student Profile Update Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the profile. Please try again.',
            error: error.message
        });
    } finally {
        // Release connection back to pool
        if (connection) connection.release();
    }
});

export default router;
