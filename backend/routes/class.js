import express from 'express';
import db from '../db.js';
import util from 'util';

const query = util.promisify(db.query).bind(db);
const router = express.Router();

// 1. GET ENROLLED CLASSES
router.get('/student/classes', async (req, res) => {
    const userId = req.session?.userId || req.query.userId;
    if (!userId) return res.status(200).json([]);

    try {
        const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [userId]);
        if (studentRes.length === 0) return res.status(200).json([]);

        const studentId = studentRes[0].id;

        const classes = await query(`
            SELECT 
                c.id, c.status, c.title AS grade, c.title AS subject, c.monthly_fee, c.thumbnail_url,
                t.id AS teacher_id, u.name AS teacher_name, u.picture AS teacher_image
            FROM classes_courses c
            JOIN enrollments e ON c.id = e.c_id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE e.s_id = ? AND e.status = 'In Progress' AND c.status IN ('active', 'completed')
            GROUP BY c.id
        `, [studentId]);

        if (classes.length === 0) {
            return res.status(200).json([]);
        }

        // STEP 3: Build the JSON for React
        const enrolledClasses = [];

        for (let cls of classes) {

            // 🔴 මෙතන තිබුණු AND status = 'active' කියන එක අයින් කළා
            const modules = await query(`
                SELECT id, title AS name, title AS topics 
                FROM modules 
                WHERE c_id = ? AND isVisible = 1
                ORDER BY number ASC
            `, [cls.id]);

            const monthsData = [];

            for (let mod of modules) {

                const lessons = await query('SELECT id, title FROM lessons WHERE m_id = ? AND isVisible = 1 ORDER BY number ASC', [mod.id]);
                
                for (let lesson of lessons) {
                    const resources = await query('SELECT id, name, link, type FROM resources WHERE l_id = ? AND isVisible = 1 ORDER BY number ASC', [lesson.id]);
                    lesson.resources = resources;
                }

                const payments = await query(`
            SELECT id FROM payments
            WHERE c_id = ? AND s_id = ? AND status = 'completed'
        `, [cls.id, studentId]);

                const isPaid = payments.length > 0;

                const quizzes = await query(`
                    SELECT * FROM quizes WHERE m_id = ? ORDER BY number ASC
                `, [mod.id]);

                monthsData.push({
                    id: mod.id,
                    name: mod.name,
                    isPaid: isPaid,
                    topics: mod.topics,
                    lessons: lessons,
                    assignments: await Promise.all((await query(`
                        SELECT a.*, sub.status as submissionStatus, sub.grade as submissionGrade, sub.feedback as submissionFeedback
                        FROM assignments a
                        LEFT JOIN assignment_submissions sub ON a.id = sub.a_id AND sub.s_id = ?
                        WHERE a.m_id = ?
                        ORDER BY a.created_at DESC
                    `, [studentId, mod.id])).map(async (a) => {
                        const attachments = await query('SELECT file_url FROM assignment_attachments WHERE a_id = ?', [a.id]);
                        return {
                            id: a.id,
                            title: a.title,
                            description: a.description,
                            deadline: a.deadline,
                            maxMarks: a.max_marks,
                            attachments: attachments.map(att => att.file_url),
                            submission: a.submissionStatus ? {
                                status: a.submissionStatus,
                                grade: a.submissionGrade,
                                feedback: a.submissionFeedback
                            } : null
                        };
                    })),
                    quizzes: quizzes.map(q => ({
                        id: q.id,
                        title: q.title,
                        number: q.number,
                        timeLimit: q.time_limit,
                        publish_at: q.publish_at
                    }))
                });
            }

            if (modules.length === 0) {
                const payments = await query(`
                    SELECT id FROM payments
                    WHERE c_id = ? AND s_id = ? AND status = 'completed'
                `, [cls.id, studentId]);

                monthsData.push({
                    id: `m-dummy-${cls.id}`,
                    name: 'Introduction',
                    isPaid: payments.length > 0,
                    topics: 'Course Introduction',
                    lessons: [],
                    assignments: [],
                    quizzes: []
                });
            }

            enrolledClasses.push({
                id: cls.id,
                grade: cls.grade || 'Grade',
                subject: cls.subject,
                status: cls.status,
                thumbnail: cls.thumbnail_url || null,
                teacher: {
                    name: cls.teacher_name,
                    image: cls.teacher_image || `https://ui-avatars.com/api/?name=${cls.teacher_name.replace(/ /g, '+')}&background=4a0b59&color=fff`
                },
                monthlyFee: cls.monthly_fee || 2500,
                schedule: cls.generated_schedule || cls.schedule_text || 'Schedule TBA',
                zoomLink: cls.zoomLink || '#',
                studentsCount: cls.studentsCount,
                months: monthsData
            });
        }

        res.status(200).json(enrolledClasses);

    } catch (error) {
        console.error("Error in /student/classes:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. GET SUGGESTED CLASSES
router.get('/suggested-classes', async (req, res) => {
    try {
        const userId = req.session?.userId || req.query.userId;
        let excludeQuery = "WHERE c.status = 'active'";
        let queryParams = [];

        if (userId) {
            const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [userId]);
            if (studentRes.length > 0) {
                excludeQuery = `WHERE c.status = 'active' AND c.id NOT IN (SELECT c_id FROM enrollments WHERE s_id = ?)`;
                queryParams.push(studentRes[0].id);
            }
        }

        const suggested = await query(`
            SELECT 
                c.id, c.grade AS grade, c.title AS subject, c.monthly_fee, c.thumbnail_url,
                u.name AS teacher_name, u.picture AS teacher_image
            FROM classes_courses c
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            ${excludeQuery}
            ORDER BY c.id DESC
            LIMIT 10
        `, queryParams);

        const formatted = suggested.map(cls => ({
            id: cls.id,
            grade: cls.grade || 'Grade',
            subject: cls.subject,
            thumbnail: cls.thumbnail_url || null,
            monthlyFee: cls.monthly_fee || 2500,
            teacher: {
                name: cls.teacher_name,
                image: cls.teacher_image || `https://ui-avatars.com/api/?name=${cls.teacher_name.replace(/ /g, '+')}`
            },
            months: [{ id: `m-sug-${cls.id}`, name: 'Intro', isPaid: false }]
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error("Error in /suggested-classes:", error);
        res.status(500).json({ error: error.message });
    }
});



// 3. POST STUDENT FEEDBACK
router.post('/reviews', async (req, res) => {
    try {
        const { title, description, rating, survey_responses, c_id, s_id } = req.body;
        
        // Ensure student exists
        let studentId = s_id;
        const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [s_id]);
        if (studentRes.length > 0) {
            studentId = studentRes[0].id;
        }

        // Check if student already reviewed this class
        const existingReview = await query(`SELECT id FROM reviews WHERE c_id = ? AND s_id = ?`, [c_id, studentId]);
        if (existingReview.length > 0) {
            return res.status(409).json({ error: 'Duplicate: You have already submitted a review for this class.' });
        }

        await query(
            'INSERT INTO reviews (title, description, rating, survey_responses, c_id, s_id) VALUES (?, ?, ?, ?, ?, ?)',
            [title || 'Review', description, rating, JSON.stringify(survey_responses), c_id, studentId]
        );
        res.status(200).json({ success: true, message: 'Review added successfully' });
    } catch (error) {
        console.error("Error in /reviews:", error);
        res.status(500).json({ error: error.message });
    }
});

// 4. GET CHECK REVIEW STATUS
router.get('/reviews/check/:classId/:userId', async (req, res) => {
    try {
        const { classId, userId } = req.params;
        
        let studentId = userId;
        const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [userId]);
        if (studentRes.length > 0) {
            studentId = studentRes[0].id;
        }

        const existingReview = await query(`SELECT id FROM reviews WHERE c_id = ? AND s_id = ?`, [classId, studentId]);
        res.status(200).json({ hasReviewed: existingReview.length > 0 });
    } catch (error) {
        console.error("Error checking review status:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;