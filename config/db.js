
// creates a MySQL connection pool and exports it for use in repositories

import 'dotenv/config';
import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

export default pool;
