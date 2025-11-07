// Importing express
var express = require('express');
// Creating router
var router = express.Router();
// Importing passport
var passport = require('passport');

// route for Google OAuth 2.0 authentication
router.get('/google', passport.authenticate('google', {
  scope: ['profile']
}));

// callback route after Google authentication
router.get('/google/redirect', passport.authenticate('google', {
  successRedirect: '/dashboard',
  failureRedirect: '/'
}));

// logout route
router.post('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

module.exports = router;