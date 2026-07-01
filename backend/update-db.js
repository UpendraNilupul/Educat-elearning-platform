import db from './db.js';

db.query('ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;', (err) => {
    if(err && err.code !== 'ER_DUP_FIELDNAME') {
        console.error(err);
    } else {
        console.log('Column added or already exists');
    }
    process.exit();
});
