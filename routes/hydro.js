const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * GET /api/hydro
 *
 * Returns plants suitable for hydroponic growing.
 * NOT county-bound -- hydro is fully climate controlled.
 * Filtered by hydro_suitable = TRUE.
 *
 * Query params:
 * - limit (default 100)
 * - difficulty: beginner|intermediate|advanced (optional filter)
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 100, difficulty } = req.query;

    let conditions = [`s.food_safe = TRUE`, `v.hydro_suitable = TRUE`];
    const params = [];

    if (difficulty) {
      params.push(difficulty);
      conditions.push(`v.difficulty_level = $${params.length}`);
    }

    params.push(parseInt(limit));

    const { rows } = await pool.query(`
      SELECT
        s.id, s.usda_symbol, s.common_name, s.scientific_name,
        s.category, s.image_url,
        v.days_to_maturity_min, v.days_to_maturity_max,
        v.spacing_inches, v.yield_per_plant,
        v.frost_hardy, v.typically_sold_as,
        v.lowes_search_term, v.seed_search_term,
        v.indoor_suitable, v.hydro_suitable,
        v.light_requirement, v.root_depth,
        v.container_suitable, v.difficulty_level, v.difficulty_note,
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
      environment: 'hydro',
      total: rows.length,
      results: rows,
    });

  } catch (err) {
    console.error('Hydro route error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
