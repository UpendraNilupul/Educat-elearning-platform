import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// --- TEACHER: CREATE QUIZ ---
router.post('/modules/:mId/quizzes', async (req, res) => {
    const { mId } = req.params;
    const { title, number, time_limit, publish_at } = req.body;

    try {
        const result = await query(
            'INSERT INTO quizes (m_id, title, number, time_limit, is_peer_reviewed, publish_at) VALUES (?, ?, ?, ?, ?, ?)',
            [mId, title || null, number, time_limit || '00:30:00', false, publish_at || null]
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
        quiz.title = quiz.title || `Quiz #${quiz.number}`;

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
            q.options = options.map(opt => ({
                id: opt.id,
                answer: opt.answer,
                correct: opt.correct === 1
            }));
        }

        quiz.questions = questions;
        res.json(quiz);
    } catch (err) {
        console.error('Error fetching quiz:', err);
        res.status(500).json({ error: 'Failed to fetch quiz' });
    }
});

// --- STUDENT: START OR RESUME QUIZ ---
router.post('/quizzes/:id/start', async (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student profile not found' });
        const sId = studentRes[0].id;

        // Fetch quiz metadata
        const quizRes = await query('SELECT * FROM quizes WHERE id = ?', [id]);
        if (quizRes.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        const quiz = quizRes[0];
        quiz.title = quiz.title || `Quiz #${quiz.number}`;

        if (quiz.publish_at) {
            const publishDate = new Date(quiz.publish_at);
            if (publishDate > new Date()) {
                return res.status(403).json({ error: 'Quiz is not yet published and cannot be accessed.' });
            }

            let timeLimitMs = 0;
            if (quiz.time_limit) {
                const parts = quiz.time_limit.split(':');
                timeLimitMs = ((parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2])) * 1000;
            }

            if (new Date() > new Date(publishDate.getTime() + timeLimitMs)) {
                return res.status(403).json({ error: 'The quiz deadline has passed and it can no longer be started.' });
            }
        }

        // Check if the student has already submitted this quiz
        const submittedRes = await query(
            "SELECT id FROM quiz_submissions WHERE qz_id = ? AND s_id = ? AND status = 'submitted' LIMIT 1",
            [id, sId]
        );
        if (submittedRes.length > 0) {
            return res.status(403).json({ error: 'You have already completed this quiz.' });
        }

        // Check if there is an in-progress submission
        const subRes = await query(
            "SELECT * FROM quiz_submissions WHERE qz_id = ? AND s_id = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
            [id, sId]
        );

        let submission;
        let remainingTime = null;
        let savedState = { studentAnswers: {}, currentQuestionIdx: 0 };

        if (subRes.length > 0) {
            submission = subRes[0];
            if (submission.saved_state) {
                try {
                    savedState = typeof submission.saved_state === 'string' ? JSON.parse(submission.saved_state) : submission.saved_state;
                } catch (e) {
                    console.error("Failed to parse saved_state");
                }
            }

            if (quiz.time_limit) {
                const parts = quiz.time_limit.split(':');
                const timeLimitSecs = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
                const startedAt = new Date(submission.started_at);
                const now = new Date();
                const elapsedSecs = Math.floor((now - startedAt) / 1000);
                remainingTime = Math.max(0, timeLimitSecs - elapsedSecs);

                // If time expired on backend, we could auto-submit here, but let's let frontend handle it for now
                // or just send 0 so frontend auto-submits immediately.
            }
        } else {
            // Create a new submission
            const insertRes = await query(
                "INSERT INTO quiz_submissions (qz_id, s_id, status, started_at) VALUES (?, ?, 'in_progress', NOW())",
                [id, sId]
            );
            submission = { id: insertRes.insertId };

            if (quiz.time_limit) {
                const parts = quiz.time_limit.split(':');
                remainingTime = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + parseInt(parts[2]);
            }
        }

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
            q.options = options.map(opt => ({
                id: opt.id,
                answer: opt.answer,
                // Don't send correct answers to the student
            }));
        }

        quiz.questions = questions;
        quiz.remainingTime = remainingTime;
        quiz.savedState = savedState;

        res.json(quiz);
    } catch (err) {
        console.error('Error starting quiz:', err);
        res.status(500).json({ error: 'Failed to start quiz' });
    }
});

// --- STUDENT: SAVE PROGRESS ---
router.put('/quizzes/:id/progress', async (req, res) => {
    const { id } = req.params;
    const { userId, savedState } = req.body;

    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student profile not found' });
        const sId = studentRes[0].id;

        await query(
            "UPDATE quiz_submissions SET saved_state = ? WHERE qz_id = ? AND s_id = ? AND status = 'in_progress'",
            [JSON.stringify(savedState), id, sId]
        );

        res.json({ message: 'Progress saved successfully' });
    } catch (err) {
        console.error('Error saving progress:', err);
        res.status(500).json({ error: 'Failed to save progress' });
    }
});

