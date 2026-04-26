/**
 * PlantItEatIt — USDA PLANTS Ingestion Script
 * Reads local complete_plant_list.txt and ingests in batches of 500
 *
 * Usage: node scripts/ingest-usda.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../db/pool');

const DATA_DIR = path.join(__dirname, '../data');
const BATCH_SIZE = 500;
const LOG = { started: new Date(), processed: 0, skipped: 0, errors: 0 };

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

async function ingestBatch(client, batch) {
  for (const row of batch) {
    try {
      const symbol = (row['Symbol'] || row['Accepted Symbol'] || '').trim();
      const scientificName = (
        row['Scientific Name with Author'] ||
        row['Scientific Name'] || ''
      ).trim();
      const commonName = (row['Common Name'] || row['National Common Name'] || '').trim() || null;
      const family = (row['Family'] || '').trim() || null;

      if (!symbol || !scientificName) {
        LOG.skipped++;
        continue;
      }

      await client.query(`
        INSERT INTO species (usda_symbol, scientific_name, common_name, family)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (usda_symbol) DO UPDATE SET
          scientific_name = EXCLUDED.scientific_name,
          common_name     = EXCLUDED.common_name,
          family          = EXCLUDED.family,
          updated_at      = NOW()
      `, [symbol, scientificName, commonName, family]);

      LOG.processed++;
    } catch (err) {
      LOG.errors++;
      if (LOG.errors <= 3) {
        console.error('  Row error:', err.message);
      }
    }
  }
}

async function ingestSpecies(records) {
  console.log(`\nIngesting ${records.length} records in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await ingestBatch(client, batch);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, err.message);
      LOG.errors += batch.length;
    } finally {
      client.release();
    }

    const pct = Math.round(((i + batch.length) / records.length) * 100);
    if (pct % 10 === 0 || i === 0) {
      console.log(`  ${pct}% — ${LOG.processed} ingested, ${LOG.errors} errors`);
    }
  }
}

async function logRun() {
  try {
    await pool.query(`
      INSERT INTO ingestion_log
        (run_type, species_processed, species_updated, errors, started_at, completed_at)
      VALUES ($1,$2,$3,$4,$5,NOW())
    `, ['usda_checklist', LOG.processed, LOG.processed, LOG.errors, LOG.started]);
  } catch (err) {
    console.warn('Could not write log:', err.message);
  }
}

async function main() {
  console.log('PlantItEatIt — USDA Ingestion Pipeline');
  console.log('=======================================');

  const completeFile = ['complete_plant_list.txt', 'complete_plant_list.csv']
    .map(f => path.join(DATA_DIR, f))
    .find(f => fs.existsSync(f));

  if (!completeFile) {
    console.error('ERROR: data/complete_plant_list.txt not found');
    process.exit(1);
  }

  console.log(`File: ${path.basename(completeFile)}`);

  const firstLine = fs.readFileSync(completeFile, 'utf8').split('\n')[0];
  const delimiter = firstLine.includes('\t') ? '\t' : ',';
  console.log(`Delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

  try {
    const records = await parseCSV(completeFile, delimiter);
    console.log(`Parsed: ${records.length} records`);
    console.log(`Columns: ${Object.keys(records[0]).join(', ')}`);

    await ingestSpecies(records);
    await logRun();

    const secs = Math.round((Date.now() - LOG.started) / 1000);
    console.log(`\n✓ Done in ${secs}s`);
    console.log(`  Processed: ${LOG.processed} | Skipped: ${LOG.skipped} | Errors: ${LOG.errors}`);

  } catch (err) {
    console.error('Fatal:', err.message, err.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();