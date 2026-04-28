/**
 * Fix bad pattern matches from food plant seeder
 * Removes food plant characteristics from toxic or non-food species
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Fixing bad seeder matches...');

  // Species to clear -- toxic plants, grasses, non-food species
  // that got caught by common name pattern matching
  const exclusions = [
    // Toxic plants
    'RICO3',   // Castorbean (Ricinus communis) -- toxic, not a food bean
    'DATU',    // Datura -- toxic
    'DAST',    // Datura stramonium -- jimsonweed, toxic
    'CONA2',   // Conium (poison hemlock) -- toxic
    'SONI3',   // Solanum nigrum -- toxic nightshade
    'PHAM6',   // Phytolacca -- pokeweed, toxic
    // Grasses tagged with wrong data
    'POAU3',   // Chilean rabbitsfoot grass -- not a pepper
    'PSSP6',   // Bluebunch wheatgrass
    'PAMIM',   // Broomcorn millet -- no growing data yet
    // Non-food wildflowers
    'PLAR',    // Arizona popcornflower
    'BREL5',   // Bush-violet
    'MENYA',   // Buckbean -- aquatic plant not a food bean
    'SICYO',   // Bur cucumber -- wild, not edible
  ];

  let cleared = 0;
  for (const symbol of exclusions) {
    const r = await pool.query(
      `UPDATE species SET
        frost_free_days_min = NULL,
        frost_free_days_max = NULL,
        drought_tolerance = NULL,
        moisture_use = NULL
      WHERE usda_symbol = $1
        AND id NOT IN (SELECT species_id FROM species_veggies)`,
      [symbol]
    );
    if (r.rowCount > 0) {
      console.log(`  Cleared: ${symbol}`);
      cleared++;
    }
  }

  // Also remove from species_veggies if they snuck in
  for (const symbol of exclusions) {
    await pool.query(`
      DELETE FROM species_veggies
      WHERE species_id = (SELECT id FROM species WHERE usda_symbol = $1)
    `, [symbol]);
  }

  console.log(`\n✓ Done. Cleared ${cleared} bad matches.`);

  // Verify castorbean is clean
  const { rows } = await pool.query(`
    SELECT usda_symbol, common_name, frost_free_days_min
    FROM species WHERE usda_symbol IN ('RICO3', 'POAU3', 'MENYA')
  `);
  rows.forEach(r => console.log(`  ${r.usda_symbol} | ${r.common_name} | frost_free=${r.frost_free_days_min}`));

  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
