var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
//session store setup
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
//end of session store setup

//importing routes
var authRouter = require('./routes/auth');
var usersRouter = require('./routes/users');

//end of importing routes

//initializing express app
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//engine setup for sessions google OAuth
var sessionStore = new MySQLStore({
  host: 'localhost',
  port: 3306,
  user: 'your_mysql_us',      // Change to your MySQL username
  password: 'your_mysql_password',  // Change to your MySQL password
  database: 'your_database_name'    // Change to your database name
});
//engine setup for sessions google OAuth
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: sessionStore
}));
//end of engine setup

//mounting routes
app.use('/', authRouter);
app.use('/', usersRouter);

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
