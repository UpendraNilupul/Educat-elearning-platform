import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// GET all courses
router.get('/courses', async (req, res) => {
    try {
        const courses = await query('SELECT * FROM classes_courses ORDER BY id DESC');
        for (let course of courses) {
            const modules = await query('SELECT * FROM modules WHERE c_id = ? ORDER BY id ASC', [course.id]);
            course.chapters = modules.map(m => ({ id: m.id, title: m.title, isVisible: m.isVisible === 1 }));
            for (let mod of course.chapters) {
                const resources = await query('SELECT * FROM resources WHERE m_id = ? ORDER BY id ASC', [mod.id]);
                mod.resources = resources.map(r => ({
                    id: r.id, title: r.name, type: r.type || 'pdf', url: r.link
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
    const { name, title, type, status, is_published, theme_color, thumbnail_url, userId } = req.body;
    
    try {
        // Fetch teacher associated with this user
        let t_id = 1; // Fallback, but we should find the actual teacher
        if (userId) {
            const tRes = await query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
            if (tRes.length > 0) t_id = tRes[0].id;
            else return res.status(404).json({ message: 'Teacher profile not found for user' });
        }

        const insertQuery = `
            INSERT INTO classes_courses 
            (name, title, type, status, is_published, theme_color, thumbnail_url, t_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [name, title, type, status, is_published ? 1 : 0, theme_color, thumbnail_url, t_id];
        
        const result = await query(insertQuery, values);
        
        res.status(201).json({ 
            id: result.insertId, 
            name, title, type, status, is_published, theme_color, thumbnail_url, t_id 
        });
    } catch (err) {
        console.error('Error creating course:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// PUT (update) a course
router.put('/courses/:id', (req, res) => {
    const { id } = req.params;
    const { name, title, type, status, is_published, theme_color, thumbnail_url } = req.body;
    
    const query = `
        UPDATE classes_courses 
        SET name = ?, title = ?, type = ?, status = ?, is_published = ?, theme_color = ?, thumbnail_url = ?
        WHERE id = ?
    `;
    
    const values = [name, title, type, status, is_published ? 1 : 0, theme_color, thumbnail_url, id];
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error updating course:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ id, name, title, type, status, is_published, theme_color, thumbnail_url });
    });
});

// DELETE a course
router.delete('/courses/:id', (req, res) => {
    const { id } = req.params;
    const delQuery = 'DELETE FROM classes_courses WHERE id = ?';
    
    db.query(delQuery, [id], (err, result) => {
        if (err) {
            console.error('Error deleting course:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.status(200).json({ message: 'Course deleted successfully' });
    });
});

// --- MODULES / CHAPTERS ---
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
        await query('DELETE FROM modules WHERE id = ?', [req.params.id]);
        res.status(200).json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Error deleting module:', err);
        res.status(500).json({ message: 'Error deleting module' });
    }
});

// --- RESOURCES ---
router.post('/modules/:m_id/resources', async (req, res) => {
    const { title, type, url } = req.body;
    try {
        const result = await query('INSERT INTO resources (name, type, link, m_id, number) VALUES (?, ?, ?, ?, ?)', [title, type, url, req.params.m_id, 1]);
        res.status(201).json({ id: result.insertId, title, type, url, m_id: req.params.m_id });
    } catch (err) {
        console.error('Error adding resource:', err);
        res.status(500).json({ message: 'Error adding resource' });
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
