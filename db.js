import mysql from 'mysql';

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '24254',
    database: 'educat'
});

db.connect((err) => {
    if(err) throw err;
    console.log('Successfully connected to the database!');
});

export default db;