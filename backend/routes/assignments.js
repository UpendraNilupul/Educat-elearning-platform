import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import util from 'util';
import { requireAuth, requireRole } from '../middleware/auth.js'; // 🌟 THE FIX: Auth Gatekeepers

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// --- MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = req.query.type === 'submission' ? 'submissions' : 'assignments';
        const dir = path.join(process.cwd(), 'uploads', type);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const prefix = req.query.type === 'submission' ? 'sub' : 'assign';
        cb(null, `${prefix}-${Date.now()}-${file.originalname}`);
    }
});

// 🌟 THE FIX: Strict File Filter to prevent RCE vulnerabilities
const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf|doc|docx|zip|rar|jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('SECURITY BLOCKED: Only PDFs, Word Docs, ZIPs, and Images are allowed!'));
        }
    },
    limits: { fileSize: 15 * 1024 * 1024 } // Limit files to 15MB to prevent storage exhaustion
});

// --- TEACHER: CREATE ASSIGNMENT ---
router.post('/modules/:mId/assignments', requireRole(['teacher', 'admin']), upload.array('attachments'), async (req, res) => {
    const { mId } = req.params;
    const { title, description, deadline, max_marks, publish_at } = req.body;
    
    const publishAtValue = (publish_at && publish_at.trim() !== "") ? publish_at : null;

    try {
        const result = await query(
            'INSERT INTO assignments (m_id, title, description, deadline, max_marks, publish_at) VALUES (?, ?, ?, ?, ?, ?)',
            [mId, title, description, deadline, max_marks || 100.00, publishAtValue]
        );
        const aId = result.insertId;

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const file_url = `/uploads/assignments/${file.filename}`;
                await query(
                    'INSERT INTO assignment_attachments (a_id, file_url) VALUES (?, ?)',
                    [aId, file_url]
                );
            }
        }

        res.status(201).json({ id: aId, message: 'Assignment created successfully' });
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});

// --- TEACHER & STUDENT: GET ASSIGNMENTS FOR MODULE ---
router.get('/modules/:mId/assignments', requireAuth, async (req, res) => {
    const { mId } = req.params;
    const userId = req.session.userId; // 🌟 THE FIX: Securely extract from session, not query params

    try {
        const assignments = await query('SELECT * FROM assignments WHERE m_id = ? ORDER BY created_at DESC', [mId]);
        
        if (req.session.userRole === 'student') {
            const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
            if (studentRes.length > 0) {
                const sId = studentRes[0].id;
                for (let assign of assignments) {
                    const submission = await query(
                        'SELECT id, file_url, submitted_at, grade, feedback, status FROM assignment_submissions WHERE a_id = ? AND s_id = ?',
                        [assign.id, sId]
                    );
                    assign.userSubmission = submission.length > 0 ? submission[0] : null;
                    
                    const attachments = await query('SELECT file_url FROM assignment_attachments WHERE a_id = ?', [assign.id]);
                    assign.attachments = attachments.map(att => att.file_url);
                }
            }
        } else {
            for (let assign of assignments) {
                const attachments = await query('SELECT file_url FROM assignment_attachments WHERE a_id = ?', [assign.id]);
                assign.attachments = attachments.map(att => att.file_url);
            }
        }

        res.json(assignments);
    } catch (err) {
        console.error('Error fetching assignments:', err);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// --- GET SINGLE ASSIGNMENT DETAILS ---
router.get('/assignments/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const assignments = await query('SELECT * FROM assignments WHERE id = ?', [id]);
        if (assignments.length === 0) return res.status(404).json({ error: 'Assignment not found' });
        
        const assign = assignments[0];
        const attachments = await query('SELECT file_url FROM assignment_attachments WHERE a_id = ?', [id]);
        assign.attachments = attachments.map(att => att.file_url);
        
        res.json(assign);
    } catch (err) {
        console.error('Error fetching assignment:', err);
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
});

// --- STUDENT: SUBMIT ASSIGNMENT ---
router.post('/assignments/:aId/submit', requireRole(['student']), upload.single('submission'), async (req, res) => {
    const { aId } = req.params;
    const userId = req.session.userId; // 🌟 THE FIX: Get ID strictly from cookie to prevent IDOR

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student profile not found' });
        const sId = studentRes[0].id;

        const file_url = `/uploads/submissions/${req.file.filename}`;

        const existing = await query('SELECT id FROM assignment_submissions WHERE a_id = ? AND s_id = ?', [aId, sId]);
        
        if (existing.length > 0) {
            await query(
                'UPDATE assignment_submissions SET file_url = ?, submitted_at = NOW(), status = "submitted" WHERE id = ?',
                [file_url, existing[0].id]
            );
            res.json({ message: 'Submission updated successfully' });
        } else {
            await query(
                'INSERT INTO assignment_submissions (a_id, s_id, file_url, status) VALUES (?, ?, ?, "submitted")',
                [aId, sId, file_url]
            );
            res.status(201).json({ message: 'Assignment submitted successfully' });
        }
    } catch (err) {
        console.error('Error submitting assignment:', err);
        res.status(500).json({ error: 'Failed to submit assignment' });
    }
});

// --- TEACHER: VIEW SUBMISSIONS FOR ASSIGNMENT ---
router.get('/assignments/:aId/submissions', requireRole(['teacher', 'admin']), async (req, res) => {
    const { aId } = req.params;

    try {
        const submissions = await query(`
            SELECT sub.*, u.name as student_name, u.email as student_email 
            FROM assignment_submissions sub
            JOIN students s ON sub.s_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE sub.a_id = ?
            ORDER BY sub.submitted_at DESC
        `, [aId]);
        res.json(submissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);
        res.status(500).json({ error: 'Failed to fetch submissions' });
    }
});

// --- TEACHER: GRADE SUBMISSION ---
router.put('/submissions/:id/grade', requireRole(['teacher', 'admin']), async (req, res) => {
    const { id } = req.params;
    const { grade, feedback } = req.body;

    try {
        await query(
            'UPDATE assignment_submissions SET grade = ?, feedback = ?, status = "graded" WHERE id = ?',
            [grade, feedback, id]
        );
        res.json({ message: 'Submission graded successfully' });
    } catch (err) {
        console.error('Error grading submission:', err);
        res.status(500).json({ error: 'Failed to grade submission' });
    }
});

export default router;