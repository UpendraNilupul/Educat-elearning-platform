import express from 'express';
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';

// Routes
import loginRoutes from './routes/login.js';
import registerRoutes from './routes/register.js';
import teacherRoutes from './routes/teachers.js';
import teacherProfileRoutes from './routes/TeacherProfileEdit.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

//
// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
//
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'educat'
});

//
// ==========================================
// 2. MIDDLEWARE
// ==========================================
//
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: 'a_very_long_random_secret_string',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Serve React build
app.use(express.static(path.join(__dirname, '..', 'dist')));

//
// ==========================================
// 3. USER ACTIVITY TRACKER
// ==========================================
//
app.use('/api', async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            await pool.query(
                'UPDATE users SET last_active = NOW() WHERE id = ?',
                [req.session.userId]
            );
        } catch (err) {
            console.error("Activity update error:", err);
        }
    }
    next();
});

//
// ==========================================
// 4. ROUTES
// ==========================================
//
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/teacher', teacherProfileRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/admin', adminRoutes);

//
// ==========================================
// 5. AUTH ROUTES
// ==========================================
//

// Register (if you still want custom logic here)
app.post('/api/register', async (req, res) => {
    const { name, email, password, role, phone_number, address, dob, gender } = req.body;

    try {
        const [roleRows] = await pool.query(
            'SELECT id FROM roles WHERE role_name = ?',
            [role]
        );

        if (roleRows.length === 0) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const roleId = roleRows[0].id;
        const hashedPassword = await bcrypt.hash(password, 10);
        const joinDate = new Date().toISOString().slice(0, 10);

        const [userResult] = await pool.query(
            `INSERT INTO users 
            (name, email, password, role_id, phone_number, address, dob, gender, join_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                email,
                hashedPassword,
                roleId,
                phone_number || '0000000000',
                address || 'N/A',
                dob || '2000-01-01',
                gender || 'other',
                joinDate
            ]
        );

        const newUserId = userResult.insertId;

        if (role === 'student') {
            await pool.query('INSERT INTO students (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'teacher') {
            await pool.query('INSERT INTO teachers (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'admin') {
            await pool.query('INSERT INTO admins (user_id) VALUES (?)', [newUserId]);
        }

        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});

// Heartbeat
app.post('/api/heartbeat', (req, res) => {
    res.json({ message: 'Heartbeat received' });
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: "Logout failed" });

        res.clearCookie('connect.sid');
        res.json({ message: "Logged out successfully" });
    });
});

//
// ==========================================
// 6. COURSE ROUTES
// ==========================================
//
app.get('/api/courses/student/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const [studentRes] = await pool.query(
            'SELECT id FROM students WHERE user_id = ?',
            [userId]
        );

        if (studentRes.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }

        const studentId = studentRes[0].id;

        const [courses] = await pool.query(`
            SELECT 
                c.id, 
                c.title, 
                u.name AS instructor,
                c.theme_color AS color,
                c.thumbnail_url AS thumbnail,
                e.status,
                IFNULL(r.rating, 5.0) AS rating,
                (SELECT COUNT(*) FROM modules WHERE c_id = c.id) AS totalModules,
                (SELECT COUNT(*) FROM lessons l 
                    JOIN modules m ON l.m_id = m.id 
                    WHERE m.c_id = c.id) AS totalLessons,
                (SELECT COUNT(*) FROM lesson_completions lc 
                    JOIN lessons l ON lc.l_id = l.id 
                    JOIN modules m ON l.m_id = m.id 
                    WHERE m.c_id = c.id AND lc.s_id = ?) AS lessonsCompleted
            FROM enrollments e
            JOIN classes_courses c ON e.c_id = c.id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN reviews r ON r.c_id = c.id AND r.s_id = ?
            WHERE e.s_id = ?
        `, [studentId, studentId, studentId]);

        const formatted = courses.map(c => {
            const progress = c.totalLessons > 0
                ? Math.round((c.lessonsCompleted / c.totalLessons) * 100)
                : 0;

            return {
                id: c.id,
                title: c.title,
                instructor: c.instructor,
                progress,
                modulesCompleted: Math.floor((progress / 100) * c.totalModules),
                totalModules: c.totalModules || 0,
                rating: c.rating,
                status: c.status,
                color: c.color || 'purple',
                thumbnail: c.thumbnail || 'default'
            };
        });

        res.json(formatted);

    } catch (err) {
        console.error("Course fetch error:", err);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

//
// ==========================================
// 7. FRONTEND FALLBACK (IMPORTANT LAST)
// ==========================================
//
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

//
// ==========================================
// 8. START SERVER
// ==========================================
//
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});

// Test DB
pool.query('SELECT 1')
    .then(() => console.log('✅ MySQL Connected'))
    .catch(err => console.error('❌ DB Connection Failed:', err));