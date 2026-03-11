import mysql from 'mysql';
import dotenv from 'dotenv';

// This loads the variables from .env into process.env
dotenv.config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed!');
        console.error('Error Details:', err.message);
    } else {
        console.log('✅ Successfully connected to the database!!');
    }
});

export default db;