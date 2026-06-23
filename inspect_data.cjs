const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const { rows } = await pool.query('SELECT role, relevansi_spkklp FROM surveys LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  pool.end();
}
run();
