import express from 'express';
import db from '../db.js';
import util from 'util';

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
             FROM timetables tt 
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
            SELECT r.id, r.title, r.description, r.rating, r.survey_responses, r.c_id, cc.title as course_name, u.name as student_name
            FROM reviews r
            JOIN classes_courses cc ON r.c_id = cc.id
            LEFT JOIN students s ON r.s_id = s.id
            LEFT JOIN users u ON s.user_id = u.id
            WHERE cc.t_id = ?
            ORDER BY r.id DESC
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

export default router;