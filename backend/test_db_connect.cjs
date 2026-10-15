const { Client } = require('pg');

async function testConnection() {
  console.log('Testing connection to PostgreSQL...');
  
  const client = new Client({
    user: 'lms_user',
    password: 'Q@!T@Sd3T@2099Str0ng',
    host: '14.99.179.157',
    port: 55432,
    database: 'lms_db',
    ssl: false
  });

  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL without SSL!');
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('Query result:', res.rows[0]);
    
    const tablesRes = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name;
    `);
    console.log('Existing tables in database:');
    console.table(tablesRes.rows);
    
    await client.end();
  } catch (err) {
    console.log('Non-SSL failed:', err.message, '--> Trying with SSL...');
    try {
      const clientSSL = new Client({
        user: 'lms_user',
        password: 'Q@!T@Sd3T@2099Str0ng',
        host: '14.99.179.157',
        port: 55432,
        database: 'lms_db',
        ssl: { rejectUnauthorized: false }
      });
      await clientSSL.connect();
      console.log('Successfully connected with SSL!');
      const res = await clientSSL.query('SELECT current_database(), current_user, version()');
      console.log('Query result:', res.rows[0]);
      
      const tablesRes = await clientSSL.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name;
      `);
      console.log('Existing tables in database:');
      console.table(tablesRes.rows);

      await clientSSL.end();
    } catch (sslErr) {
      console.error('Connection failed with SSL too:', sslErr.message);
    }
  }
}

testConnection();
