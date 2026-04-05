import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// --- TEACHER: CREATE QUIZ ---
router.post('/modules/:mId/quizzes', async (req, res) => {
    const { mId } = req.params;
    const { number, time_limit, is_peer_reviewed } = req.body;

    try {
        const result = await query(
            'INSERT INTO quizes (m_id, number, time_limit, is_peer_reviewed) VALUES (?, ?, ?, ?)',
            [mId, number, time_limit || '00:30:00', is_peer_reviewed || false]
        );
        res.status(201).json({ id: result.insertId, message: 'Quiz created successfully' });
    } catch (err) {
        console.error('Error creating quiz:', err);
        res.status(500).json({ error: 'Failed to create quiz' });
    }
});

// --- TEACHER: ADD QUESTION TO BANK ---
router.post('/courses/:cId/questions', async (req, res) => {
    const { cId } = req.params;
    const { type, marks, question, t_id, options } = req.body;

    try {
        // 1. Insert question into question_bank
        const qResult = await query(
            'INSERT INTO question_bank (type, marks, question, c_id, t_id) VALUES (?, ?, ?, ?, ?)',
            [type, marks, question, cId, t_id]
        );
        const qId = qResult.insertId;

        // 2. Insert options into answers table
        if (options && options.length > 0) {
            for (let opt of options) {
                await query(
                    'INSERT INTO answers (answer, correct, q_id) VALUES (?, ?, ?)',
                    [opt.answer, opt.correct, qId]
                );
            }
        }

        res.status(201).json({ id: qId, message: 'Question added to bank' });
    } catch (err) {
        console.error('Error adding question:', err);
        res.status(500).json({ error: 'Failed to add question' });
    }
});

// --- TEACHER: LINK QUESTION TO QUIZ ---
router.post('/quizzes/:qzId/questions', async (req, res) => {
    const { qzId } = req.params;
    const { qId } = req.body;

    try {
        await query('INSERT INTO quiz_questions (qz_id, q_id) VALUES (?, ?)', [qzId, qId]);
        res.status(201).json({ message: 'Question linked to quiz' });
    } catch (err) {
        console.error('Error linking question:', err);
        res.status(500).json({ error: 'Failed to link question' });
    }
});

// --- GET QUIZ DETAILS (FOR STUDENT/TEACHER) ---
router.get('/quizzes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const quizRes = await query('SELECT * FROM quizes WHERE id = ?', [id]);
        if (quizRes.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        
        const quiz = quizRes[0];

        // Fetch questions for this quiz
        const questions = await query(`
            SELECT qb.* 
            FROM question_bank qb
            JOIN quiz_questions qq ON qb.id = qq.q_id
            WHERE qq.qz_id = ?
        `, [id]);

        // Fetch options for each question
        for (let q of questions) {
            const options = await query('SELECT id, answer, correct FROM answers WHERE q_id = ?', [q.id]);
            q.options = options;
        }

        quiz.questions = questions;
        res.json(quiz);
    } catch (err) {
        console.error('Error fetching quiz:', err);
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// --- STUDENT: SUBMIT QUIZ (AUTO-GRADING) ---
router.post('/quizzes/:qzId/submit', async (req, res) => {
    const { qzId } = req.params;
    const { userId, answers: studentAnswers } = req.body; // studentAnswers: [{qId: 1, aId: 10}, ...]

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student profile not found' });
        const sId = studentRes[0].id;

        // 1. Create a submission record
        const subResult = await query(
            'INSERT INTO quiz_submissions (qz_id, s_id) VALUES (?, ?)',
            [qzId, sId]
        );
        const submissionId = subResult.insertId;

        let totalScore = 0;

        // 2. Process answers and calculate score
        for (let sa of studentAnswers) {
            // Save answer
            await query(
                'INSERT INTO student_quiz_answers (submission_id, q_id, a_id) VALUES (?, ?, ?)',
                [submissionId, sa.qId, sa.aId]
            );

            // Check correctness
            const correctOpt = await query('SELECT correct, marks FROM answers a JOIN question_bank qb ON a.q_id = qb.id WHERE a.id = ? AND a.q_id = ?', [sa.aId, sa.qId]);
            
            if (correctOpt.length > 0 && correctOpt[0].correct) {
                // Fetch marks for the question (already joined above)
                const marksRes = await query('SELECT marks FROM question_bank WHERE id = ?', [sa.qId]);
                if (marksRes.length > 0) {
                    totalScore += parseFloat(marksRes[0].marks);
                }
            }
        }

        // 3. Update total score in submission
        await query('UPDATE quiz_submissions SET score = ? WHERE id = ?', [totalScore, submissionId]);

        res.json({ 
            message: 'Quiz submitted successfully', 
            submissionId, 
            score: totalScore 
        });
    } catch (err) {
        console.error('Error submitting quiz:', err);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

// --- GET ALL QUIZZES FOR A MODULE ---
router.get('/modules/:mId/quizzes', async (req, res) => {
    const { mId } = req.params;
    try {
        const quizzes = await query('SELECT * FROM quizes WHERE m_id = ? ORDER BY number ASC', [mId]);
        res.json(quizzes);
    } catch (err) {
        console.error('Error fetching quizzes:', err);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

export default router;
