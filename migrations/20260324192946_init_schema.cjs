exports.up = async function(knex) {
await knex.raw(`
CREATE TABLE users (
    user_id INT AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),
    PRIMARY KEY (user_id)
);
`);

await knex.raw(`
CREATE TABLE notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(25) NOT NULL DEFAULT 'personal',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    user_id INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
`);

await knex.raw(`
CREATE TABLE federated_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_credential (provider, subject),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
`);
};

exports.down = async function(knex) {
await knex.raw(`DROP TABLE IF EXISTS federated_credentials;`);
await knex.raw(`DROP TABLE IF EXISTS notes;`);
await knex.raw(`DROP TABLE IF EXISTS users;`);
};