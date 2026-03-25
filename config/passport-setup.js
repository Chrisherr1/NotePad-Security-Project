import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oidc';
import AuthService from '../services/AuthService.js';
import UserRepository from '../repository/UserRepository.js';

/*
    serializeUser - determines what data is saved in the session
    after a user logs in, passport calls this to decide what to store in the session
    we only store the user_id to keep the session small
    the user_id is what gets saved to req.session
*/
passport.serializeUser(function(user, done) {
    process.nextTick(function() {
        done(null, user.user_id);
    });
});

/*
    deserializeUser - runs on every request after the user is logged in
    passport takes the user_id we saved in the session and uses it to fetch the full user object
    the full user object is then attached to req.user on every request
    if the user is not found in the database, we return false to log them out
*/
passport.deserializeUser(function(user_id, done) {
    process.nextTick(async function() {
        try {
            const user = await UserRepository.findById(user_id);
            if(!user) {
                return done(null, false);
            }
            return done(null, user);
        } catch(err) {
            return done(err);
        }
    });
});

/*
    GoogleStrategy - configures passport to use Google OAuth
    clientID and clientSecret are from Google Cloud Console
    callbackURL is where Google redirects after authentication
    scope tells Google what information we want access to (profile and email)
*/
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/v1/auth/google/redirect',
    scope: ['profile', 'email']
}, 
/*
    verify - called by passport after Google authenticates the user
    issuer - the URL of the identity provider (Google's URL)
    profile - the user's Google profile (id, displayName, emails, etc)
    done - callback to tell passport if authentication succeeded or failed
    we pass the logic to AuthService.googleAuth to keep this file clean
*/
async function verify(issuer, profile, done) {
    try {
        const user = await AuthService.googleAuth(issuer, profile);
        return done(null, user);
    } catch(err) {
        return done(err);
    }
}));

/*
    authorizationParams - forces Google to show the account selection screen
    this ensures the user can switch accounts after logging out
    without this, Google would automatically log in with the last used account
*/
GoogleStrategy.prototype.authorizationParams = function(options) {
    return {
        prompt: 'select_account'
    };
};

export default passport;