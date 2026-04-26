const express = require('express');
const router = express.Router();

// GET /api/climate?lat=31.44&lng=-110.18
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'lat and lng must be valid numbers' });
    }

    // Step 1: Elevation from Open-Meteo
    const elevRes = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`
    );
    const elevData = await elevRes.json();
    const elevationM = elevData?.elevation?.[0] ?? 0;
    const elevationFt = Math.round(elevationM * 3.28084);

    // Step 2: Historical weather — use archive API with ERA5
    // Pull last 10 years of daily data to compute climate normals
    const endDate = '2024-12-31';
    const startDate = '2015-01-01';

    const archiveParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      start_date: startDate,
      end_date: endDate,
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'wind_speed_10m_max',
      ].join(','),
      timezone: 'America/Phoenix',
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
        error: 'Climate data unavailable — elevation only',
      });
    }

    const cToF = (c) => Math.round(((c * 9) / 5 + 32) * 10) / 10;
    const avg = (arr) => arr.filter(v => v !== null).reduce((a, b) => a + b, 0) / arr.filter(v => v !== null).length;

    // Group by month (0-11)
    const monthlyMinC = Array(12).fill(null).map(() => []);
    const monthlyMaxC = Array(12).fill(null).map(() => []);
    const monthlyPrecipMm = Array(12).fill(null).map(() => []);

    daily.time.forEach((date, i) => {
      const month = new Date(date).getMonth();
      if (daily.temperature_2m_min[i] !== null) monthlyMinC[month].push(daily.temperature_2m_min[i]);
      if (daily.temperature_2m_max[i] !== null) monthlyMaxC[month].push(daily.temperature_2m_max[i]);
      if (daily.precipitation_sum[i] !== null) monthlyPrecipMm[month].push(daily.precipitation_sum[i]);
    });

    const monthlyAvgMinC = monthlyMinC.map(avg);
    const monthlyAvgMaxC = monthlyMaxC.map(avg);
    const monthlyAvgPrecipMm = monthlyPrecipMm.map(vals => vals.reduce((a, b) => a + b, 0) / (vals.length / 30));

    const overallMinC = avg(monthlyAvgMinC.filter(v => !isNaN(v)));
    const overallMaxC = avg(monthlyAvgMaxC.filter(v => !isNaN(v)));
    const annualPrecipMm = monthlyAvgPrecipMm.filter(v => !isNaN(v)).reduce((a, b) => a + b, 0);
    const annualPrecipIn = Math.round((annualPrecipMm / 25.4) * 10) / 10;

    // Frost dates
    const lastFrostMonth = (() => {
      for (let m = 5; m >= 0; m--) {
        if (!isNaN(monthlyAvgMinC[m]) && monthlyAvgMinC[m] <= 0) return m + 2;
      }
      return 1;
    })();

    const firstFrostMonth = (() => {
      for (let m = 6; m < 12; m++) {
        if (!isNaN(monthlyAvgMinC[m]) && monthlyAvgMinC[m] <= 0) return m + 1;
      }
      return 12;
    })();

    const frostFreeMonths = monthlyAvgMinC.filter(t => !isNaN(t) && t > 0).length;
    const frostFreeDays = frostFreeMonths * 30;

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyFormatted = monthNames.map((name, i) => ({
      month: name,
      minF: isNaN(monthlyAvgMinC[i]) ? null : cToF(monthlyAvgMinC[i]),
      maxF: isNaN(monthlyAvgMaxC[i]) ? null : cToF(monthlyAvgMaxC[i]),
      precipIn: isNaN(monthlyAvgPrecipMm[i]) ? null : Math.round((monthlyAvgPrecipMm[i] / 25.4) * 10) / 10,
      hasFrost: !isNaN(monthlyAvgMinC[i]) && monthlyAvgMinC[i] <= 0,
    }));

    res.json({
      elevationFt,
      elevationM: Math.round(elevationM),
      annualPrecipIn,
      avgTempMinF: cToF(overallMinC),
      avgTempMaxF: cToF(overallMaxC),
      frostFreeDays,
      lastFrostMonth,
      firstFrostMonth,
      monthly: monthlyFormatted,
    });

  } catch (err) {
    console.error('Climate API error:', err);
    res.status(500).json({ error: 'Failed to fetch climate data', detail: err.message });
  }
});

module.exports = router;