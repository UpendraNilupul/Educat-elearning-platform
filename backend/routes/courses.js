import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

router.get('/courses/student/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Find the student ID based on the user ID
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);

        if (studentRes.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const studentId = studentRes[0].id;

        // Fetch courses and progress
        const courses = await query(`
            SELECT 
                c.id, 
                c.title, 
                u.name AS instructor,
                c.theme_color AS color,
                c.thumbnail_url AS thumbnail,
                e.status,
                IFNULL(r.rating, 5.0) AS rating,
                (SELECT COUNT(*) FROM modules WHERE c_id = c.id) AS totalModules,
                (SELECT COUNT(*) FROM lessons l 
                    JOIN modules m ON l.m_id = m.id 
                    WHERE m.c_id = c.id) AS totalLessons,
                (SELECT COUNT(*) FROM lesson_completions lc 
                    JOIN lessons l ON lc.l_id = l.id 
                    JOIN modules m ON l.m_id = m.id 
                    WHERE m.c_id = c.id AND lc.s_id = ?) AS lessonsCompleted
            FROM enrollments e
            JOIN classes_courses c ON e.c_id = c.id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN reviews r ON r.c_id = c.id AND r.s_id = ?
            WHERE e.s_id = ?
        `, [studentId, studentId, studentId]);

        // Calculate percentage progress
        const formatted = courses.map(c => {
            const progress = c.totalLessons > 0
                ? Math.round((c.lessonsCompleted / c.totalLessons) * 100)
                : 0;

            return {
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                progress,
                modulesCompleted: Math.floor((progress / 100) * (c.totalModules || 0)),
                totalModules: c.totalModules || 0,
                rating: c.rating,
                status: c.status,
                color: c.color || 'purple',
                thumbnail: c.thumbnail || 'default'
            };
        });

        res.json(formatted);

    } catch (err) {
        console.error("Course fetch error:", err);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

export default router;