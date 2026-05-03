const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/veggies/compatibility?plant=tomato&county=04003&elevation=5003&frost_free_days=360
router.get('/compatibility', async (req, res) => {
  try {
    const { plant, county, elevation, frost_free_days } = req.query;
    if (!plant) return res.status(400).json({ error: 'plant name is required' });

    const elevFt = parseInt(elevation) || null;
    const frostFreeDays = parseInt(frost_free_days) || null;
    const searchPattern = `%${plant}%`;

    const { rows } = await pool.query(`
      SELECT DISTINCT
        s.id, s.usda_symbol, s.scientific_name, s.common_name,
        s.family, s.category, s.duration,
        s.drought_tolerance, s.moisture_use, s.shade_tolerance,
        s.frost_free_days_min, s.frost_free_days_max,
        s.elevation_min_ft, s.elevation_max_ft,
        s.temp_min_f, s.precip_min_in, s.precip_max_in,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.yield_per_plant,
        v.deer_risk, v.rabbit_risk, v.javelina_risk,
        v.start_indoors, v.weeks_before_last_frost,
        v.direct_sow, v.frost_hardy
      FROM species s
      LEFT JOIN species_veggies v ON v.species_id = s.id
      WHERE s.food_safe = TRUE
        AND (
          s.common_name ILIKE $1
          OR s.scientific_name ILIKE $1
          OR s.family ILIKE $1
        )
      ORDER BY s.common_name
      LIMIT 5
    `, [searchPattern]);

    if (rows.length === 0) {
      return res.json({
        plant, found: false,
        message: `No plant matching "${plant}" found in our database.`,
        suggestions: ['Try searching by scientific name', 'Check spelling', 'Try a related term']
      });
    }

    const results = rows.map(sp => {
      const checks = [];
      let score = 100;
      let compatible = true;

      if (frostFreeDays && sp.frost_free_days_min) {
        if (frostFreeDays >= sp.frost_free_days_min) {
          checks.push({ factor: 'Season length', pass: true, message: `Your ${frostFreeDays} frost-free days exceeds the ${sp.frost_free_days_min} days needed. ✓` });
        } else {
          score -= 40; compatible = false;
          checks.push({ factor: 'Season length', pass: false, message: `Needs ${sp.frost_free_days_min} frost-free days, you have ${frostFreeDays}. Season too short. ✗` });
        }
      }

      if (elevFt && sp.elevation_max_ft) {
        if (elevFt <= sp.elevation_max_ft) {
          checks.push({ factor: 'Elevation', pass: true, message: `Your elevation (${elevFt}ft) is within range (max ${sp.elevation_max_ft}ft). ✓` });
        } else {
          score -= 30; compatible = false;
          checks.push({ factor: 'Elevation', pass: false, message: `Your elevation (${elevFt}ft) exceeds the maximum (${sp.elevation_max_ft}ft). ✗` });
        }
      }

      if (sp.drought_tolerance) {
        checks.push({
          factor: 'Water needs', pass: true,
          message: `Drought tolerance: ${sp.drought_tolerance}. ${
            sp.drought_tolerance === 'High' ? 'Well suited for your dry climate.' :
            sp.drought_tolerance === 'Medium' ? 'Will need regular irrigation.' :
            'Will need consistent watering — drip irrigation strongly recommended.'
          }`
        });
      }

      const compatibilityLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Marginal' : 'Not recommended';

      return {
        id: sp.id, scientific_name: sp.scientific_name, common_name: sp.common_name,
        family: sp.family, compatible, compatibility_score: score, compatibility_label: compatibilityLabel, checks,
        growing_data: {
          frost_free_days_needed: sp.frost_free_days_min,
          elevation_max_ft: sp.elevation_max_ft,
          drought_tolerance: sp.drought_tolerance,
          moisture_use: sp.moisture_use,
          days_to_maturity: sp.days_to_maturity_min ? `${sp.days_to_maturity_min}-${sp.days_to_maturity_max} days` : null,
          start_indoors: sp.start_indoors,
          weeks_before_last_frost: sp.weeks_before_last_frost,
          deer_risk: sp.deer_risk, rabbit_risk: sp.rabbit_risk, javelina_risk: sp.javelina_risk,
        }
      };
    });

    res.json({ plant, location: { county, elevation: elevFt, frost_free_days: frostFreeDays }, total: results.length, results });

  } catch (err) {
    console.error('Compatibility error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// GET /api/veggies/climate?elevation=5030&frost_free_days=351&exclude_county=04019&limit=200
// Returns all food_safe species matched by climate only — no county restriction
// exclude_county optionally removes plants already verified for that county
router.get('/climate', async (req, res) => {
  try {
    const elevation = parseInt(req.query.elevation) || 0;
    const frost_free_days = parseInt(req.query.frost_free_days) || 365;
    const limit = parseInt(req.query.limit) || 200;
    const exclude_county = req.query.exclude_county || null;

    const params = [elevation, frost_free_days];
    let excludeClause = '';

    if (exclude_county) {
      params.push(exclude_county.padStart(5, '0'));
      excludeClause = `AND s.id NOT IN (
        SELECT species_id FROM species_counties WHERE county_fips = $${params.length}
      )`;
    }

    const query = `
      SELECT DISTINCT
        s.id, s.usda_symbol, s.scientific_name, s.common_name,
        s.category, s.image_url,
        sv.days_to_maturity_min, sv.days_to_maturity_max,
        sv.difficulty_level,
        sv.elevation_max_ft, sv.frost_free_days_min,
        sv.deer_risk, sv.rabbit_risk, sv.javelina_risk,
        sv.drought_tolerance, sv.yield_per_plant,
        sv.start_indoors, sv.frost_hardy,
        sv.typically_sold_as, sv.lowes_search_term, sv.seed_search_term,
        cu.intro AS culinary_intro
      FROM species s
      JOIN species_veggies sv ON sv.species_id = s.id
      LEFT JOIN species_culinary cu ON cu.species_id = s.id
      WHERE s.food_safe = TRUE
        AND (sv.elevation_max_ft IS NULL OR sv.elevation_max_ft >= $1)
        AND (sv.frost_free_days_min IS NULL OR sv.frost_free_days_min <= $2)
        ${excludeClause}
      ORDER BY s.common_name
      LIMIT ${limit}
    `;

    const { rows } = await pool.query(query, params);

    res.json({
      total: rows.length,
      elevation,
      frost_free_days,
      results: rows,
    });

  } catch (err) {
    console.error('Climate route error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// GET /api/veggies?county=04003&elevation=5003&limit=50
router.get('/', async (req, res) => {
  try {
    const { county, zone, elevation, native_only, limit = 100 } = req.query;

    if (!county) return res.status(400).json({ error: 'county FIPS is required' });

    const countyFips = county.padStart(5, '0');
    const params = [countyFips];
    let elevCondition = '';

    if (elevation) {
      const e = parseInt(elevation);
      if (!isNaN(e)) {
        params.push(e);
        elevCondition = `AND (s.elevation_max_ft IS NULL OR s.elevation_max_ft >= $${params.length})`;
      }
    }

    const nativeFilter = native_only === 'true' ? `AND sc.native_status ILIKE '%N%'` : '';
    params.push(parseInt(limit));

    const query = `
      SELECT
        s.id, s.usda_symbol, s.scientific_name, s.common_name,
        s.category, s.duration, s.native_status,
        s.shade_tolerance, s.drought_tolerance, s.moisture_use,
        s.elevation_min_ft, s.elevation_max_ft, s.temp_min_f,
        s.bloom_period, s.image_url, s.image_source,
        sc.native_status AS county_native_status,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.row_spacing_inches,
        v.mature_height_inches, v.spread_inches,
        v.yield_per_plant,
        v.succession_planting, v.succession_interval_days,
        v.start_indoors, v.weeks_before_last_frost,
        v.direct_sow, v.frost_hardy,
        v.soil_ph_min, v.soil_ph_max,
        v.needs_amended_soil, v.soil_notes,
        v.deer_risk, v.rabbit_risk, v.javelina_risk,
        v.squirrel_risk, v.bird_risk, v.wildlife_notes,
        v.typically_sold_as,
        v.lowes_search_term, v.seed_search_term,
        v.difficulty_level, v.difficulty_note,
        cu.intro AS culinary_intro,
        cu.culinary AS culinary_flavor
      FROM species s
      JOIN species_counties sc ON sc.species_id = s.id
      LEFT JOIN species_veggies v ON v.species_id = s.id
      LEFT JOIN species_culinary cu ON cu.species_id = s.id
      WHERE sc.county_fips = $1
        AND s.food_safe = TRUE
        AND s.frost_free_days_min IS NOT NULL
        ${elevCondition}
        ${nativeFilter}
      ORDER BY s.common_name
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(query, params);
    res.json({ county, total: rows.length, results: rows });

  } catch (err) {
    console.error('Veggies query error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

// GET /api/veggies/search?q=squash&county=04019
router.get('/search', async (req, res) => {
  try {
    const { q, county } = req.query;
    if (!q || !county) return res.status(400).json({ error: 'q and county are required' });

    const { rows } = await pool.query(`
      SELECT DISTINCT s.id, s.scientific_name, s.common_name,
        s.category, s.image_url,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.deer_risk, v.rabbit_risk, v.frost_hardy
      FROM species s
      JOIN species_counties sc ON sc.species_id = s.id
      LEFT JOIN species_veggies v ON v.species_id = s.id
      WHERE sc.county_fips = $1
        AND s.food_safe = TRUE
        AND (s.common_name ILIKE $2 OR s.scientific_name ILIKE $2)
      ORDER BY s.common_name
      LIMIT 20
    `, [county.padStart(5, '0'), `%${q}%`]);

    res.json({ query: q, total: rows.length, results: rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
