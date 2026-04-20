// middleware/sessionStore.js
import session from 'express-session';
import MySQLStore from 'express-mysql-session';

// express-mysql-session requires the session instance to be passed in
const MySQLStoreSession = MySQLStore(session);

/*
    sessionStore - creates a MySQL session store
    stores session data in the database instead of memory
    this allows sessions to persist across server restarts
    and allows docker container rebuilds without losing active user sessions
*/
const sessionStore = new MySQLStoreSession({

    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || '424notes_app',
    // automatically delete expired sessions from the database
    clearExpired: true,
    // check for and remove expired sessions every 15 minutes
    checkExpirationInterval: 1000 * 60 * 15,
});

export default sessionStore;