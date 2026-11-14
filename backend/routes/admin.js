import express from 'express';
import db from '../db.js';
import util from 'util';
import bcrypt from 'bcryptjs';

const router = express.Router();
const query = util.promisify(db.query).bind(db);

async function checkAndCreateMessageNotification(req, senderId, receiverId, messageText = '') {
    try {
        const receiverQuery = await query(`
            SELECT r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.id = ?
        `, [receiverId]);

        if (receiverQuery.length > 0 && ['student', 'teacher', 'admin'].includes(receiverQuery[0].role_name.toLowerCase().trim())) {
            const senderQuery = await query('SELECT name FROM users WHERE id = ?', [senderId]);
            const senderName = senderQuery[0]?.name || 'Admin';
            const notifTitle = `Message from ${senderName}`;
            // Use actual message text; fallback only if empty
            const notifDesc = messageText && messageText.trim() ? messageText.trim() : `New message from ${senderName}`;
            
            const insertRes = await query(`
                INSERT INTO notifications (user_id, title, description, is_read)
                VALUES (?, ?, ?, FALSE)
            `, [receiverId, notifTitle, notifDesc]);

            if (req.io) {
                req.io.to(`user_${receiverId}`).emit('new_notification', {
                    id: insertRes.insertId,
                    title: notifTitle,
                    description: notifDesc,
                    user_id: receiverId,
                    is_read: 0,
                    created_at: new Date()
                });
            }
        }
    } catch (error) {
        console.error("Error in checkAndCreateMessageNotification:", error);
    }
}

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
            WHERE MONTH(p.payment_date) = MONTH(CURRENT_DATE()) AND YEAR(p.payment_date) = YEAR(CURRENT_DATE()) AND p.status = 'completed'
            GROUP BY t.id, u.name, u.picture 
            ORDER BY total_earned DESC LIMIT 1
        `);

        const mostActiveTeacher = await query(`
            SELECT u.name, COUNT(c.id) as course_count, u.picture
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            JOIN classes_courses c ON c.t_id = t.id
            GROUP BY t.id, u.name, u.picture
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
router.get('/teacher-details/:id', async (req, res) => {
    try {
        const teacherData = await query(`
            SELECT u.name, u.email, u.phone_number, u.address, u.dob, u.gender, u.picture, u.created_at, u.status,
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
        await query(
            'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
            [req.session.userId, `Marked Teacher ID ${teacherId} application as: ${status}`]
        );

        // Get user_id of teacher for notification
        const teacherRows = await query('SELECT user_id FROM teachers WHERE id = ?', [teacherId]);
        const teacherUserId = teacherRows[0]?.user_id;

        // 2. Log the feedback into the new dedicated table
        if (message && message.trim() !== "") {
            await query(
                'INSERT INTO teacher_reviews (teacher_id, status, feedback) VALUES (?, ?, ?)',
                [teacherId, status, message]
            );
        }

        // 3. Insert notification for the unapproved teacher so it shows in their Messages popup
        if (teacherUserId) {
            const notifTitle = `Teacher Verification: ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            const notifDesc = message && message.trim() !== "" 
                ? message.trim() 
                : `Your teacher verification status has been updated to ${status}.`;

            const insertRes = await query(
                'INSERT INTO notifications (user_id, title, description, is_read) VALUES (?, ?, ?, FALSE)',
                [teacherUserId, notifTitle, notifDesc]
            );

            if (req.io) {
                req.io.to(`user_${teacherUserId}`).emit('new_notification', {
                    id: insertRes.insertId,
                    title: notifTitle,
                    description: notifDesc,
                    user_id: teacherUserId,
                    is_read: 0,
                    created_at: new Date()
                });
            }
        }

        res.status(200).json({ success: true, message: `Teacher marked as ${status}.` });
    } catch (error) {
        console.error("Error verifying teacher:", error);
        res.status(500).json({ success: false, message: "Failed to update teacher status." });
    }
});

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
        const { search, status, subject } = req.query;

        let sqlQuery = `
            SELECT 
                t.id AS teacher_id,
                u.id AS user_id,
                t.user_code,
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

        if (search && search.trim() !== '') {
            sqlQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ? OR t.user_code LIKE ?)`;
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

        if (status && status !== 'All') {
            if (status === 'Banned' || status === 'Suspended') {
                sqlQuery += ` AND u.status = ?`;
                queryParams.push(status.toLowerCase());
            } else {
                sqlQuery += ` AND t.verification_status = ?`;
                queryParams.push(status.toLowerCase());
            }
        } else {
            sqlQuery += ` AND t.verification_status != 'rejected'`;
        }

        if (subject && subject !== 'All') {
            sqlQuery += ` AND s.name = ?`;
            queryParams.push(subject);
        }

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

        const profileQuery = await query(`
            SELECT 
                u.id as user_id,
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
                s.user_code,
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

        if (search && search.trim() !== '') {
            sqlQuery += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ? OR s.user_code LIKE ?)`;
            const searchWildcard = `%${search}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
        }

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
router.put('/student-status/:userId', async (req, res) => {
    try {
        const { status } = req.body; 
        await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.userId]);
        await query(
            'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
            [req.session.userId, `Changed Student ID ${req.params.userId} account status to: ${status}`]
        );
        res.status(200).json({ success: true, message: `Student account ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

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
router.get('/all-courses', async (req, res) => {
    try {
        const courses = await query("SELECT id, title FROM classes_courses WHERE status = 'active' ORDER BY title ASC");
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch courses." });
    }
});

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

router.post('/promo-codes', async (req, res) => {
    try {
        const { code, c_id, discount_percent, expire_date } = req.body;

        if (!code || !c_id || !discount_percent || !expire_date) {
            return res.status(400).json({ success: false, message: "All fields are required." });
        }

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        if (expire_date < todayStr) {
            return res.status(400).json({ success: false, message: "Expiry date must be today or a future date." });
        }
        const parts = expire_date.split('-');
        if (parts[0].length !== 4 || parseInt(parts[0], 10) > 2100) {
            return res.status(400).json({ success: false, message: "Expiry date must be a valid date with a 4-digit year no later than 2100." });
        }

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
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "This promo code already exists!" });
        }
        res.status(500).json({ success: false, message: "Failed to create promo code." });
    }
});

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
                c.name,
                c.status,
                c.created_at,
                u.name AS teacher_name,
                u.picture AS teacher_picture,
                (SELECT COUNT(DISTINCT s_id) FROM enrollments WHERE c_id = c.id) AS total_students,
                (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE c_id = c.id) AS total_revenue
            FROM classes_courses c
            LEFT JOIN teachers t ON c.t_id = t.id
            LEFT JOIN users u ON t.user_id = u.id
            WHERE 1=1
        `;

        const queryParams = [];

        if (search && search.trim() !== '') {
            sqlQuery += ` AND (c.name LIKE ? OR c.title LIKE ? OR u.name LIKE ?)`;
            const searchWildcard = `%${search.trim()}%`;
            queryParams.push(searchWildcard, searchWildcard, searchWildcard);
        }

        if (status && status.trim() !== '' && status.toLowerCase() !== 'all') {
            sqlQuery += ` AND c.status = ?`;
            queryParams.push(status.trim());
        }

        sqlQuery += ` GROUP BY c.id ORDER BY c.created_at DESC`;

        const courses = await query(sqlQuery, queryParams);
        const maskedCourses = (courses || []).map(c => ({
            ...c,
            total_revenue: isSubAdmin ? "RESTRICTED" : c.total_revenue
        }));

        res.status(200).json({ success: true, data: maskedCourses });

    } catch (error) {
        console.error("Error fetching courses list:", error);
        res.status(500).json({ success: false, data: [], message: "Server error fetching courses." });
    }
});

// ==========================================
// 17. UPDATE COURSE STATUS
// ==========================================
router.put('/course-status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        await query('UPDATE classes_courses SET status = ? WHERE id = ?', [status, req.params.id]);
        await query(
            'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
            [req.session.userId, `Changed Course ID ${req.params.id} status to: ${status}`]
        );

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
            const users = await query(`
                SELECT s.user_id 
                FROM enrollments e 
                JOIN students s ON e.s_id = s.id 
                WHERE e.c_id = ? AND e.status = 'In Progress'
            `, [targetId]);
            userIds = users.map(u => u.user_id);

        } else if (audienceType === 'subject') {
            const users = await query(`
                SELECT t.user_id 
                FROM teacher_subjects ts 
                JOIN teachers t ON ts.t_id = t.id 
                WHERE ts.sub_id = ?
            `, [targetId]);
            userIds = users.map(u => u.user_id);

        } else if (audienceType === 'students_by_subject') {
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

        if (userIds.length === 0) {
            return res.status(404).json({ success: false, message: "No active users found matching this criteria." });
        }

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

        if (dob) {
            const dobDate = new Date(dob);
            if (dobDate >= new Date()) {
                return res.status(400).json({ success: false, message: "Date of birth must be in the past." });
            }
            if (dobDate < new Date('1900-01-01')) {
                return res.status(400).json({ success: false, message: "Date of birth must be after 1900-01-01." });
            }
            if (dob.split('-')[0].length !== 4) {
                return res.status(400).json({ success: false, message: "Date of birth must have a valid 4-digit year." });
            }
        }

        await query(`
            UPDATE users 
            SET name = ?, email = ?, phone_number = ?, address = ?, dob = ?, gender = ? 
            WHERE id = ?
        `, [name, email, phone_number, address, dob, gender, req.params.id]);

        res.status(200).json({ success: true, message: "Profile updated successfully!" });
    } catch (error) {
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

        const user = await query('SELECT password FROM users WHERE id = ?', [adminId]);
        if (user.length === 0) return res.status(404).json({ success: false, message: "User not found." });

        const isMatch = await bcrypt.compare(currentPassword, user[0].password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password." });

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
        const { senderId, receiverId, message, fileUrl, fileType } = req.body;

        if (!senderId || !receiverId || (!message && !fileUrl)) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const convQuery = await query(`
            SELECT id FROM conversations 
            WHERE (participant1_id = ? AND participant2_id = ?) 
               OR (participant1_id = ? AND participant2_id = ?)
        `, [senderId, receiverId, receiverId, senderId]);

        let conversationId;

        if (convQuery.length > 0) {
            conversationId = convQuery[0].id;
        } else {
            const newConv = await query(`
                INSERT INTO conversations (participant1_id, participant2_id) 
                VALUES (?, ?)
            `, [senderId, receiverId]);
            conversationId = newConv.insertId;
        }

        await query(`
            INSERT INTO messages (conversation_id, sender_id, body, file_url, file_type) 
            VALUES (?, ?, ?, ?, ?)
        `, [conversationId, senderId, message || '', fileUrl || null, fileType || null]);

        await query(`
            UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
        `, [conversationId]);

        await checkAndCreateMessageNotification(req, senderId, receiverId, message);

        res.status(200).json({ success: true, message: "Message sent successfully!" });

    } catch (error) {
        console.error("Direct Message Error:", error);
        res.status(500).json({ success: false, message: "Failed to send message." });
    }
});

// ==========================================
// 🌟 23. THE ESCALATION SYSTEM (SUB TO SUPER)
// ==========================================
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

        const {
            name,
            email,
            password,
            phoneNumber,
            phone_number,
            address,
            dob,
            gender,
            adminLevelType,
            admin_level,
            adminLevel,
            role
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: "Name, email, and password are required." });
        }

        // Determine admin level from radio option / input
        const rawAdminLevel = adminLevelType || admin_level || adminLevel || role || 'moderator';
        let assignedAdminLevel = 'moderator';
        if (rawAdminLevel === 'Financial Manager' || rawAdminLevel === 'finance') {
            assignedAdminLevel = 'finance';
        } else if (rawAdminLevel === 'System Moderator' || rawAdminLevel === 'moderator') {
            assignedAdminLevel = 'moderator';
        } else {
            assignedAdminLevel = rawAdminLevel;
        }

        // Fallback defaults for NOT NULL columns in users table
        const finalPhoneNumber = phoneNumber || phone_number || 'N/A';
        const finalAddress = address || 'N/A';
        const finalDob = dob || '2000-01-01';
        const finalGender = gender || 'other';
        const finalJoinDate = req.body.join_date || new Date().toISOString().slice(0, 10);
        let roleId = 1;

        try {
            const roleResults = await query('SELECT id FROM roles WHERE role_name = "admin"');
            if (roleResults && roleResults.length > 0) {
                roleId = roleResults[0].id;
            }
        } catch (e) {
            roleId = 1;
        }

        // Validate dob if provided explicitly
        if (dob) {
            const dobDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - dobDate.getFullYear();
            const monthDiff = today.getMonth() - dobDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
                age--;
            }
            if (age < 18) {
                return res.status(400).json({ success: false, message: "Sub-Admins must be at least 18 years old." });
            }
            if (dobDate < new Date('1900-01-01')) {
                return res.status(400).json({ success: false, message: "Date of birth must be after 1900-01-01." });
            }
            if (typeof dob === 'string' && dob.split('-')[0].length !== 4) {
                return res.status(400).json({ success: false, message: "Date of birth must have a valid 4-digit year." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userResult = await query(`
            INSERT INTO users (name, email, password, phone_number, address, dob, gender, role_id, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [name, email, hashedPassword, finalPhoneNumber, finalAddress, finalDob, finalGender, roleId, finalJoinDate]);

        await query(`
            INSERT INTO admins (user_id, admin_level) VALUES (?, ?)
        `, [userResult.insertId, assignedAdminLevel]);

        res.status(201).json({ 
            success: true, 
            message: `${assignedAdminLevel === 'finance' ? 'Financial Manager' : 'System Moderator'} created successfully!` 
        });
    } catch (error) {
        console.error("Sub-admin creation error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ success: false, message: "That email is already in use by another account." });
        }
        res.status(500).json({ success: false, message: "Failed to create Sub-Admin." });
    }
});

