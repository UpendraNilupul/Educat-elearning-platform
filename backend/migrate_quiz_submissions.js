import 'dotenv/config';
import db from './db.js';
import util from 'util';

const query = util.promisify(db.query).bind(db);

async function runMigration() {
    try {
        console.log("Adding columns to quiz_submissions...");
        await query(`
            ALTER TABLE quiz_submissions 
            ADD COLUMN status VARCHAR(20) DEFAULT 'in_progress',
            ADD COLUMN started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN saved_state JSON DEFAULT NULL;
        `);
        console.log("Migration successful!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        process.exit();
    }
}

runMigration();
