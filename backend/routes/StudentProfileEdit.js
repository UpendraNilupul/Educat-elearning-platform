import 'dotenv/config';
import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { v2 as cloudinary } from 'cloudinary';
import pkg from 'multer-storage-cloudinary';
const { CloudinaryStorage } = pkg;
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

/**
 * @route   GET /api/student/:studentId/calendar
 * @desc    Get scheduled classes for a student's calendar
 */
router.get('/:studentId/calendar', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        // Query 1: Fetch timetables (Classes)
        const [classRows] = await db.promise().query(`
            SELECT 
                t.id, 
                t.title AS event_title, 
                DATE_FORMAT(t.scheduled_date, '%Y-%m-%d') AS scheduled_date, 
                t.start_time, 
                t.meeting_link, 
                c.title AS course_title, 
                c.theme_color 
            FROM timetables t 
            JOIN classes_courses c ON t.c_id = c.id 
            JOIN enrollments e ON c.id = e.c_id 
            WHERE e.s_id = ? AND t.status = 'scheduled'
        `, [studentId]);

        // Map classes to include type: 'class'
        const classes = classRows.map(row => ({ ...row, type: 'class' }));

        // Query 2: Fetch todos
        const [todoRows] = await db.promise().query(`
            SELECT 
                id, 
                task AS event_title, 
                DATE_FORMAT(due_date, '%Y-%m-%d') AS scheduled_date, 
                is_completed 
            FROM todos 
            WHERE user_id = ? AND due_date IS NOT NULL
        `, [studentId]);

        // Map todos to include type: 'todo' and dynamic theme_color
        const todos = todoRows.map(row => ({
            ...row,
            type: 'todo',
            theme_color: row.is_completed ? 'gray' : 'orange'
        }));

        // Merge both arrays
        const mergedEvents = [...classes, ...todos];

        res.status(200).json(mergedEvents);
    } catch (error) {
        console.error('❌ Error fetching student calendar events:', error);
        res.status(500).json({ success: false, message: 'Server error fetching calendar' });
    }
});

/**
 * @route   GET /api/student/:userId/todos
 * @desc    Fetch todos for a user
 */
router.get('/:userId/todos', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await db.promise().query(
            'SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        console.error('❌ Error fetching todos:', error);
        res.status(500).json({ success: false, message: 'Server error fetching todos' });
    }
});

/**
 * @route   POST /api/student/:userId/todos
 * @desc    Add a new todo
 */
router.post('/:userId/todos', async (req, res) => {
    const userId = req.params.userId;
    const { task, due_date } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO todos (user_id, task, due_date) VALUES (?, ?, ?)',
            [userId, task, due_date || null]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('❌ Error adding todo:', error);
        res.status(500).json({ success: false, message: 'Server error adding todo' });
    }
});

/**
 * @route   PUT /api/student/todos/:todoId/toggle
 * @desc    Toggle todo completion status
 */
router.put('/todos/:todoId/toggle', async (req, res) => {
    const todoId = req.params.todoId;
    const { is_completed } = req.body;
    try {
        await db.promise().query(
            'UPDATE todos SET is_completed = ? WHERE id = ?',
            [is_completed, todoId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error toggling todo:', error);
        res.status(500).json({ success: false, message: 'Server error toggling todo' });
    }
});

/**
 * @route   DELETE /api/student/todos/:todoId
 * @desc    Delete a todo
 */
router.delete('/todos/:todoId', async (req, res) => {
    const todoId = req.params.todoId;
    try {
        await db.promise().query(
            'DELETE FROM todos WHERE id = ?',
            [todoId]
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('❌ Error deleting todo:', error);
        res.status(500).json({ success: false, message: 'Server error deleting todo' });
    }
});

export default router;
