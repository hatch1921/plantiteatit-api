const express = require('express');
const router = express.Router();

// GET /api/climate?lat=32.22&lng=-110.97
// Fetches elevation and climate normals from Open-Meteo
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

    // Fetch elevation
    const elevRes = await fetch(
      `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`
    );
    const elevData = await elevRes.json();
    const elevationM = elevData?.elevation?.[0] ?? 0;
    const elevationFt = Math.round(elevationM * 3.28084);

    // Fetch climate normals (ERA5 reanalysis — 30-year historical averages)
    const climateParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      monthly: [
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'relative_humidity_2m_mean',
        'wind_speed_10m_mean',
        'shortwave_radiation_sum',
      ].join(','),
      models: 'ERA5',
      start_date: '1991-01-01',
      end_date: '2020-12-31',
    });

    const climateRes = await fetch(
      `https://climate-api.open-meteo.com/v1/climate?${climateParams}`
    );
    const climateData = await climateRes.json();
    const monthly = climateData?.monthly;

    if (!monthly) {
      // Return at least elevation if climate API fails
      return res.json({
        elevationFt,
        elevationM: Math.round(elevationM),
        error: 'Climate data unavailable — elevation only',
      });
    }

    const monthlyMinC = monthly.temperature_2m_min ?? [];
    const monthlyMaxC = monthly.temperature_2m_max ?? [];
    const monthlyPrecip = monthly.precipitation_sum ?? [];
    const monthlyHumidity = monthly.relative_humidity_2m_mean ?? [];

    // Helper: Celsius to Fahrenheit
    const cToF = (c) => Math.round(((c * 9) / 5 + 32) * 10) / 10;

    // Annual precipitation
    const annualPrecipMm = monthlyPrecip.reduce((a, b) => a + b, 0);
    const annualPrecipIn = Math.round((annualPrecipMm / 25.4) * 10) / 10;

    // Average min and max temps
    const avgMinC = monthlyMinC.reduce((a, b) => a + b, 0) / 12;
    const avgMaxC = monthlyMaxC.reduce((a, b) => a + b, 0) / 12;
    const avgHumidity = Math.round(monthlyHumidity.reduce((a, b) => a + b, 0) / 12);

    // Frost dates — find last spring frost and first fall frost
    const lastFrostMonth = (() => {
      for (let m = 5; m >= 0; m--) {
        if (monthlyMinC[m] <= 0) return m + 2; // 1-indexed, next month is safe
      }
      return 1;
    })();

    const firstFrostMonth = (() => {
      for (let m = 6; m < 12; m++) {
        if (monthlyMinC[m] <= 0) return m + 1; // 1-indexed
      }
      return 12;
    })();

    // Frost-free days estimate
    const frostFreeMonths = monthlyMinC.filter(t => t > 0).length;
    const frostFreeDays = frostFreeMonths * 30;

    // Monthly data formatted for client
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyFormatted = monthNames.map((name, i) => ({
      month: name,
      minF: cToF(monthlyMinC[i] ?? 0),
      maxF: cToF(monthlyMaxC[i] ?? 0),
      precipIn: Math.round((monthlyPrecip[i] ?? 0) / 25.4 * 10) / 10,
      humidityPct: Math.round(monthlyHumidity[i] ?? 0),
      hasFrost: (monthlyMinC[i] ?? 0) <= 0,
    }));

    res.json({
      elevationFt,
      elevationM: Math.round(elevationM),
      annualPrecipIn,
      avgTempMinF: cToF(avgMinC),
      avgTempMaxF: cToF(avgMaxC),
      humidityAvgPct: avgHumidity,
      frostFreeDays,
      lastFrostMonth,
      firstFrostMonth,
      monthly: monthlyFormatted,
    });

  } catch (err) {
    console.error('Climate API error:', err);
    res.status(500).json({ error: 'Failed to fetch climate data' });
  }
});

module.exports = router;
