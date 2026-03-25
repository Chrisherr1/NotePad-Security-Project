-- Drop the database if it exists and recreate it
DROP DATABASE IF EXISTS 424notes_app;
CREATE DATABASE 424notes_app;
USE 424notes_app;

-- Create users table
CREATE TABLE users (
    user_id INT AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255),
    PRIMARY KEY (user_id)
);

-- Create notes table
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
DESCRIBE notes;
DESCRIBE federated_credentials;