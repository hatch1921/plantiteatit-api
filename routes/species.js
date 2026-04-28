const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

function zoneToNum(z) {
  if (!z) return null;
  const m = z.match(/^(\d+)([ab]?)$/i);
  if (!m) return null;
  return parseInt(m[1]) + (m[2].toLowerCase() === 'b' ? 0.5 : 0);
}

function safeInt(v) {
  const n = parseInt(v);
  return isNaN(n) ? null : n;
}

// GET /api/species
// Query params: county, zone, elevation, category, native_only, limit
router.get('/', async (req, res) => {
  try {
    const {
      county,
      zone,
      elevation,
      category,
      native_only,
      limit = 150,
    } = req.query;

    const params = [];
    const conditions = [];
    let joinClause = '';

    // County filter — LEFT JOIN so county is optional
    if (county) {
      joinClause = `JOIN species_counties sc ON sc.species_id = s.id`;
      params.push(county.padStart(5, '0'));
      conditions.push(`sc.county_fips = $${params.length}`);
    }

    // Hardiness zone filter
    const zoneNum = zoneToNum(zone);
    if (zoneNum !== null) {
      joinClause += ` LEFT JOIN species_zones sz ON sz.species_id = s.id`;
      params.push(zoneNum);
      conditions.push(`(sz.zone_min_num IS NULL OR sz.zone_min_num <= $${params.length})`);
      params.push(zoneNum);
      conditions.push(`(sz.zone_max_num IS NULL OR sz.zone_max_num >= $${params.length})`);
    }

    // Elevation filter — exclude plants that explicitly can't grow at this elevation
    const elevFt = safeInt(elevation);
    if (elevFt !== null) {
      params.push(elevFt);
      // Only exclude if elevation_max_ft is set AND user elevation exceeds it
      conditions.push(`(s.elevation_max_ft IS NULL OR s.elevation_max_ft >= $${params.length})`);
      params.push(elevFt);
      // Only exclude if elevation_min_ft is set AND user elevation is below it
      conditions.push(`(s.elevation_min_ft IS NULL OR s.elevation_min_ft <= $${params.length})`);
    }

    // Category filter
    if (category) {
      params.push(`%${category}%`);
      conditions.push(`s.category ILIKE $${params.length}`);
    }

    // Native only
    if (native_only === 'true' && county) {
      conditions.push(`sc.native_status ILIKE '%N%'`);
    }

    // Food safety -- only show verified safe species
    conditions.push(`s.food_safe = TRUE`);

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Order: prioritize plants with characteristics data, then by name
    const query = `
      SELECT DISTINCT
        s.id, s.usda_symbol, s.scientific_name, s.common_name,
        s.family, s.category, s.duration, s.growth_habit,
        s.native_status, s.drought_tolerance, s.moisture_use,
        s.shade_tolerance, s.bloom_period, s.active_growth_period,
        s.frost_free_days_min, s.frost_free_days_max,
        s.elevation_min_ft, s.elevation_max_ft,
        s.temp_min_f, s.precip_min_in, s.precip_max_in,
        s.toxicity, s.wildlife_value,
        s.image_url, s.image_source, s.image_license, s.image_attribution
        ${county ? ', sc.native_status AS county_native_status' : ''}
      FROM species s
      ${joinClause}
      ${whereClause}
      ORDER BY
        s.common_name
      LIMIT $${params.length + 1}
    `;

    params.push(parseInt(limit));
    const { rows } = await pool.query(query, params);

    // Group by category
    const categories = {};
    for (const row of rows) {
      const cat = row.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(row);
    }

    res.json({
      county: county || null,
      zone: zone || null,
      elevation: elevFt,
      total: rows.length,
      categories,
    });

  } catch (err) {
    console.error('Species query error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// GET /api/species/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
        array_agg(DISTINCT sz.zone_min || '-' || sz.zone_max)
          FILTER (WHERE sz.id IS NOT NULL) AS zones
      FROM species s
      LEFT JOIN species_zones sz ON sz.species_id = s.id
      WHERE s.id = $1
      GROUP BY s.id
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ error: 'Species not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Species detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
