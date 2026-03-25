module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '0922',
      database: process.env.DB_NAME || '424notes_app'
    },
    migrations: {
      directory: './migrations'
    }
  }
};