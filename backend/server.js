import 'dotenv/config';
import express from 'express';
import http from 'http'; 
import { Server } from 'socket.io'; 
import path from 'path';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';

import db from './db.js';
import util from 'util';
const query = util.promisify(db.query).bind(db);

// Route Imports
import loginRoutes from './routes/login.js';
import registerRoutes from './routes/register.js';
import teacherRoutes from './routes/teachers.js';
import adminRoutes from './routes/admin.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import verifyRoutes from './routes/verify.js';
import courseRoutes from './routes/courses.js';
import teacherProfileRoutes from './routes/TeacherProfileEdit.js';
import studentProfileRoutes from './routes/StudentProfileEdit.js';
import classRoutes from './routes/class.js';
import assignmentRoutes from './routes/assignments.js';
import quizRoutes from './routes/quizzes.js';
import paymentRoute from './routes/paymentRoute.js'; 
import initAssignmentScheduler from './jobs/assignmentScheduler.js';

// Chat Routes
import studentChatRoutes from './routes/studentChat.js';
import teacherChatRoutes from './routes/teacherChat.js';
import adminChatRoutes from './routes/adminChat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// ==========================================
// 🌟 SERVER & SOCKET INITIALIZATION
// ==========================================
const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'], 
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Express Session Configuration
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'a_very_long_random_secret_string',
    resave: false,
    saveUninitialized: false, 
    cookie: { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        sameSite: 'lax', 
        maxAge: 1000 * 60 * 60 * 24 
    }
});

app.use(sessionMiddleware);
io.engine.use(sessionMiddleware); 

// Session-swapping middleware for tab-level role isolation on localhost
app.use(async (req, res, next) => {
    if (req.session) {
        const reqRole = req.headers['x-user-role'];
        const reqUserId = req.headers['x-user-id'];
        
        if (reqRole && reqUserId) {
            req.session.roles = req.session.roles || {};
            if (!req.session.roles[reqRole]) {
                try {
                    const sqlQuery = `
                        SELECT users.id, roles.role_name, users.name, users.picture, admins.admin_level 
                        FROM users 
                        JOIN roles ON users.role_id = roles.id 
                        LEFT JOIN admins ON users.id = admins.user_id
                        WHERE users.id = ?
                    `;
                    const results = await query(sqlQuery, [reqUserId]);
                    if (results.length > 0) {
                        const user = results[0];
                        const normalizedRole = String(user.role_name || '').toLowerCase().trim();
                        if (normalizedRole === String(reqRole).toLowerCase().trim()) {
                            req.session.roles[normalizedRole] = {
                                userId: user.id,
                                userRole: normalizedRole,
                                userName: user.name,
                                adminLevel: user.admin_level || null,
                                userPicture: user.picture
                            };
                        }
                    }
                } catch (err) {
                    console.error("Failed to reconstruct session roles:", err);
                }
            }
            
            if (req.session.roles[reqRole]) {
                const roleData = req.session.roles[reqRole];
                req.session.userId = roleData.userId;
                req.session.userRole = reqRole;
                req.session.userName = roleData.userName;
                req.session.userPicture = roleData.userPicture;
                req.session.adminLevel = roleData.adminLevel;
            }
        }
    }
    next();
});

// FOOTPRINT TRACKER
app.use('/api', async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            await query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.session.userId]);
        } catch (error) {
            console.error("Failed to update last_active:", error);
        }
    }
    next();
});

// Heartbeat
app.post('/api/heartbeat', (req, res) => {
    res.status(200).json({ message: 'Heartbeat received' });
});

// ROUTE MOUNTING
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api', courseRoutes);
app.use('/api/teacher', teacherProfileRoutes);
app.use('/api', verifyRoutes);
app.use('/api', classRoutes);
app.use('/api/student', studentProfileRoutes);
app.use('/api', paymentRoute); 

// ==========================================
// 📊 STATS API ROUTE
// ==========================================
app.get('/api/public/stats', async (req, res) => {
    try {
        console.log("🚀 Stats API hit una!"); 
        
        const studentCount = await query('SELECT COUNT(*) AS count FROM students');
        console.log("📦 Student Data:", studentCount); 

        const teacherCount = await query('SELECT COUNT(*) AS count FROM teachers');
        const courseCount = await query('SELECT COUNT(*) AS count FROM classes_courses');

        res.status(200).json({
            students: studentCount[0]?.count || 0,
            teachers: teacherCount[0]?.count || 0,
            courses: courseCount[0]?.count || 0
        });
    } catch (error) {
        console.error("❌ Stats Backend Error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Chat Routes
app.use('/api', studentChatRoutes);
app.use('/api', teacherChatRoutes);
app.use('/api', adminChatRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', quizRoutes);

// SERVE UPLOADS
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ==========================================
// 🌟 SECURED: SOCKET.IO CHAT LOGIC
// ==========================================
io.on("connection", (socket) => {
    const session = socket.request.session;
    console.log(`🟢 User Connected to Chat: ${socket.id}`);

    // Join a specific conversation room
    socket.on("join_room", async (conversationId) => {
        // Verify Authentication & Authorization
        if (!session || !session.userId) return;

        try {
            const check = await query(
                'SELECT id FROM conversations WHERE id = ? AND (participant1_id = ? OR participant2_id = ?)', 
                [conversationId, session.userId, session.userId]
            );
            
            if (check.length > 0) {
                socket.join(conversationId);
                console.log(`🔒 User ${session.userId} securely joined chat ${conversationId}`);
            } else {
                console.warn(`⚠️ User ${session.userId} attempted to hack into unauthorized chat ${conversationId}`);
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Handle sending/receiving messages
    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data.message);
    });

    // Handle joining a global notification room for the user
    socket.on("join_notification_room", (userId) => {
        const roomName = `user_${userId}`;
        socket.join(roomName);
        console.log(`User ${socket.id} joined notification room: ${roomName}`);
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

// Fallback for SPA routing
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`🌱 Server running on http://localhost:${PORT}`);
    // Start background jobs
    initAssignmentScheduler(io);
});


