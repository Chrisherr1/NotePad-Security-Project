// Load environment variables from .env file
require('dotenv').config(); 


const createError = require('http-errors');
const path = require('path');
const logger = require('morgan');



const express = require('express');
const passportSetup = require('./config/passport-setup');
const db = require('./config/db');

//initializing express app
const app = express();

//session store setup
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const { csrfSynchronisedProtection, generateToken } = require('./middleware/csrf');
const cookieParser = require('cookie-parser');


// view engine setup
// tells express what template engine we are using(html,ejs,pug) and where the template files are located
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//middleware setup


app.use((req, res, next) => {
     //protects from browser misinterpreting file types
    res.setHeader('X-Content-Type-Options', 'nosniff');
    //protects from clickjacking(via embedded in iframes)
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//engine setup for sessions google OAuth
const sessionStore = new MySQLStore({
  host: process.env.MYSQL_HOST  || 'localhost',
  port: process.env.PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '0922',
  database: process.env.MYSQL_DATABASE || '424notes_app'
});

//session
app.use(session({
  secret: process.env.COOKIE_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
  httpOnly: true,
  secure:true,
  sameSite: 'lax',
  maxAge: 1000 * 60 * 30
  }
}));

// Initialize Passport
app.use(passportSetup.initialize());
app.use(passportSetup.session());

//importing routes
const authRouter = require('./routes/auth-routes');
const dashboardRouter = require('./routes/dashboard');
const notesRouter = require('./routes/notes');
const csrfRouter = require('./routes/csrf');

//mounting routes
app.use('/', csrfRouter); // Mount it FIRST
app.use('/', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', notesRouter);




// Added error checking
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// CSRF error handler
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token validation failed
    console.error('CSRF token validation failed');
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  next(err);
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
