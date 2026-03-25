/*
    isAuthenticated - middleware to check if the user is logged in
    passport attaches the isAuthenticated() method to req after a user logs in
    if the user is not authenticated, they are redirected to the login page
    if they are authenticated, next() is called to proceed to the route
*/
export function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ message: 'Unauthorized' });
}