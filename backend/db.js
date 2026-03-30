import 'dotenv/config';
import mysql from 'mysql2';

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/*const db = mysql.createPool({
    host:"localhost", 
    user:"root",
    password:"",
    database:"educat",
});*/

db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed!');
        console.error('Error Details:', err.message);
    } else {
        console.log('✅ Successfully connected to the database as a pool!!');
        connection.release();
    }
});

export default db;