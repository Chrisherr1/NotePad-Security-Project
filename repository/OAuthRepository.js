import pool from '../config/db.js';

class OAuthRepository {

    // find federated credentials by google and subject
    async findCredentials(issuer,subject){
        const [rows] = await pool.query(
            `SELECT *
            FROM federated_credentials
            WHERE provider = ? AND subject = ?`,
            [issuer,subject]
        );
        return rows[0];
    }

    // create a new federated credential
    async createCredential(userId,issuer,subject) {
        const [result] = await pool.query(
            `INSERT INTO federated_credentials (user_id, provider, subject)
            VALUES (?,?,?)`,
            [userId,issuer,subject]
        );
        return result;
    }
}
export default new OAuthRepository();