// ==========================================
// 🌟 24.5 MANAGE SUB-ADMINS (SUPER ADMIN ONLY)
// ==========================================

// A. Fetch all Sub-Admins
router.get('/sub-admins', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const team = await query(`
            SELECT u.id, u.name, u.email, u.phone_number, u.status, u.join_date, a.admin_level 
            FROM users u
            JOIN admins a ON u.id = a.user_id
            WHERE a.admin_level IN ('moderator', 'finance')
            ORDER BY u.created_at DESC
        `);

        res.status(200).json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch team members." });
    }
});

// 🌟 RESTORED MISSING ROUTE: Toggle Status (Suspend / Activate)
router.put('/sub-admins/:id/status', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        const { status } = req.body; 
        
        await query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);

        await query(
            'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
            [req.session.userId, `Changed Sub-Admin ID ${req.params.id} status to: ${status}`]
        );

        res.status(200).json({ success: true, message: `Sub-Admin marked as ${status}.` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update status." });
    }
});

// 🌟 RESTORED MISSING ROUTE: Permanently Remove Sub-Admin
router.delete('/sub-admins/:id', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Unauthorized." });
        }

        await query('DELETE FROM users WHERE id = ?', [req.params.id]);

        await query(
            'INSERT INTO user_activity (user_id, action_type) VALUES (?, ?)', 
            [req.session.userId, `Permanently deleted Sub-Admin ID ${req.params.id}`]
        );

        res.status(200).json({ success: true, message: "Sub-Admin permanently removed." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to remove Sub-Admin." });
    }
});

