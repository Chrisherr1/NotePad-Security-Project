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
        SELECT note_id, note
        FROM users u, notes n
        WHERE u.user_id = ?
            AND u.user_id = n.user_id`, [id])
    return rows;
}

// create a note 
async function createNote(title, content, category, id) {
    const result = await pool.query(`
        INSERT INTO notes (title, content, category, user_id)
        VALUES (?, ?, ?, ?)
        `, [title, content, category, id])
    return result;
} 

// update a note
async function updateNote(note, id) {
    const result = await pool.query(`
        UPDATE notes
        SET note = ?
        WHERE note_id = ? 
        `, [note, id])
    return result;
}

// delete a note
async function deleteNote(id) {
    const result = await pool.query(`
        DELETE FROM notes
        WHERE note_id = ?
        `, [id])
}

// Export the functions if you need them
module.exports.getUserNotes = getUserNotes;
module.exports.createNote = createNote;
module.exports.updateNote = updateNote;
module.exports.deleteNote = deleteNote;