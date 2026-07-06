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
            LEFT JOIN teachers t ON a.t_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN classes_courses c ON c.t_id = t.id
            LEFT JOIN reviews r ON r.c_id = c.id
            WHERE a.is_published = TRUE
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

// GET /api/admin/advertisements
router.get('/admin/advertisements', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const sql = `
            SELECT a.id, a.ad_link, a.is_published, a.t_id, u.name as teacher_name
            FROM advertisements a
            LEFT JOIN teachers t ON a.t_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY a.id DESC
        `;
        const ads = await query(sql);
        res.status(200).json(ads);
    } catch (err) {
        console.error('Error fetching admin ads:', err);
        res.status(500).json({ error: 'Failed to fetch advertisements' });
    }
});

// POST /api/admin/advertisements
router.post('/admin/advertisements', requireAuth, requireRole(['admin']), upload.single('advertisement'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        
        const adLink = req.file.path;
        const result = await query(
            'INSERT INTO advertisements (t_id, ad_link, is_published) VALUES (?, ?, ?)',
            [null, adLink, true]
        );

        res.status(201).json({ success: true, message: 'Admin advertisement uploaded successfully' });
    } catch (err) {
        console.error('Error uploading admin ad:', err);
        res.status(500).json({ error: 'Failed to upload admin advertisement' });
    }
});

// PUT /api/admin/advertisements/:id/toggle
router.put('/admin/advertisements/:id/toggle', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        const { is_published } = req.body;
        await query('UPDATE advertisements SET is_published = ? WHERE id = ?', [is_published, req.params.id]);
        res.status(200).json({ success: true, message: 'Status updated' });
    } catch (err) {
        console.error('Error toggling publish status:', err);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// DELETE /api/admin/advertisements/:id
router.delete('/admin/advertisements/:id', requireAuth, requireRole(['admin']), async (req, res) => {
    try {
        await query('DELETE FROM advertisements WHERE id = ?', [req.params.id]);
        res.status(200).json({ success: true, message: 'Advertisement deleted' });
    } catch (err) {
        console.error('Error deleting admin ad:', err);
        res.status(500).json({ error: 'Failed to delete advertisement' });
    }
});

export default router;
