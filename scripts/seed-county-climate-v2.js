/**
 * PlantItEatIt — County Climate Pre-Seeder v2
 *
 * Usage:
 *   node scripts/seed-county-climate-v2.js             (all counties)
 *   node scripts/seed-county-climate-v2.js --resume    (resume after stall)
 *   node scripts/seed-county-climate-v2.js --state 04  (Arizona only)
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Direct pool creation -- bypasses shared pool.js SSL issue
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  connectionTimeoutMillis: 10000,
});

const CENTROIDS_FILE = path.join(__dirname, '../data/county-centroids.json');
const CHECKPOINT_FILE = path.join(__dirname, '../data/climate-checkpoint.json');
const DELAY_MS = 250;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function getClimateDescriptor(elevFt, precipIn, lat) {
  if (elevFt > 7000) return 'High Mountain';
  if (elevFt > 4000 && precipIn < 15) return 'High Desert';
  if (elevFt > 2000 && precipIn < 15) return 'Desert';
  if (precipIn > 50) return 'Humid';
  if (precipIn > 30) return 'Temperate';
  if (lat > 45) return 'Northern Plains';
  return 'Semi-Arid';
}

function getMonsoonMonth(lat, lng) {
  if (lat < 36 && lat > 28 && lng > -115 && lng < -103) return 'Jul';
  return null;
}

function getZone(extremeMinF) {
  if (extremeMinF > 50) return '12';
  if (extremeMinF > 40) return '11';
  if (extremeMinF > 30) return '10a';
  if (extremeMinF > 25) return '9b';
  if (extremeMinF > 20) return '9a';
  if (extremeMinF > 15) return '8b';
  if (extremeMinF > 10) return '8a';
  if (extremeMinF > 5)  return '7b';
  if (extremeMinF > 0)  return '7a';
  if (extremeMinF > -5) return '6b';
  if (extremeMinF > -10) return '6a';
  return 'Below 6';
}

async function fetchClimate(lat, lng) {
  const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?` +
    `latitude=${lat}&longitude=${lng}` +
    `&start_date=2014-01-01&end_date=2023-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum` +
    `&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto`;

  const archiveRes = await fetch(archiveUrl);
  if (!archiveRes.ok) {
    const text = await archiveRes.text();
    throw new Error(`Archive API ${archiveRes.status}: ${text.slice(0, 200)}`);
  }
  const archive = await archiveRes.json();

  const elevRes = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
  if (!elevRes.ok) throw new Error(`Elevation API ${elevRes.status}`);
  const elev = await elevRes.json();

  const mins = archive.daily.temperature_2m_min.filter(v => v !== null);
  const maxs = archive.daily.temperature_2m_max.filter(v => v !== null);
  const precips = archive.daily.precipitation_sum.filter(v => v !== null);

  const yearCount = 10;
  const frostFreeDays = Math.round(mins.filter(t => t > 32).length / yearCount);
  const annualPrecipIn = Math.round((precips.reduce((a, b) => a + b, 0) / yearCount) * 10) / 10;
  const avgTempMinF = Math.round((mins.reduce((a, b) => a + b, 0) / mins.length) * 10) / 10;
  const avgTempMaxF = Math.round((maxs.reduce((a, b) => a + b, 0) / maxs.length) * 10) / 10;
  const extremeMinF = Math.round(Math.min(...mins) * 10) / 10;
  const elevationFt = Math.round(elev.elevation[0] * 3.28084);

  return { elevationFt, frostFreeDays, annualPrecipIn, avgTempMinF, avgTempMaxF, extremeMinF };
}

function loadCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch {}
  return { processed: [] };
}

function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

async function main() {
  const resume = process.argv.includes('--resume');
  const stateIdx = process.argv.indexOf('--state');
  const stateFilter = stateIdx >= 0 ? process.argv[stateIdx + 1] : null;

  console.log('PlantItEatIt — County Climate Pre-Seeder v2');
  console.log('=============================================');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 50) + '...' : 'NOT SET');

  // Test connection first
  try {
    await pool.query('SELECT 1');
    console.log('Database connection: OK\n');
  } catch (err) {
    console.error('Database connection FAILED:', err.message);
    process.exit(1);
  }

  if (!fs.existsSync(CENTROIDS_FILE)) {
    console.error('Missing data/county-centroids.json');
    process.exit(1);
  }

  const centroids = JSON.parse(fs.readFileSync(CENTROIDS_FILE, 'utf8'));
  const checkpoint = loadCheckpoint();

  console.log(`Total counties: ${Object.keys(centroids).length}`);
  if (stateFilter) console.log(`State filter: ${stateFilter}`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS county_climate (
      county_fips      VARCHAR(5)   PRIMARY KEY,
      elevation_ft     INTEGER,
      frost_free_days  INTEGER,
      annual_precip_in DECIMAL(5,1),
      avg_temp_min_f   DECIMAL(5,1),
      avg_temp_max_f   DECIMAL(5,1),
      extreme_min_f    DECIMAL(5,1),
      hardiness_zone   VARCHAR(5),
      climate_descriptor VARCHAR(50),
      monsoon_month    VARCHAR(3),
      lat              DECIMAL(8,4),
      lng              DECIMAL(8,4),
      cached_at        TIMESTAMP DEFAULT NOW(),
      updated_at       TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('county_climate table ready\n');

  const entries = Object.entries(centroids)
    .filter(([fips]) => !stateFilter || fips.startsWith(stateFilter));

  console.log(`Processing ${entries.length} counties...\n`);

  let processed = 0, skipped = 0, errors = 0;

  for (const [fips, coords] of entries) {
    const lat = coords[0];
    const lng = coords[1];

    if (resume && checkpoint.processed.includes(fips)) { skipped++; continue; }

    try {
      const climate = await fetchClimate(lat, lng);
      const zone = getZone(climate.extremeMinF);
      const descriptor = getClimateDescriptor(climate.elevationFt, climate.annualPrecipIn, lat);
      const monsoon = getMonsoonMonth(lat, lng);

      await pool.query(`
        INSERT INTO county_climate (
          county_fips, elevation_ft, frost_free_days, annual_precip_in,
          avg_temp_min_f, avg_temp_max_f, extreme_min_f,
          hardiness_zone, climate_descriptor, monsoon_month, lat, lng
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        ON CONFLICT (county_fips) DO UPDATE SET
          elevation_ft = EXCLUDED.elevation_ft,
          frost_free_days = EXCLUDED.frost_free_days,
          annual_precip_in = EXCLUDED.annual_precip_in,
          avg_temp_min_f = EXCLUDED.avg_temp_min_f,
          avg_temp_max_f = EXCLUDED.avg_temp_max_f,
          extreme_min_f = EXCLUDED.extreme_min_f,
          hardiness_zone = EXCLUDED.hardiness_zone,
          climate_descriptor = EXCLUDED.climate_descriptor,
          monsoon_month = EXCLUDED.monsoon_month,
          updated_at = NOW()
      `, [fips, climate.elevationFt, climate.frostFreeDays, climate.annualPrecipIn,
          climate.avgTempMinF, climate.avgTempMaxF, climate.extremeMinF,
          zone, descriptor, monsoon, lat, lng]);

      checkpoint.processed.push(fips);
      saveCheckpoint(checkpoint);
      processed++;

      console.log(`  ${fips}: ${climate.elevationFt}ft | ${climate.frostFreeDays}d | ${climate.annualPrecipIn}" | Zone ${zone} | ${descriptor}`);
      await sleep(DELAY_MS);

    } catch (err) {
      console.error(`  ${fips} ERROR: ${err.message}`);
      errors++;
      await sleep(3000);
    }
  }

  console.log(`\n✓ Done -- processed: ${processed}, skipped: ${skipped}, errors: ${errors}`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
