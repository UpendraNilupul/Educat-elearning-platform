import 'dotenv/config';
import mysql from 'mysql2';

const dbConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: '+00:00',
};

// Only use SSL if we are NOT connecting to a local database
if (process.env.DB_HOST && !process.env.DB_HOST.includes('localhost') && !process.env.DB_HOST.includes('127.0.0.1')) {
    dbConfig.ssl = { rejectUnauthorized: false };
}

const db = mysql.createPool(dbConfig);

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