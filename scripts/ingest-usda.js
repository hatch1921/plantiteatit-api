/**
 * PlantItEatIt — USDA PLANTS Ingestion Script
 * 
 * Downloads and ingests the USDA PLANTS complete dataset into PostgreSQL.
 * Run once to seed, then quarterly to refresh.
 *
 * Usage: node scripts/ingest-usda.js
 *
 * USDA Downloads: https://plants.sc.egov.usda.gov/home/downloads
 * Files used:
 *   - Complete plant list CSV
 *   - Plant characteristics CSV
 *   - County distribution CSV (manual download — place in /data/)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const { parse } = require('csv-parse');
const pool = require('../db/pool');

const DATA_DIR = path.join(__dirname, '../data');
const LOG = { started: new Date(), processed: 0, updated: 0, errors: 0 };

// ─── USDA download URLs ───────────────────────────────────────────────────────
// Note: USDA periodically updates these URLs. Verify at plants.sc.egov.usda.gov
const USDA = {
  complete: 'https://plants.sc.egov.usda.gov/csvdownload?plantLst=plantCompleteList',
  characteristics: 'https://plants.sc.egov.usda.gov/csvdownload?plantLst=plantCharacteristicsList',
  countyFile: path.join(DATA_DIR, 'county_distribution.csv'),
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`  Downloading: ${url}`);
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'PlantItEatIt/1.0' } }, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true, trim: true }))
      .on('data', r => records.push(r))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

function safeInt(v) { const n = parseInt(v); return isNaN(n) ? null : n; }
function safeFloat(v) { const n = parseFloat(v); return isNaN(n) ? null : n; }

function parseZone(z) {
  if (!z) return { min: null, max: null, minNum: null, maxNum: null };
  const parts = z.trim().split('-');
  const min = parts[0]?.trim() || null;
  const max = parts[1]?.trim() || min;
  const toNum = (s) => s
    ? parseFloat(s.replace(/a$/i, '.0').replace(/b$/i, '.5'))
    : null;
  return { min, max, minNum: toNum(min), maxNum: toNum(max) };
}

async function ingestSpecies(records) {
  console.log(`\nIngesting ${records.length} species...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of records) {
      try {
        const symbol = (row['Symbol'] || row['Accepted Symbol'] || '').trim();
        const scientificName = (row['Scientific Name with Author'] || row['Scientific Name'] || '').trim();
        const commonName = row['Common Name'] || null;
        const family = row['Family'] || null;
        const category = row['Category'] || null;
        const duration = row['Duration'] || null;
        const growthHabit = row['Growth Habit'] || null;
        const nativeStatus = row['Native Status'] || null;

        if (!symbol || !scientificName) continue;

        await client.query(`
          INSERT INTO species (
            usda_symbol, scientific_name, common_name, family,
            category, duration, growth_habit, native_status
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          ON CONFLICT (usda_symbol) DO UPDATE SET
            scientific_name = EXCLUDED.scientific_name,
            common_name     = EXCLUDED.common_name,
            family          = EXCLUDED.family,
            category        = EXCLUDED.category,
            duration        = EXCLUDED.duration,
            growth_habit    = EXCLUDED.growth_habit,
            native_status   = EXCLUDED.native_status,
            updated_at      = NOW()
        `, [symbol, scientificName, commonName, family, category, duration, growthHabit, nativeStatus]);
        LOG.processed++;
      } catch (err) {
        LOG.errors++;
        if (LOG.errors < 10) console.error(`  Error on row:`, err.message);
      }
    }
    await client.query('COMMIT');
    console.log(`  Species: ${LOG.processed} processed, ${LOG.errors} errors`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ingestCharacteristics(records) {
  console.log(`\nIngesting characteristics for ${records.length} records...`);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const row of records) {
      try {
        const symbol = (row['Symbol'] || row['Accepted Symbol'] || '').trim();
        if (!symbol) continue;

        const res = await client.query(
          'SELECT id FROM species WHERE usda_symbol = $1', [symbol]
        );
        if (!res.rows.length) continue;
        const speciesId = res.rows[0].id;

        await client.query(`
          UPDATE species SET
            elevation_min_ft     = $1,
            elevation_max_ft     = $2,
            temp_min_f           = $3,
            precip_min_in        = $4,
            precip_max_in        = $5,
            frost_free_days_min  = $6,
            frost_free_days_max  = $7,
            drought_tolerance    = $8,
            moisture_use         = $9,
            shade_tolerance      = $10,
            bloom_period         = $11,
            active_growth_period = $12,
            toxicity             = $13,
            wildlife_value       = $14,
            updated_at           = NOW()
          WHERE id = $15
        `, [
          safeInt(row['Minimum Elevation, feet'] || row['Elevation, Minimum (ft)']),
          safeInt(row['Maximum Elevation, feet'] || row['Elevation, Maximum (ft)']),
          safeFloat(row['Temperature, Minimum (°F)'] || row['Minimum Temperature (°F)']),
          safeFloat(row['Precipitation, Minimum (inches)']),
          safeFloat(row['Precipitation, Maximum (inches)']),
          safeInt(row['Frost Free Days, Minimum']),
          safeInt(row['Frost Free Days, Maximum']),
          row['Drought Tolerance'] || null,
          row['Moisture Use'] || null,
          row['Shade Tolerance'] || null,
          row['Bloom Period'] || null,
          row['Active Growth Period'] || null,
          row['Toxicity'] || null,
          row['Wildlife Value'] || null,
          speciesId,
        ]);

        // Zone data
        const zone = row['Hardy Zone'] || row['Hardiness Zone'] || null;
        if (zone) {
          const { min, max, minNum, maxNum } = parseZone(zone);
          await client.query(`
            INSERT INTO species_zones (species_id, zone_min, zone_max, zone_min_num, zone_max_num)
            VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
          `, [speciesId, min, max, minNum, maxNum]);
        }
        LOG.updated++;
      } catch (err) {
        LOG.errors++;
        if (LOG.errors < 10) console.error(`  Char error:`, err.message);
      }
    }
    await client.query('COMMIT');
    console.log(`  Characteristics: ${LOG.updated} updated`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function ingestCounties(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`\n  County file not found at ${filePath}`);
    console.warn('  Download from https://plants.sc.egov.usda.gov/home/downloads');
    console.warn('  Place as: data/county_distribution.csv — skipping.');
    return;
  }

  console.log('\nIngesting county distribution...');
  const records = await parseCSV(filePath);
  const client = await pool.connect();
  let count = 0;

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM species_counties');

    for (const row of records) {
      try {
        const symbol = (row['Symbol'] || row['Accepted Symbol'] || '').trim();
        const countyFips = (row['County FIPS'] || row['FIPS'] || '').trim();
        const stateFips = (row['State FIPS'] || countyFips.substring(0, 2)).trim();
        const nativeStatus = row['Native Status'] || row['Occurrence Status'] || null;

        if (!symbol || !countyFips) continue;

        const res = await client.query(
          'SELECT id FROM species WHERE usda_symbol = $1', [symbol]
        );
        if (!res.rows.length) continue;

        await client.query(`
          INSERT INTO species_counties (species_id, state_fips, county_fips, native_status)
          VALUES ($1,$2,$3,$4)
        `, [res.rows[0].id, stateFips.padStart(2,'0'), countyFips.padStart(5,'0'), nativeStatus]);
        count++;
      } catch (err) {
        LOG.errors++;
      }
    }
    await client.query('COMMIT');
    console.log(`  County records: ${count} ingested`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function logRun() {
  await pool.query(`
    INSERT INTO ingestion_log
      (run_type, species_processed, species_updated, errors, started_at, completed_at)
    VALUES ($1,$2,$3,$4,$5,NOW())
  `, ['usda_full', LOG.processed, LOG.updated, LOG.errors, LOG.started]);
}

async function main() {
  console.log('PlantItEatIt — USDA Ingestion Pipeline');
  console.log('=======================================');
  ensureDir(DATA_DIR);

  try {
    // Step 1: Complete species list
    const completePath = path.join(DATA_DIR, 'complete_plant_list.csv');
    await downloadFile(USDA.complete, completePath);
    const completeRecords = await parseCSV(completePath);
    await ingestSpecies(completeRecords);

    // Step 2: Characteristics
    const charPath = path.join(DATA_DIR, 'plant_characteristics.csv');
    await downloadFile(USDA.characteristics, charPath);
    const charRecords = await parseCSV(charPath);
    await ingestCharacteristics(charRecords);

    // Step 3: County distribution (manual download required)
    await ingestCounties(USDA.countyFile);

    await logRun();

    console.log('\n✓ Ingestion complete');
    console.log(`  Processed: ${LOG.processed} | Updated: ${LOG.updated} | Errors: ${LOG.errors}`);
  } catch (err) {
    console.error('\nFatal error:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
