import cron from 'node-cron';
import db from '../db.js';
import util from 'util';

const query = util.promisify(db.query).bind(db);

/**
 * Background job to check for assignments that need to be published.
 * Runs every minute.
 */
const initAssignmentScheduler = () => {
    console.log('⏰ Assignment Scheduler initialized.');

    cron.schedule('* * * * *', async () => {
        try {
            // 1. Find all assignments where publish_at <= NOW() AND notification_sent = FALSE
            // We also handle NULL publish_at as "publish immediately" (though those should already have been sent if logic is consistent)
            const pendingAssignments = await query(`
                SELECT a.id, a.title, m.c_id, cc.title as course_title
                FROM assignments a
                JOIN modules m ON a.m_id = m.id
                JOIN classes_courses cc ON m.c_id = cc.id
                WHERE (a.publish_at <= NOW() OR a.publish_at IS NULL)
                AND a.notification_sent = FALSE
            `);

            if (pendingAssignments.length === 0) return;

            console.log(`📢 Found ${pendingAssignments.length} assignments to notify!`);

            for (const assign of pendingAssignments) {
                // 2. Find all students enrolled in this course
                const enrolledStudents = await query(`
                    SELECT s.user_id 
                    FROM enrollments e
                    JOIN students s ON e.s_id = s.id
                    WHERE e.c_id = ?
                `, [assign.c_id]);

                // 3. Create notifications for each student
                for (const student of enrolledStudents) {
                    await query(`
                        INSERT INTO notifications (title, description, user_id)
                        VALUES (?, ?, ?)
                    `, [
                        'New Assignment Published',
                        `A new assignment "${assign.title}" has been published in your course "${assign.course_title}".`,
                        student.user_id
                    ]);
                }

                // 4. Mark notification as sent
                await query('UPDATE assignments SET notification_sent = TRUE WHERE id = ?', [assign.id]);
                console.log(`✅ Notification sent for assignment ID: ${assign.id}`);
            }
        } catch (err) {
            console.error('❌ Error in assignment scheduler job:', err);
        }
    });
};

export default initAssignmentScheduler;
