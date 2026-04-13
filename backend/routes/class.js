import express from 'express';
import db from '../db.js'; 
import util from 'util';

// 🌟 THE FIX: Set up the database query exactly like your server.js does!
const query = util.promisify(db.query).bind(db);
const router = express.Router();

// GET /api/student/classes
router.get('/student/classes', async (req, res) => {
    
    const userId = req.session?.userId || req.query.userId; 

    if (!userId) {
        return res.status(200).json([]); 
    }

    try {
        // STEP 1: Find the student profile ID
        const studentRes = await query(`SELECT id FROM students WHERE user_id = ?`, [userId]);

        if (studentRes.length === 0) {
            return res.status(404).json({ message: "Student profile not found." });
        }
        const studentId = studentRes[0].id;

        // STEP 2: Fetch enrolled classes
        const classes = await query(`
            SELECT 
                c.id, 
                c.name AS grade, 
                c.title AS subject,
                c.monthly_fee,
                c.schedule_text,
                t.id AS teacher_id,
                u.name AS teacher_name,
                u.picture AS teacher_image,
                tt.meeting_link AS zoomLink,
                CONCAT('Every ', DAYNAME(tt.scheduled_date), ' ', TIME_FORMAT(tt.start_time, '%h:%i %p')) AS generated_schedule,
                (SELECT COUNT(*) FROM enrollments WHERE c_id = c.id) AS studentsCount
            FROM classes_courses c
            JOIN enrollments e ON c.id = e.c_id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN timetables tt ON tt.c_id = c.id
            WHERE e.s_id = ? AND e.status = 'In Progress'
            GROUP BY c.id
        `, [studentId]);

        if (classes.length === 0) {
            return res.status(200).json([]);
        }

        // STEP 3: Build the JSON for React
        const enrolledClasses = [];

        for (let cls of classes) {
            
            const modules = await query(`
                SELECT id, title AS name, title AS topics 
                FROM modules 
                WHERE c_id = ? AND status = 'active'
                ORDER BY number ASC
            `, [cls.id]);

            const monthsData = [];

            for (let mod of modules) {
                
                const videos = await query(`
                    SELECT id, title, link, duration, DATE_FORMAT(upload_date, '%M %d') as formatted_date
                    FROM lessons 
                    WHERE m_id = ? AND type LIKE '%video%'
                    ORDER BY number ASC
                `, [mod.id]);

                const tutes = await query(`
                    SELECT id, name, link, resource_type, file_size 
                    FROM resources 
                    WHERE m_id = ?
                    ORDER BY number ASC
                `, [mod.id]);

                const payments = await query(`
                    SELECT id FROM payments 
                    WHERE c_id = ? AND s_id = ? AND m_id = ? AND status = 'completed'
                `, [cls.id, studentId, mod.id]);

                const isPaid = payments.length > 0; 

                monthsData.push({
                    id: mod.id,
                    name: mod.name,
                    isPaid: isPaid,
                    topics: mod.topics,
                    videos: videos.map(v => ({
                        id: v.id,
                        title: v.title || 'Lesson Video',
                        link: v.link,   
                        date: v.formatted_date || 'Available Now',
                        duration: v.duration || '--'
                    })),
                    tutes: tutes.map(t => ({
                        id: t.id,
                        name: t.name,
                        type: t.resource_type || 'Material',
                        size: t.file_size || 'Unknown Size',
                        link: t.link
                    })),
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
                    }))
                });
            }

            enrolledClasses.push({
                id: cls.id,
                grade: cls.grade || 'Grade',
                subject: cls.subject,
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
        console.error("Error fetching student classes:", error);
        res.status(500).json({ message: "Internal server error while fetching classes." });
    }
});

export default router;