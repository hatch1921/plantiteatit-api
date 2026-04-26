require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  // Count Cochise county records
  const r1 = await pool.query(
    "SELECT COUNT(*) FROM species_counties WHERE county_fips = '04003'"
  );
  console.log('Cochise County (04003) records:', r1.rows[0].count);

  // Count Pima county records
  const r2 = await pool.query(
    "SELECT COUNT(*) FROM species_counties WHERE county_fips = '04019'"
  );
  console.log('Pima County (04019) records:', r2.rows[0].count);

  // Find food plants in Cochise county
  const r3 = await pool.query(`
    SELECT s.common_name, s.drought_tolerance, s.frost_free_days_min, s.elevation_max_ft
    FROM species s
    JOIN species_counties sc ON sc.species_id = s.id
    WHERE sc.county_fips = '04003'
      AND s.frost_free_days_min IS NOT NULL
    LIMIT 15
  `);
  console.log('\nFood plants in Cochise County:');
  if (r3.rows.length === 0) {
    console.log('  None found — county distribution not yet loaded for these species');
  } else {
    r3.rows.forEach(r => console.log(`  ${r.common_name}: drought=${r.drought_tolerance}, frost-free=${r.frost_free_days_min}d`));
  }

  // Total species with characteristics
  const r4 = await pool.query(
    "SELECT COUNT(*) FROM species WHERE frost_free_days_min IS NOT NULL"
  );
  console.log('\nTotal species with frost-free data:', r4.rows[0].count);

  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
