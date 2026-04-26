const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/veggies
// Query params: county, zone, elevation, native_only, limit
// Returns vegetable species with extended growing data
router.get('/', async (req, res) => {
  try {
    const { county, zone, elevation, native_only, limit = 100 } = req.query;

    if (!county) {
      return res.status(400).json({ error: 'county FIPS is required' });
    }

    const params = [county.padStart(5, '0')];
    let elevCondition = '';
    let zoneCondition = '';

    if (elevation) {
      const e = parseInt(elevation);
      if (!isNaN(e)) {
        params.push(e);
        elevCondition = `AND (
          s.elevation_min_ft IS NULL OR s.elevation_max_ft IS NULL OR
          (s.elevation_min_ft <= $${params.length} AND s.elevation_max_ft >= $${params.length})
        )`;
      }
    }

    if (zone) {
      const m = zone.match(/^(\d+)([ab]?)$/i);
      if (m) {
        const num = parseInt(m[1]) + (m[2].toLowerCase() === 'b' ? 0.5 : 0);
        params.push(num);
        zoneCondition = `AND (sz.zone_min_num IS NULL OR sz.zone_min_num <= $${params.length})
          AND (sz.zone_max_num IS NULL OR sz.zone_max_num >= $${params.length})`;
      }
    }

    const nativeFilter = native_only === 'true'
      ? `AND sc.native_status ILIKE '%N%'` : '';

    params.push(parseInt(limit));

    const query = `
      SELECT DISTINCT
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
        v.lowes_product_name, v.lowes_affiliate_url, v.lowes_product_price,
        v.burpee_product_name, v.burpee_affiliate_url
      FROM species s
      JOIN species_counties sc ON sc.species_id = s.id
      LEFT JOIN species_zones sz ON sz.species_id = s.id
      LEFT JOIN species_veggies v ON v.species_id = s.id
      WHERE sc.county_fips = $1
        AND s.category IN ('Forb/Herb', 'Dicot', 'Monocot', 'Gymnosperm')
        ${elevCondition}
        ${zoneCondition}
        ${nativeFilter}
      ORDER BY
        CASE WHEN sc.native_status ILIKE '%N%' THEN 0 ELSE 1 END,
        s.common_name
      LIMIT $${params.length}
    `;

    const { rows } = await pool.query(query, params);
    res.json({ county, total: rows.length, results: rows });

  } catch (err) {
    console.error('Veggies query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/veggies/:id/pests
// Returns pest calendar for a species and region
router.get('/:id/pests', async (req, res) => {
  try {
    const { region } = req.query;
    const params = [req.params.id];
    let regionFilter = '';
    if (region) {
      params.push(region);
      regionFilter = `AND p.region_code = $2`;
    }

    const { rows } = await pool.query(`
      SELECT p.pest_name, p.region_code, p.active_months,
             p.severity, p.organic_control, p.notes
      FROM species_pests p
      WHERE p.species_id = $1 ${regionFilter}
      ORDER BY p.severity DESC
    `, params);

    res.json({ species_id: req.params.id, pests: rows });
  } catch (err) {
    console.error('Pests query error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/veggies/search?q=squash&county=04019
router.get('/search', async (req, res) => {
  try {
    const { q, county } = req.query;
    if (!q || !county) {
      return res.status(400).json({ error: 'q and county are required' });
    }

    const { rows } = await pool.query(`
      SELECT DISTINCT s.id, s.scientific_name, s.common_name,
        s.category, s.image_url,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.deer_risk, v.rabbit_risk, v.frost_hardy
      FROM species s
      JOIN species_counties sc ON sc.species_id = s.id
      LEFT JOIN species_veggies v ON v.species_id = s.id
      WHERE sc.county_fips = $1
        AND (
          s.common_name ILIKE $2 OR
          s.scientific_name ILIKE $2
        )
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


// GET /api/veggies/compatibility?plant=butternut+squash&county=04003&elevation=5003&frost_free_days=360
// Returns a compatibility assessment for a specific plant at a location
router.get('/compatibility', async (req, res) => {
  try {
    const { plant, county, elevation, frost_free_days } = req.query;

    if (!plant) return res.status(400).json({ error: 'plant name is required' });

    const elevFt = parseInt(elevation) || null;
    const frostFreeDays = parseInt(frost_free_days) || null;
    const countyFips = county ? county.padStart(5, '0') : null;

    // Search by common name, scientific name, or family
    const searchTerms = plant.toLowerCase().split(/\s+/);
    const searchPattern = `%${plant}%`;

    const { rows } = await pool.query(`
      SELECT DISTINCT
        s.id, s.usda_symbol, s.scientific_name, s.common_name,
        s.family, s.category, s.duration,
        s.drought_tolerance, s.moisture_use, s.shade_tolerance,
        s.frost_free_days_min, s.frost_free_days_max,
        s.elevation_min_ft, s.elevation_max_ft,
        s.temp_min_f, s.precip_min_in, s.precip_max_in,
        s.bloom_period, s.active_growth_period,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.yield_per_plant,
        v.deer_risk, v.rabbit_risk, v.javelina_risk,
        v.start_indoors, v.weeks_before_last_frost,
        v.direct_sow, v.frost_hardy
      FROM species s
      LEFT JOIN species_veggies v ON v.species_id = s.id
      WHERE (
        s.common_name ILIKE $1
        OR s.scientific_name ILIKE $1
        OR s.family ILIKE $1
      )
      ORDER BY s.common_name
      LIMIT 5
    `, [searchPattern]);

    if (rows.length === 0) {
      return res.json({
        plant,
        found: false,
        message: `No plant matching "${plant}" found in our database.`,
        suggestions: ['Try searching by scientific name', 'Check spelling', 'Try a related term']
      });
    }

    // Build compatibility assessment for each result
    const results = rows.map(sp => {
      const checks = [];
      let score = 100;
      let compatible = true;

      // Frost-free days check
      if (frostFreeDays && sp.frost_free_days_min) {
        if (frostFreeDays >= sp.frost_free_days_min) {
          checks.push({
            factor: 'Season length',
            pass: true,
            message: `Your ${frostFreeDays} frost-free days exceeds the ${sp.frost_free_days_min} days needed. ✓`
          });
        } else {
          score -= 40;
          compatible = false;
          checks.push({
            factor: 'Season length',
            pass: false,
            message: `Needs ${sp.frost_free_days_min} frost-free days, you have ${frostFreeDays}. Season too short. ✗`
          });
        }
      }

      // Elevation check
      if (elevFt && sp.elevation_max_ft) {
        if (elevFt <= sp.elevation_max_ft) {
          checks.push({
            factor: 'Elevation',
            pass: true,
            message: `Your elevation (${elevFt}ft) is within range (max ${sp.elevation_max_ft}ft). ✓`
          });
        } else {
          score -= 30;
          compatible = false;
          checks.push({
            factor: 'Elevation',
            pass: false,
            message: `Your elevation (${elevFt}ft) exceeds the maximum (${sp.elevation_max_ft}ft). ✗`
          });
        }
      }

      // Drought tolerance context
      if (sp.drought_tolerance) {
        checks.push({
          factor: 'Water needs',
          pass: true,
          message: `Drought tolerance: ${sp.drought_tolerance}. ${
            sp.drought_tolerance === 'High' ? 'Well suited for your dry climate.' :
            sp.drought_tolerance === 'Medium' ? 'Will need regular irrigation in your area.' :
            'Will need consistent watering — drip irrigation strongly recommended.'
          }`
        });
      }

      const compatibilityLabel =
        score >= 80 ? 'Excellent' :
        score >= 60 ? 'Good' :
        score >= 40 ? 'Marginal' : 'Not recommended';

      return {
        id: sp.id,
        scientific_name: sp.scientific_name,
        common_name: sp.common_name,
        family: sp.family,
        compatible,
        compatibility_score: score,
        compatibility_label: compatibilityLabel,
        checks,
        growing_data: {
          frost_free_days_needed: sp.frost_free_days_min,
          elevation_max_ft: sp.elevation_max_ft,
          drought_tolerance: sp.drought_tolerance,
          moisture_use: sp.moisture_use,
          days_to_maturity: sp.days_to_maturity_min
            ? `${sp.days_to_maturity_min}-${sp.days_to_maturity_max} days`
            : null,
          start_indoors: sp.start_indoors,
          weeks_before_last_frost: sp.weeks_before_last_frost,
          deer_risk: sp.deer_risk,
          rabbit_risk: sp.rabbit_risk,
          javelina_risk: sp.javelina_risk,
        }
      };
    });

    res.json({
      plant,
      location: { county, elevation: elevFt, frost_free_days: frostFreeDays },
      total: results.length,
      results
    });

  } catch (err) {
    console.error('Compatibility error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});