import express from 'express';
import db from '../db.js';
import util from 'util';
import bcrypt from 'bcryptjs';

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
        const isSubAdmin = req.session && req.session.adminLevel === 'sub';
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
            WHERE t.verification_status != 'Approved'
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

            for (let i = 6; i >= 0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({
                    time: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                    logins: found ? found.count : 0
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

            for (let i = 29; i >= 0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({
                    time: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    logins: found ? found.count : 0
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
                    logins: found ? found.count : 0
                };
            });
        }

        res.status(200).json({
            success: true,
            kpis: {
                totalStudents: students[0].count,
                totalTeachers: teachers[0].count,
                activeCourses: courses[0].count,
                monthlyRevenue: isSubAdmin ? "RESTRICTED" : revenue[0].total,
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

// ==========================================
// 6. FETCH FULL TEACHER DETAILS & HISTORY
// ==========================================
// ==========================================
// 6. FETCH FULL TEACHER DETAILS & HISTORY
// ==========================================
router.get('/teacher-details/:id', async (req, res) => {
    try {
        const teacherData = await query(`
            SELECT u.name, u.email, u.phone_number, u.address, u.dob, u.gender, u.picture, u.created_at,
                   t.id as teacher_id, t.highest_qualification, t.verification_status,
                   t.university, t.experience_years, t.bio, t.resume_link, t.nic_path
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?
        `, [req.params.id]);

        if (teacherData.length === 0) {
            return res.status(404).json({ success: false, message: "Teacher not found." });
        }

        // Fetch the history of reviews for this teacher
        const reviewHistory = await query(`
            SELECT status, feedback, created_at 
            FROM teacher_reviews 
            WHERE teacher_id = ? 
            ORDER BY created_at DESC
        `, [req.params.id]);

        res.status(200).json({
            success: true,
            data: teacherData[0],
            history: reviewHistory
        });
    } catch (error) {
        console.error("Error fetching teacher details:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
});

// ==========================================
// 7. SUBMIT TEACHER REVIEW
// ==========================================
router.put('/verify-teacher/:id', async (req, res) => {
    const teacherId = req.params.id;
    const { status, message } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    try {
        // 1. Update the main status on the teacher's account
        await query('UPDATE teachers SET verification_status = ? WHERE id = ?', [status, teacherId]);

        // 2. Log the feedback into the new dedicated table
        if (message && message.trim() !== "") {
            await query(
                'INSERT INTO teacher_reviews (teacher_id, status, feedback) VALUES (?, ?, ?)',
                [teacherId, status, message]
            );
        }

        res.status(200).json({ success: true, message: `Teacher marked as ${status}.` });
    } catch (error) {
        console.error("Error verifying teacher:", error);
        res.status(500).json({ success: false, message: "Failed to update teacher status." });
    }
});

//teachers page routs
// ==========================================
// 8. FETCH ALL SUBJECTS (For Filter Dropdown)
// ==========================================
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await query('SELECT id, name FROM subjects ORDER BY name ASC');
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        console.error("Error fetching subjects:", error);
        res.status(500).json({ success: false, message: "Failed to load subjects." });
    }
});

// ==========================================
// 9. FETCH TEACHERS LIST WITH FILTERS & STATS
// ==========================================
router.get('/teachers-list', async (req, res) => {
    try {
        // Grab filter parameters from the frontend request
        const { search, status, subject } = req.query;

        // Base SQL Query connecting all 5 tables!
        let sqlQuery = `
            SELECT 
                t.id AS teacher_id,
                u.id AS user_id,
                u.name, 
                u.email, 
                u.phone_number,
                u.picture,
                u.status AS account_status, 
                t.verification_status,
                u.last_active,
                COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) AS active_classes,
                GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS subjects
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN classes_courses c ON c.t_id = t.id
            LEFT JOIN teacher_subjects ts ON ts.t_id = t.id
            LEFT JOIN subjects s ON ts.sub_id = s.id
            WHERE 1=1
        `;

        const queryParams = [];

        // 1. Search Filter (Checks Name, Email, or Phone)
        if (search && search.trim() !== '') {
            sqlQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard);
        }

        // 2. Status Filter
        if (status && status !== 'All') {
            if (status === 'Banned' || status === 'Suspended') {
                // If checking for bans, look at the main user account status
                sqlQuery += ` AND u.status = ?`;
                queryParams.push(status.toLowerCase());
            } else {
                // Otherwise, look at their application verification status
                sqlQuery += ` AND t.verification_status = ?`;
                queryParams.push(status.toLowerCase());
            }
        } else {
            // Default behavior: Hide "Rejected" teachers to keep the dashboard clean
            sqlQuery += ` AND t.verification_status != 'rejected'`;
        }

        // 3. Subject Filter
        if (subject && subject !== 'All') {
            sqlQuery += ` AND s.name = ?`;
            queryParams.push(subject);
        }

        // Group the results so we don't get duplicate rows for teachers with multiple subjects
        sqlQuery += ` GROUP BY t.id, u.id ORDER BY u.created_at DESC`;

        const teachersList = await query(sqlQuery, queryParams);

        res.status(200).json({ success: true, data: teachersList });

    } catch (error) {
        console.error("Error fetching teachers list:", error);
        res.status(500).json({ success: false, message: "Server error fetching teachers." });
    }
});

// ==========================================
// 10. FETCH SPECIFIC TEACHER ANALYTICS
// ==========================================
router.get('/teacher-analytics/:id', async (req, res) => {
    try {
        const teacherId = req.params.id;

        // 1. Get Basic Profile & Subjects
        const profileQuery = await query(`
            SELECT 
                u.id as user_id, /* 🌟 THE FIX: Added this line so we can message/suspend them! */
                u.name, u.email, u.picture, u.phone_number, u.status, u.last_active, u.created_at,
                t.verification_status,
                GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') AS subjects
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            LEFT JOIN teacher_subjects ts ON ts.t_id = t.id
            LEFT JOIN subjects s ON ts.sub_id = s.id
            WHERE t.id = ?
            GROUP BY t.id, u.id
        `, [teacherId]);

        if (profileQuery.length === 0) {
            return res.status(404).json({ success: false, message: "Teacher not found." });
        }

        // 2. Get Course Performance (Revenue, Students, Ratings per course)
        const coursesQuery = await query(`
            SELECT 
                c.id, c.title, c.status, c.created_at,
                COUNT(DISTINCT e.id) as total_students,
                COALESCE(SUM(p.amount), 0) as total_revenue,
                COALESCE(AVG(r.rating), 0) as average_rating
            FROM classes_courses c
            LEFT JOIN enrollments e ON e.c_id = c.id
            LEFT JOIN payments p ON p.c_id = c.id
            LEFT JOIN reviews r ON r.c_id = c.id
            WHERE c.t_id = ?
            GROUP BY c.id
            ORDER BY total_revenue DESC
        `, [teacherId]);

        // 3. Get Recent Student Reviews
        const reviewsQuery = await query(`
            SELECT 
                r.rating, r.description, r.created_at,
                u.name as student_name, c.title as course_title
            FROM reviews r
            JOIN students s ON r.s_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN classes_courses c ON r.c_id = c.id
            WHERE c.t_id = ?
            ORDER BY r.created_at DESC
            LIMIT 5
        `, [teacherId]);

        // 4. Calculate Master KPIs
        let totalPlatformStudents = 0;
        let totalPlatformRevenue = 0;
        let sumRatings = 0;
        let ratingCount = 0;

        coursesQuery.forEach(course => {
            totalPlatformStudents += course.total_students;
            totalPlatformRevenue += parseFloat(course.total_revenue);
            if (course.average_rating > 0) {
                sumRatings += parseFloat(course.average_rating);
                ratingCount++;
            }
        });

        const masterAvgRating = ratingCount > 0 ? (sumRatings / ratingCount).toFixed(1) : "0.0";

        res.status(200).json({
            success: true,
            profile: profileQuery[0],
            kpis: {
                totalStudents: totalPlatformStudents,
                totalRevenue: totalPlatformRevenue.toFixed(2),
                avgRating: masterAvgRating,
                activeCourses: coursesQuery.filter(c => c.status === 'active').length
            },
            courses: coursesQuery,
            recentReviews: reviewsQuery
        });

    } catch (error) {
        console.error("Error fetching teacher analytics:", error);
        res.status(500).json({ success: false, message: "Server error fetching analytics." });
    }
});

// ==========================================
// 11. FETCH STUDENTS LIST WITH FILTERS & STATS
// ==========================================
router.get('/students-list', async (req, res) => {
    try {
        const { search, status } = req.query;

        let sqlQuery = `
            SELECT 
                s.id AS student_id,
                u.id AS user_id,
                u.name, 
                u.email, 
                u.phone_number,
                u.picture,
                u.status AS account_status,
                u.last_active,
                s.grade_level,
                s.school_name,
                COUNT(DISTINCT CASE WHEN e.status = 'In Progress' THEN e.c_id END) AS active_enrollments
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN enrollments e ON e.s_id = s.id
            WHERE 1=1
        `;

        const queryParams = [];

        // 1. Search Filter
        if (search && search.trim() !== '') {
            sqlQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard);
        }

        // 2. Status Filter
        if (status && status !== 'All') {
            sqlQuery += ` AND u.status = ?`;
            queryParams.push(status.toLowerCase());
        }

        sqlQuery += ` GROUP BY s.id, u.id ORDER BY u.created_at DESC`;

        const studentsList = await query(sqlQuery, queryParams);
        res.status(200).json({ success: true, data: studentsList });

    } catch (error) {
        console.error("Error fetching students list:", error);
        res.status(500).json({ success: false, message: "Server error fetching students." });
    }
});

// ==========================================
// 12. FETCH SPECIFIC STUDENT PROFILE
// ==========================================
router.get('/student-profile/:id', async (req, res) => {
    try {
        const studentId = req.params.id;

        // 1. Get Basic Profile
        const profileQuery = await query(`
            SELECT 
                s.id as student_id, u.id as user_id, u.name, u.email, u.phone_number, u.picture, 
                u.status, u.last_active, u.created_at, s.grade_level, s.school_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `, [studentId]);

        if (profileQuery.length === 0) {
            return res.status(404).json({ success: false, message: "Student not found." });
        }

        // 2. Get Enrollments Details
        const enrollmentsQuery = await query(`
            SELECT 
                e.id, e.status, e.enrolled_date,
                c.title as course_title, c.id as course_id,
                t_user.name as teacher_name
            FROM enrollments e
            JOIN classes_courses c ON e.c_id = c.id
            JOIN teachers t ON c.t_id = t.id
            JOIN users t_user ON t.user_id = t_user.id
            WHERE e.s_id = ?
            ORDER BY e.enrolled_date DESC
        `, [studentId]);

        // 3. Get Payment History
        const paymentsQuery = await query(`
            SELECT 
                p.id, p.amount, p.status, p.payment_date, p.invoice_link,
                c.title as course_title
            FROM payments p
            JOIN classes_courses c ON p.c_id = c.id
            WHERE p.s_id = ?
            ORDER BY p.payment_date DESC
        `, [studentId]);

        res.status(200).json({
            success: true,
            profile: profileQuery[0],
            enrollments: enrollmentsQuery,
            payments: paymentsQuery
        });

    } catch (error) {
        console.error("Error fetching student profile:", error);
        res.status(500).json({ success: false, message: "Server error fetching student data." });
    }
});

// ==========================================
// 13. QUICK ACTIONS: SUSPEND & MESSAGE
// ==========================================
// Toggle Suspend/Active Status
router.put('/student-status/:userId', async (req, res) => {
    try {
        const { status } = req.body; // Expects 'active' or 'suspended'
        await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.userId]);
        res.status(200).json({ success: true, message: `Student account ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// Send Direct Notification
router.post('/student-notify', async (req, res) => {
    try {
        const { userId, title, message } = req.body;
        await query(
            'INSERT INTO notifications (user_id, title, description) VALUES (?, ?, ?)',
            [userId, title, message]
        );
        res.status(200).json({ success: true, message: "Message sent successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// ==========================================
// 14. BULK ACTIONS: ANNOUNCEMENTS & OFFERS
// ==========================================
router.post('/students/bulk-notify', async (req, res) => {
    try {
        const { userIds, title, message } = req.body;

        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ success: false, message: "No students selected." });
        }

        // 🌟 THE FIX: Use Promise.all for guaranteed, bulletproof inserts
        const insertPromises = userIds.map(id => {
            return query(
                'INSERT INTO notifications (user_id, title, description) VALUES (?, ?, ?)',
                [id, title, message]
            );
        });

        await Promise.all(insertPromises);

        res.status(200).json({ success: true, message: `Successfully sent to ${userIds.length} students!` });
    } catch (error) {
        console.error("Bulk Notify Error:", error);
        res.status(500).json({ success: false, message: "Failed to send bulk announcement." });
    }
});

// ==========================================
// 15. PROMO CODES MANAGEMENT
// ==========================================

// A. Fetch simplified courses list for the dropdown
router.get('/all-courses', async (req, res) => {
    try {
        const courses = await query("SELECT id, title FROM classes_courses WHERE status = 'active' ORDER BY title ASC");
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch courses." });
    }
});

// B. Fetch all Promo Codes
router.get('/promo-codes', async (req, res) => {
    try {
        const promos = await query(`
            SELECT 
                p.id, p.code, p.discount_percent, p.expire_date, p.status,
                c.title as course_title
            FROM promo_codes p
            JOIN classes_courses c ON p.c_id = c.id
            ORDER BY p.expire_date DESC
        `);
        res.status(200).json({ success: true, data: promos });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch promo codes." });
    }
});

// C. Create a new Promo Code
router.post('/promo-codes', async (req, res) => {
    try {
        const { code, c_id, discount_percent, expire_date } = req.body;

        if (!code || !c_id || !discount_percent || !expire_date) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        // Convert the discount to decimal (e.g., 50% -> 0.50) if it comes in as a whole number
        let formattedDiscount = parseFloat(discount_percent);
        if (formattedDiscount > 1) {
            formattedDiscount = formattedDiscount / 100;
        }

        await query(
            'INSERT INTO promo_codes (code, c_id, discount_percent, expire_date, status) VALUES (?, ?, ?, ?, ?)',
            [code.toUpperCase(), c_id, formattedDiscount, expire_date, 'active']
        );

        res.status(201).json({ success: true, message: "Promo code generated successfully!" });
    } catch (error) {
        console.error("Promo Code Error:", error);
        // Handle MySQL unique constraint errors if the code already exists
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "This promo code already exists!" });
        }
        res.status(500).json({ success: false, message: "Failed to create promo code." });
    }
});

// D. Toggle Promo Code Status (Deactivate/Reactivate)
router.put('/promo-codes/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        await query('UPDATE promo_codes SET status = ? WHERE id = ?', [status, req.params.id]);
        res.status(200).json({ success: true, message: `Promo code marked as ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// ==========================================
// 16. FETCH ALL COURSES WITH STATS
// ==========================================
router.get('/courses-list', async (req, res) => {
    try {
        const isSubAdmin = req.session && req.session.adminLevel === 'sub';
        const { search, status } = req.query;

        let sqlQuery = `
            SELECT 
                c.id AS course_id,
                c.title,
                c.type,
                c.status,
                c.created_at,
                u.name AS teacher_name,
                u.picture AS teacher_picture,
                (SELECT COUNT(DISTINCT s_id) FROM enrollments WHERE c_id = c.id) AS total_students,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE c_id = c.id) AS total_revenue
            FROM classes_courses c
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;

        const queryParams = [];

        // 1. Search Filter (Checks Course Title or Teacher Name)
        if (search && search.trim() !== '') {
            sqlQuery += ` AND (c.title LIKE ? OR u.name LIKE ?)`;
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard);
        }

        // 2. Status Filter
        if (status && status !== 'All') {
            sqlQuery += ` AND c.status = ?`;
            queryParams.push(status);
        }

        sqlQuery += ` GROUP BY c.id ORDER BY c.created_at DESC`;

        const courses = await query(sqlQuery, queryParams);
        const maskedCourses = courses.map(c => ({
            ...c,
            total_revenue: isSubAdmin ? "RESTRICTED" : c.total_revenue
        }));

        res.status(200).json({ success: true, data: maskedCourses });

    } catch (error) {
        console.error("Error fetching courses list:", error);
        res.status(500).json({ success: false, message: "Server error fetching courses." });
    }
});

// ==========================================
// 17. UPDATE COURSE STATUS
// ==========================================
router.put('/course-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        // Expected statuses: 'active', 'not_active' (Pending), 'suspended'
        await query('UPDATE classes_courses SET status = ? WHERE id = ?', [status, req.params.id]);

        let messageWord = status === 'active' ? 'Approved & Published' : status === 'not_active' ? 'Moved to Pending' : 'Suspended';
        res.status(200).json({ success: true, message: `Course ${messageWord} successfully.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update course status." });
    }
});

// ==========================================
// 18. GLOBAL TARGETED ANNOUNCEMENTS
// ==========================================
router.post('/global-announcement', async (req, res) => {
    try {
        const { audienceType, targetId, minAge, maxAge, title, message } = req.body;

        if (!title || !message) {
            return res.status(400).json({ success: false, message: "Title and message are required." });
        }

        let userIds = [];

        // 1. Hunt down the target audience
        if (audienceType === 'all') {
            const users = await query("SELECT id FROM users WHERE status = 'active'");
            userIds = users.map(u => u.id);

        } else if (audienceType === 'students') {
            const users = await query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'student' AND u.status = 'active'");
            userIds = users.map(u => u.id);

        } else if (audienceType === 'teachers') {
            const users = await query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.role_name = 'teacher' AND u.status = 'active'");
            userIds = users.map(u => u.id);

        } else if (audienceType === 'course') {
            // Get all students enrolled in a specific active course
            const users = await query(`
                SELECT s.user_id 
                FROM enrollments e 
                JOIN students s ON e.s_id = s.id 
                WHERE e.c_id = ? AND e.status = 'In Progress'
            `, [targetId]);
            userIds = users.map(u => u.user_id);

        } else if (audienceType === 'subject') {
            // Get all teachers who teach a specific subject
            const users = await query(`
                SELECT t.user_id 
                FROM teacher_subjects ts 
                JOIN teachers t ON ts.t_id = t.id 
                WHERE ts.sub_id = ?
            `, [targetId]);
            userIds = users.map(u => u.user_id);

        } else if (audienceType === 'students_by_subject') {
            // 🌟 NEW: Get all students currently learning a specific subject
            const users = await query(`
                SELECT DISTINCT s.user_id 
                FROM enrollments e 
                JOIN students s ON e.s_id = s.id 
                JOIN classes_courses c ON e.c_id = c.id 
                JOIN teacher_subjects ts ON c.t_id = ts.t_id 
                WHERE ts.sub_id = ? AND e.status = 'In Progress'
            `, [targetId]);
            userIds = users.map(u => u.user_id);

        } else if (audienceType === 'students_by_age') {
            // 🌟 NEW: Get students dynamically based on their exact age today
            if (!minAge || !maxAge) return res.status(400).json({ success: false, message: "Age range is required." });

            const users = await query(`
                SELECT u.id 
                FROM users u 
                JOIN roles r ON u.role_id = r.id 
                WHERE r.role_name = 'student' 
                AND u.status = 'active'
                AND TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) BETWEEN ? AND ?
            `, [minAge, maxAge]);
            userIds = users.map(u => u.id);
        }

        // 2. Safety check
        if (userIds.length === 0) {
            return res.status(404).json({ success: false, message: "No active users found matching this criteria." });
        }

        // 3. Blast the notifications using Promise.all
        const insertPromises = userIds.map(id => {
            return query(
                'INSERT INTO notifications (user_id, title, description) VALUES (?, ?, ?)',
                [id, title, message]
            );
        });

        await Promise.all(insertPromises);

        res.status(200).json({ success: true, message: `Announcement blasted to ${userIds.length} users!` });

    } catch (error) {
        console.error("Global Announcement Error:", error);
        res.status(500).json({ success: false, message: "Failed to send global announcement." });
    }
});

// ==========================================
// 19. ADMIN SETTINGS: GET PROFILE
// ==========================================
router.get('/profile/:id', async (req, res) => {
    try {
        const adminId = req.params.id;
        const profile = await query(`
            SELECT name, email, phone_number, address, dob, gender, picture, 2fa_enabled 
            FROM users WHERE id = ?
        `, [adminId]);

        if (profile.length === 0) return res.status(404).json({ success: false, message: "Admin not found." });

        // Format the date so it plays nicely with HTML date inputs
        if (profile[0].dob) {
            const d = new Date(profile[0].dob);
            profile[0].dob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }

        res.status(200).json({ success: true, data: profile[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load profile." });
    }
});

// ==========================================
// 20. ADMIN SETTINGS: UPDATE PROFILE
// ==========================================
router.put('/profile/:id', async (req, res) => {
    try {
        const { name, email, phone_number, address, dob, gender } = req.body;

        await query(`
            UPDATE users 
            SET name = ?, email = ?, phone_number = ?, address = ?, dob = ?, gender = ? 
            WHERE id = ?
        `, [name, email, phone_number, address, dob, gender, req.params.id]);

        res.status(200).json({ success: true, message: "Profile updated successfully!" });
    } catch (error) {
        // Handle duplicate email error
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "That email is already in use by another account." });
        }
        res.status(500).json({ success: false, message: "Failed to update profile." });
    }
});

// ==========================================
// 21. ADMIN SETTINGS: CHANGE PASSWORD
// ==========================================
router.put('/change-password/:id', async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const adminId = req.params.id;

        // 1. Get current user's hashed password
        const user = await query('SELECT password FROM users WHERE id = ?', [adminId]);
        if (user.length === 0) return res.status(404).json({ success: false, message: "User not found." });

        // 2. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user[0].password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password." });

        // 3. Hash new password and save
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, adminId]);

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update password." });
    }
});

// ==========================================
// 22. DIRECT MESSAGING (CHAT SYSTEM)
// ==========================================
router.post('/send-message', async (req, res) => {
    try {
        const { senderId, receiverId, message } = req.body;

        if (!senderId || !receiverId || !message) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // 1. Check if a conversation already exists between these two users
        const convQuery = await query(`
            SELECT id FROM conversations 
            WHERE (participant1_id = ? AND participant2_id = ?) 
               OR (participant1_id = ? AND participant2_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);

        let conversationId;

        if (convQuery.length > 0) {
            conversationId = convQuery[0].id;
        } else {
            // 2. Create a new conversation if one doesn't exist
            const newConv = await query(`
                INSERT INTO conversations (participant1_id, participant2_id) 
                VALUES (?, ?)
            `, [senderId, receiverId]);
            conversationId = newConv.insertId;
        }

        // 3. Insert the actual message
        await query(`
            INSERT INTO messages (conversation_id, sender_id, body) 
            VALUES (?, ?, ?)
        `, [conversationId, senderId, message]);

        // 4. Update the conversation's timestamp to bump it to the top of the inbox
        await query(`
            UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [conversationId]);

        res.status(200).json({ success: true, message: "Message sent successfully!" });

    } catch (error) {
        console.error("Direct Message Error:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// ==========================================
// 🌟 23. THE ESCALATION SYSTEM (SUB TO SUPER)
// ==========================================

// Sub-Admin sends an issue up the chain
router.post('/escalate', async (req, res) => {
    try {
        const { entityType, entityId, reason } = req.body;
        const subAdminId = req.session.userId;

        await query(`
            INSERT INTO admin_escalations (sub_admin_id, entity_type, entity_id, reason)
            VALUES (?, ?, ?, ?)
        `, [subAdminId, entityType, entityId, reason]);

        res.status(200).json({ success: true, message: "Issue escalated to the Super Admin successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to escalate issue." });
    }
});

// Super Admin views pending issues
router.get('/escalations', async (req, res) => {
    try {
        const escalations = await query(`
            SELECT e.*, u.name as sub_admin_name 
            FROM admin_escalations e
            JOIN users u ON e.sub_admin_id = u.id
            ORDER BY e.created_at DESC
        `);
        res.status(200).json({ success: true, data: escalations });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch escalations." });
    }
});

// Super Admin marks an issue as resolved
router.put('/resolve-escalation/:id', async (req, res) => {
    try {
        await query(`UPDATE admin_escalations SET status = 'resolved' WHERE id = ?`, [req.params.id]);
        res.status(200).json({ success: true, message: "Escalation resolved." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to resolve escalation." });
    }
});

// ==========================================
// 🌟 24. CREATE SUB-ADMIN (SUPER ADMIN ONLY)
// ==========================================
router.post('/create-sub-admin', async (req, res) => {
    try {
        // Ensure only a Super Admin can hit this route!
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Unauthorized. Super Admin access required." });
        }

        const { name, email, password, phoneNumber, address, dob, gender } = req.body;

        // Hash the new admin's password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Find the 'admin' role ID
        const roleResults = await query('SELECT id FROM roles WHERE role_name = "admin"');
        const roleId = roleResults[0].id;

        // 1. Insert into main users table
        const userResult = await query(`
            INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
        `, [name, email, hashedPassword, phoneNumber, address, dob, gender, roleId]);

        // 2. Insert into admins table and tag them specifically as 'sub'
        await query(`
            INSERT INTO admins (user_id, admin_level) VALUES (?, 'sub')
        `, [userResult.insertId]);

        res.status(201).json({ success: true, message: "Sub-Admin created successfully!" });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "That email is already in use by another account." });
        }
        res.status(500).json({ success: false, message: "Failed to create Sub-Admin." });
    }
});

export default router;