// ==========================================
// 25. GLOBAL AUDIT LOGS (SUPER ADMIN ONLY)
// ==========================================
router.get('/system-logs', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Unauthorized. Super Admin clearance required." });
        }

        const logs = await query(`
            SELECT 
                ua.id, 
                ua.action_type, 
                ua.created_at, 
                u.name as admin_name, 
                u.email as admin_email,
                a.admin_level
            FROM user_activity ua
            JOIN users u ON ua.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN admins a ON u.id = a.user_id
            WHERE r.role_name = 'admin' AND ua.action_type != 'login' AND ua.action_type != 'logout'
            ORDER BY ua.created_at DESC
            LIMIT 200
        `);

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error("Audit Log Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch system logs." });
    }
});

// ==========================================
// 26. UNIFIED COMMUNICATIONS HUB ROUTES
// ==========================================
router.get('/conversations', async (req, res) => {
    try {
        const adminId = req.session.userId;
        
        const conversations = await query(`
            SELECT 
                c.id as conversation_id, 
                c.last_message_at,
                u.id as other_user_id, 
                u.name as other_user_name, 
                u.picture as other_user_picture,
                r.role_name as other_user_role,
                (SELECT COUNT(*) FROM messages m 
                 WHERE m.conversation_id = c.id 
                   AND m.sender_id = u.id 
                   AND m.is_read = FALSE) as unread_count
            FROM conversations c
            JOIN users u ON (u.id = c.participant1_id OR u.id = c.participant2_id) AND u.id != ?
            JOIN roles r ON u.role_id = r.id
            WHERE c.participant1_id = ? OR c.participant2_id = ?
            ORDER BY c.last_message_at DESC
        `, [adminId, adminId, adminId]);

        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        console.error("Conversations Error:", error);
        res.status(500).json({ success: false, message: "Failed to load conversations." });
    }
});

