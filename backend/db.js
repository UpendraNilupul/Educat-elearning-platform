import mysql from 'mysql';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'educat'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed!');
        console.error('Error Details:', err.message);
        console.log('Please ensure your MySQL server is running and your credentials in backend/db.js are correct.');
    } else {
        console.log('✅ Successfully connected to the database!');
    }
});

export default db;