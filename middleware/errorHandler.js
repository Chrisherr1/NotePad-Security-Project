import createError from 'http-errors';

// catch 404 and forward to error handler
export function notFound(req, res, next) {
    next(createError(404));
}

// CSRF error handler
export function csrfError(err, req, res, next) {
    if (err.code === 'EBADCSRFTOKEN') {
        console.error('CSRF token validation failed');
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next(err);
}

// error handler - returns JSON with error message and status code
export function errorHandler(err, req, res, next) {
    console.error(err);

    let status = 500;

    if (err.status) {
        status = err.status;
    }

    let message = 'Internal Server Error';
    
    if (err.message) {

        message = err.message;
    }

    res.status(status).json({ error: message });
}