router.get('/conversations/:id/messages', async (req, res) => {
    try {
        const userId = req.session.userId;
        if (userId) {
            await query(`
                UPDATE messages 
                SET is_read = TRUE 
                WHERE conversation_id = ? AND sender_id != ? AND is_read = FALSE
            `, [req.params.id, userId]);
        }

        const messages = await query(`
            SELECT sender_id, body, file_url, file_type, created_at 
            FROM messages 
            WHERE conversation_id = ? 
            ORDER BY created_at ASC
        `, [req.params.id]);

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load messages." });
    }
});

router.get('/announcements-history', async (req, res) => {
    try {
        const history = await query(`
            SELECT 
                title, 
                description, 
                MIN(created_at) as sent_at, 
                COUNT(id) as recipient_count 
            FROM notifications 
            GROUP BY title, description 
            ORDER BY sent_at DESC
        `);

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load announcement history." });
    }
});

// ==========================================
// 27. CSV DATA EXPORT ROUTES
// ==========================================
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => {
            let str = String(val !== null && val !== undefined ? val : '');
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        }).join(',')
    );
    return [headers, ...rows].join('\n');
};

router.get('/export/teachers', async (req, res) => {
    try {
        const teachers = await query(`
            SELECT 
                t.user_code AS 'ID Code',
                u.name AS 'Full Name', 
                u.email AS 'Email Address', 
                u.phone_number AS 'Phone Number',
                u.gender AS 'Gender',
                u.address AS 'Location',
                t.highest_qualification AS 'Qualification',
                t.verification_status AS 'Application Status',
                u.status AS 'Account Status',
                DATE_FORMAT(u.join_date, '%Y-%m-%d') AS 'Join Date'
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            ORDER BY u.join_date DESC
        `);

        const csvData = convertToCSV(teachers);
        res.header('Content-Type', 'text/csv');
        res.attachment(`Ziron_Teachers_Export_${getPastDateString(0)}.csv`);
        res.send(csvData);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to export teachers." });
    }
});

