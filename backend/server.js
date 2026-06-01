import 'dotenv/config';
import express from 'express';
import http from 'http'; // 🌟 NEW: Import Node's native HTTP module
import { Server } from 'socket.io'; // 🌟 NEW: Import Socket.io
import path from 'path';
import cors from 'cors';
import session from 'express-session';
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
import initAssignmentScheduler from './jobs/assignmentScheduler.js';

//chat
import studentChatRoutes from './routes/studentChat.js';
import teacherChatRoutes from './routes/teacherChat.js';
import adminChatRoutes from './routes/adminChat.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

// ==========================================
// 🌟 NEW: SERVER & SOCKET INITIALIZATION
// ==========================================
const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'], // Matching your React ports
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

app.use(session({
    secret: 'a_very_long_random_secret_string',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: false, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 }
}));

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
//chat
app.use('/api', studentChatRoutes);
app.use('/api', teacherChatRoutes);
app.use('/api', adminChatRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', quizRoutes);

// SERVE UPLOADS
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ==========================================
// 🌟 NEW: SOCKET.IO CHAT LOGIC
// ==========================================
io.on("connection", (socket) => {
    console.log(`🟢 User Connected to Chat: ${socket.id}`);

    // Join a specific conversation room
    socket.on("join_room", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    // Handle sending/receiving messages
    socket.on("send_message", (data) => {
        // data expects: { room: conversation_id, message: { sender_id, body, created_at } }
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

// 🌟 FIX: Listen using 'server' instead of 'app'
server.listen(PORT, () => {
    console.log(`🌱 Server running on http://localhost:${PORT}`);
    // Start background jobs
    initAssignmentScheduler(io);
});
