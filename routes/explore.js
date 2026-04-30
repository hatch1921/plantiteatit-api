const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * GET /api/explore?q=pumpkin&elevation=5003&frost_free_days=360&county=04003
 *
 * Searches ALL food_safe species regardless of county distribution.
 * Used as fallback when local search returns no results.
 * Returns plants with compatibility calculated from elevation + frost_free_days.
 * Excludes species already in the user's county (those show in the main list).
 */
router.get('/', async (req, res) => {
  try {
    const { q, elevation, frost_free_days, county } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'q must be at least 2 characters' });
    }

    const elevFt = parseInt(elevation) || null;
    const frostFreeDays = parseInt(frost_free_days) || null;
    const countyFips = county ? county.padStart(5, '0') : null;
    const searchPattern = `%${q.trim()}%`;

    // Search all food_safe species, optionally excluding those already in user's county
    const { rows } = await pool.query(`
      SELECT DISTINCT
        s.id, s.usda_symbol, s.common_name, s.scientific_name,
        s.category, s.drought_tolerance, s.moisture_use,
        s.elevation_min_ft, s.elevation_max_ft,
        s.frost_free_days_min, s.frost_free_days_max,
        s.temp_min_f,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.yield_per_plant,
        v.deer_risk, v.rabbit_risk, v.javelina_risk,
        v.start_indoors, v.weeks_before_last_frost,
        v.direct_sow, v.frost_hardy,
        v.soil_notes, v.wildlife_notes,
        v.typically_sold_as, v.lowes_search_term, v.seed_search_term,
        s.image_url,
        -- Check if already in user's county
        CASE WHEN sc_local.species_id IS NOT NULL THEN true ELSE false END AS in_local_county
      FROM species s
      LEFT JOIN species_veggies v ON v.species_id = s.id
      LEFT JOIN species_counties sc_local ON (
        sc_local.species_id = s.id
        AND sc_local.county_fips = $2
      )
      WHERE s.food_safe = TRUE
        AND (
          s.common_name ILIKE $1
          OR s.scientific_name ILIKE $1
        )
      ORDER BY
        s.common_name
      LIMIT 20
    `, [searchPattern, countyFips || '00000']);

    // Calculate compatibility for each result
    const results = rows.map(plant => {
      let score = 100;
      let reasons = [];
      let confidence = 'Likely';

      // Frost-free days check
      if (frostFreeDays && plant.frost_free_days_min) {
        if (frostFreeDays >= plant.frost_free_days_min) {
          reasons.push(`Your ${frostFreeDays} frost-free days covers the ${plant.frost_free_days_min} days needed`);
        } else {
          score -= 40;
          reasons.push(`Needs ${plant.frost_free_days_min} frost-free days, you have ${frostFreeDays}`);
        }
      }

      // Elevation check
      if (elevFt && plant.elevation_max_ft) {
        if (elevFt <= plant.elevation_max_ft) {
          reasons.push(`Your elevation (${elevFt.toLocaleString()} ft) is within range`);
        } else {
          score -= 30;
          reasons.push(`Elevation (${elevFt.toLocaleString()} ft) exceeds typical max (${plant.elevation_max_ft.toLocaleString()} ft)`);
        }
      }

      // Set confidence label
      if (score >= 90) confidence = 'Likely grows here';
      else if (score >= 70) confidence = 'Should grow with care';
      else if (score >= 50) confidence = 'Worth trying';
      else confidence = 'Challenging at your location';

      // Source label
      const source = plant.in_local_county
        ? 'Confirmed in your county'
        : 'Based on your climate profile';

      return {
        id: plant.id,
        usda_symbol: plant.usda_symbol,
        common_name: plant.common_name,
        scientific_name: plant.scientific_name,
        category: plant.category,
        drought_tolerance: plant.drought_tolerance,
        elevation_max_ft: plant.elevation_max_ft,
        frost_free_days_min: plant.frost_free_days_min,
        days_to_maturity_min: plant.days_to_maturity_min,
        days_to_maturity_max: plant.days_to_maturity_max,
        yield_per_plant: plant.yield_per_plant,
        deer_risk: plant.deer_risk,
        rabbit_risk: plant.rabbit_risk,
        javelina_risk: plant.javelina_risk,
        start_indoors: plant.start_indoors,
        frost_hardy: plant.frost_hardy,
        soil_notes: plant.soil_notes,
        wildlife_notes: plant.wildlife_notes,
        typically_sold_as: plant.typically_sold_as,
        lowes_search_term: plant.lowes_search_term,
        seed_search_term: plant.seed_search_term,
        image_url: plant.image_url,
        in_local_county: plant.in_local_county,
        compatibility_score: score,
        confidence,
        source,
        reasons,
      };
    });

    res.json({
      query: q,
      elevation: elevFt,
      frost_free_days: frostFreeDays,
      total: results.length,
      results,
    });

  } catch (err) {
    console.error('Explore error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
