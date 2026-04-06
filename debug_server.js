import 'dotenv/config';
import fs from 'fs';
import express from 'express';
import db from './backend/db.js';
import initAssignmentScheduler from './backend/jobs/assignmentScheduler.js';

console.log("🚀 Starting Server Debug...");

async function start() {
    try {
        console.log("1. Initializing Scheduler...");
        initAssignmentScheduler();
        console.log("2. Scheduler Initialized.");

        const app = express();
        const PORT = 3001; 

        app.listen(PORT, () => {
            console.log(`✅ Server Test SUCCESS on port ${PORT}`);
            process.exit(0);
        });
    } catch (e) {
        console.error("❌ CRASH DURING STARTUP:", e);
        process.exit(1);
    }
}

start();
