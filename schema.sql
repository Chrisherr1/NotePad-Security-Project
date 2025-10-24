-- Drop the database if it exists and recreate it
DROP DATABASE IF EXISTS 424notes_app;
CREATE DATABASE 424notes_app;
USE 424notes_app;

-- Create users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT,
    name VARCHAR(25) NOT NULL,
    PRIMARY KEY (user_id)
);

-- Create notes table
CREATE TABLE notes (
    note_id INT AUTO_INCREMENT,
    note VARCHAR(255),
    user_id INT,
    PRIMARY KEY (note_id),
    FOREIGN KEY (user_id) 
    REFERENCES users(user_id)
);

-- Create federated_credentials table
CREATE TABLE federated_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    provider VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_credential (provider, subject),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Verify the tables were created correctly
SHOW TABLES;
DESCRIBE users;
DESCRIBE federated_credentials;