import express from 'express';
import db from '../db.js';

const router = express.Router();

// Get all teachers from database
router.get('/teachers', (req, res) => {
    const query = 'SELECT id, name, picture, email FROM users WHERE role = ?';
    
    db.query(query, ['teacher'], (err, results) => {
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
    const query = 'SELECT id, name, picture, email FROM users WHERE id = ? AND role = ?';
    
    db.query(query, [id, 'teacher'], (err, results) => {
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

export default router;
