/**
 * Downloads US county centroids from Census Bureau
 * Saves to data/county-centroids.json
 * Run once before seed-county-climate.js
 *
 * Usage: node scripts/download-county-centroids.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../data/county-centroids.json');

async function main() {
  console.log('Downloading county centroids from Census Bureau...');

  // Census Bureau county centers of population
  const url = 'https://www2.census.gov/geo/docs/reference/cenpop2020/county/CenPop2020_Mean_CO.txt';

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  const centroids = {};
  let count = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 4) continue;

    const statefp = cols[0]?.padStart(2, '0');
    const countyfp = cols[1]?.padStart(3, '0');
    const lat = parseFloat(cols[cols.length - 2]);
    const lng = parseFloat(cols[cols.length - 1]);

    if (!statefp || !countyfp || isNaN(lat) || isNaN(lng)) continue;

    const fips = `${statefp}${countyfp}`;
    centroids[fips] = [lat, lng];
    count++;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(centroids, null, 2));
  console.log(`✓ Saved ${count} county centroids to data/county-centroids.json`);
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