// --- GET QUIZ REVIEW (FOR STUDENT) ---
router.get('/quizzes/:id/review/:userId', async (req, res) => {
    const { id, userId } = req.params;
    try {
        const studentRes = await query('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (studentRes.length === 0) return res.status(404).json({ error: 'Student not found' });
        const sId = studentRes[0].id;

        // 1. Fetch the quiz
        const quizRes = await query('SELECT * FROM quizes WHERE id = ?', [id]);
        if (quizRes.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        const quiz = quizRes[0];
        quiz.title = quiz.title || `Quiz #${quiz.number}`;

        // 2. Fetch questions with ALL options and flag which ones are correct
        const questions = await query(`
            SELECT qb.* 
            FROM question_bank qb
            JOIN quiz_questions qq ON qb.id = qq.q_id
            WHERE qq.qz_id = ?
        `, [id]);

        for (let q of questions) {
            const options = await query('SELECT id, answer, correct FROM answers WHERE q_id = ?', [q.id]);
            // Convert correct to boolean for the frontend review logic
            q.options = options.map(opt => ({
                id: opt.id,
                answer: opt.answer,
                correct: opt.correct === 1
            }));
        }
        quiz.questions = questions;

        // 3. Fetch student's answers for this quiz
        const submission = await query(`
            SELECT id, score FROM quiz_submissions WHERE qz_id = ? AND s_id = ?
        `, [id, sId]);

        let studentAnswers = {};
        if (submission.length > 0) {
            const subId = submission[0].id;
            const answers = await query(`
                SELECT sa.q_id, sa.a_id 
                FROM student_quiz_answers sa
                WHERE sa.submission_id = ?
            `, [subId]);

            // Format into { qId: aId } or { qId: [aId1, aId2] }
            answers.forEach(ans => {
                const qType = questions.find(q => q.id === ans.q_id)?.type;
                if (qType === 'multiple') {
                    if (!studentAnswers[ans.q_id]) studentAnswers[ans.q_id] = [];
                    studentAnswers[ans.q_id].push(ans.a_id);
                } else {
                    studentAnswers[ans.q_id] = ans.a_id;
                }
            });

            // Add score to the response
            quiz.score = submission[0].score;
        }

        res.json({ quiz, studentAnswers });
    } catch (err) {
        console.error('Error fetching quiz review:', err);
        res.status(500).json({ error: 'Failed to fetch quiz review' });
    }
});

// --- GET QUIZ DETAILS AND QUESTIONS (WITHOUT CORRECT ANSWERS) ---
router.get('/quizzes/:id/questions', async (req, res) => {
    const { id } = req.params;
    try {
        const quizRes = await query('SELECT * FROM quizes WHERE id = ?', [id]);
        if (quizRes.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        const quiz = quizRes[0];
        quiz.title = quiz.title || `Quiz #${quiz.number}`;

        // Check if quiz is published
        if (quiz.publish_at && new Date(quiz.publish_at) > new Date()) {
            return res.status(403).json({ error: 'Quiz is not yet published and cannot be accessed.' });
        }

        // Fetch questions for this quiz
        const questions = await query(`
            SELECT qb.* 
            FROM question_bank qb
            JOIN quiz_questions qq ON qb.id = qq.q_id
            WHERE qq.qz_id = ?
        `, [id]);

        // Fetch options for each question
        for (let q of questions) {
            const options = await query('SELECT id, answer FROM answers WHERE q_id = ?', [q.id]);
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

        // Find the in-progress submission
        const subRes = await query(
            "SELECT id FROM quiz_submissions WHERE qz_id = ? AND s_id = ? AND status = 'in_progress' ORDER BY id DESC LIMIT 1",
            [qzId, sId]
        );

        let submissionId;
        if (subRes.length > 0) {
            submissionId = subRes[0].id;
            // Clear saved_state and update status
            await query("UPDATE quiz_submissions SET status = 'submitted', submitted_at = NOW(), saved_state = NULL WHERE id = ?", [submissionId]);
        } else {
            // Fallback: Create a submission record if missing
            const insertResult = await query(
                "INSERT INTO quiz_submissions (qz_id, s_id, status, submitted_at) VALUES (?, ?, 'submitted', NOW())",
                [qzId, sId]
            );
            submissionId = insertResult.insertId;
        }

        let totalScore = 0;

        // 2. Group answers by question and save to DB
        const groupedAnswers = {};
        for (let sa of studentAnswers) {
            if (!groupedAnswers[sa.qId]) {
                groupedAnswers[sa.qId] = [];
            }
            groupedAnswers[sa.qId].push(sa.aId);

            // Save individual answer mapping
            await query(
                'INSERT INTO student_quiz_answers (submission_id, q_id, a_id) VALUES (?, ?, ?)',
                [submissionId, sa.qId, sa.aId]
            );
        }

        // 3. Process grouped answers to calculate score
        for (let qIdStr in groupedAnswers) {
            const qId = parseInt(qIdStr);
            const selectedOptIds = groupedAnswers[qId];

            // Fetch question metadata
            const qMeta = await query('SELECT type, marks FROM question_bank WHERE id = ?', [qId]);
            if (qMeta.length === 0) continue;

            const { type, marks } = qMeta[0];
            const maxMarks = parseFloat(marks);

            // Fetch all options for this question
            const allOptions = await query('SELECT id, correct FROM answers WHERE q_id = ?', [qId]);

            let correctCount = 0;
            let incorrectCount = 0;
            const correctSet = new Set();
            const incorrectSet = new Set();

            for (let opt of allOptions) {
                if (opt.correct) {
                    correctCount++;
                    correctSet.add(opt.id);
                } else {
                    incorrectCount++;
                    incorrectSet.add(opt.id);
                }
            }

            // Calculate user's specific selections
            let userCorrectPicks = 0;
            let userIncorrectPicks = 0;

            for (let aId of selectedOptIds) {
                if (correctSet.has(aId)) {
                    userCorrectPicks++;
                } else if (incorrectSet.has(aId)) {
                    userIncorrectPicks++;
                }
            }

            let questionScore = 0;

            if (type === 'multiple') {
                // Checkbox: Partial credit + Penalty
                let reward = 0;
                let penalty = 0;

                if (correctCount > 0) {
                    reward = (maxMarks / correctCount) * userCorrectPicks;
                }
                if (incorrectCount > 0) {
                    penalty = (maxMarks / incorrectCount) * userIncorrectPicks;
                }

                questionScore = reward - penalty;
                if (questionScore < 0) questionScore = 0; // Floor limit
            } else {
                // Single/Dropdown: All or nothing
                if (userCorrectPicks > 0 && userIncorrectPicks === 0 && selectedOptIds.length === 1) {
                    questionScore = maxMarks;
                }
            }

            totalScore += questionScore;
        }

        // 4. Update total score in submission
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

// --- TEACHER: UPDATE QUIZ METADATA ---
router.put('/quizzes/:id', async (req, res) => {
    const { id } = req.params;
    const { title, number, time_limit, publish_at } = req.body;

    try {
        await query(
            'UPDATE quizes SET title = ?, number = ?, time_limit = ?, publish_at = ? WHERE id = ?',
            [title || null, number, time_limit, publish_at, id]
        );
        res.json({ message: 'Quiz updated successfully' });
    } catch (err) {
        console.error('Error updating quiz:', err);
        res.status(500).json({ error: 'Failed to update quiz' });
    }
});

// --- TEACHER: DELETE QUIZ ---
router.delete('/quizzes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Delete associated questions mapping
        await query('DELETE FROM quiz_questions WHERE qz_id = ?', [id]);

        // 2. Delete the quiz
        await query('DELETE FROM quizes WHERE id = ?', [id]);

        res.json({ message: 'Quiz deleted successfully' });
    } catch (err) {
        console.error('Error deleting quiz:', err);
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// --- TEACHER: UPDATE QUESTION ---
router.put('/questions/:id', async (req, res) => {
    const { id } = req.params;
    const { type, marks, question, options } = req.body;

    try {
        // 1. Update question_bank
        await query(
            'UPDATE question_bank SET type = ?, marks = ?, question = ? WHERE id = ?',
            [type, marks, question, id]
        );

        // 2. Update options gracefully to preserve a_id for past student submissions
        if (options && options.length > 0) {
            const existingOptionIds = options.filter(opt => opt.id).map(opt => opt.id);
            if (existingOptionIds.length > 0) {
                await query('DELETE FROM answers WHERE q_id = ? AND id NOT IN (?)', [id, existingOptionIds]);
            } else {
                await query('DELETE FROM answers WHERE q_id = ?', [id]);
            }

            for (let opt of options) {
                if (opt.id) {
                    await query(
                        'UPDATE answers SET answer = ?, correct = ? WHERE id = ? AND q_id = ?',
                        [opt.answer, opt.correct, opt.id, id]
                    );
                } else {
                    await query(
                        'INSERT INTO answers (answer, correct, q_id) VALUES (?, ?, ?)',
                        [opt.answer, opt.correct, id]
                    );
                }
            }
        }

        res.json({ message: 'Question updated successfully' });
    } catch (err) {
        console.error('Error updating question:', err);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

// --- TEACHER: UNLINK QUESTION FROM QUIZ ---
router.delete('/quizzes/:qzId/questions/:qId', async (req, res) => {
    const { qzId, qId } = req.params;
    try {
        await query('DELETE FROM quiz_questions WHERE qz_id = ? AND q_id = ?', [qzId, qId]);
        res.json({ message: 'Question removed from quiz' });
    } catch (err) {
        console.error('Error unlinking question:', err);
        res.status(500).json({ error: 'Failed to remove question' });
    }
});

export default router;
