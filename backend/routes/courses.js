import express from 'express';
import db from '../db.js';

const router = express.Router();

// GET all courses
router.get('/', (req, res) => {
    const query = 'SELECT * FROM classes_courses';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching courses:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(200).json(results);
    });
});

// POST a new course
router.post('/', (req, res) => {
    // For now we will hardcode t_id as 1 (assuming teacher ID 1 exists) or fall back since the frontend isn't passing it yet.
    // In a real app, you would get this from req.session.userId or similar
    const t_id = 1; 

    const { name, title, type, status, is_published, theme_color, thumbnail_url } = req.body;
    
    // We expect these fields based on the updated TeachersCourse form
    const query = `
        INSERT INTO classes_courses 
        (name, title, type, status, is_published, theme_color, thumbnail_url, t_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [name, title, type, status, is_published ? 1 : 0, theme_color, thumbnail_url, t_id];
    
    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error creating course:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        res.status(201).json({ 
            id: result.insertId, 
            name, title, type, status, is_published, theme_color, thumbnail_url, t_id 
        });
    });
});

// PUT (update) a course
router.put('/:id', (req, res) => {
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
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM classes_courses WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
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

export default router;
