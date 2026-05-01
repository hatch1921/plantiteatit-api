const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

/**
 * GET /api/microgreens
 *
 * Returns all microgreens varieties.
 * No climate or county filtering -- microgreens grow anywhere indoors.
 *
 * Query params:
 * - difficulty: beginner|intermediate|advanced
 */
router.get('/', async (req, res) => {
  try {
    const { difficulty } = req.query;
    let conditions = [];
    const params = [];

    if (difficulty) {
      params.push(difficulty);
      conditions.push(`difficulty_level = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(`
      SELECT * FROM microgreens
      ${where}
      ORDER BY
        CASE difficulty_level
          WHEN 'beginner' THEN 1
          WHEN 'intermediate' THEN 2
          WHEN 'advanced' THEN 3
          ELSE 4
        END,
        days_to_harvest_min ASC
    `, params);

    res.json({
      environment: 'microgreens',
      total: rows.length,
      results: rows,
    });

  } catch (err) {
    console.error('Microgreens route error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

module.exports = router;
