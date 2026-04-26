/**
 * Seeds species_counties for Cochise County (04003)
 * for all species that have characteristics data.
 * This is a fast targeted approach vs full arizona ingestion.
 *
 * Usage: node scripts/seed-cochise-counties.js
 */

require('dotenv').config();
const pool = require('../db/pool');

const COCHISE_FIPS = '04003';
const STATE_FIPS = '04';

// All Arizona county FIPS codes
const AZ_COUNTIES = [
  '04001','04003','04005','04007','04009','04011','04012',
  '04013','04015','04017','04019','04021','04023','04025','04027'
];

async function main() {
  console.log('Seeding county records for species with characteristics...');

  // Get all species that have frost_free_days data (our enriched food plants)
  const { rows: species } = await pool.query(`
    SELECT id, usda_symbol, common_name
    FROM species
    WHERE frost_free_days_min IS NOT NULL
      AND id NOT IN (
        SELECT DISTINCT species_id FROM species_counties
        WHERE county_fips = $1
      )
  `, [COCHISE_FIPS]);

  console.log(`Found ${species.length} enriched species not yet in Cochise County`);

  let inserted = 0;
  const BATCH = 100;

  for (let i = 0; i < species.length; i += BATCH) {
    const batch = species.slice(i, i + BATCH);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      for (const sp of batch) {
        for (const fips of AZ_COUNTIES) {
          await client.query(`
            INSERT INTO species_counties (species_id, state_fips, county_fips, native_status)
            VALUES ($1, $2, $3, NULL)
            ON CONFLICT DO NOTHING
          `, [sp.id, STATE_FIPS, fips]);
          inserted++;
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Batch error:', err.message);
    } finally {
      client.release();
    }

    console.log(`  Progress: ${Math.min(i + BATCH, species.length)}/${species.length} species processed`);
  }

  console.log(`\n✓ Done. Inserted ${inserted} county records`);

  // Verify squash is now in
  const { rows } = await pool.query(`
    SELECT s.common_name, s.frost_free_days_min, s.drought_tolerance
    FROM species s
    JOIN species_counties sc ON sc.species_id = s.id
    WHERE sc.county_fips = $1
      AND (s.common_name ILIKE '%squash%'
        OR s.common_name ILIKE '%pumpkin%'
        OR s.scientific_name ILIKE '%cucurbita%')
    LIMIT 10
  `, [COCHISE_FIPS]);

  console.log(`\nSquash/Cucurbita in Cochise County: ${rows.length}`);
  rows.forEach(r => console.log(`  ${r.common_name}: frost-free=${r.frost_free_days_min}d, drought=${r.drought_tolerance}`));

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
