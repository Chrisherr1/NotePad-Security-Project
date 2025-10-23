// requiring express
var express = require('express');
// requiring passport and the Google OAuth 2.0 strategy
var passport = require('passport');
//importing Google OAuth 2.0 strategy
var GoogleStrategy = require('passport-google-oidc').Strategy;
// requiring the database module
var db = require('../db');

// configuring passport to use the Google OAuth 2.0 strategy using mysql database
passport.use(new GoogleStrategy({
  clientID: process.env['GOOGLE_CLIENT_ID'],
  clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
  callbackURL: '/oauth2/redirect/google',
  scope: ['profile']
}, function verify(issuer, profile, cb) {
  // CHANGE 1: Using query() instead of get(), with async/await pattern
  db.query('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [issuer, profile.id])
    .then(([rows]) => {  // CHANGE 2: MySQL returns [rows, fields], destructure to get rows
      if (rows.length === 0) {  // CHANGE 3: Check array length instead of !row
        // CHANGE 4: Using query() instead of run()
        return db.query('INSERT INTO users (name) VALUES (?)', [profile.displayName])
          .then(([result]) => {  // CHANGE 5: Get result object from insert
            var id = result.insertId;  // CHANGE 6: Use insertId instead of lastID
            return db.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [id, issuer, profile.id])
              .then(() => {
                var user = {
                  id: id,
                  name: profile.displayName
                };
                return cb(null, user);
              });
          });
      } else {
        var row = rows[0];  // CHANGE 7: Get first row from array
        return db.query('SELECT * FROM users WHERE id = ?', [row.user_id])
          .then(([userRows]) => {
            if (userRows.length === 0) {  // CHANGE 8: Check array length
              return cb(null, false);
            }
            return cb(null, userRows[0]);  // CHANGE 9: Return first user row
          });
      }
    })
    .catch(err => {  // CHANGE 10: Use .catch() for promise error handling
      return cb(err);
    });
}));


// setting up the router
var router = express.Router();
// rendering the login page
router.get('/', function(req, res, next) {
  res.render('login');
});
// route for Google OAuth 2.0 authentication
router.get('/login/federated/google', passport.authenticate('google'));

router.get('/oauth2/redirect/google', passport.authenticate('google', {
  successRedirect: '/dashboard',
  failureRedirect: '/'
}));
  

module.exports = router;