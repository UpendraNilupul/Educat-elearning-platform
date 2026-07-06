import express from 'express';
import db from '../db.js';
import util from 'util';
import { requireAuth, requireRole } from '../middleware/auth.js';

const query = util.promisify(db.query).bind(db);

const router = express.Router();

// Get all teachers
router.get('/teachers', (req, res) => {
    const sqlQuery = `
        SELECT u.id, u.name, u.picture, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.role_name = ?
    `;

    db.query(sqlQuery, ['teacher'], (err, results) => {
        if (err) {
            console.error('Error fetching teachers:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        res.status(200).json({
            success: true,
            teachers: results,
            count: results.length
        });
    });
});

// Get a specific teacher by ID
router.get('/teachers/:id', (req, res) => {
    const { id } = req.params;

    const sqlQuery = `
        SELECT u.id, u.name, u.picture, u.email
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND r.role_name = ?
    `;

    db.query(sqlQuery, [id, 'teacher'], (err, results) => {
        if (err) {
            console.error('Error fetching teacher:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.status(200).json({
            success: true,
            teacher: results[0]
        });
    });
});

// Get Dashboard Stats for a specific teacher
router.get('/teachers/:userId/dashboard-stats', async (req, res) => {
    const { userId } = req.params;
    try {
        // Find teacher ID
        const teacherRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (teacherRes.length === 0) return res.status(404).json({ error: 'Teacher not found' });
        const teacherId = teacherRes[0].id;

        // Total Students (Distinct)
        const studentsRes = await query(
            'SELECT COUNT(DISTINCT s_id) as total FROM enrollments WHERE c_id IN (SELECT id FROM classes_courses WHERE t_id = ?)',
            [teacherId]
        );
        const totalStudents = studentsRes[0].total || 0;

        // Total Reviews
        const reviewsRes = await query(
            'SELECT COUNT(*) as total FROM reviews WHERE c_id IN (SELECT id FROM classes_courses WHERE t_id = ?)',
            [teacherId]
        );
        const totalReviews = reviewsRes[0].total || 0;

        // Upcoming Classes
        const upcomingRes = await query(
            `SELECT tt.title, cc.title as course, 
             DATE_FORMAT(tt.scheduled_date, '%b %d') as date, 
             TIME_FORMAT(tt.start_time, '%h:%i %p') as time 
             FROM live_classes tt 
             JOIN classes_courses cc ON tt.c_id = cc.id 
             WHERE cc.t_id = ? AND tt.scheduled_date >= CURDATE() 
             ORDER BY tt.scheduled_date, tt.start_time 
             LIMIT 5`,
            [teacherId]
        );

        res.json({
            totalStudents,
            totalReviews,
            upcomingClasses: upcomingRes
        });
    } catch (err) {
        console.error('Error fetching teacher stats:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});
// Get Reviews for a specific teacher
router.get('/teachers/:userId/reviews', async (req, res) => {
    const { userId } = req.params;
    try {
        const teacherRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (teacherRes.length === 0) return res.status(404).json({ error: 'Teacher not found' });
        const teacherId = teacherRes[0].id;

        const reviewsRes = await query(`
            SELECT r.id, r.title, r.description, r.rating, r.survey_responses, r.created_at, r.is_read, cc.title as course_name, 'Anonymous Student' as student_name
            FROM reviews r
            JOIN classes_courses cc ON r.c_id = cc.id
            WHERE cc.t_id = ?
            ORDER BY r.created_at DESC
        `, [teacherId]);

        res.json({
            success: true,
            reviews: reviewsRes
        });
    } catch (err) {
        console.error('Error fetching teacher reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Mark review as read
router.put('/reviews/:reviewId/read', async (req, res) => {
    try {
        await query('UPDATE reviews SET is_read = TRUE WHERE id = ?', [req.params.reviewId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to update status" });
    }
});

// GET all live classes for the authenticated teacher
router.get('/teacher/liveclasses', requireAuth, requireRole(['teacher']), async (req, res) => {
    const userId = req.session.userId;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (tRes.length === 0) {
            return res.status(403).json({ error: 'Teacher profile not found' });
        }
        const teacherId = tRes[0].id;

        const liveClasses = await query(`
            SELECT t.*, c.title AS course_title
            FROM live_classes t
            JOIN classes_courses c ON t.c_id = c.id
            WHERE c.t_id = ?
            ORDER BY t.scheduled_date DESC, t.start_time DESC
        `, [teacherId]);

        res.status(200).json(liveClasses);
    } catch (err) {
        console.error('Error fetching live classes:', err);
        res.status(500).json({ error: 'Failed to fetch live classes' });
    }
});

// POST a new live class
router.post('/teacher/liveclasses', requireAuth, requireRole(['teacher']), async (req, res) => {
    const { c_id, title, scheduled_date, start_time, duration_minutes, meeting_link, status } = req.body;
    const userId = req.session.userId;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (tRes.length === 0) {
            return res.status(403).json({ error: 'Teacher profile not found' });
        }
        const teacherId = tRes[0].id;

        // Verify course ownership
        const courseCheck = await query('SELECT id, title FROM classes_courses WHERE id = ? AND t_id = ?', [c_id, teacherId]);
        if (courseCheck.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Course does not belong to you' });
        }

        // Validate scheduled_date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (scheduled_date < todayStr) {
            return res.status(400).json({ error: 'Scheduled date must be today or a future date.' });
        }
        const dateParts = scheduled_date.split('-');
        if (dateParts[0].length !== 4 || parseInt(dateParts[0], 10) > 2100) {
            return res.status(400).json({ error: 'Scheduled date must be a valid date with a 4-digit year no later than 2100.' });
        }

        const result = await query(`
            INSERT INTO live_classes (c_id, title, scheduled_date, start_time, duration_minutes, meeting_link, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [c_id, title, scheduled_date, start_time, duration_minutes, meeting_link, status || 'scheduled']);

        const newClass = {
            id: result.insertId,
            c_id,
            title,
            scheduled_date,
            start_time,
            duration_minutes,
            meeting_link,
            status: status || 'scheduled',
            course_title: courseCheck[0].title
        };
        res.status(201).json(newClass);
    } catch (err) {
        console.error('Error creating live class:', err);
        res.status(500).json({ error: 'Failed to create live class' });
    }
});

// PUT (edit) a live class
router.put('/teacher/liveclasses/:id', requireAuth, requireRole(['teacher']), async (req, res) => {
    const { id } = req.params;
    const { c_id, title, scheduled_date, start_time, duration_minutes, meeting_link, status } = req.body;
    const userId = req.session.userId;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (tRes.length === 0) {
            return res.status(403).json({ error: 'Teacher profile not found' });
        }
        const teacherId = tRes[0].id;

        // Verify live class ownership
        const timetableCheck = await query(`
            SELECT t.id FROM live_classes t
            JOIN classes_courses c ON t.c_id = c.id
            WHERE t.id = ? AND c.t_id = ?
        `, [id, teacherId]);
        if (timetableCheck.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Live class not found or not owned by you' });
        }

        // Verify new course ownership
        const courseCheck = await query('SELECT id, title FROM classes_courses WHERE id = ? AND t_id = ?', [c_id, teacherId]);
        if (courseCheck.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Selected course does not belong to you' });
        }

        // Validate scheduled_date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        if (scheduled_date < todayStr) {
            return res.status(400).json({ error: 'Scheduled date must be today or a future date.' });
        }
        const dateParts = scheduled_date.split('-');
        if (dateParts[0].length !== 4 || parseInt(dateParts[0], 10) > 2100) {
            return res.status(400).json({ error: 'Scheduled date must be a valid date with a 4-digit year no later than 2100.' });
        }

        await query(`
            UPDATE live_classes
            SET c_id = ?, title = ?, scheduled_date = ?, start_time = ?, duration_minutes = ?, meeting_link = ?, status = ?
            WHERE id = ?
        `, [c_id, title, scheduled_date, start_time, duration_minutes, meeting_link, status || 'scheduled', id]);

        const updatedClass = {
            id: parseInt(id),
            c_id,
            title,
            scheduled_date,
            start_time,
            duration_minutes,
            meeting_link,
            status: status || 'scheduled',
            course_title: courseCheck[0].title
        };
        res.status(200).json(updatedClass);
    } catch (err) {
        console.error('Error updating live class:', err);
        res.status(500).json({ error: 'Failed to update live class' });
    }
});

// DELETE a live class
router.delete('/teacher/liveclasses/:id', requireAuth, requireRole(['teacher']), async (req, res) => {
    const { id } = req.params;
    const userId = req.session.userId;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (tRes.length === 0) {
            return res.status(403).json({ error: 'Teacher profile not found' });
        }
        const teacherId = tRes[0].id;

        // Verify live class ownership
        const timetableCheck = await query(`
            SELECT t.id FROM live_classes t
            JOIN classes_courses c ON t.c_id = c.id
            WHERE t.id = ? AND c.t_id = ?
        `, [id, teacherId]);
        if (timetableCheck.length === 0) {
            return res.status(403).json({ error: 'Unauthorized: Live class not found or not owned by you' });
        }

        await query('DELETE FROM live_classes WHERE id = ?', [id]);
        res.status(200).json({ message: 'Live class deleted successfully' });
    } catch (err) {
        console.error('Error deleting live class:', err);
        res.status(500).json({ error: 'Failed to delete live class' });
    }
});
// POST a class announcement
router.post('/teacher/classes/:id/announcements', requireAuth, requireRole(['teacher']), async (req, res) => {
    const classId = req.params.id;
    const { title, message } = req.body;
    const userId = req.session.userId;
    
    try {
        // Verify teacher ownership of the class
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (tRes.length === 0) return res.status(403).json({ error: 'Teacher profile not found' });
        const teacherId = tRes[0].id;
        
        const courseCheck = await query('SELECT id FROM classes_courses WHERE id = ? AND t_id = ?', [classId, teacherId]);
        if (courseCheck.length === 0) return res.status(403).json({ error: 'Unauthorized: Course not found or not owned by you' });

        // Get all students enrolled
        const students = await query(`
            SELECT s.user_id 
            FROM enrollments e 
            JOIN students s ON e.s_id = s.id 
            WHERE e.c_id = ?
        `, [classId]);

        if (students.length > 0) {
            const values = students.map(st => [st.user_id, title || 'Class Announcement', message]);
            await query('INSERT INTO notifications (user_id, title, description) VALUES ?', [values]);
        }

        // Insert into class_announcements table
        await query(
            'INSERT INTO class_announcements (c_id, title, message) VALUES (?, ?, ?)',
            [classId, title || 'Class Announcement', message]
        );

        res.status(200).json({ success: true, message: 'Announcement posted successfully' });
    } catch (err) {
        console.error('Error posting announcement:', err);
        res.status(500).json({ error: 'Failed to post announcement' });
    }
});

export default router;