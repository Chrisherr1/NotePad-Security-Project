import { csrfSynchronisedProtection } from '../middleware/csrf.js';
import authRoutes from './auth-routes.js';
import csrfRoutes from './csrf.js';
import notesRoutes from './notes.js';


export default function router(app) {

    // CSRF token route — must be BEFORE csrfSynchronisedProtection
    // so the frontend can fetch the token without being blocked
    app.use('/api/v1', csrfRoutes);
    
    // apply CSRF protection to everything below this line
    app.use(csrfSynchronisedProtection);

    // Auth API routes
    // Handles routes like '/api/v1/auth/login', '/api/v1/auth/signup', etc
    app.use('/api/v1/auth',authRoutes);

    // Notes API routes
    app.use('/api/v1', notesRoutes);



}