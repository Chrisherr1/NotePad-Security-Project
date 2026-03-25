import pool from '../config/db.js'

class UserRepository {

    // find by email
    async findByEmail(email) {
        const [rows] = await pool.query(
            `SELECT *
            FROM users
            WHERE email = ?`,
            [email]
        );

        return rows[0];
    }
    // find by id
    async findById(id){
        const [rows] = await pool.query(
            `SELECT *
            FROM users
            WHERE user_id = ?`,
            [id]
        );
        return rows[0];
    }
    // creates a new user
    async createUser(name,email,hashedPassword) {
        const [result] = await pool.query(
            `INSERT INTO users (name,email,password)
            VALUES (?,?,?)`,
            [name,email,hashedPassword]
        );

        return result;
    }
}
export default new UserRepository();