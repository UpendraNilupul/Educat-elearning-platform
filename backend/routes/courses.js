import express from 'express';
import db from '../db.js';
import util from 'util';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/resources';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

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
                    const mappedLesson = { id: les.id, type: les.type, link: les.link, number: les.number, title: les.title };
                    const resources = await query('SELECT * FROM resources WHERE l_id = ? ORDER BY number ASC, id ASC', [les.id]);
                    mappedLesson.resources = resources.map(r => ({
                        id: r.id, title: r.name, type: r.type || 'pdf', url: r.link
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
                        maxMarks: a.max_marks
                    };
                }));

                const quizzes = await query('SELECT * FROM quizes WHERE m_id = ? ORDER BY number ASC', [mod.id]);
                mod.quizzes = quizzes.map(q => ({
                    id: q.id,
                    number: q.number,
                    timeLimit: q.time_limit,
                    isPeerReviewed: q.is_peer_reviewed === 1
                }));
            }
        }
        res.status(200).json(courses);
    } catch (err) {
        console.error('Error fetching courses:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST a new course
router.post('/courses', async (req, res) => {
    const { name, title, type, status, is_published, theme_color, thumbnail_url, students, progress, userId } = req.body;
    try {
        const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
        const actualTeacherId = tRes.length > 0 ? tRes[0].id : 0;
        
        const result = await query(
            'INSERT INTO classes_courses (name, title, type, status, is_published, theme_color, thumbnail_url, students, modules, progress, t_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [name, title, type, status, is_published ? 1 : 0, theme_color, thumbnail_url, students || 0, 0, progress || 0, actualTeacherId]
        );
        res.status(201).json({ id: result.insertId, ...req.body, t_id: actualTeacherId });
    } catch (err) {
        console.error('Error creating course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PUT (update) a course
router.put('/courses/:id', async (req, res) => {
    const { id } = req.params;
    const { name, title, type, status, is_published, theme_color, thumbnail_url } = req.body;
    
    const updateQuery = `
        UPDATE classes_courses 
        SET name = ?, title = ?, type = ?, status = ?, is_published = ?, theme_color = ?, thumbnail_url = ?
        WHERE id = ?
    `;
    
    const values = [name, title, type, status, is_published ? 1 : 0, theme_color, thumbnail_url, id];
    
    try {
        const result = await query(updateQuery, values);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ id: parseInt(id), name, title, type, status, is_published, theme_color, thumbnail_url });
    } catch (err) {
        console.error('Error updating course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// DELETE a course
router.delete('/courses/:id', async (req, res) => {
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
router.put('/courses/:c_id/modules/reorder', async (req, res) => {
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

router.post('/modules', async (req, res) => {
    const { title, c_id, isVisible } = req.body;
    try {
        const result = await query('INSERT INTO modules (title, c_id, number, isVisible) VALUES (?, ?, ?, ?)', [title, c_id, 1, isVisible ? 1 : 0]);
        res.status(201).json({ id: result.insertId, title, isVisible: isVisible ? true : false, resources: [] });
    } catch (err) {
        console.error('Error adding module:', err);
        res.status(500).json({ message: 'Error adding module' });
    }
});

router.put('/modules/:id', async (req, res) => {
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

router.delete('/modules/:id', async (req, res) => {
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

router.post('/modules/:m_id/lessons', async (req, res) => {
    const { title } = req.body;
    try {
        const result = await query('INSERT INTO lessons (title, number, type, link, m_id) VALUES (?, ?, ?, ?, ?)', [title, 1, 'standard', '', req.params.m_id]);
        res.status(201).json({ id: result.insertId, title, type: 'standard', link: '', number: 1, m_id: req.params.m_id, resources: [] });
    } catch (err) {
        console.error('Error adding lesson:', err);
        res.status(500).json({ message: 'Error adding lesson' });
    }
});

// --- RESOURCES ---
router.post('/lessons/:l_id/resources', upload.single('file'), async (req, res) => {
    const { title, type } = req.body;
    let url = req.body.url || '';
    
    if (req.file) {
        url = `http://localhost:3000/uploads/resources/${req.file.filename}`;
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

router.put('/modules/:m_id/lessons/reorder', async (req, res) => {
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

router.put('/lessons/:l_id/resources/reorder', async (req, res) => {
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
            c.theme_color, 
            c.thumbnail_url, 
            u.name AS teacher_name 
        FROM classes_courses c 
        JOIN teachers t ON c.t_id = t.id 
        JOIN users u ON t.user_id = u.id 
        WHERE c.is_published = TRUE
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
