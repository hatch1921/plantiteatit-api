/**
 * PlantItEatIt — Image Resolution Script
 * 
 * Resolves open-license image URLs for each species.
 * Priority: 1) Wikimedia Commons  2) iNaturalist (CC0/CC-BY only)
 *
 * Usage: node scripts/resolve-images.js
 * Recommended: run weekly via cron
 */

require('dotenv').config();
const pool = require('../db/pool');

const DELAY_MS = 350;
const BATCH_SIZE = 50;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function httpGet(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'PlantItEatIt/1.0 (plantiteatit.com)' }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getWikimediaImage(scientificName) {
  try {
    // Try Wikipedia REST API first
    const encoded = encodeURIComponent(scientificName);
    const data = await httpGet(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`
    );

    if (data?.thumbnail?.source) {
      return {
        url: data.originalimage?.source || data.thumbnail.source,
        source: 'wikimedia',
        license: 'CC/Public Domain',
        attribution: data.content_urls?.desktop?.page || null,
      };
    }

    // Fallback: search Commons
    const search = await httpGet(
      `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&srnamespace=6&format=json&srlimit=1`
    );
    const title = search?.query?.search?.[0]?.title;
    if (!title) return null;

    const info = await httpGet(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`
    );
    const pages = info?.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    const imageUrl = page?.imageinfo?.[0]?.url;
    if (!imageUrl) return null;

    return {
      url: imageUrl,
      source: 'wikimedia',
      license: page?.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value || 'Unknown',
      attribution: null,
    };
  } catch {
    return null;
  }
}

async function getINaturalistImage(scientificName) {
  try {
    const encoded = encodeURIComponent(scientificName);
    const data = await httpGet(
      `https://api.inaturalist.org/v1/taxa?q=${encoded}&rank=species&photo_license=cc0,cc-by&per_page=1`
    );

    const taxon = data?.results?.[0];
    if (!taxon) return null;

    const photo = taxon.default_photo;
    if (!photo) return null;

    const license = photo.license_code?.toLowerCase();
    // Strictly commercial-safe licenses only
    if (!['cc0', 'cc-by'].includes(license)) return null;

    return {
      url: photo.medium_url || photo.url,
      source: 'inaturalist',
      license: license.toUpperCase(),
      attribution: photo.attribution,
    };
  } catch {
    return null;
  }
}

async function main() {
  console.log('PlantItEatIt — Image Resolution Pipeline');
  console.log('=========================================');

  const { rows: species } = await pool.query(`
    SELECT id, scientific_name, common_name
    FROM species
    WHERE image_url IS NULL
       OR last_image_check < NOW() - INTERVAL '7 days'
    ORDER BY id
  `);

  console.log(`Species to process: ${species.length}`);
  let resolved = 0, failed = 0;

  for (let i = 0; i < species.length; i += BATCH_SIZE) {
    const batch = species.slice(i, i + BATCH_SIZE);

    for (const sp of batch) {
      await sleep(DELAY_MS);

      let image = await getWikimediaImage(sp.scientific_name);
      if (!image) image = await getINaturalistImage(sp.scientific_name);

      if (image) {
        await pool.query(`
          UPDATE species SET
            image_url         = $1,
            image_source      = $2,
            image_license     = $3,
            image_attribution = $4,
            last_image_check  = NOW()
          WHERE id = $5
        `, [image.url, image.source, image.license, image.attribution, sp.id]);
        resolved++;
      } else {
        await pool.query(
          'UPDATE species SET last_image_check = NOW() WHERE id = $1',
          [sp.id]
        );
        failed++;
      }
    }

    const pct = Math.round(((i + batch.length) / species.length) * 100);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} complete — ${pct}% done`);
  }

  await pool.query(`
    INSERT INTO ingestion_log
      (run_type, species_processed, species_updated, errors, started_at, completed_at)
    VALUES ('image_resolve', $1, $2, $3, NOW(), NOW())
  `, [species.length, resolved, failed]);

  console.log(`\n✓ Done. Resolved: ${resolved} | No image: ${failed}`);
  await pool.end();
}

main().catch(err => {
  console.error('Image resolution failed:', err);
  process.exit(1);
});
