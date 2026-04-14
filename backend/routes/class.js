import express from 'express';
import db from '../db.js'; 
import util from 'util';

const query = util.promisify(db.query).bind(db);
const router = express.Router();

// 1. GET ENROLLED CLASSES
router.get('/student/classes', async (req, res) => {
    const userId = req.session?.userId || req.query.userId; 
    if (!userId) return res.status(200).json([]); 

    try {
        const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [userId]);
        if (studentRes.length === 0) return res.status(200).json([]); 
        
        const studentId = studentRes[0].id;

        const classes = await query(`
            SELECT 
                c.id, c.name AS grade, c.title AS subject,
                t.id AS teacher_id, u.name AS teacher_name, u.picture AS teacher_image
            FROM classes_courses c
            JOIN enrollments e ON c.id = e.c_id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE e.s_id = ? AND e.status = 'In Progress'
            GROUP BY c.id
        `, [studentId]);

        res.status(200).json(classes.map(cls => ({
            id: cls.id,
            grade: cls.grade,
            subject: cls.subject,
            monthlyFee: 2500,
            teacher: { name: cls.teacher_name, image: cls.teacher_image },
            months: [{ id: `m-${cls.id}`, name: 'Current Month', isPaid: true }]
        })));
    } catch (error) {
        console.error("Error in /student/classes:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. GET SUGGESTED CLASSES
router.get('/suggested-classes', async (req, res) => {
    try {
        const suggested = await query(`
            SELECT 
                c.id, c.name AS grade, c.title AS subject,
                u.name AS teacher_name, u.picture AS teacher_image
            FROM classes_courses c
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            ORDER BY c.id DESC
            LIMIT 10
        `);

        const formatted = suggested.map(cls => ({
            id: cls.id,
            grade: cls.grade || 'Grade',
            subject: cls.subject,
            monthlyFee: 2500,
            teacher: {
                name: cls.teacher_name,
                image: cls.teacher_image || `https://ui-avatars.com/api/?name=${cls.teacher_name.replace(/ /g, '+')}`
            }
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error("Error in /suggested-classes:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;