router.get('/export/students', async (req, res) => {
    try {
        const students = await query(`
            SELECT 
                s.user_code AS 'ID Code',
                u.name AS 'Full Name', 
                u.email AS 'Email Address', 
                u.phone_number AS 'Phone Number',
                u.gender AS 'Gender',
                u.address AS 'Location',
                s.grade_level AS 'Grade Level',
                s.school_name AS 'School',
                u.status AS 'Account Status',
                DATE_FORMAT(u.join_date, '%Y-%m-%d') AS 'Join Date'
            FROM students s
            JOIN users u ON s.user_id = u.id
            ORDER BY u.join_date DESC
        `);

        const csvData = convertToCSV(students);
        res.header('Content-Type', 'text/csv');
        res.attachment(`Ziron_Students_Export_${getPastDateString(0)}.csv`);
        res.send(csvData);
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to export students." });
    }
});

// ==========================================
// 27.5 PROFESSIONAL FINANCIAL EXPORTS
// ==========================================
router.get('/export/finance', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).send("Unauthorized. Super Admin clearance required.");
        }

        const { type, timeframe, customDate } = req.query;
        let dateCondition = "1=1";

        if (timeframe === 'weekly') {
            dateCondition = "DATE(payment_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
        } else if (timeframe === 'monthly') {
            dateCondition = "MONTH(payment_date) = MONTH(CURDATE()) AND YEAR(payment_date) = YEAR(CURDATE())";
        } else if (timeframe === 'yearly') {
            dateCondition = "YEAR(payment_date) = YEAR(CURDATE())";
        } else if (timeframe === 'custom_month' && customDate) {
            const [year, month] = customDate.split('-');
            dateCondition = `MONTH(payment_date) = ${parseInt(month)} AND YEAR(payment_date) = ${parseInt(year)}`;
        } else if (timeframe === 'custom_year' && customDate) {
            dateCondition = `YEAR(payment_date) = ${parseInt(customDate)}`;
        }

        let data = [];
        let filename = "";

        if (type === 'revenue') {
            filename = `Educat_Student_Revenue_${timeframe}_${getPastDateString(0)}.csv`;
            dateCondition = dateCondition.replace(/payment_date/g, 'p.payment_date');
            
            data = await query(`
                SELECT 
                    p.invoice_link AS 'Invoice ID',
                    DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i') AS 'Date & Time',
                    u.name AS 'Student Name',
                    u.email AS 'Student Email',
                    c.title AS 'Course Name',
                    p.payment_method AS 'Method',
                    p.amount AS 'Amount (LKR)'
                FROM payments p
                JOIN students s ON p.s_id = s.id
                JOIN users u ON s.user_id = u.id
                JOIN classes_courses c ON p.c_id = c.id
                WHERE p.status = 'completed' AND ${dateCondition}
                ORDER BY p.payment_date DESC
            `);

        } else if (type === 'payouts') {
            filename = `Educat_Teacher_Payouts_${timeframe}_${getPastDateString(0)}.csv`;
            dateCondition = dateCondition.replace(/payment_date/g, 'pt.payment_date');

            data = await query(`
                SELECT 
                    pt.id AS 'Transaction ID',
                    DATE_FORMAT(pt.payment_date, '%Y-%m-%d %H:%i') AS 'Date & Time',
                    u.name AS 'Teacher Name',
                    t.user_code AS 'Teacher ID',
                    pt.amount AS 'Amount Paid (LKR)',
                    pt.reference_note AS 'Reference / Note',
                    admin_u.name AS 'Processed By'
                FROM payout_transactions pt
                JOIN teachers t ON pt.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                JOIN users admin_u ON pt.admin_id = admin_u.id
                WHERE ${dateCondition}
                ORDER BY pt.payment_date DESC
            `);

        } else if (type === 'manifest') {
            filename = `Educat_Bank_Transfer_Manifest_${getPastDateString(0)}.csv`;

            data = await query(`
                SELECT 
                    u.name AS 'Teacher Name',
                    t.user_code AS 'Teacher ID',
                    u.phone_number AS 'Phone Number',
                    u.email AS 'Contact Email',
                    tp.month_year AS 'For Month',
                    (tp.net_payable - tp.amount_paid) AS 'Balance to Pay (LKR)'
                FROM teacher_payouts tp
                JOIN teachers t ON tp.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                WHERE (tp.net_payable - tp.amount_paid) > 0
                ORDER BY u.name ASC
            `);

        } else if (type === 'profit') {
            filename = `Educat_Platform_Profit_Summary_${timeframe}_${getPastDateString(0)}.csv`;
            
            let profitDateCondition = "1=1";
            if (timeframe === 'yearly') {
                profitDateCondition = "month_year LIKE CONCAT(YEAR(CURDATE()), '-%')";
            } else if (timeframe === 'monthly') {
                profitDateCondition = "month_year = DATE_FORMAT(CURDATE(), '%Y-%m')";
            } else if (timeframe === 'custom_month' && customDate) {
                profitDateCondition = `month_year = '${customDate}'`;
            } else if (timeframe === 'custom_year' && customDate) {
                profitDateCondition = `month_year LIKE '${customDate}-%'`;
            }

            data = await query(`
                SELECT 
                    month_year AS 'Month/Year',
                    COUNT(DISTINCT teacher_id) AS 'Active Teachers',
                    SUM(gross_earnings) AS 'Total System Volume (LKR)',
                    SUM(platform_fee) AS 'Platform Profit/Fee (LKR)'
                FROM teacher_payouts
                WHERE ${profitDateCondition}
                GROUP BY month_year
                ORDER BY month_year DESC
            `);
        }

        if (data.length === 0) {
            data = [{ Message: `No financial records found for ${type} in the ${timeframe} timeframe.` }];
        }

        const csvData = convertToCSV(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(filename);
        res.send(csvData);

    } catch (error) {
        console.error("Financial Export Error:", error);
        res.status(500).send("Failed to generate financial report.");
    }
});

