import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import loginRoutes from './routs/login.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// 1. Serve the static React files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Register your database API routes
// (e.g., http://localhost:3000/api/login)
app.use('/api', loginRoutes);


app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});