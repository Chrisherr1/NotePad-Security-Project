import UserRepository from "../repository/UserRepository.js";
import OAuthRepository from "../repository/OAuthRepository.js";
import UserDTO from "../dtos/UserDTO.js"

// Reference guide

// --- From Passport/Google OAuth ---
// issuer                                                    -the URL of the identity provider e.g Google's URL
// profile.id                                                -Google's unique ID for the user
// profile.displayName                                       -the user's name from their Google account

// --- From our database ---
// credential.user_id                                        -the user_id column from federated_credentials table
// result.insertId                                           -the auto generated ID of the new row after an INSERT (from MySQL)

// --- Our own functions ---
// OAuthRepository.findCredentials(issuer, subject)           -finds a federated credential by provider and subject
// OAuthRepository.createCredential(userId, issuer, subject)  -creates a new federated credential

// UserRepository.createUser(name, email, hashedPassword)     -creates a new user
// UserRepository.findById(id)                                -finds a user by their user_id

// UserDTO({ user_id, name })                                 -shapes the user data before returning to passport

class AuthService {

    // Google OAuth login/signup
    async googleAuth(issuer,profile) {

        // Google's unique user id (subject)
        const subject = profile.id;

        // get email from Google and normalize it (prevents duplicates like A@gmail vs a@gmail)
        const email = profile.emails?.[0]?.value?.toLowerCase().trim();

        // get display name from Google profile
        const name = profile.displayName;

        // if Google does not return an email, we cannot continue (email is our unique key)
        if(!email){
            throw new Error('No email from Google');
        }

        // check if federated credential exists (user already linked with Google before)
        const credential = await OAuthRepository.findCredentials(issuer,subject);
        
        if(!credential){

            // no existing Google credential → this could be:
            // 1. a completely new user
            // 2. an existing user who signed up with email/password

            // NEW STEP: check if a user already exists with this email
            let user = await UserRepository.findByEmail(email);

            // if user does NOT exist → create a new user
            if(!user){
                const result = await UserRepository.createUser(
                    name,       // use Google display name for new users
                    email,
                    null        // no password (OAuth user)
                );

                // fetch the newly created user
                user = await UserRepository.findById(result.insertId);
            }

            // link this Google account to the user (existing OR newly created)
            await OAuthRepository.createCredential(user.user_id,issuer,subject);

            // return user data to passport
            return new UserDTO(user);

        } else {
            
            // existing Google user → fetch user data
            const user = await UserRepository.findById(credential.user_id);
            if(!user){
                throw new Error('User not found')
            }

            return new UserDTO(user);
        }
    }
}
export default  new AuthService();