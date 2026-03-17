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

import forgotPasswordRoutes from './routes/forgotPassword.js';
import coursesRoutes from './routes/courses.js';
import session from 'express-session';
import adminRoutes from './routes/admin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());

// 1. Serve the static React files from the 'dist' folder
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use(session({
    secret: 'a_very_long_random_secret_string', // Used to sign the session ID
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // 🛡️ CRITICAL: Hides the cookie from hackers' JavaScript!
        secure: false, // Set to true later when you launch with HTTPS
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // Cookie lasts for 1 day
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

// 2. Register your database API routes
// (e.g., http://localhost:3000/api/login)
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/courses', coursesRoutes);

// Add this below your other app.use('/api', ...) lines
app.use('/api/forgot-password', forgotPasswordRoutes);

// Add to your route definitions (below your other app.use lines)
app.use('/api/admin', adminRoutes);



app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
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
app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});
