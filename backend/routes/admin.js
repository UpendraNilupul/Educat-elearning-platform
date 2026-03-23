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
            
            for(let i=6; i>=0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({ 
                    time: dateObj.toLocaleDateString('en-US', {weekday: 'short'}), 
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
            
            for(let i=29; i>=0; i--) {
                const targetDate = getPastDateString(i);
                const found = rawData.find(row => row.dateStr === targetDate);
                const dateObj = new Date(targetDate);
                usageData.push({ 
                    time: dateObj.toLocaleDateString('en-US', {month: 'short', day: 'numeric'}), 
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
                   t.university, t.experience_years, t.bio, t.resume_link
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

export default router;