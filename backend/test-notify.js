import db from './db.js';
import util from 'util';
const query = util.promisify(db.query).bind(db);

async function test() {
    try {
        await query(`
            INSERT INTO notifications (user_id, title, description, is_read)
            VALUES (?, 'Payment Successful', 'Your payment was successful and you have been enrolled.', FALSE)
        `, [2]); 
        console.log("Success");
    } catch(e) {
        console.error("Error", e);
    }
    process.exit(0);
}
test();
