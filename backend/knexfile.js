require('dotenv').config({ path: '../.env' });

module.exports = {
  client: 'pg',
  connection: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    database: process.env.POSTGRES_DB || 'llm_observer',
    user: process.env.POSTGRES_USER || 'observer',
    password: process.env.POSTGRES_PASSWORD || 'observer_secret_2024',
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  pool: {
    min: 2,
    max: 10,
  },
};
