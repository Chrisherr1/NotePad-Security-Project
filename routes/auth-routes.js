import express from 'express';
import passport from 'passport';
import AuthController from '../controllers/AuthController.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { isAuthenticated } from '../middleware/auth.js';



const authRoutes = express.Router();

// gives client url to serve the frontend after google redirects user to dashboard
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8080';

// login route
authRoutes.post('/login', loginLimiter, AuthController.login);

// get current logged in user
authRoutes.get('/user', isAuthenticated, (req, res) => {
    res.json(req.user);
});

// signup route
authRoutes.post('/signup', AuthController.signup);

// route for Google OAuth 2.0 authentication
authRoutes.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));

// callback route after Google authentication
authRoutes.get('/google/redirect', passport.authenticate('google', {
    successRedirect: `${CLIENT_URL}/dashboard.html`,
    failureRedirect: `${CLIENT_URL}/index.html`
}));

// logout route
authRoutes.post('/logout', AuthController.logout);

export default authRoutes;