// ==========================================
// 28. FINANCIAL PAYOUT SYSTEM / LEDGER
// ==========================================
const getFinancialLedgerPayouts = async (req, res) => {
    try {
        const monthYear = req.query.month || new Date().toISOString().slice(0, 7);
        const [year, month] = monthYear.split('-');

        // 1. Query aggregated earnings per teacher joining teachers, courses, payments
        const rawEarnings = await query(`
            SELECT 
                t.id AS teacher_id, 
                u.name AS teacher_name,
                COALESCE(SUM(p.amount), 0) AS gross_earned
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            JOIN classes_courses c ON c.t_id = t.id
            JOIN payments p ON p.c_id = c.id
            WHERE MONTH(p.payment_date) = ? AND YEAR(p.payment_date) = ? AND p.status = 'completed'
            GROUP BY t.id, u.name
        `, [month, year]);

        // 2. Group calculations by teacher.id using a Map/Dictionary to guarantee deduplication in JS
        const earningsByTeacher = new Map();
        for (let earning of rawEarnings) {
            const teacherId = earning.teacher_id;
            const grossEarned = parseFloat(earning.gross_earned || 0);

            if (earningsByTeacher.has(teacherId)) {
                const existing = earningsByTeacher.get(teacherId);
                existing.gross_earned += grossEarned;
            } else {
                earningsByTeacher.set(teacherId, {
                    teacher_id: teacherId,
                    teacher_name: earning.teacher_name,
                    gross_earned: grossEarned
                });
            }
        }

        // 3. Upsert into teacher_payouts table using aggregated totals per teacher
        for (let earning of earningsByTeacher.values()) {
            const platformFee = earning.gross_earned * 0.10; 
            await query(`
                INSERT INTO teacher_payouts (teacher_id, month_year, gross_earnings, platform_fee, net_payable)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    gross_earnings = VALUES(gross_earnings),
                    platform_fee = VALUES(platform_fee),
                    net_payable = (VALUES(gross_earnings) - VALUES(platform_fee) + adjustment)
            `, [earning.teacher_id, monthYear, earning.gross_earned, platformFee, earning.gross_earned - platformFee]);
        }

        // 4. Fetch payout records ensuring 1 row per teacher using GROUP BY t.id, u.name
        const rawPayouts = await query(`
            SELECT 
                tp.id,
                tp.teacher_id,
                tp.month_year,
                tp.gross_earnings,
                tp.platform_fee,
                tp.adjustment,
                tp.net_payable,
                tp.amount_paid,
                tp.payment_status,
                tp.status,
                tp.paid_at,
                u.name AS teacher_name, 
                u.picture
            FROM teacher_payouts tp
            JOIN teachers t ON tp.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            WHERE tp.month_year = ?
            GROUP BY t.id, u.name, tp.id, u.picture
            ORDER BY tp.net_payable DESC
        `, [monthYear]);

        // 5. Consolidate into a map by teacher.id before returning to ensure exactly one row per teacher
        const payoutsMap = new Map();
        rawPayouts.forEach(p => {
            if (!payoutsMap.has(p.teacher_id)) {
                payoutsMap.set(p.teacher_id, {
                    ...p,
                    gross_earnings: parseFloat(p.gross_earnings || 0),
                    platform_fee: parseFloat(p.platform_fee || 0),
                    adjustment: parseFloat(p.adjustment || 0),
                    net_payable: parseFloat(p.net_payable || 0),
                    amount_paid: parseFloat(p.amount_paid || 0)
                });
            }
        });

        const payouts = Array.from(payoutsMap.values());

        const systemStats = {
            totalGross: payouts.reduce((sum, p) => sum + p.gross_earnings, 0),
            systemEarnings: payouts.reduce((sum, p) => sum + p.platform_fee, 0),
            totalToPay: payouts.reduce((sum, p) => sum + p.net_payable, 0),
        };

        res.status(200).json({ success: true, data: payouts, stats: systemStats });
    } catch (error) {
        console.error("Payout Sync Error:", error);
        res.status(500).json({ success: false, message: "Failed to load payouts." });
    }
};

