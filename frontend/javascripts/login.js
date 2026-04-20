/*
 * login.js
 * --------
 * Handles all logic for the login/signup page:
 *  - Fetching a CSRF token on page load
 *  - Toggling between login and signup forms
 *  - Submitting login credentials to POST /api/v1/auth/login
 *  - Submitting signup data to POST /api/v1/auth/signup
 *  - Displaying error messages returned from the API
 *
 * This file replaced the old EJS form submissions (action='/login' method='POST')
 * with fetch() calls so we can handle responses without a full page reload.
 */
 //const API = ''; // change to '' when deploying

 // API base URl for production
const API = window.location.hostname === 'localhost'
    ? 'http://localhost:3000'  // your local backend port
    : 'https://api.notepad.christianherrera.dev';

/*
 * csrfToken
 * ---------
 * Stored at module level so it can be reused across both the login
 * and signup form submissions without fetching it twice.
 * Populated by getCsrfToken() which runs on page load.
 */
let csrfToken = null;

/* ================================================================
    CSRF TOKEN
    ================================================================
    Your backend uses csrf-sync to protect POST/PUT/DELETE routes.
    Before submitting any form, the frontend must:
    1. Call GET /csrf to get a token tied to the current session
    2. Send that token back in the 'x-csrf-token' header on every
        mutating request (POST, PUT, DELETE)
If the token is missing or wrong, the backend returns 403 Forbidden.
   ================================================================ */

async function getCsrfToken() {
    try {
        const res = await fetch(`${API}/api/v1/csrf`, {
            /*
             * credentials: 'include' is required on ALL fetch() calls.
             * Without it, the browser won't send the session cookie,
             * so the backend can't tie the CSRF token to your session.
             */
            credentials: 'include'
        });
        const { csrfToken: token } = await res.json();
        csrfToken = token;
    } catch (err) {
        console.error('Failed to fetch CSRF token:', err);
    }
}

/* ================================================================
   FORM TOGGLE
   ================================================================
   The login and signup forms share the same page.
   Only one is visible at a time using the 'active' CSS class.
   Clicking "Create account" shows signup and hides login.
   Clicking "Back to login" shows login and hides signup.
   ================================================================ */

document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault(); // stop the # href from jumping to the top of the page
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('signupForm').classList.add('active');

    // clear any error messages left over from a failed login attempt
    clearErrors();
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.add('active');

    // clear any error messages left over from a failed signup attempt
    clearErrors();
});

/* ================================================================
   LOGIN FORM SUBMISSION
   ================================================================
   Previously: <form action='/login' method='POST'>
   Now: fetch() → POST /api/v1/auth/login
   
   The backend (AuthController.login) expects:
     - req.body.email
     - req.body.password
   
   On success: the backend sets the session and returns 200
   On failure: the backend returns { message: '...' } with a 4xx status
   ================================================================ */

document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    /*
     * e.preventDefault() stops the browser from doing its default
     * form submission (which would cause a full page reload and
     * send the data as a URL-encoded POST the old MVC way).
     */
    e.preventDefault();

    const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        credentials: 'include', // send session cookie with the request
        headers: {
            'Content-Type': 'application/json',
            /*
             * x-csrf-token: required by csrf-sync on the backend.
             * The backend middleware checks this header against the
             * token stored in the session. If they don't match → 403.
             */
            'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        })
    });

    if (res.ok) {
        /*
         * Login successful — redirect to the dashboard.
         * The session cookie is now set by the backend,
         * so dashboard.js can call /api/v1/auth/user and get back
         * the logged in user's data.
         */
        window.location.href = '/dashboard.html';
    } else {
        /*
         * Login failed — show the error message from the backend.
         * e.g. "Invalid email or password"
         */
        const { message } = await res.json();
        showError('loginForm', message);
    }
});

/* ================================================================
   SIGNUP FORM SUBMISSION
   ================================================================
   Previously: <form action='/signup' method='POST'>
   Now: fetch() → POST /api/v1/auth/signup
   
   The backend (AuthController.signup) expects:
     - req.body.name
     - req.body.email
     - req.body.password
   
   On success: account is created, session is set, returns 201
   On failure: returns { message: '...' } with a 4xx status
   ================================================================ */

document.getElementById('signupFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();

    const res = await fetch(`${API}/api/v1/auth/signup`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'x-csrf-token': csrfToken
        },
        body: JSON.stringify({
            name: document.getElementById('name').value,
            email: document.getElementById('signupEmail').value,
            password: document.getElementById('signupPassword').value
        })
    });

    if (res.ok) {
        // Account created and session set — go straight to the dashboard
        window.location.href = '/dashboard.html';
    } else {
        const { message } = await res.json();
        showError('signupForm', message);
    }
});

/* ================================================================
   ERROR DISPLAY HELPER
   ================================================================
   Inserts a red error message at the top of the specified form.
   Removes any existing error first to avoid stacking duplicates.
   
   formId  — the id of the form container div ('loginForm' or 'signupForm')
   message — the error string returned from the API
   ================================================================ */

function showError(formId, message) {
    // remove any existing error message in this form first
    clearErrors();

    const error = document.createElement('p');
    error.className = 'error-msg';
    error.textContent = message;
    error.style.color = 'red';
    error.style.marginBottom = '10px';
    error.style.fontSize = '0.9rem';

    // insert the error at the top of the form container
    const form = document.getElementById(formId);
    form.prepend(error);
}

/*
 * clearErrors
 * -----------
 * Removes all error messages from the page.
 * Called when switching between forms so stale errors don't carry over.
 */
function clearErrors() {
    document.querySelectorAll('.error-msg').forEach(el => el.remove());
}

/* ================================================================
   INIT
   ================================================================
   Fetch the CSRF token as soon as the page loads.
   This must happen before any form submission so csrfToken is
   ready when the user clicks login or signup.
   ================================================================ */
getCsrfToken();