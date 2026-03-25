import pool from '../config/db.js';

class NoteRepository {

    // get a note by id
    async getNoteById(id) {
        const [rows] = await pool.query(
            `SELECT * FROM notes WHERE note_id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    // get notes of user
    async getUserNotes(id) {
        const [rows] = await pool.query(
            `SELECT note_id, title, content, category, pinned, created_at, updated_at
            FROM notes
            WHERE user_id = ?`,
            [id]
        );

        return rows;
    }

    // creates a note
    async createNote(title, content, category, id) {
        const [result] = await pool.query(
            `INSERT INTO notes(title, content, category, user_id)
            VALUES (?, ?, ?, ?)`,
            [title, content, category, id]
        );
        const [rows] = await pool.query(
            `SELECT *
            FROM notes
            WHERE note_id = ?`,
            [result.insertId]
        );
        return rows[0];
    }

    // updates a note
    async updateNote(title, content, category, pinned, id) {
        const [result] = await pool.query(
            `UPDATE notes
            SET title = ?, content = ?, category = ?, pinned = ?
            WHERE note_id = ?`,
            [title, content, category, pinned, id]
        );

        const [rows] = await pool.query(
            `SELECT *
            FROM notes
            WHERE note_id = ?`,
            [id]
        );
        return [rows];
    }

    // deletes a note
    async deleteNote(id) {
        console.log("Note id from database file: ", id);

        const [result] = await pool.query(
            `DELETE FROM notes
            WHERE note_id = ?`,
            [id]
        );
        return result;
    }
}

export default new NoteRepository();