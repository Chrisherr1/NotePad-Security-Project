// middleware/sessions.js
import session from 'express-session';
import sessionStore from './sessionStore.js';

export default session({

    // secret used to sign the session ID cookie — pulled from .env, never hardcoded
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    // use MySQL as the session store instead of memory
    // keeps sessions alive across server restarts and docker container rebuilds
    store: sessionStore,

    cookie: {
        
        // prevent JavaScript from reading the session cookie
        // protects against XSS attacks stealing the session ID
        httpOnly: true,
        // only send the cookie over HTTPS in production
        // false in dev so localhost (no SSL) still works
        secure: process.env.NODE_ENV === 'production',
        // strict in production — cookie is only sent on same-site requests
        // lax in dev — allows redirects from Google OAuth on localhost to work
        sameSite: 'lax',
        // session expires after 30 minutes of inactivity
        maxAge: 1000 * 60 * 30
    }
});