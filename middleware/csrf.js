import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({

    getTokenFromRequest: (req) => {
        return req.body?.["_csrf"] ||
        req.headers["csrf-token"] ||
        req.headers["x-csrf-token"];
    },
    ignoredMethods: ["GET","HEAD","OPTIONS"], // never CSRF-check read-only requests
    size:128, // token size in bis, 64 is default but 128 is stronger
});

export { csrfSynchronisedProtection, generateToken };