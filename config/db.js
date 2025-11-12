// handles SQL logic for GET, POST, PUT, & DELETE

require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

module.exports = pool;

// get notes of user
async function getUserNotes(id) {
    const [rows] = await pool.query(`
        SELECT n.note_id, n.title, n.content, n.category, n.date
        FROM users u, notes n
        WHERE u.user_id = ?
            AND u.user_id = n.user_id`, [id])
    console.log(rows)
    return rows
}

// create a note 
async function createNote(title, content, category, date, id) {
    const result = await pool.query(`
        INSERT INTO notes (title, content, category, date, user_id)
        VALUES (?, ?, ?, ?, ?)
        `, [title, content, category, date, id])
    console.log("Note from sql query: ", result)
    return result
} 

// update a note
async function updateNote(title, content, category, id) {
    const result = await pool.query(`
        UPDATE notes
        SET title = ?,
            content = ?,
            category = ?
        WHERE note_id = ? 
        `, [title, content, category, id])
    return result
}

// delete a note
async function deleteNote(id) {
    console.log("Note id from database file: ", id);
    const result = await pool.query(`
        DELETE FROM notes
        WHERE note_id = ?
        `, [id])
    return result
}

// Export the functions if you need them
module.exports.getUserNotes = getUserNotes;
module.exports.createNote = createNote;
module.exports.updateNote = updateNote;
module.exports.deleteNote = deleteNote;