router.get('/payouts', getFinancialLedgerPayouts);
router.get('/financial-ledger', getFinancialLedgerPayouts);

router.put('/payouts/:id/adjust', async (req, res) => {
    try {
        const { adjustment } = req.body;
        const parsedAdjustment = parseFloat(adjustment);
        if (isNaN(parsedAdjustment)) {
            return res.status(400).json({ success: false, message: "Invalid adjustment amount." });
        }

        await query(`
            UPDATE teacher_payouts 
            SET adjustment = ?, 
                net_payable = (gross_earnings - platform_fee) + ?,
                payment_status = CASE 
                    WHEN amount_paid >= ((gross_earnings - platform_fee) + ?) AND ((gross_earnings - platform_fee) + ?) > 0 THEN 'completed'
                    WHEN amount_paid > 0 THEN 'partial'
                    ELSE 'unpaid'
                END
            WHERE id = ?
        `, [parsedAdjustment, parsedAdjustment, parsedAdjustment, parsedAdjustment, req.params.id]);

        res.status(200).json({ success: true, message: "Adjustment applied successfully." });
    } catch (error) {
        console.error("Payout adjustment error:", error);
        res.status(500).json({ success: false, message: "Failed to apply adjustment." });
    }
});

router.post('/payouts/:id/pay', async (req, res) => {
    try {
        const payoutId = req.params.id;
        const { amount, referenceNote, teacherId } = req.body;
        const adminId = req.session.userId;

        await query(`
            INSERT INTO payout_transactions (payout_id, teacher_id, admin_id, amount, reference_note)
            VALUES (?, ?, ?, ?, ?)
        `, [payoutId, teacherId, adminId, amount, referenceNote]);

        await query(`
            UPDATE teacher_payouts 
            SET amount_paid = amount_paid + ? 
            WHERE id = ?
        `, [amount, payoutId]);

        await query(`
            UPDATE teacher_payouts 
            SET payment_status = CASE 
                WHEN amount_paid >= net_payable THEN 'completed'
                ELSE 'partial'
            END
            WHERE id = ?
        `, [payoutId]);

        res.status(200).json({ success: true, message: "Payment recorded successfully in the ledger." });
    } catch (error) {
        console.error("Payment Transaction Error:", error);
        res.status(500).json({ success: false, message: "Failed to process payment transaction." });
    }
});

router.get('/payouts/:id/history', async (req, res) => {
    try {
        const history = await query(`
            SELECT pt.*, u.name as admin_name 
            FROM payout_transactions pt
            JOIN users u ON pt.admin_id = u.id
            WHERE pt.payout_id = ?
            ORDER BY pt.payment_date DESC
        `, [req.params.id]);

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load transaction history." });
    }
});

// ==========================================
// 29. STAFF (SUB-ADMIN) PAYROLL SYSTEM
// ==========================================
router.get('/staff-payouts', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') {
            return res.status(403).json({ success: false, message: "Super Admin clearance required." });
        }

        const monthYear = req.query.month || new Date().toISOString().slice(0, 7);

        const subAdmins = await query(`
            SELECT u.id, u.name 
            FROM users u 
            JOIN admins a ON u.id = a.user_id 
            WHERE a.admin_level IN ('moderator', 'finance') AND u.status = 'active'
        `);

        for (let admin of subAdmins) {
            await query(`
                INSERT IGNORE INTO admin_payouts (sub_admin_id, month_year)
                VALUES (?, ?)
            `, [admin.id, monthYear]);
        }

        const payouts = await query(`
            SELECT 
                ap.*, u.name as admin_name, u.picture
            FROM admin_payouts ap
            JOIN users u ON ap.sub_admin_id = u.id
            WHERE ap.month_year = ?
            ORDER BY ap.net_payable DESC
        `, [monthYear]);

        const systemStats = {
            totalSalaries: payouts.reduce((sum, p) => sum + parseFloat(p.base_salary), 0),
            totalAdjustments: payouts.reduce((sum, p) => sum + parseFloat(p.adjustment), 0),
            totalToPay: payouts.reduce((sum, p) => sum + parseFloat(p.net_payable), 0),
        };

        res.status(200).json({ success: true, data: payouts, stats: systemStats });
    } catch (error) {
        console.error("Staff Payout Sync Error:", error);
        res.status(500).json({ success: false, message: "Failed to load staff payouts." });
    }
});

router.put('/staff-payouts/:id/update', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') return res.status(403).send("Unauthorized.");
        
        const { base_salary, adjustment } = req.body;
        const parsedBase = parseFloat(base_salary);
        const parsedAdj = parseFloat(adjustment);
        const base = isNaN(parsedBase) ? 0 : parsedBase;
        const adj = isNaN(parsedAdj) ? 0 : parsedAdj;
        const net = base + adj;
        
        await query(`
            UPDATE admin_payouts 
            SET base_salary = ?, 
                adjustment = ?, 
                net_payable = ?,
                payment_status = CASE 
                    WHEN amount_paid >= ? AND ? > 0 THEN 'completed'
                    WHEN amount_paid > 0 THEN 'partial'
                    ELSE 'unpaid'
                END
            WHERE id = ?
        `, [base, adj, net, net, net, req.params.id]);

        res.status(200).json({ success: true, message: "Payroll updated successfully." });
    } catch (error) {
        console.error("Staff Payroll update error:", error);
        res.status(500).json({ success: false, message: "Failed to update payroll." });
    }
});

