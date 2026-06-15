import 'dotenv/config';
import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

import { v2 as cloudinary } from 'cloudinary';
import cloudinaryStoragePkg from 'multer-storage-cloudinary'; // 🌟 Simple default import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 🌟 THE FIX: Robust Cloudinary Storage Initialization
// This automatically detects what version of the library you have 
// and initializes it correctly so it never crashes!
let storage;

if (cloudinaryStoragePkg.CloudinaryStorage) {
    // Handles modern v4.x syntax
    storage = new cloudinaryStoragePkg.CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'educat_profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: (req, file) => Date.now() + '-' + Math.round(Math.random() * 1E9)
        }
    });
} else if (cloudinaryStoragePkg.default?.CloudinaryStorage) {
    // Handles wrapped ESM exports
    storage = new cloudinaryStoragePkg.default.CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: 'educat_profiles',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            public_id: (req, file) => Date.now() + '-' + Math.round(Math.random() * 1E9)
        }
    });
} else {
    // Handles older v2.x syntax
    const StorageConstructor = cloudinaryStoragePkg.default || cloudinaryStoragePkg;
    try {
        storage = new StorageConstructor({
            cloudinary: cloudinary,
            params: {
                folder: 'educat_profiles',
                allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
            }
        });
    } catch (e) {
        storage = StorageConstructor({
            cloudinary: cloudinary,
            folder: 'educat_profiles',
            allowedFormats: ['jpg', 'png', 'jpeg', 'webp']
        });
    }
}

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

    if (req.session && req.session.userId && req.session.userId !== parseInt(userId)) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this profile' });
    }

    const {
        name, email, phone_number, address, dob, gender,
        school_name, grade_level, guardian_name, guardian_phone,
        removePhoto
    } = req.body;

    let connection;

    try {
        connection = await db.promise().getConnection();
        await connection.beginTransaction();

        let userSQL = `
            UPDATE users 
            SET name = ?, email = ?, phone_number = ?, address = ?, dob = ?, gender = ?
        `;
        const userParams = [name, email, phone_number, address, dob, gender];

        if (req.file) {
            userSQL += `, picture = ?`;
            userParams.push(req.file.path);
        } else if (removePhoto === 'true') {
            userSQL += `, picture = NULL`;
        }

        userSQL += ` WHERE id = ?`;
        userParams.push(userId);

        await connection.query(userSQL, userParams);

        const studentSQL = `
            UPDATE students 
            SET school_name = ?, grade_level = ?, guardian_name = ?, guardian_phone = ? 
            WHERE user_id = ?
        `;
        const studentParams = [school_name, grade_level, guardian_name, guardian_phone, userId];

        await connection.query(studentSQL, studentParams);
        await connection.commit();

        res.status(200).json({
            success: true,
            message: 'Student profile updated successfully!',
            picture: req.file ? req.file.path : undefined
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Student Profile Update Error:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while updating the profile. Please try again.',
            error: error.message
        });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * @route   GET /api/student/dashboard/:studentId
 * @desc    Get dashboard data (recent courses and upcoming deadlines)
 */
router.get('/dashboard/:studentId', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const [courses] = await db.promise().query(`
            SELECT c.id, c.name as subject, c.title as course_name, c.theme_color, u.name as teacher_name 
            FROM classes_courses c 
            JOIN enrollments e ON c.id = e.c_id 
            JOIN teachers t ON c.t_id = t.id 
            JOIN users u ON t.user_id = u.id 
            WHERE e.s_id = ? 
            ORDER BY e.enrolled_date DESC LIMIT 2
        `, [studentId]);

        const [deadlines] = await db.promise().query(`
            SELECT a.id, a.title, a.deadline, c.name as course_name 
            FROM assignments a 
            JOIN modules m ON a.m_id = m.id 
            JOIN classes_courses c ON m.c_id = c.id 
            JOIN enrollments e ON c.id = e.c_id 
            WHERE e.s_id = ? AND a.deadline >= NOW() 
            ORDER BY a.deadline ASC LIMIT 3
        `, [studentId]);

        res.status(200).json({ courses, deadlines });
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        res.status(500).json({ success: false, message: 'Server error fetching dashboard data' });
    }
});

/**
 * @route   GET /api/student/:studentId/calendar
 * @desc    Get scheduled classes for a student's calendar
 */
router.get('/:studentId/calendar', async (req, res) => {
    const studentId = req.params.studentId;

    try {
        const [classRows] = await db.promise().query(`
            SELECT 
                t.id, 
                t.title AS event_title, 
                DATE_FORMAT(t.scheduled_date, '%Y-%m-%d') AS scheduled_date, 
                t.start_time, 
                t.meeting_link, 
                c.title AS course_title, 
                c.theme_color 
            FROM live_classes t 
            JOIN classes_courses c ON t.c_id = c.id 
            JOIN enrollments e ON c.id = e.c_id 
            WHERE e.s_id = ? AND t.status = 'scheduled' AND c.status = 'active'
        `, [studentId]);

        const classes = classRows.map(row => ({ ...row, type: 'class' }));

        const [todoRows] = await db.promise().query(`
            SELECT 
                id, 
                task AS event_title, 
                DATE_FORMAT(due_date, '%Y-%m-%d') AS scheduled_date, 
                is_completed 
            FROM todos 
            WHERE user_id = ? AND due_date IS NOT NULL
        `, [studentId]);

        const todos = todoRows.map(row => ({
            ...row,
            type: 'todo',
            theme_color: row.is_completed ? 'gray' : 'orange'
        }));

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