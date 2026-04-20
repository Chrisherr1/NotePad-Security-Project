// middleware/securityHeaders.js
import helmet from 'helmet';

export default helmet({
    contentSecurityPolicy: {
        directives: {

            // default fallback — only allow resources from your own domain
            defaultSrc: ["'self'"],
            
            // only allow scripts from your domain and Google (OAuth)
            scriptSrc: [
                "'self'",
                "https://accounts.google.com",       // Google OAuth script
            ],
            // allow inline styles for your own CSS + Google OAuth UI elements
            // remove 'unsafe-inline' if you move all styles to external .css files
            styleSrc: [
                "'self'",
                "'unsafe-inline'",
                "https://accounts.google.com",       // Google OAuth UI styles
            ],

            // all fonts are self-hosted — no external font CDNs used
            fontSrc: ["'self'"],

            // allow images from your domain, inline base64 data URIs,
            // and Google profile pictures returned after OAuth login
            imgSrc: [
                "'self'",
                "data:",                                     // base64 inline images
                "https://lh3.googleusercontent.com",        // Google profile pictures
            ],

            // restrict which URLs your frontend JS can fetch/XHR to
            // only your own origin and your backend API subdomain
            connectSrc: [
                "'self'",
                "https://api.notepad.christianherrera.dev", // backend API
            ],

            // allow Google OAuth to open in a frame/popup for the auth flow
            frameSrc: [
                "https://accounts.google.com",              // Google OAuth popup/redirect
            ],

            // block all plugin-based content (Flash, etc.) — nothing uses this
            objectSrc: ["'none'"],

            // prevent base tag hijacking — only allow base URL from same origin
            baseUri: ["'self'"],

            // restrict form submissions to same origin only
            formAction: ["'self'"],

            // prevent clickjacking — disallow embedding in iframes
            frameAncestors: ["'none'"],

            // automatically upgrade any accidental http:// requests to https://
            upgradeInsecureRequests: [],
        },
    },
    // must stay false — Google OAuth breaks if this is enabled
    crossOriginEmbedderPolicy: false,

    // restrict cross-origin resource sharing to same-site requests only
    crossOriginResourcePolicy: { policy: "same-site" },
});