router.post('/staff-payouts/:id/pay', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') return res.status(403).send("Unauthorized.");

        const payoutId = req.params.id;
        const { amount, referenceNote, subAdminId } = req.body;
        const superAdminId = req.session.userId;

        await query(`
            INSERT INTO admin_payout_transactions (payout_id, sub_admin_id, processed_by, amount, reference_note)
            VALUES (?, ?, ?, ?, ?)
        `, [payoutId, subAdminId, superAdminId, amount, referenceNote]);

        await query(`
            UPDATE admin_payouts 
            SET amount_paid = amount_paid + ? 
            WHERE id = ?
        `, [amount, payoutId]);

        await query(`
            UPDATE admin_payouts 
            SET payment_status = CASE 
                WHEN amount_paid >= net_payable THEN 'completed'
                ELSE 'partial'
            END
            WHERE id = ?
        `, [payoutId]);

        res.status(200).json({ success: true, message: "Payment recorded successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to process payment." });
    }
});

router.get('/staff-payouts/:id/history', async (req, res) => {
    try {
        if (req.session.adminLevel !== 'super') return res.status(403).send("Unauthorized.");

        const history = await query(`
            SELECT pt.*, u.name as processor_name 
            FROM admin_payout_transactions pt
            JOIN users u ON pt.processed_by = u.id
            WHERE pt.payout_id = ?
            ORDER BY pt.payment_date DESC
        `, [req.params.id]);

        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to load history." });
    }
});

// ==========================================
// 21. BANK SLIP PAYMENTS APPROVAL
// ==========================================
router.get('/pending-payments', async (req, res) => {
    try {
        const payments = await query(`
            SELECT 
                p.id, p.amount, p.slip_url, p.payment_date, p.invoice_link,
                u.name as student_name, u.email as student_email,
                c.title as course_title, c.id as class_id,
                s.id as student_id
            FROM payments p
            JOIN students s ON p.s_id = s.id
            JOIN users u ON s.user_id = u.id
            JOIN classes_courses c ON p.c_id = c.id
            WHERE p.status = 'pending_approval' AND p.payment_method = 'slip'
            ORDER BY p.payment_date ASC
        `);
        res.status(200).json({ success: true, data: payments });
    } catch (error) {
        console.error("Pending payments error:", error);
        res.status(500).json({ success: false, message: "Failed to load pending payments." });
    }
});

router.put('/payments/:id/approve', async (req, res) => {
    try {
        const paymentId = req.params.id;
        
        const paymentDetails = await query('SELECT * FROM payments WHERE id = ?', [paymentId]);
        if (paymentDetails.length === 0) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        
        const { c_id, s_id } = paymentDetails[0];

        await query('UPDATE payments SET status = ? WHERE id = ?', ['completed', paymentId]);
        await query('INSERT IGNORE INTO enrollments (s_id, c_id) VALUES (?, ?)', [s_id, c_id]);

        const studentUser = await query('SELECT user_id FROM students WHERE id = ?', [s_id]);
        if (studentUser.length > 0) {
            await query(`
                INSERT INTO notifications (user_id, title, description, is_read)
                VALUES (?, 'Payment Approved', 'Your bank slip payment was approved and you have been enrolled.', 0)
            `, [studentUser[0].user_id]);
        }

        res.status(200).json({ success: true, message: "Payment approved successfully." });
    } catch (error) {
        console.error("Payment approve error:", error);
        res.status(500).json({ success: false, message: "Failed to approve payment." });
    }
});

router.put('/payments/:id/reject', async (req, res) => {
    try {
        const paymentId = req.params.id;
        await query('UPDATE payments SET status = ? WHERE id = ?', ['rejected', paymentId]);
        
        const paymentDetails = await query('SELECT s_id FROM payments WHERE id = ?', [paymentId]);
        if (paymentDetails.length > 0) {
            const studentUser = await query('SELECT user_id FROM students WHERE id = ?', [paymentDetails[0].s_id]);
            if (studentUser.length > 0) {
                await query(`
                    INSERT INTO notifications (user_id, title, description, is_read)
                    VALUES (?, 'Payment Rejected', 'Your bank slip payment was rejected. Please contact support.', 0)
                `, [studentUser[0].user_id]);
            }
        }

        res.status(200).json({ success: true, message: "Payment rejected successfully." });
    } catch (error) {
        console.error("Payment reject error:", error);
        res.status(500).json({ success: false, message: "Failed to reject payment." });
    }
});

export default router;