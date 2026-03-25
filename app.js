import 'dotenv/config';
import logger from 'morgan';
import express from 'express';
import passportSetup from './config/passport-setup.js';
import cookieParser from 'cookie-parser';
// import main router which mounts all route files onto the app
import router from './routes/router.js';
import session from './middleware/sessions.js';
import securityHeaders from './middleware/securityHeaders.js';
import corsConfig from './middleware/cors.js';
import { notFound, csrfError, errorHandler } from './middleware/errorHandler.js';
import path from 'path';



// initialize express app
const app = express();

// security headers - sets HTTP security headers using helmet
app.use(securityHeaders);
app.use(corsConfig);


// logs HTTP requests in development
app.use(logger('dev'));

//
app.use(express.static(path.join(process.cwd(), 'frontend')));

// parses incoming JSON requests
app.use(express.json());
// parses URL encoded form data
app.use(express.urlencoded({ extended: false }));
// parses cookies from incoming requests
app.use(cookieParser());
// session - handles user sessions using MySQL as the session store
app.use(session);

// initialize passport and restore authentication state from session
app.use(passportSetup.initialize());
app.use(passportSetup.session());

// mount all routes
router(app);


// Error Handlers
// catch 404
app.use(notFound);
// CSRF error handler
app.use(csrfError);
// error handler
app.use(errorHandler);

export default app;