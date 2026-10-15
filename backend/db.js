const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.PGUSER || 'lms_user',
  password: process.env.PGPASSWORD || 'Q@!T@Sd3T@2099Str0ng',
  host: process.env.PGHOST || '14.99.179.157',
  port: parseInt(process.env.PGPORT || '55432', 10),
  database: process.env.PGDATABASE || 'lms_db',
  ssl: false,
  options: '-c search_path=elevateqa,public',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
