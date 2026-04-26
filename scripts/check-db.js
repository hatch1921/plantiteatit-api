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

  // Find squash/cucurbita in database
  const r2 = await pool.query(`
    SELECT usda_symbol, scientific_name, common_name, frost_free_days_min
    FROM species
    WHERE common_name ILIKE '%squash%'
       OR common_name ILIKE '%cucurbit%'
       OR scientific_name ILIKE '%cucurbita%'
    LIMIT 20
  `);
  console.log('\nSquash/Cucurbita in species table:');
  r2.rows.forEach(r => console.log(`  ${r.usda_symbol} | ${r.common_name} | ${r.scientific_name} | frost-free=${r.frost_free_days_min}`));

  // Check if any are in Cochise county
  const r3 = await pool.query(`
    SELECT s.usda_symbol, s.common_name, s.scientific_name
    FROM species s
    JOIN species_counties sc ON sc.species_id = s.id
    WHERE sc.county_fips = '04003'
      AND (s.common_name ILIKE '%squash%' OR s.scientific_name ILIKE '%cucurbita%')
    LIMIT 10
  `);
  console.log('\nSquash in Cochise County:', r3.rows.length);
  r3.rows.forEach(r => console.log(`  ${r.common_name} | ${r.scientific_name}`));

  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
