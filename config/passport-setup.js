require('dotenv').config();

const passport = require('passport');
const GoogleStrategy = require('passport-google-oidc').Strategy;
const db = require('./db');  

// Passport serialization
passport.serializeUser(function(user, done) {
  process.nextTick(function() {
   done(null, { user_id: user.user_id, name: user.name });  // Changed from id to user_id
  });
});

passport.deserializeUser(function(user, done) {
  process.nextTick(function() {
    return done(null, user);
  });
});

//configure passport google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/google/redirect'
}, function verify(issuer, profile, done) {
  db.query('SELECT * FROM federated_credentials WHERE provider = ? AND subject = ?', [issuer, profile.id])
    .then(([rows]) => {
      if (rows.length === 0) {
        // New user - create user and federated credential
        return db.query('INSERT INTO users (name) VALUES (?)', [profile.displayName])
          .then(([result]) => {
            var userId = result.insertId;
            return db.query('INSERT INTO federated_credentials (user_id, provider, subject) VALUES (?, ?, ?)', [userId, issuer, profile.id])
              .then(() => {
                var user = {
                  user_id: userId,  // Changed from id to user_id
                  name: profile.displayName
                };
                return done(null, user);
              });
          });
      } else {
        // Existing user - fetch user data
        var row = rows[0];
        return db.query('SELECT * FROM users WHERE user_id = ?', [row.user_id])  // Changed from id to user_id
          .then(([userRows]) => {
            if (userRows.length === 0) {
              return done(null, false);
            }
            return done(null, userRows[0]);
          });
      }
    })
    .catch(err => {
      return done(err);
    });
}));

module.exports = passport;