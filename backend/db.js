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

/*const db = mysql.createConnection({
    host:"localhost", 
    user:"root",
    password:"",
    database:"educat",
});*/

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed!');
        console.error('Error Details:', err.message);
    } else {
        console.log('✅ Successfully connected to the database!!');
        
        // Auto-migrate schema updates to ensure live DB consistency
        const migrations = [
            'ALTER TABLE lessons ADD COLUMN title VARCHAR(150) DEFAULT ""',
            'ALTER TABLE resources ADD COLUMN l_id INT',
            'ALTER TABLE classes_courses ADD COLUMN teacher_id INT DEFAULT 1',
            'ALTER TABLE modules ADD COLUMN isVisible TINYINT(1) DEFAULT 1',
            'ALTER TABLE classes_courses ADD COLUMN students INT DEFAULT 0',
            'ALTER TABLE classes_courses ADD COLUMN modules INT DEFAULT 0',
            'ALTER TABLE classes_courses ADD COLUMN progress INT DEFAULT 0'
        ];
        
        migrations.forEach(query => {
            db.query(query, (error) => {
                // Ignore errors related to columns already existing
                if (error && !error.message.includes('Duplicate column')) {
                    console.error('Migration note:', error.message);
                }
            });
        });
    }
});

export default db;