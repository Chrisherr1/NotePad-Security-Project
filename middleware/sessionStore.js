import session from 'express-session';
import MySQLStore from 'express-mysql-session';

const MySQLStoreSession = MySQLStore(session);

/*
    sessionStore - creates a MySQL session store
    stores session data in the database instead of memory
    this allows sessions to persist across server restarts
    and allows multiple server instances to share session data
*/
const sessionStore = new MySQLStoreSession({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '0922',
    database: process.env.MYSQL_DATABASE || '424notes_app'
});

export default sessionStore;