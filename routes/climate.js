const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// GET /api/climate?lat=31.44&lng=-110.18&county=04003
//
// county param is optional but strongly recommended.
// If provided, climate data is served from county_climate cache (fast, no rate limits).
// Elevation is always fetched live from GPS coordinates.
// Falls back to Open-Meteo archive API if county not in cache.

router.get('/', async (req, res) => {
  try {
    const { lat, lng, county } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    // Always fetch elevation live -- it is GPS-specific, not county-level
    const elevRes = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`
    );
    const elevData = await elevRes.json();
    const elevationM = elevData?.elevation?.[0] ?? 0;
    const elevationFt = Math.round(elevationM * 3.28084);

    // If county FIPS provided, try cache first
    if (county) {
      const { rows } = await pool.query(
        'SELECT * FROM county_climate WHERE county_fips = $1',
        [county]
      );

      if (rows.length > 0) {
        const c = rows[0];
        return res.json({
          elevationFt,                              // live from GPS
          elevationM: Math.round(elevationM),
          annualPrecipIn: parseFloat(c.annual_precip_in),
          avgTempMinF: parseFloat(c.avg_temp_min_f),
          avgTempMaxF: parseFloat(c.avg_temp_max_f),
          frostFreeDays: c.frost_free_days,
          hardinessZone: c.hardiness_zone,
          climateDescriptor: c.climate_descriptor,
          monsoonMonth: c.monsoon_month,
          source: 'cache',
        });
      }
    }

    // No cache hit -- fall back to Open-Meteo archive API
    console.log(`Cache miss for county ${county || 'unknown'} -- calling Open-Meteo archive`);

    const endDate = '2024-12-31';
    const startDate = '2015-01-01';

    const archiveParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: ['temperature_2m_max','temperature_2m_min','precipitation_sum'].join(','),
      temperature_unit: 'fahrenheit',
      precipitation_unit: 'inch',
      timezone: 'auto',
    });

    const archiveRes = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?${archiveParams}`
    );

    if (!archiveRes.ok) {
      throw new Error(`Open-Meteo archive API error: ${archiveRes.status}`);
    }

    const archiveData = await archiveRes.json();
    const daily = archiveData?.daily;

    if (!daily || !daily.time) {
      return res.json({
        elevationFt,
        elevationM: Math.round(elevationM),
        error: 'Climate data unavailable',
        source: 'elevation-only',
      });
    }

    const avg = (arr) => {
      const valid = arr.filter(v => v !== null);
      return valid.reduce((a, b) => a + b, 0) / valid.length;
    };

    const mins = daily.temperature_2m_min.filter(v => v !== null);
    const maxs = daily.temperature_2m_max.filter(v => v !== null);
    const precips = daily.precipitation_sum.filter(v => v !== null);

    const yearCount = 10;
    const frostFreeDays = Math.round(mins.filter(t => t > 32).length / yearCount);
    const annualPrecipIn = Math.round((precips.reduce((a, b) => a + b, 0) / yearCount) * 10) / 10;
    const avgTempMinF = Math.round(avg(mins) * 10) / 10;
    const avgTempMaxF = Math.round(avg(maxs) * 10) / 10;

    res.json({
      elevationFt,
      elevationM: Math.round(elevationM),
      annualPrecipIn,
      avgTempMinF,
      avgTempMaxF,
      frostFreeDays,
      source: 'live',
    });

  } catch (err) {
    console.error('Climate API error:', err);
    res.status(500).json({ error: 'Failed to fetch climate data', detail: err.message });
  }
});

module.exports = router;