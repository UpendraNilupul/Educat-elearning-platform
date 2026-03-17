import db from './backend/db.js';

const seed = () => {
    // 1. Insert User
    const userQuery = `INSERT INTO users (name, password, role_id, email, phone_number, address, dob, gender, join_date) 
                       VALUES ('Admin Teacher', 'hashed', 2, 'teacher@test.com', '1234567890', '123 Main St', '1990-01-01', 'male', '2026-01-01')`;
    
    db.query(userQuery, (err, userRes) => {
        if (err) {
            console.log('User exists or error:', err.message);
            // Ignore error and try creating teacher 1
            createTeacher(1);
            return;
        }
        createTeacher(userRes.insertId);
    });
};

const createTeacher = (userId) => {
    // 2. Insert Teacher
    const teacherQuery = `INSERT INTO teachers (user_id) VALUES (?)`;
    db.query(teacherQuery, [userId], (err2, teacherRes) => {
        if (err2) {
            console.error('Teacher Error:', err2.message);
            
            // Just check if we have any teachers
            db.query('SELECT * FROM teachers', (err3, results) => {
               console.log("Existing teachers:", results);
               process.exit();
            });
        } else {
            console.log('✅ Teacher Created with ID:', teacherRes.insertId);
            process.exit();
        }
    });
};

seed();
