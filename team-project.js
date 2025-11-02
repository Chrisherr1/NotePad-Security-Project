require('dotenv').config(); 
// Load environment variables from .env file

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

//passport setup
var passport = require('passport');
var GoogleStrategy = require('passport-google-oidc').Strategy;
var db = require('./config/db');  // Adjust path if your db file is elsewhere
//end of passport setup

//session store setup
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
//end of session store setup

//initializing express app
var app = express();

// view engine setup
// tells express what template engine we are using(html,ejs,pug) and where the template files are located
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// end of view engine setup

//middleware setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//engine setup for sessions google OAuth
var sessionStore = new MySQLStore({
  host: process.env.MYSQL_HOST || 'localhost',
  port: 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '0922',
  database: process.env.MYSQL_DATABASE || '424notes_app'
});

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//configure passport google strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/oauth2/redirect/google',
  scope: ['profile']
}, function verify(issuer, profile, cb) {
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
                return cb(null, user);
              });
          });
      } else {
        // Existing user - fetch user data
        var row = rows[0];
        return db.query('SELECT * FROM users WHERE user_id = ?', [row.user_id])  // Changed from id to user_id
          .then(([userRows]) => {
            if (userRows.length === 0) {
              return cb(null, false);
            }
            return cb(null, userRows[0]);
          });
      }
    })
    .catch(err => {
      return cb(err);
    });
}));

// Passport serialization
passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { user_id: user.user_id, name: user.name });  // Changed from id to user_id
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

//importing routes (AFTER passport is configured)
var authRouter = require('./routes/auth');
var dashboardRouter = require('./routes/dashboard');
var notesRouter = require('./routes/notes');
//end of importing routes

//mounting routes
app.use('/', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', notesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;