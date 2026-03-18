import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import session from 'express-session';

// 🌟 ADDED THESE THREE LINES:
import db from './db.js'; 
import util from 'util';
const query = util.promisify(db.query).bind(db);

// Route Imports
import loginRoutes from './routes/login.js';
import registerRoutes from './routes/register.js';
import teacherRoutes from './routes/teachers.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
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
        httpOnly: true, 
        secure: false, 
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // Cookie lasts for 1 day
    }
}));

// 🌟 THE FOOTPRINT TRACKER (Middleware)
app.use('/api', async (req, res, next) => {
    // Check if the user is currently logged in
    if (req.session && req.session.userId) {
        try {
            // Update their clock to exactly right now
            await query('UPDATE users SET last_active = NOW() WHERE id = ?', [req.session.userId]);
        } catch (error) {
            console.error("Failed to update last_active:", error);
        }
    }
    next(); // Pass the request along to its actual destination
});

// We need a blank route specifically for the frontend heartbeat to hit
app.post('/api/heartbeat', (req, res) => {
    // It doesn't need to do anything! The middleware above already updated the time.
    res.status(200).json({ message: 'Heartbeat received' });
});


// 2. Register your database API routes
app.use('/api', loginRoutes);
app.use('/api', registerRoutes);
app.use('/api', teacherRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});