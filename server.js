import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

// 1. Serve the static files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Point the root route to the index.html INSIDE dist
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 3. Handle React Routing (optional but recommended)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});