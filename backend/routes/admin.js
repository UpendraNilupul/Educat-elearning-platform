import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
// Convert the callback-based db.query to Promises so we can use async/await cleanly
const query = util.promisify(db.query).bind(db);

router.get('/dashboard-stats', async (req, res) => {
    try {
        // 1. KPI Counts
        const students = await query("SELECT COUNT(*) as count FROM students");
        const teachers = await query("SELECT COUNT(*) as count FROM teachers WHERE verification_status = 'approved'");
        const courses = await query("SELECT COUNT(*) as count FROM classes_courses WHERE status = 'active'");
        
        // Revenue for current month
        const revenue = await query(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM payments 
            WHERE MONTH(payment_date) = MONTH(CURRENT_DATE()) AND YEAR(payment_date) = YEAR(CURRENT_DATE())
        `);

        // 2. Pending Teachers
        const pendingTeachers = await query(`
            SELECT t.id, u.name, u.created_at, t.highest_qualification 
            FROM teachers t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.verification_status = 'pending'
            LIMIT 5
        `);

        // 3. Courses to Review
        const coursesToReview = await query(`
            SELECT c.id, c.title, u.name as author 
            FROM classes_courses c 
            JOIN teachers t ON c.t_id = t.id 
            JOIN users u ON t.user_id = u.id 
            WHERE c.status = 'not_active'
            LIMIT 5
        `);

        // 4. Top Earner (Current Month)
        const topEarner = await query(`
            SELECT u.name, COALESCE(SUM(p.amount), 0) as total_earned, u.picture 
            FROM teachers t 
            JOIN users u ON t.user_id = u.id 
            JOIN classes_courses c ON c.t_id = t.id 
            JOIN payments p ON p.c_id = c.id 
            WHERE MONTH(p.payment_date) = MONTH(CURRENT_DATE())
            GROUP BY t.id 
            ORDER BY total_earned DESC 
            LIMIT 1
        `);

        // 5. Most Active Teacher (Based on course creation for now, can be updated to user_activity later)
        const mostActiveTeacher = await query(`
            SELECT u.name, COUNT(c.id) as course_count, u.picture
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            JOIN classes_courses c ON c.t_id = t.id
            GROUP BY t.id
            ORDER BY course_count DESC
            LIMIT 1
        `);

        // 6. Usage Data (Mocked hourly structure, populated by real user_activity if it exists)
        // Grouping logins by hour for today
        const activityRaw = await query(`
            SELECT HOUR(created_at) as hour, COUNT(*) as count
            FROM user_activity
            WHERE DATE(created_at) = CURDATE()
            GROUP BY HOUR(created_at)
        `);

        // Format activity data for the Recharts graph (0-24 hours)
        const usageData = [6, 9, 12, 15, 18, 21].map(hour => {
            const found = activityRaw.find(a => a.hour === hour);
            const label = hour > 12 ? `${hour-12}pm` : `${hour}am`;
            return { time: label, students: found ? found.count : 0 };
        });

        res.status(200).json({
            success: true,
            kpis: {
                totalStudents: students[0].count,
                totalTeachers: teachers[0].count,
                activeCourses: courses[0].count,
                monthlyRevenue: revenue[0].total
            },
            pendingTeachers,
            coursesToReview,
            topEarner: topEarner[0] || null,
            mostActiveTeacher: mostActiveTeacher[0] || null,
            usageData
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch dashboard stats" });
    }
});

export default router;