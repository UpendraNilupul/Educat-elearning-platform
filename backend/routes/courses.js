import express from 'express';
import db from '../db.js';
import util from 'util';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

import { courseResourceStorage, courseThumbnailStorage } from '../cloudinaryConfig.js';

const upload = multer({ storage: courseResourceStorage });

// GET all courses
router.get('/courses', async (req, res) => {
    try {
        let q = 'SELECT * FROM classes_courses ORDER BY id DESC';
        let params = [];
        if (req.query.teacherId) {
            const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [req.query.teacherId]);
            if (tRes.length > 0) {
                q = 'SELECT * FROM classes_courses WHERE t_id = ? ORDER BY id DESC';
                params.push(tRes[0].id);
            } else {
                return res.status(200).json([]);
            }
        }
        const courses = await query(q, params);
        for (let course of courses) {
            const modules = await query('SELECT * FROM modules WHERE c_id = ? ORDER BY number ASC, id ASC', [course.id]);
            course.chapters = modules.map(m => ({ id: m.id, title: m.title, isVisible: m.isVisible === 1 }));
            course.modules = course.chapters.length; // Override stale db property with dynamic calculation
            for (let mod of course.chapters) {
                const lessons = await query('SELECT * FROM lessons WHERE m_id = ? ORDER BY number ASC, id ASC', [mod.id]);
                mod.lessons = [];
                for (let les of lessons) {
                    const mappedLesson = { id: les.id, type: les.type, link: les.link, number: les.number, title: les.title, isVisible: les.isVisible !== 0 };
                    const resources = await query('SELECT * FROM resources WHERE l_id = ? ORDER BY number ASC, id ASC', [les.id]);
                    mappedLesson.resources = resources.map(r => ({
                        id: r.id, title: r.name, type: r.type || 'pdf', url: r.link, isVisible: r.isVisible !== 0
                    }));
                    mod.lessons.push(mappedLesson);
                }
                const assignments = await query('SELECT * FROM assignments WHERE m_id = ? ORDER BY created_at DESC', [mod.id]);
                mod.assignments = await Promise.all(assignments.map(async (a) => {
                    const attachments = await query('SELECT id, file_url FROM assignment_attachments WHERE a_id = ?', [a.id]);
                    return {
                        id: a.id,
                        title: a.title,
                        description: a.description,
                        attachments: attachments.map(att => ({ id: att.id, file_url: att.file_url })),
                        deadline: a.deadline,
                        maxMarks: a.max_marks,
                        publish_at: a.publish_at
                    };
                }));

                const quizzes = await query('SELECT * FROM quizes WHERE m_id = ? ORDER BY number ASC', [mod.id]);
                mod.quizzes = quizzes.map(q => ({
                    id: q.id,
                    title: q.title || `Quiz #${q.number}`,
                    number: q.number,
                    timeLimit: q.time_limit,
                    isPeerReviewed: q.is_peer_reviewed === 1,
                    publish_at: q.publish_at
                }));
            }
        }
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

const uploadThumbnail = multer({ storage: courseThumbnailStorage });

// POST upload course thumbnail
router.post('/courses/upload-thumbnail', requireRole(['teacher', 'admin']), uploadThumbnail.single('thumbnail'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    const fileUrl = req.file.path; // Cloudinary URL returned by multer-storage-cloudinary
    res.status(200).json({ url: fileUrl });
});

// POST a new course
router.post('/courses', requireRole(['teacher', 'admin']), async (req, res) => {
    console.log("POST /courses req.body:", req.body);
    const { name, title, type, grade, status, is_published, theme_color, thumbnail_url, students, progress, userId, monthly_fee } = req.body;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        const actualTeacherId = tRes.length > 0 ? tRes[0].id : 0;

        const result = await query(
            'INSERT INTO classes_courses (name, title, type, grade, status, is_published, theme_color, thumbnail_url, students, modules, progress, t_id, monthly_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, title, type, grade || null, status, is_published ? 1 : 0, theme_color || 'purple', thumbnail_url, students || 0, 0, progress || 0, actualTeacherId, monthly_fee || 0]
        );
        res.status(201).json({ id: result.insertId, ...req.body, t_id: actualTeacherId });
    } catch (err) {
        console.error('Error creating course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PUT (update) a course
router.put('/courses/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    console.log("PUT /courses/:id req.body:", req.body);
    const { id } = req.params;
    const { name, title, type, grade, status, is_published, theme_color, thumbnail_url, monthly_fee } = req.body;
    
    const updateQuery = `
        UPDATE classes_courses 
        SET name = ?, title = ?, type = ?, grade = ?, status = ?, is_published = ?, theme_color = ?, thumbnail_url = ?, monthly_fee = ?
        WHERE id = ?
    `;
    
    const values = [name, title, type, grade || null, status, is_published ? 1 : 0, theme_color || 'purple', thumbnail_url, monthly_fee || 0, id];
    


    try {
        const result = await query(updateQuery, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ id: parseInt(id), name, title, type, grade, status, is_published, theme_color: theme_color || 'purple', thumbnail_url, monthly_fee });
    } catch (err) {
        console.error('Error updating course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PUT mark a course as complete
router.put('/courses/:id/complete', requireRole(['teacher', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { final_summary } = req.body;
    try {
        const updateQuery = `
            UPDATE classes_courses 
            SET status = 'completed', final_summary = ?
            WHERE id = ?
        `;
        const result = await query(updateQuery, [final_summary || null, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json({ success: true, message: 'Course marked as complete' });
    } catch (err) {
        console.error('Error completing course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PUT reopen a completed course
router.put('/courses/:id/reopen', requireRole(['teacher', 'admin']), async (req, res) => {
    const { id } = req.params;
    try {
        const updateQuery = `
            UPDATE classes_courses 
            SET status = 'active'
            WHERE id = ?
        `;
        const result = await query(updateQuery, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        res.status(200).json({ success: true, message: 'Course reopened successfully' });
    } catch (err) {
        console.error('Error reopening course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a course
router.delete('/courses/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    const { id } = req.params;

    try {
        const mods = await query('SELECT id FROM modules WHERE c_id = ?', [id]);
        for (let mod of mods) {
            await query('DELETE FROM resources WHERE m_id = ?', [mod.id]);
            await query('DELETE FROM lessons WHERE m_id = ?', [mod.id]);
        }
        await query('DELETE FROM modules WHERE c_id = ?', [id]);

        const result = await query('DELETE FROM classes_courses WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ message: 'Course deleted successfully' });
    } catch (err) {
        console.error('Error deleting course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// --- MODULES / CHAPTERS ---
router.put('/courses/:c_id/modules/reorder', requireRole(['teacher', 'admin']), async (req, res) => {
    const { moduleIds } = req.body;
    try {
        if (moduleIds && moduleIds.length > 0) {
            for (let i = 0; i < moduleIds.length; i++) {
                await query('UPDATE modules SET number = ? WHERE id = ? AND c_id = ?', [i + 1, moduleIds[i], req.params.c_id]);
            }
        }
        res.status(200).json({ message: 'Order updated' });
    } catch (err) {
        console.error('Error reordering modules:', err);
        res.status(500).json({ message: 'Error reordering modules' });
    }
});

router.post('/modules', requireRole(['teacher', 'admin']), async (req, res) => {
    const { title, c_id, isVisible } = req.body;
    try {
        const result = await query('INSERT INTO modules (title, c_id, number, isVisible) VALUES (?, ?, ?, ?)', [title, c_id, 1, isVisible ? 1 : 0]);
        res.status(201).json({ id: result.insertId, title, isVisible: isVisible ? true : false, resources: [] });
    } catch (err) {
        console.error('Error adding module:', err);
        res.status(500).json({ message: 'Error adding module' });
    }
});

router.put('/teacher/modules/:id/visibility', async (req, res) => {
    // isVisible කියන්නේ true (පේනවා) ද false (හැංගිලා) ද කියන එක
    const { isVisible } = req.body;

    try {
        await query(
            'UPDATE modules SET isVisible = ? WHERE id = ?',
            [isVisible ? 1 : 0, req.params.id]
        );
        res.json({ success: true, message: "Visibility updated!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update" });
    }
});

router.put('/modules/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    const { title, isVisible } = req.body;
    try {
        let updateQuery = 'UPDATE modules SET ';
        const params = [];
        if (title !== undefined) { updateQuery += 'title = ?, '; params.push(title); }
        if (isVisible !== undefined) { updateQuery += 'isVisible = ?, '; params.push(isVisible ? 1 : 0); }
        if (params.length === 0) return res.status(400).json({ message: 'Nothing to update' });

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        params.push(req.params.id);

        await query(updateQuery, params);
        res.status(200).json({ id: req.params.id, title, isVisible: isVisible ? true : false });
    } catch (err) {
        console.error('Error updating module:', err);
        res.status(500).json({ message: 'Error updating module' });
    }
});

router.delete('/modules/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        await query('DELETE FROM resources WHERE m_id = ?', [req.params.id]);
        await query('DELETE FROM lessons WHERE m_id = ?', [req.params.id]);
        await query('DELETE FROM modules WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting module:', err);
        res.status(500).json({ message: 'Error deleting module' });
    }
});

router.post('/modules/:m_id/lessons', requireRole(['teacher', 'admin']), async (req, res) => {
    const { title } = req.body;
    try {
        const result = await query('INSERT INTO lessons (title, number, type, link, m_id) VALUES (?, ?, ?, ?, ?)', [title, 1, 'standard', '', req.params.m_id]);
        res.status(201).json({ id: result.insertId, title, type: 'standard', link: '', number: 1, m_id: req.params.m_id, resources: [] });
    } catch (err) {
        console.error('Error adding lesson:', err);
        res.status(500).json({ message: 'Error adding lesson' });
    }
});

router.put('/lessons/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    const { title, isVisible } = req.body;
    try {
        let updateQuery = 'UPDATE lessons SET ';
        const params = [];
        if (title !== undefined) { updateQuery += 'title = ?, '; params.push(title); }
        if (isVisible !== undefined) { updateQuery += 'isVisible = ?, '; params.push(isVisible ? 1 : 0); }
        if (params.length === 0) return res.status(400).json({ message: 'Nothing to update' });

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        params.push(req.params.id);

        await query(updateQuery, params);
        res.status(200).json({ id: req.params.id, title, isVisible: isVisible ? true : false });
    } catch (err) {
        console.error('Error updating lesson:', err);
        res.status(500).json({ message: 'Error updating lesson' });
    }
});

router.delete('/lessions/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        await query('DELETE FROM resources WHERE l_id = ?', [req.params.id]);
        await query('DELETE FROM lessons WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting lesson:', err);
        res.status(500).json({ message: 'Error deleting lesson' });
    }
});

// --- RESOURCES ---

// Proxy Download Route for Cloudinary Raw Files
router.get('/resources/download', (req, res) => {
    let { url: fileUrl, name: originalName } = req.query;
    if (!fileUrl) return res.status(400).send('URL is required');
    
    // Ensure https
    if (fileUrl.startsWith('http://')) fileUrl = fileUrl.replace('http://', 'https://');
    
    let finalFileName = originalName || 'download';
    
    // Clean up .pdftemp and .ziptemp from Cloudinary raw workaround
    if (fileUrl.toLowerCase().endsWith('.pdftemp') || finalFileName.toLowerCase().endsWith('.pdftemp')) {
        finalFileName = finalFileName.replace(/\.pdftemp$/i, '');
        if (!finalFileName.toLowerCase().endsWith('.pdf')) finalFileName += '.pdf';
    } else if (fileUrl.toLowerCase().endsWith('.ziptemp') || finalFileName.toLowerCase().endsWith('.ziptemp')) {
        finalFileName = finalFileName.replace(/\.ziptemp$/i, '');
        if (!finalFileName.toLowerCase().endsWith('.zip')) finalFileName += '.zip';
    } else if (!finalFileName.includes('.')) {
        if (fileUrl.toLowerCase().endsWith('.pdf')) finalFileName += '.pdf';
        if (fileUrl.toLowerCase().endsWith('.zip')) finalFileName += '.zip';
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${finalFileName}"`);
    
    https.get(fileUrl, (cloudinaryRes) => {
        const contentType = cloudinaryRes.headers['content-type'] || 'application/octet-stream';
        // Try to infer extension from Content-Type if it still doesn't have one
        if (!finalFileName.includes('.')) {
            if (contentType.includes('pdf')) finalFileName += '.pdf';
            else if (contentType.includes('zip') || contentType.includes('x-zip-compressed')) finalFileName += '.zip';
            res.setHeader('Content-Disposition', `attachment; filename="${finalFileName}"`);
        }
        res.setHeader('Content-Type', contentType);
        cloudinaryRes.pipe(res);
    }).on('error', (err) => {
        console.error('Proxy download error:', err);
        res.status(500).send('Failed to download file');
    });
});

router.post('/lessons/:l_id/resources', upload.single('file'), requireRole(['teacher', 'admin']), async (req, res) => {
    const { title, type } = req.body;
    let url = req.body.url || '';

    if (req.file) {
        url = req.file.path; // Cloudinary URL returned by multer-storage-cloudinary
    }

    try {
        const lessonRes = await query('SELECT m_id FROM lessons WHERE id = ?', [req.params.l_id]);
        const m_id = lessonRes.length > 0 ? lessonRes[0].m_id : 0;
        const result = await query('INSERT INTO resources (name, type, link, l_id, m_id, number) VALUES (?, ?, ?, ?, ?, ?)', [title, type, url, req.params.l_id, m_id, 1]);
        res.status(201).json({ id: result.insertId, title, type, url, l_id: req.params.l_id });
    } catch (err) {
        console.error('Error adding resource:', err);
        res.status(500).json({ message: 'Error adding resource' });
    }
});

router.put('/resources/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    const { title, url, isVisible } = req.body;
    try {
        let updateQuery = 'UPDATE resources SET ';
        const params = [];
        if (title !== undefined) { updateQuery += 'name = ?, '; params.push(title); }
        if (url !== undefined) { updateQuery += 'link = ?, '; params.push(url); }
        if (isVisible !== undefined) { updateQuery += 'isVisible = ?, '; params.push(isVisible ? 1 : 0); }
        if (params.length === 0) return res.status(400).json({ message: 'Nothing to update' });

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        params.push(req.params.id);

        await query(updateQuery, params);
        res.status(200).json({ id: req.params.id, title, url, isVisible: isVisible ? true : false });
    } catch (err) {
        console.error('Error updating resource:', err);
        res.status(500).json({ message: 'Error updating resource' });
    }
});

router.delete('/resources/:id', requireRole(['teacher', 'admin']), async (req, res) => {
    try {
        await query('DELETE FROM resources WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting resource:', err);
        res.status(500).json({ message: 'Error deleting resource' });
    }
});

router.put('/modules/:m_id/lessons/reorder', requireRole(['teacher', 'admin']), async (req, res) => {
    const { lessonIds } = req.body;
    try {
        if (lessonIds && lessonIds.length > 0) {
            for (let i = 0; i < lessonIds.length; i++) {
                await query('UPDATE lessons SET number = ? WHERE id = ? AND m_id = ?', [i + 1, lessonIds[i], req.params.m_id]);
            }
        }
        res.status(200).json({ message: 'Order updated' });
    } catch (err) {
        console.error('Error reordering lessons:', err);
        res.status(500).json({ message: 'Error reordering lessons' });
    }
});

router.put('/lessons/:l_id/resources/reorder', requireRole(['teacher', 'admin']), async (req, res) => {
    const { resourceIds } = req.body;
    try {
        if (resourceIds && resourceIds.length > 0) {
            for (let i = 0; i < resourceIds.length; i++) {
                await query('UPDATE resources SET number = ? WHERE id = ? AND l_id = ?', [i + 1, resourceIds[i], req.params.l_id]);
            }
        }
        res.status(200).json({ message: 'Order updated' });
    } catch (err) {
        console.error('Error reordering resources:', err);
        res.status(500).json({ message: 'Error reordering resources' });
    }
});

// GET /courses/search - Dynamic Course Search
router.get('/courses/search', async (req, res) => {
    const { teacher, className, subject } = req.query;

    let sql = `
        SELECT 
            c.id, 
            c.name AS class_name, 
            c.title AS subject, 
            c.type, 
            c.grade,
            c.theme_color, 
            c.thumbnail_url, 
            u.name AS teacher_name 
        FROM classes_courses c 
        JOIN teachers t ON c.t_id = t.id 
        JOIN users u ON t.user_id = u.id 
        WHERE c.status = 'active'
    `;
    const params = [];

    if (teacher) {
        sql += ` AND u.name LIKE ?`;
        params.push(`%${teacher}%`);
    }
    if (className) {
        sql += ` AND c.name LIKE ?`;
        params.push(`%${className}%`);
    }
    if (subject) {
        sql += ` AND c.title LIKE ?`;
        params.push(`%${subject}%`);
    }

    try {
        const results = await query(sql, params);
        res.status(200).json(results);
    } catch (err) {
        console.error('Error searching courses:', err);
        res.status(500).json({ message: 'Server error during search' });
    }
});

// Make sure to import your middleware at the top of courses.js if you haven't already:
// import { requireAuth } from '../middleware/auth.js';

router.get('/courses/student/:userId', requireAuth, async (req, res) => {
    const userId = parseInt(req.params.userId);

    // 🌟 THE FIX: Security Check (IDOR Prevention)
    // Ensure the person requesting this data is the actual student (or an admin)
    if (req.session.userId !== userId && req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Unauthorized to view these courses." });
    }

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
            WHERE e.s_id = ? AND c.status IN ('active', 'completed')
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

router.get('/student/my-assessments', requireAuth, async (req, res) => {
    // We get the ID directly from the secure session cookie! No spoofing possible.
    const userId = req.session.userId;

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ message: "Student not found" });
        const studentId = studentRes[0].id;

        // 1. Fetch ALL Assignments in one query (checks submission status)
        const assignments = await query(`
            SELECT 
                a.id, a.title, a.deadline, a.publish_at, a.max_marks,
                c.title as subject, c.id as courseId, 'Assignment' as type,
                IF(MAX(sub.id) IS NOT NULL, 'completed', 'pending') as status,
                MAX(sub.grade) as grade, MAX(sub.feedback) as feedback, MAX(sub.status) as sub_status, MAX(sub.file_url) as file_url
            FROM assignments a
            JOIN modules m ON a.m_id = m.id
            JOIN classes_courses c ON m.c_id = c.id
            JOIN enrollments e ON c.id = e.c_id
            LEFT JOIN assignment_submissions sub ON a.id = sub.a_id AND sub.s_id = ?
            WHERE e.s_id = ? AND e.status = 'In Progress' AND c.status IN ('active', 'completed')
            GROUP BY a.id, a.title, a.deadline, a.publish_at, a.max_marks, c.title, c.id
        `, [studentId, studentId]);

        // 2. Fetch ALL Quizzes in one query (checks submission status)
        const quizzes = await query(`
            SELECT 
                q.id, COALESCE(NULLIF(q.title, ''), CONCAT('Quiz #', q.number)) as title, q.time_limit, q.publish_at,
                c.title as subject, c.id as courseId, 'Quiz' as type,
                IF(MAX(sub.status) = 'submitted', 'completed', 'pending') as status,
                MAX(sub.score) as grade, q.allow_review
            FROM quizes q
            JOIN modules m ON q.m_id = m.id
            JOIN classes_courses c ON m.c_id = c.id
            JOIN enrollments e ON c.id = e.c_id
            LEFT JOIN quiz_submissions sub ON q.id = sub.qz_id AND sub.s_id = ?
            WHERE e.s_id = ? AND e.status = 'In Progress' AND c.status IN ('active', 'completed')
            GROUP BY q.id, q.number, q.time_limit, q.publish_at, q.allow_review, c.title, c.id
        `, [studentId, studentId]);

        // Combine and send back as one clean array
        res.json([...assignments, ...quizzes]);
    } catch (err) {
        console.error("Assessments fetch error:", err);
        res.status(500).json({ error: "Failed to fetch assessments" });
    }
});

// GET scheduled live classes for courses the student is enrolled in
router.get('/student/liveclasses', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        const studentId = studentRes[0].id;

        const liveClasses = await query(`
            SELECT 
                lc.id,
                lc.c_id,
                lc.title,
                DATE_FORMAT(lc.scheduled_date, '%Y-%m-%d') AS scheduled_date,
                lc.start_time,
                lc.duration_minutes,
                lc.meeting_link,
                lc.status,
                c.title AS course_title,
                c.theme_color,
                u.name AS teacher_name
            FROM live_classes lc
            JOIN classes_courses c ON lc.c_id = c.id
            JOIN enrollments e ON c.id = e.c_id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE e.s_id = ? AND lc.status = 'scheduled' AND c.status IN ('active', 'completed')
            ORDER BY lc.scheduled_date ASC, lc.start_time ASC
        `, [studentId]);

        res.status(200).json(liveClasses);
    } catch (err) {
        console.error("Error fetching student live classes:", err);
        res.status(500).json({ error: "Failed to fetch live classes" });
    }
});
// GET enrolled students for a specific course
router.get('/courses/:id/students', requireAuth, async (req, res) => {
    try {
        const courseId = req.params.id;
        const students = await query(`
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.picture AS profile_image,
                e.enrolled_date, 
                e.status
            FROM enrollments e
            JOIN students s ON e.s_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE e.c_id = ? AND u.role_id = 3
            ORDER BY e.enrolled_date DESC
        `, [courseId]);
        
        res.status(200).json(students);
    } catch (err) {
        console.error("Error fetching enrolled students:", err);
        res.status(500).json({ error: "Failed to fetch enrolled students" });
    }
});

export default router;
