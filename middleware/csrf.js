import { csrfSync } from 'csrf-sync';

const { csrfSynchronisedProtection, generateToken } = csrfSync({

    getTokenFromRequest: (req) => {
        return req.body?.["_csrf"] ||
        req.headers["csrf-token"] ||
        req.headers["x-csrf-token"];
    },
});

export { csrfSynchronisedProtection, generateToken };