const mysql = require('mysql');
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'educat'
});

db.connect((err)=>{
    if(err) throw err;
    console.log('Succefully connected to the database!');
});

module.exports = db;