const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * GET /api/indoor
 *
 * Returns plants suitable for indoor growing.
 * NOT county-bound -- climate is controlled indoors.
 * Filtered by indoor_suitable = TRUE.
 *
 * Query params:
 * - limit (default 100)
 * - difficulty: beginner|intermediate|advanced (optional filter)
 * - light: low|medium|high|full sun (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, difficulty, light } = req.query;

    let conditions = [`s.food_safe = TRUE`, `v.indoor_suitable = TRUE`];
    const params = [];

    if (difficulty) {
      params.push(difficulty);
      conditions.push(`v.difficulty_level = $${params.length}`);
    }

    if (light) {
      params.push(light);
      conditions.push(`v.light_requirement = $${params.length}`);
    }

    params.push(parseInt(limit));

    const { rows } = await pool.query(`
      SELECT
        s.id, s.usda_symbol, s.common_name, s.scientific_name,
        s.category, s.drought_tolerance, s.image_url,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.yield_per_plant,
        v.start_indoors, v.direct_sow, v.frost_hardy,
        v.soil_notes, v.typically_sold_as,
        v.lowes_search_term, v.seed_search_term,
        v.indoor_suitable, v.hydro_suitable,
        v.light_requirement, v.root_depth,
        v.container_suitable, v.difficulty_level, v.difficulty_note,
        v.deer_risk, v.rabbit_risk, v.javelina_risk,
        cu.intro AS culinary_intro,
        cu.culinary AS culinary_flavor
      FROM species s
      JOIN species_veggies v ON v.species_id = s.id
      LEFT JOIN species_culinary cu ON cu.species_id = s.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY
        CASE v.difficulty_level
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END,
        v.days_to_maturity_min ASC NULLS LAST,
        s.common_name
      LIMIT $${params.length}
    `, params);

    res.json({
      environment: 'indoor',
      total: rows.length,
      results: rows,
    });

  } catch (err) {
    console.error('Indoor route error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
