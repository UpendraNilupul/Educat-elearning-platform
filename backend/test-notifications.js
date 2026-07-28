import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import db from './db.js';

db.query('SELECT id, user_id, title, is_read FROM notifications ORDER BY id DESC LIMIT 5', (err, results) => {
    if (err) {
        console.error("Error fetching notifications:", err);
    } else {
        console.log("Latest Notifications:");
        console.log(results);
    }
    process.exit();
});
