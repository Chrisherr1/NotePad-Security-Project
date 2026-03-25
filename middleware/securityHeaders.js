// middleware/securityHeaders.js
import helmet from 'helmet';

export default helmet({
    contentSecurityPolicy: false,  // disable CSP for local testing
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
});