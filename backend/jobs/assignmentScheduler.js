import cron from 'node-cron';
import db from '../db.js';
import util from 'util';

const query = util.promisify(db.query).bind(db);

/**
 * Background job to check for assignments and quizzes that need to be published.
 * Runs every minute.
 */
const initAssignmentScheduler = (io) => {
    console.log('⏰ Content Scheduler (Assignments & Quizzes) initialized.');

    cron.schedule('* * * * *', async () => {
        try {
            // 1. Find all pending assignments
            const pendingAssignments = await query(`
                SELECT a.id, a.title, m.c_id, cc.title as course_title
                FROM assignments a
                JOIN modules m ON a.m_id = m.id
                JOIN classes_courses cc ON m.c_id = cc.id
                WHERE (a.publish_at <= NOW() OR a.publish_at IS NULL)
                AND a.notification_sent = FALSE
            `);

            if (pendingAssignments.length > 0) {
                console.log(`📢 Found ${pendingAssignments.length} assignments to notify!`);

                for (const assign of pendingAssignments) {
                    // Find all students enrolled in this course
                    const enrolledStudents = await query(`
                        SELECT s.user_id 
                        FROM enrollments e
                        JOIN students s ON e.s_id = s.id
                        WHERE e.c_id = ?
                    `, [assign.c_id]);

                    // Create notifications for each student
                    for (const student of enrolledStudents) {
                        await query(`
                            INSERT INTO notifications (title, description, user_id)
                            VALUES (?, ?, ?)
                        `, [
                            'New Assignment Published',
                            `A new assignment "${assign.title}" has been published in your course "${assign.course_title}".`,
                            student.user_id
                        ]);
                        
                        // Emit real-time socket notification
                        if (io) {
                            io.to(`user_${student.user_id}`).emit('new_notification', {
                                title: 'New Assignment Published',
                                description: `A new assignment "${assign.title}" has been published in your course "${assign.course_title}".`
                            });
                        }
                    }

                    // Mark notification as sent
                    await query('UPDATE assignments SET notification_sent = TRUE WHERE id = ?', [assign.id]);
                    console.log(`✅ Notification sent for assignment ID: ${assign.id}`);
                }
            }

            // 2. Find all pending quizzes
            const pendingQuizzes = await query(`
                SELECT q.id, q.title, q.number, m.c_id, cc.title as course_title
                FROM quizes q
                JOIN modules m ON q.m_id = m.id
                JOIN classes_courses cc ON m.c_id = cc.id
                WHERE (q.publish_at <= NOW() OR q.publish_at IS NULL)
                AND q.notification_sent = FALSE
            `);

            if (pendingQuizzes.length > 0) {
                console.log(`📢 Found ${pendingQuizzes.length} quizzes to notify!`);

                for (const qz of pendingQuizzes) {
                    // Find all students enrolled in this course
                    const enrolledStudents = await query(`
                        SELECT s.user_id 
                        FROM enrollments e
                        JOIN students s ON e.s_id = s.id
                        WHERE e.c_id = ?
                    `, [qz.c_id]);

                    // Create notifications for each student
                    for (const student of enrolledStudents) {
                        await query(`
                            INSERT INTO notifications (title, description, user_id)
                            VALUES (?, ?, ?)
                        `, [
                            'New Quiz Published',
                            `A new quiz (${qz.title || `Quiz #${qz.number}`}) has been published in your course "${qz.course_title}".`,
                            student.user_id
                        ]);
                        
                        // Emit real-time socket notification
                        if (io) {
                            io.to(`user_${student.user_id}`).emit('new_notification', {
                                title: 'New Quiz Published',
                                description: `A new quiz (${qz.title || `Quiz #${qz.number}`}) has been published in your course "${qz.course_title}".`
                            });
                        }
                    }

                    // Mark notification as sent
                    await query('UPDATE quizes SET notification_sent = TRUE WHERE id = ?', [qz.id]);
                    console.log(`✅ Notification sent for quiz ID: ${qz.id}`);
                }
            }
        } catch (err) {
            console.error('❌ Error in content scheduler job:', err);
        }
    });
};

export default initAssignmentScheduler;
