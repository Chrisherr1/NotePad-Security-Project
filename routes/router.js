import authRoutes from './auth-routes.js';
import csrfRoutes from './csrf.js';
import notesRoutes from './notes.js';

export default function router(app) {

    // CSRF token route
    app.use('/', csrfRoutes);

    // Auth API routes
    // Handles routes like '/api/v1/auth/login', '/api/v1/auth/signup', etc
    app.use('/api/v1/auth',authRoutes);

    // Notes API routes
    app.use('/api/v1', notesRoutes);



}