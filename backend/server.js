import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url'; // 🌟 FIX: Added missing import
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// ==========================================
// 🌟 ROUTE IMPORTS (Merged & Cleaned)
// ==========================================
import adminRoute from './routes/admin.js';
import classRoute from './routes/class.js';
import coursesRoute from './routes/courses.js';
import forgotPasswordRoute from './routes/forgotPassword.js';
import loginRoute from './routes/login.js';
import paymentRoute from './routes/paymentRoute.js';
import registerRoute from './routes/register.js';
import studentProfileRoute from './routes/StudentProfileEdit.js';
import teacherProfileRoute from './routes/TeacherProfileEdit.js';
import teachersRoute from './routes/teachers.js';
import verifyRoute from './routes/verify.js';
import assignmentRoutes from './routes/assignments.js';
import quizRoutes from './routes/quizzes.js';

// Chat Routes
import studentChatRoutes from './routes/studentChat.js';
import teacherChatRoutes from './routes/teacherChat.js';
import adminChatRoutes from './routes/adminChat.js';

// Jobs
import initAssignmentScheduler from './jobs/assignmentScheduler.js';

// ==========================================
// 🌟 SETUP & SOCKET.IO INITIALIZATION
// ==========================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// ==========================================
// 🌟 MIDDLEWARE
// ==========================================
// CORS Allow
app.use(cors({ 
    origin: ['http://localhost:5173', 'http://localhost:5174'], 
    credentials: true 
}));

// JSON & Form Data Parse
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser());

// Sessions
app.use(session({
    secret: 'educat-secret-key-2024', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// Serve Uploads & Static files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// ==========================================
// 🌟 MOUNT ROUTES
// ==========================================
// Core Routes
app.use('/api', loginRoute);
app.use('/api', registerRoute);
app.use('/api', teachersRoute);
app.use('/api', coursesRoute);
app.use('/api', verifyRoute);
app.use('/api', paymentRoute);
app.use('/api/admin', adminRoute);
app.use('/api/forgot-password', forgotPasswordRoute);
// 🌟 HEARTBEAT ROUTE EKA (Chat eke user online da balanna)
app.get('/api/heartbeat', (req, res) => {
    res.status(200).json({ success: true, message: 'Alive' });
});
// Profile & Classes
app.use('/api/teacher', teacherProfileRoute);
app.use('/api/student', studentProfileRoute); 
app.use('/api/student', classRoute); // My Lessons
app.use('/api', classRoute);         // Suggested Classes

// Assignments & Quizzes
app.use('/api', assignmentRoutes);
app.use('/api', quizRoutes);

// Chat Routes
app.use('/api', studentChatRoutes);
app.use('/api', teacherChatRoutes);
app.use('/api', adminChatRoutes);

// ==========================================
// 🌟 SOCKET.IO CHAT LOGIC
// ==========================================
io.on("connection", (socket) => {
    console.log(`🟢 User Connected to Chat: ${socket.id}`);

    socket.on("join_room", (conversationId) => {
        socket.join(conversationId);
        console.log(`User ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on("send_message", (data) => {
        socket.to(data.room).emit("receive_message", data.message);
    });

    socket.on("disconnect", () => {
        console.log(`🔴 User Disconnected: ${socket.id}`);
    });
});

// Fallback for SPA routing (React frontend)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// ==========================================
// 🌟 START SERVER (Using server.listen for Sockets)
// ==========================================
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🌱 Server running on http://localhost:${PORT} 🚀`);
    initAssignmentScheduler();
});