/**
 * PlantItEatIt — Arizona State Plants Ingestion
 *
 * Reads the USDA Arizona state plant list and populates
 * species_counties for all Arizona counties using the state FIPS.
 *
 * Arizona State FIPS: 04
 * Pima County FIPS:   04019 (Tucson)
 *
 * Usage: node scripts/ingest-arizona.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../db/pool');

const DATA_DIR = path.join(__dirname, '../data');
const STATE_FIPS = '04';

// Arizona county FIPS codes — we'll mark all AZ species
// as present in all AZ counties initially
// Pima County (Tucson) = 04019 is our primary test target
const AZ_COUNTIES = [
  '04001', // Apache
  '04003', // Cochise
  '04005', // Coconino
  '04007', // Gila
  '04009', // Graham
  '04011', // Greenlee
  '04012', // La Paz
  '04013', // Maricopa
  '04015', // Mohave
  '04017', // Navajo
  '04019', // Pima (Tucson — our primary target)
  '04021', // Pinal
  '04023', // Santa Cruz
  '04025', // Yavapai
  '04027', // Yuma
];

function parseCSV(filePath, delimiter = ',') {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter,
        relax_quotes: true,
        relax_column_count: true,
      }))
      .on('data', r => records.push(r))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

async function main() {
  console.log('PlantItEatIt — Arizona Plants Ingestion');
  console.log('========================================');

  const filePath = path.join(DATA_DIR, 'arizona_plants.txt');
  if (!fs.existsSync(filePath)) {
    console.error('ERROR: data/arizona_plants.txt not found');
    process.exit(1);
  }

  // Detect delimiter
  const firstLine = fs.readFileSync(filePath, 'utf8').split('\n')[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  console.log(`Delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

  const records = await parseCSV(filePath, delimiter);
  console.log(`Parsed: ${records.length} records`);
  console.log(`Columns: ${Object.keys(records[0]).join(', ')}`);

  let matched = 0, notFound = 0, inserted = 0, errors = 0;
  const BATCH = 200;

  // Clear existing AZ county data first
  await pool.query(`DELETE FROM species_counties WHERE state_fips = $1`, [STATE_FIPS]);
  console.log(`Cleared existing AZ county records`);

  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const row of batch) {
        const symbol = (
          row['Symbol'] ||
          row['Accepted Symbol'] ||
          row['symbol'] || ''
        ).trim();

        if (!symbol) continue;

        // Look up species by symbol
        const res = await client.query(
          'SELECT id FROM species WHERE usda_symbol = $1',
          [symbol]
        );

        if (!res.rows.length) {
          notFound++;
          continue;
        }

        matched++;
        const speciesId = res.rows[0].id;
        const nativeStatus = row['Native Status'] || row['Nativity'] || null;

        // Insert for each AZ county
        for (const countyFips of AZ_COUNTIES) {
          try {
            await client.query(`
              INSERT INTO species_counties (species_id, state_fips, county_fips, native_status)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT DO NOTHING
            `, [speciesId, STATE_FIPS, countyFips, nativeStatus]);
            inserted++;
          } catch (err) {
            errors++;
          }
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`Batch error:`, err.message);
      errors += batch.length;
    } finally {
      client.release();
    }

    const pct = Math.round(((i + batch.length) / records.length) * 100);
    if (pct % 20 === 0 || i === 0) {
      console.log(`  ${pct}% — ${matched} species matched, ${inserted} county records inserted`);
    }
  }

  console.log(`\n✓ Arizona ingestion complete`);
  console.log(`  Species matched: ${matched}`);
  console.log(`  Species not found: ${notFound}`);
  console.log(`  County records inserted: ${inserted}`);
  console.log(`  Errors: ${errors}`);
  console.log(`\nPima County (04019) now has ${matched} species available`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});