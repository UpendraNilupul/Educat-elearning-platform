import express from 'express';
import db from '../db.js';
import multer from 'multer';
import path from 'path'; // Required for the file filter
import { assignmentStorage, submissionStorage } from '../cloudinaryConfig.js';
import util from 'util';
import { requireAuth, requireRole } from '../middleware/auth.js'; // 🌟 Auth Gatekeepers

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// 🌟 COMBINED FIX: Strict File Filter to prevent RCE vulnerabilities
const fileFilter = (req, file, cb) => {
    const filetypes = /pdf|doc|docx|zip|rar|jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('SECURITY BLOCKED: Only PDFs, Word Docs, ZIPs, and Images are allowed!'));
    }
};

const limits = { fileSize: 15 * 1024 * 1024 }; // Limit files to 15MB

// 🌟 COMBINED FIX: Use Cloudinary storage with our security limits
const assignmentUpload = multer({ storage: assignmentStorage, fileFilter, limits });
const submissionUpload = multer({ storage: submissionStorage, fileFilter, limits });

const toMySQLDateTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

// --- TEACHER: CREATE ASSIGNMENT ---
// 🌟 COMBINED FIX: Added auth gatekeeper (HEAD) + Cloudinary upload (Dev)
router.post('/modules/:mId/assignments', requireRole(['teacher', 'admin']), assignmentUpload.array('attachments'), async (req, res) => {
    const { mId } = req.params;
    const { title, description, deadline, max_marks, publish_at } = req.body;

    const formattedDeadline = toMySQLDateTime(deadline);
    const formattedPublishAt = toMySQLDateTime(publish_at);

    try {
        const result = await query(
            'INSERT INTO assignments (m_id, title, description, deadline, max_marks, publish_at) VALUES (?, ?, ?, ?, ?, ?)',
            [mId, title, description, formattedDeadline, max_marks || 100.00, formattedPublishAt]
        );
        const aId = result.insertId;

        const insertedAttachments = [];
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const file_url = file.path; // Cloudinary URL
                const attResult = await query(
                    'INSERT INTO assignment_attachments (a_id, file_url) VALUES (?, ?)',
                    [aId, file_url]
                );
                insertedAttachments.push({ id: attResult.insertId, file_url });
            }
        }

        res.status(201).json({
            id: aId,
            m_id: mId,
            title,
            description,
            deadline: formattedDeadline,
            max_marks: max_marks || 100.00,
            publish_at: formattedPublishAt,
            attachments: insertedAttachments,
            message: 'Assignment created successfully'
        });
    } catch (err) {
        console.error('Error creating assignment:', err);
        res.status(500).json({ error: 'Failed to create assignment' });
    }
});

// --- TEACHER: UPDATE ASSIGNMENT ---
router.put('/assignments/:id', assignmentUpload.array('attachments'), async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline, max_marks, publish_at } = req.body;
    const formattedDeadline = toMySQLDateTime(deadline);
    const formattedPublishAt = toMySQLDateTime(publish_at);

    try {
        await query(
            'UPDATE assignments SET title = ?, description = ?, deadline = ?, max_marks = ?, publish_at = ? WHERE id = ?',
            [title, description, formattedDeadline, max_marks, formattedPublishAt, id]
        );

        const newAttachments = [];
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const file_url = file.path;
                const attResult = await query(
                    'INSERT INTO assignment_attachments (a_id, file_url) VALUES (?, ?)',
                    [id, file_url]
                );
                newAttachments.push({ id: attResult.insertId, file_url });
            }
        }

        res.json({ message: 'Assignment updated successfully', newAttachments });
    } catch (err) {
        console.error('Error updating assignment:', err);
        res.status(500).json({ error: 'Failed to update assignment' });
    }
});

// --- TEACHER: DELETE ASSIGNMENT ---
router.delete('/assignments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Cascading delete handles attachments and submissions if FK is set up correctly
        await query('DELETE FROM assignments WHERE id = ?', [id]);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (err) {
        console.error('Error deleting assignment:', err);
        res.status(500).json({ error: 'Failed to delete assignment' });
    }
});

// --- TEACHER: REMOVE SINGLE ATTACHMENT ---
router.delete('/attachments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await query('DELETE FROM assignment_attachments WHERE id = ?', [id]);
        res.json({ message: 'Attachment removed successfully' });
    } catch (err) {
        console.error('Error removing attachment:', err);
        res.status(500).json({ error: 'Failed to remove attachment' });
    }
});

