import express from 'express';
import multer from 'multer';
import { advertisementStorage } from '../cloudinaryConfig.js';
import db from '../db.js';
import util from 'util';
import { requireAuth, requireRole } from '../middleware/auth.js';

const query = util.promisify(db.query).bind(db);
const router = express.Router();
const upload = multer({ storage: advertisementStorage });

// POST /api/teacher/advertisements - Upload a new advertisement
router.post('/teacher/advertisements', requireAuth, requireRole(['teacher']), upload.single('advertisement'), async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const adLink = req.file.path;

        // Get teacher id
        const teacherRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (teacherRes.length === 0) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }
        const teacherId = teacherRes[0].id;

        // Insert new advertisement
        const result = await query(
            'INSERT INTO advertisements (t_id, ad_link) VALUES (?, ?)',
            [teacherId, adLink]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Advertisement uploaded successfully',
            advertisement: {
                id: result.insertId,
                t_id: teacherId,
                ad_link: adLink
            }
        });
    } catch (err) {
        console.error('Error uploading advertisement:', err);
        res.status(500).json({ error: 'Failed to upload advertisement' });
    }
});

// GET /api/teacher/advertisements - Get advertisements for the logged-in teacher
router.get('/teacher/advertisements', requireAuth, requireRole(['teacher']), async (req, res) => {
    try {
        const userId = req.session.userId;
        const teacherRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (teacherRes.length === 0) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }
        const teacherId = teacherRes[0].id;

        const ads = await query('SELECT * FROM advertisements WHERE t_id = ? ORDER BY id DESC', [teacherId]);
        res.status(200).json(ads);
    } catch (err) {
        console.error('Error fetching teacher advertisements:', err);
        res.status(500).json({ error: 'Failed to fetch advertisements' });
    }
});

// DELETE /api/teacher/advertisements/:id - Delete an advertisement
router.delete('/teacher/advertisements/:id', requireAuth, requireRole(['teacher']), async (req, res) => {
    try {
        const userId = req.session.userId;
        const { id } = req.params;

        const teacherRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        if (teacherRes.length === 0) {
            return res.status(404).json({ error: 'Teacher profile not found' });
        }
        const teacherId = teacherRes[0].id;

        await query('DELETE FROM advertisements WHERE id = ? AND t_id = ?', [id, teacherId]);
        res.status(200).json({ success: true, message: 'Advertisement deleted' });
    } catch (err) {
        console.error('Error deleting advertisement:', err);
        res.status(500).json({ error: 'Failed to delete advertisement' });
    }
});

// GET /api/public/advertisements/top - Fetch top-rated teachers' advertisements for homepage
router.get('/public/advertisements/top', async (req, res) => {
    try {
        const sql = `
            SELECT a.id as ad_id, a.ad_link, t.id as teacher_id, u.name as teacher_name, 
                   COALESCE(AVG(r.rating), 0) as avg_rating
            FROM advertisements a
            JOIN teachers t ON a.t_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN classes_courses c ON c.t_id = t.id
            LEFT JOIN reviews r ON r.c_id = c.id
            GROUP BY a.id, a.ad_link, t.id, u.name
            ORDER BY avg_rating DESC, a.id DESC
            LIMIT 4
        `;

        const ads = await query(sql);
        res.status(200).json(ads);
    } catch (err) {
        console.error('Error fetching top advertisements:', err);
        res.status(500).json({ error: 'Failed to fetch top advertisements' });
    }
});

export default router;
