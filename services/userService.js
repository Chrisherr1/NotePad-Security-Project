import UserRepository from "../repository/UserRepository.js";
import UserDTO from "../dtos/UserDTO.js"

import argon2 from 'argon2';

class UserService {
    
    // create a new user (SignUp)
    async createUser(name,email,password) {

        // checks if user already exists
        const existingUsers = await UserRepository.findByEmail(email);
        
        if(existingUsers){
            throw new Error('Email already registered');
        }

        // hashes the password
        const hashPassword = await argon2.hash(password);

        // Insert new user
        const result = await UserRepository.createUser(name,email,hashPassword);

        // returns user data without password
        return new UserDTO({ user_id: result.insertId, name, email });
    }

    // Signs in user
    async loginUser(email,password) {

        // Find user by email
        const user = await UserRepository.findByEmail(email);
        if(!user) {
            throw new Error('Invalid email or password');
        }
        if(!user.password){
            throw new Error('This account was created with Google. Please sign in with Google.');
        }

        // hashes password
        const match = await argon2.verify(user.password,password);

        if(!match){
            throw new Error('Invalid email or password');
        }
        // Return user without password
        return new UserDTO(user);
    }
}

export default new UserService();