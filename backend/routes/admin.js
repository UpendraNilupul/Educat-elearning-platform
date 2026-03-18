import express from 'express';
import db from '../db.js';
import util from 'util';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

// Helper function to safely get YYYY-MM-DD for past dates
const getPastDateString = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

router.get('/dashboard-stats', async (req, res) => {
    try {
        const period = req.query.period || 'today';
        const role = req.query.role || 'both';

        // 1. KPI Counts
        const students = await query("SELECT COUNT(*) as count FROM students");
        const teachers = await query("SELECT COUNT(*) as count FROM teachers WHERE verification_status = 'approved'");
        const courses = await query("SELECT COUNT(*) as count FROM classes_courses WHERE status = 'active'");
        
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

        // 4. Top Performers
        const topEarner = await query(`
            SELECT u.name, COALESCE(SUM(p.amount), 0) as total_earned, u.picture 
            FROM teachers t 
            JOIN users u ON t.user_id = u.id 
            JOIN classes_courses c ON c.t_id = t.id 
            JOIN payments p ON p.c_id = c.id 
            WHERE MONTH(p.payment_date) = MONTH(CURRENT_DATE())
            GROUP BY t.id 
            ORDER BY total_earned DESC LIMIT 1
        `);

        const mostActiveTeacher = await query(`
            SELECT u.name, COUNT(c.id) as course_count, u.picture
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            JOIN classes_courses c ON c.t_id = t.id
            GROUP BY t.id
            ORDER BY course_count DESC LIMIT 1
        `);

        // ==========================================
        // 🌟 5. DYNAMIC CHART DATA (24-Hour View)
        // ==========================================
        let usageData = [];
        
        let roleQueryString = '';
        let queryParams = [];

        if (role === 'student' || role === 'teacher') {
            roleQueryString = 'AND r.role_name = ?';
            queryParams.push(role);
        } else {
            roleQueryString = "AND r.role_name != 'admin'";
        }

        if (period === 'week') {
            const rawData = await query(`
                SELECT DATE_FORMAT(ua.created_at, '%Y-%m-%d') as dateStr, COUNT(*) as count
                FROM user_activity ua
                JOIN users u ON ua.user_id = u.id
                JOIN roles r ON u.role_id = r.id
                WHERE ua.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) AND ua.action_type = 'login'
                ${roleQueryString}
                GROUP BY dateStr
            `, queryParams);
            
            for(let i=6; i>=0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({ 
                    time: dateObj.toLocaleDateString('en-US', {weekday: 'short'}), 
                    students: found ? found.count : 0 
                });
            }

        } else if (period === 'month') {
            const rawData = await query(`
                SELECT DATE_FORMAT(ua.created_at, '%Y-%m-%d') as dateStr, COUNT(*) as count
                FROM user_activity ua
                JOIN users u ON ua.user_id = u.id
                JOIN roles r ON u.role_id = r.id
                WHERE ua.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) AND ua.action_type = 'login'
                ${roleQueryString}
                GROUP BY dateStr
            `, queryParams);
            
            for(let i=29; i>=0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({ 
                    time: dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), 
                    students: found ? found.count : 0 
                });
            }

        } else {
            // Default: Today (24 Hours)
            const activityRaw = await query(`
                SELECT HOUR(ua.created_at) as hour, COUNT(*) as count
                FROM user_activity ua
                JOIN users u ON ua.user_id = u.id
                JOIN roles r ON u.role_id = r.id
                WHERE DATE(ua.created_at) = CURDATE() AND ua.action_type = 'login'
                ${roleQueryString}
                GROUP BY HOUR(ua.created_at)
            `, queryParams);
            
            // Loop 24 times (0 to 23) to create a bar for every single hour
            usageData = Array.from({ length: 24 }, (_, i) => {
                const found = activityRaw.find(a => a.hour === i);
                
                // Format the hour nicely (e.g., 0 = 12am, 13 = 1pm)
                const ampm = i >= 12 ? 'pm' : 'am';
                const displayHour = i % 12 === 0 ? 12 : i % 12;
                const label = `${displayHour}${ampm}`;

                return { 
                    time: label, 
                    students: found ? found.count : 0 
                };
            });
        }

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