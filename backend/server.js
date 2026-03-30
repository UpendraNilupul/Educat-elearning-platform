import 'dotenv/config';
import express from 'express';
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
<<<<<<< HEAD
import studentProfileRoutes from './routes/studentProfileEdit.js';
=======


>>>>>>> 7a01597a655ba09130f2dfb4164a6f429daef200
// 🌟 THE NEW TEAMMATE ROUTES
import courseRoutes from './routes/courses.js';
import teacherProfileRoutes from './routes/TeacherProfileEdit.js';
import studentProfileRoutes from './routes/StudentProfileEdit.js'; // 🌟 ADD THIS LINE!

import classRoutes from './routes/class.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

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

// 🌟 ROUTE MOUNTING
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);

// Mount the new routes
<<<<<<< HEAD
app.use('/api', courseRoutes); 
app.use('/api/teacher', teacherProfileRoutes); 
app.use('/api', verifyRoutes); 
app.use('/api', classRoutes);
=======
app.use('/api', courseRoutes);
app.use('/api/teacher', teacherProfileRoutes);
app.use('/api', verifyRoutes);
>>>>>>> 7a01597a655ba09130f2dfb4164a6f429daef200
app.use('/api/student', studentProfileRoutes);


// 🌟 THE FIX: Give permission to serve the uploaded profile pictures!

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌱 Server running on http://localhost:${PORT}`);
});
