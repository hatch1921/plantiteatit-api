/**
 * PlantItEatIt — Food Plant Characteristics Seeder
 * Usage: node scripts/seed-food-plants.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db/pool');

async function main() {
  console.log('PlantItEatIt — Food Plant Characteristics Seeder');
  console.log('=================================================');

  const sqlPath = path.join(__dirname, 'seed-food-plants.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split carefully — only on semicolons followed by newline
  // Keep UPDATE statements, skip comment-only blocks
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => {
      // Remove pure comment blocks and empty strings
      const noComments = s.replace(/--[^\n]*/g, '').trim();
      return noComments.length > 10;
    });

  console.log(`Found ${statements.length} statements to run`);

  let updated = 0;
  let errors = 0;

  for (const stmt of statements) {
    try {
      const result = await pool.query(stmt);
      if (result.rowCount !== undefined && result.rowCount > 0) {
        updated += result.rowCount;
        // Show first 60 chars of statement for context
        const preview = stmt.replace(/\s+/g, ' ').substring(0, 60);
        console.log(`  ✓ ${result.rowCount} rows — ${preview}...`);
      }
    } catch (err) {
      errors++;
      console.error(`  ✗ Error:`, err.message.substring(0, 120));
    }
  }

  console.log(`\n✓ Done`);
  console.log(`  Total rows updated: ${updated}`);
  console.log(`  Errors: ${errors}`);

  // Quick verification
  const { rows } = await pool.query(`
    SELECT common_name, drought_tolerance, frost_free_days_min,
           frost_free_days_max, elevation_max_ft
    FROM species
    WHERE frost_free_days_min IS NOT NULL
      AND (common_name ILIKE '%tomato%'
        OR common_name ILIKE '%chile%'
        OR common_name ILIKE '%squash%'
        OR common_name ILIKE '%garlic%'
        OR common_name ILIKE '%rosemary%')
    LIMIT 10
  `);

  if (rows.length > 0) {
    console.log(`\nSample updated food plants:`);
    rows.forEach(r => {
      console.log(`  ${r.common_name}: drought=${r.drought_tolerance}, frost-free=${r.frost_free_days_min}-${r.frost_free_days_max}d, max elev=${r.elevation_max_ft}ft`);
    });
  } else {
    console.log('\nNo food plants with characteristics found — check symbol matches');
  }

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});