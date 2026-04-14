import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';

// ==========================================
// 🌟 TEAM EKE ROUTES IMPORTS 
// ==========================================
import adminRoute from './routes/admin.js';
import classRoute from './routes/class.js';
import coursesRoute from './routes/courses.js';
import forgotPasswordRoute from './routes/forgotPassword.js';
import loginRoute from './routes/login.js';
import paymentRoute from './routes/paymentRoute.js';
import registerRoute from './routes/register.js';
import studentProfileRoute from './routes/StudentProfileEdit.js';
import teachersRoute from './routes/teachers.js';
import verifyRoute from './routes/verify.js';

const app = express();

// ==========================================
// 🌟 MIDDLEWARE TIKA
// ==========================================
// 1. CORS Allow kirima (Frontend ekata connect wenna)
app.use(cors({ 
    origin: 'http://localhost:5173', 
    credentials: true 
}));

// 2. JSON saha PayHere Form Data kiyawanna
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

// 3. Login Sessions on kirima
app.use(cookieParser());
app.use(session({
    secret: 'educat-secret-key-2024', 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 }
}));

// ==========================================
// 🌟 ROUTES TIKA
// ==========================================
app.use('/api', paymentRoute);
app.use('/api/admin', adminRoute);
app.use('/api', coursesRoute);
app.use('/api', forgotPasswordRoute);
app.use('/api', loginRoute);
app.use('/api', registerRoute);
app.use('/api', teachersRoute);
app.use('/api', verifyRoute);

// 🌟 Student profile eke basic-info wada karanna
app.use('/api/student', studentProfileRoute); 

// 🌟 ALUTH FIX EKA: Classes route eka widi dekatama wada karanna damma
app.use('/api/student', classRoute); // /student/classes wada karanna (My Lessons)
app.use('/api', classRoute);         // /suggested-classes wada karanna (Suggested Classes)

// ==========================================
// SERVER EKA START KIRIMA
// ==========================================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 🚀`);
});

