import mysql from 'mysql2'

import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise();

/*
// get list of Users
export async function getUsers() {
    const [rows] = await pool.query("SELECT * FROM users")
    return rows
}

// get information of one user
export async function getUser(id) {
    const [rows] = await pool.query(`
        SELECT *
        FROM users
        WHERE user_id = ? 
        `, [id])
    return rows[0]
}
*/

// get notes of user
export async function getUserNotes(id) {
    const [rows] = await pool.query(`
        SELECT note_id, note
        FROM users u, notes n
        WHERE u.user_id = ?
            AND u.user_id = n.user_id`, [id])
    return rows
}

// create a note 
export async function createNote(note, id) {
    const result = await pool.query(`
        INSERT INTO notes (note, user_id)
        VALUES (?, ?)
        `, [note, id])

    return result;
} 

// update a note
export async function updateNote(note, id) {
    const result = await pool.query(`
        UPDATE notes
        SET note = ?
        WHERE note_id = ? 
        `, [note, id])
    
    return result;
}

// delete a note
export async function deleteNote(id) {
    const result = await pool.query(`
        DELETE FROM notes
        WHERE note_id = ?
        `, [id])
}

/*
const result = await getUserNotes(1)
console.log(result)
*/