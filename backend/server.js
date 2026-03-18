import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import loginRoutes from './routes/login.js';
import registerRoutes from './routes/register.js';
import teacherRoutes from './routes/teachers.js';
import teacherProfileRoutes from './routes/TeacherProfileEdit.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import session from 'express-session';
import mysql from 'mysql2/promise';

const app = express();

// ==========================================
// 1. MIDDLEWARE & SESSIONS
// ==========================================

// Allow React to communicate with Express and send cookies
app.use(cors({ 
    origin: 'http://localhost:5173', 
    credentials: true 
})); 
app.use(express.json()); 

// Set up sessions to remember who is logged in (Needed for your App.jsx)
app.use(session({
    secret: 'educat_super_secret_key_123', // In production, put this in a .env file
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// 2. Register your database API routes
// (e.g., http://localhost:3000/api/login)
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/teacher', teacherProfileRoutes);

// Add this below your other app.use('/api', ...) lines
app.use('/api/forgot-password', forgotPasswordRoutes);


app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});
// ==========================================
// 2. DATABASE CONFIGURATION
// ==========================================
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // <--- UPDATE THIS if your MySQL has a password
    database: 'educat'
});

// ==========================================
// 3. AUTHENTICATION ROUTES
// ==========================================

// Registration Route
app.post('/api/register', async (req, res) => {
    // Extract data sent from your React registration form
    const { name, email, password, role, phone_number, address, dob, gender } = req.body;

    try {
        // 1. Find the role_id for the requested role ('student', 'teacher', 'admin')
        const [roleRows] = await pool.query('SELECT id FROM roles WHERE role_name = ?', [role]);
        if (roleRows.length === 0) return res.status(400).json({ error: "Invalid role" });
        const roleId = roleRows[0].id;

        // 2. Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);
        const joinDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        // 3. Insert into the main 'users' table
        const userQuery = `
            INSERT INTO users (name, email, password, role_id, phone_number, address, dob, gender, join_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [userResult] = await pool.query(userQuery, [
            name, email, hashedPassword, roleId, 
            phone_number || '0000000000', address || 'N/A', dob || '2000-01-01', gender || 'other', joinDate
        ]);

        const newUserId = userResult.insertId;

        // 4. Insert into the specific profile table (Ripple effect from new database schema!)
        if (role === 'student') {
            await pool.query('INSERT INTO students (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'teacher') {
            await pool.query('INSERT INTO teachers (user_id) VALUES (?)', [newUserId]);
        } else if (role === 'admin') {
            await pool.query('INSERT INTO admins (user_id) VALUES (?)', [newUserId]);
        }

        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Registration failed" });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Find user and join the roles table to get the text name of the role
        const [users] = await pool.query(`
            SELECT u.*, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id 
            WHERE u.email = ?
        `, [email]);

        if (users.length === 0) return res.status(401).json({ error: "Invalid email or password" });

        const user = users[0];

        // 2. Compare the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        // 3. Save user info to the session
        req.session.userId = user.id;
        req.session.userRole = user.role_name;
        req.session.userName = user.name;

        // Send back to React
        res.json({ 
            message: "Logged in successfully", 
            userId: user.id,
            userName: user.name, 
            userRole: user.role_name 
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Login failed" });
    }
});

// Status Route (Called by App.jsx inside useEffect on load)
app.get('/api/status', (req, res) => {
    if (req.session.userId) {
        res.json({ 
            isLoggedIn: true, 
            userId: req.session.userId,
            userName: req.session.userName, 
            userRole: req.session.userRole 
        });
    } else {
        res.status(401).json({ isLoggedIn: false });
    }
});

// Logout Route (Called by App.jsx handleLogout)
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: "Could not log out" });
        res.clearCookie('connect.sid'); // Clear the session cookie
        res.json({ message: "Logged out successfully" });
    });
});

// ==========================================
// 4. COURSE ROUTES
// ==========================================

app.get('/api/courses/student/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        // Step A: Find the specific student_id associated with this user_id
        const [studentRes] = await pool.query('SELECT id FROM students WHERE user_id = ?', [userId]);
        
        if (studentRes.length === 0) {
            return res.status(404).json({ message: "Student profile not found." });
        }
        
        const studentId = studentRes[0].id;

        // Step B: Fetch courses, instructor name, and calculate progress
        const query = `
            SELECT 
                c.id, 
                c.title, 
                u.name AS instructor,
                c.theme_color AS color,
                c.thumbnail_url AS thumbnail,
                e.status,
                IFNULL(r.rating, 5.0) AS rating,
                (SELECT COUNT(*) FROM modules m WHERE m.c_id = c.id) AS totalModules,
                (SELECT COUNT(*) FROM lessons l JOIN modules m ON l.m_id = m.id WHERE m.c_id = c.id) AS totalLessons,
                (SELECT COUNT(*) FROM lesson_completions lc 
                 JOIN lessons l ON lc.l_id = l.id 
                 JOIN modules m ON l.m_id = m.id 
                 WHERE m.c_id = c.id AND lc.s_id = ?) AS lessonsCompleted
            FROM enrollments e
            JOIN classes_courses c ON e.c_id = c.id
            JOIN teachers t ON c.t_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN reviews r ON r.c_id = c.id AND r.s_id = ?
            WHERE e.s_id = ?;
        `;

        const [courses] = await pool.query(query, [studentId, studentId, studentId]);

        // Step C: Format the data exactly how your React Course.jsx expects it
        const formattedCourses = courses.map(course => {
            const progress = course.totalLessons > 0 
                ? Math.round((course.lessonsCompleted / course.totalLessons) * 100) 
                : 0;

            return {
                id: course.id,
                title: course.title,
                instructor: course.instructor,
                progress: progress,
                modulesCompleted: Math.floor((progress / 100) * course.totalModules),
                totalModules: course.totalModules || 0,
                rating: course.rating,
                status: course.status,
                color: course.color || 'purple',
                thumbnail: course.thumbnail || 'bg-gradient-to-br from-purple-500 to-indigo-600'
            };
        });

        res.json(formattedCourses);

    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({ error: "Failed to fetch courses" });
    }
});

// ==========================================
// 5. START SERVER
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Educat backend is running on http://localhost:${PORT}`);
});
// Test the database connection immediately on startup
pool.query('SELECT 1')
    .then(() => console.log('✅ Connected to the MySQL database!'))
    .catch(err => console.error('❌ Database connection failed:', err));