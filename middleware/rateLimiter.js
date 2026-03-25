import rateLimit from 'express-rate-limit';

/*
    rate limiter for login route
    limits each IP to 10 login attempts per 15 minutes
    prevents brute force attacks on the login endpoint
    after 10 failed attempts the user will be blocked for 15 minutes
*/
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again after 15 minutes' }
});