import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import loginRoutes from './routes/login.js';
import registerRoutes from './routes/register.js';
import teacherRoutes from './routes/teachers.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import session from 'express-session';

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

// Add this below your other app.use('/api', ...) lines
app.use('/api/forgot-password', forgotPasswordRoutes);


app.use((req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});