// --- TEACHER & STUDENT: GET ASSIGNMENTS FOR MODULE ---
router.get('/modules/:mId/assignments', requireAuth, async (req, res) => {
    const { mId } = req.params;
    const userId = req.session.userId;

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

                    // 🌟 COMBINED FIX: Map attachments correctly with IDs for the frontend
                    const attachments = await query('SELECT id, file_url FROM assignment_attachments WHERE a_id = ?', [assign.id]);
                    assign.attachments = attachments;
                }
            }
        } else {
            for (let assign of assignments) {
                const attachments = await query('SELECT id, file_url FROM assignment_attachments WHERE a_id = ?', [assign.id]);
                assign.attachments = attachments; // Array of objects {id, file_url}
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
        const attachments = await query('SELECT id, file_url FROM assignment_attachments WHERE a_id = ?', [id]);
        assign.attachments = attachments;

        // If requested by a student, fetch their submission
        if (req.session.userRole === 'student') {
            const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [req.session.userId]);
            if (studentRes.length > 0) {
                const sId = studentRes[0].id;
                const submission = await query(
                    'SELECT id, file_url, submitted_at, grade, feedback, status FROM assignment_submissions WHERE a_id = ? AND s_id = ?',
                    [assign.id, sId]
                );
                assign.userSubmission = submission.length > 0 ? submission[0] : null;
            }
        }

        res.json(assign);
    } catch (err) {
        console.error('Error fetching assignment:', err);
        res.status(500).json({ error: 'Failed to fetch assignment' });
    }
});

// --- STUDENT: SUBMIT ASSIGNMENT ---
// 🌟 COMBINED FIX: Added auth gatekeeper (HEAD) + Cloudinary upload (Dev)
router.post('/assignments/:aId/submit', requireRole(['student']), submissionUpload.single('submission'), async (req, res) => {
    const { aId } = req.params;
    const userId = req.session.userId;

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student profile not found' });
        const sId = studentRes[0].id;

        const file_url = req.file.path; // Cloudinary URL

        // Check if late submission
        const assignmentRes = await query('SELECT deadline FROM assignments WHERE id = ?', [aId]);
        if (assignmentRes.length === 0) return res.status(404).json({ error: 'Assignment not found' });

        if (new Date() > new Date(assignmentRes[0].deadline)) {
            return res.status(400).json({ error: 'Submissions are locked. The deadline has passed.' });
        }
        let submissionStatus = 'submitted';

        // Check if already submitted
        const existing = await query('SELECT id FROM assignment_submissions WHERE a_id = ? AND s_id = ?', [aId, sId]);

        if (existing.length > 0) {
            await query(
                'UPDATE assignment_submissions SET file_url = ?, submitted_at = NOW(), status = ? WHERE id = ?',
                [file_url, submissionStatus, existing[0].id]
            );
            res.json({ message: 'Submission updated successfully', status: submissionStatus });
        } else {
            await query(
                'INSERT INTO assignment_submissions (a_id, s_id, file_url, status) VALUES (?, ?, ?, ?)',
                [aId, sId, file_url, submissionStatus]
            );
            res.status(201).json({ message: 'Assignment submitted successfully', status: submissionStatus });
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
    const { grade, marks, feedback } = req.body;

    if (!id || id === 'undefined') {
        return res.status(400).json({ error: 'Valid submission ID is required.' });
    }

    const marksValue = grade !== undefined ? grade : marks;
    const parsedMarks = marksValue !== undefined && marksValue !== null && marksValue !== '' 
        ? Number(marksValue) 
        : null;

    if (parsedMarks !== null && isNaN(parsedMarks)) {
        return res.status(400).json({ error: 'Invalid grade/marks value provided.' });
    }

    try {
        const result = await query(
            'UPDATE assignment_submissions SET grade = ?, feedback = ?, status = "graded" WHERE id = ?',
            [parsedMarks, feedback ?? null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        res.json({ message: 'Submission graded successfully' });
    } catch (error) {
        console.error("Grading Error Detail:", error);
        res.status(500).json({ error: error.message || 'Failed to grade submission' });
    }
});

export default router;