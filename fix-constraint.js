require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await pool.query(`
    ALTER TABLE species_veggies 
    ADD CONSTRAINT species_veggies_species_id_key UNIQUE (species_id)
  `);
  console.log('Constraint added.');
  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
