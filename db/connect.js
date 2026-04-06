const mysql = require('mysql2/promise');

const con = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'chaerul26',
    database: 'db_market'
});

module.exports = con;