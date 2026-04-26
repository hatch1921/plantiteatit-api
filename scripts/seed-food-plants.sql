-- PlantItEatIt — Curated Food Plant Characteristics
-- Vegetables, herbs, and edibles with accurate growing data
-- Run after USDA ingestion to populate characteristics for key food plants
-- Sources: USDA PLANTS, university extension services, agronomic databases

-- This UPDATE script matches on usda_symbol and populates characteristics
-- for the most commonly grown food plants in the US

-- ─── TOMATOES ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 60, frost_free_days_max = 85,
  precip_min_in = 18, precip_max_in = 60,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 7000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol IN ('LYCO4','LYES','LYPI3') OR common_name ILIKE '%tomato%';

-- ─── PEPPERS / CHILES ─────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 70, frost_free_days_max = 90,
  precip_min_in = 12, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 7500,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'CAAN%' OR usda_symbol LIKE 'CAAP%' OR usda_symbol LIKE 'CACH%'
   OR common_name ILIKE '%pepper%' OR common_name ILIKE '%chile%' OR common_name ILIKE '%chili%';

-- ─── SQUASH / ZUCCHINI ───────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 50, frost_free_days_max = 65,
  precip_min_in = 16, precip_max_in = 60,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 7000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'CUPE%' OR usda_symbol LIKE 'CUMO%' OR usda_symbol LIKE 'CUMA%'
   OR common_name ILIKE '%squash%' OR common_name ILIKE '%zucchini%' OR common_name ILIKE '%pumpkin%';

-- ─── BEANS ───────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 50, frost_free_days_max = 70,
  precip_min_in = 14, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 7000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'PHVU%' OR usda_symbol LIKE 'PHAC%' OR usda_symbol LIKE 'VIUN%'
   OR common_name ILIKE '%bean%';

-- ─── GARLIC ──────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 10, precip_max_in = 50,
  temp_min_f = 0, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'ALSA%' OR common_name ILIKE '%garlic%';

-- ─── ONIONS ──────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 90, frost_free_days_max = 120,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 20, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'ALCE%' OR common_name ILIKE '%onion%';

-- ─── LETTUCE ─────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intermediate',
  frost_free_days_min = 45, frost_free_days_max = 60,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 25, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring'
WHERE usda_symbol LIKE 'LASA%' OR common_name ILIKE '%lettuce%';

-- ─── CARROTS ─────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 70, frost_free_days_max = 80,
  precip_min_in = 14, precip_max_in = 40,
  temp_min_f = 25, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'DACA%' OR common_name ILIKE '%carrot%';

-- ─── BEETS ───────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 55, frost_free_days_max = 70,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 25, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'BEVU%' OR common_name ILIKE '%beet%';

-- ─── CUCUMBERS ───────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 50, frost_free_days_max = 70,
  precip_min_in = 16, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 6500,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'CUSA%' OR common_name ILIKE '%cucumber%';

-- ─── CORN ────────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Graminoid', duration = 'Annual', growth_habit = 'Graminoid',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 60, frost_free_days_max = 100,
  precip_min_in = 18, precip_max_in = 60,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 7000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'ZEMA%' OR common_name ILIKE '%corn%' OR common_name ILIKE '%maize%';

-- ─── POTATOES ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 70, frost_free_days_max = 120,
  precip_min_in = 15, precip_max_in = 50,
  temp_min_f = 28, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'SOTU%' OR common_name ILIKE '%potato%';

-- ─── BASIL ───────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 60, frost_free_days_max = 90,
  precip_min_in = 14, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 6000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'OCBA%' OR common_name ILIKE '%basil%';

-- ─── ROSEMARY ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Shrub', duration = 'Perennial', growth_habit = 'Shrub',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 8, precip_max_in = 40,
  temp_min_f = 10, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'SAOF%' OR common_name ILIKE '%rosemary%';

-- ─── THYME ───────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 8, precip_max_in = 40,
  temp_min_f = -20, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'THYMUS%' OR usda_symbol LIKE 'THVU%' OR common_name ILIKE '%thyme%';

-- ─── OREGANO ─────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 8, precip_max_in = 40,
  temp_min_f = -10, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'ORVU%' OR common_name ILIKE '%oregano%';

-- ─── MINT ────────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Tolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 14, precip_max_in = 60,
  temp_min_f = -20, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'MENTHA%' OR usda_symbol LIKE 'MESP%' OR usda_symbol LIKE 'MEPI%'
   OR common_name ILIKE '%mint%' OR common_name ILIKE '%spearmint%' OR common_name ILIKE '%peppermint%';

-- ─── SAGE ────────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 8, precip_max_in = 35,
  temp_min_f = -10, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol = 'SAOF2' OR common_name ILIKE '%garden sage%' OR common_name ILIKE '%culinary sage%';

-- ─── SPINACH ─────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intermediate',
  frost_free_days_min = 40, frost_free_days_max = 50,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 20, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring'
WHERE usda_symbol LIKE 'SPOL%' OR common_name ILIKE '%spinach%';

-- ─── KALE ────────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intermediate',
  frost_free_days_min = 55, frost_free_days_max = 75,
  precip_min_in = 14, precip_max_in = 50,
  temp_min_f = 10, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring and Fall'
WHERE usda_symbol LIKE 'BNOL%' OR common_name ILIKE '%kale%';

-- ─── RADISHES ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intermediate',
  frost_free_days_min = 22, frost_free_days_max = 30,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 28, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring and Fall'
WHERE usda_symbol LIKE 'RASA%' OR common_name ILIKE '%radish%';

-- ─── CILANTRO / CORIANDER ────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 45, frost_free_days_max = 55,
  precip_min_in = 10, precip_max_in = 40,
  temp_min_f = 28, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring'
WHERE usda_symbol LIKE 'COSA%' OR common_name ILIKE '%cilantro%' OR common_name ILIKE '%coriander%';

-- ─── CHIVES ──────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Perennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Medium', shade_tolerance = 'Intermediate',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 10, precip_max_in = 40,
  temp_min_f = -30, elevation_min_ft = 0, elevation_max_ft = 9000,
  bloom_period = 'Spring', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'ALSC%' OR common_name ILIKE '%chive%';

-- ─── SUNFLOWERS ──────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 70, frost_free_days_max = 100,
  precip_min_in = 10, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'HEAN%' OR common_name ILIKE '%sunflower%';

-- ─── PEAS ────────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 55, frost_free_days_max = 70,
  precip_min_in = 14, precip_max_in = 45,
  temp_min_f = 25, elevation_min_ft = 0, elevation_max_ft = 8000,
  bloom_period = 'Spring', active_growth_period = 'Spring'
WHERE usda_symbol LIKE 'PISA%' OR common_name ILIKE '% pea%' OR common_name ILIKE 'pea %';

-- ─── WATERMELON ──────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 80, frost_free_days_max = 100,
  precip_min_in = 16, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 6000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'CILA%' OR common_name ILIKE '%watermelon%';

-- ─── CANTALOUPE / MELON ──────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Medium', moisture_use = 'Medium', shade_tolerance = 'Intolerant',
  frost_free_days_min = 80, frost_free_days_max = 90,
  precip_min_in = 16, precip_max_in = 50,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 6000,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'CUME%' OR common_name ILIKE '%cantaloupe%' OR common_name ILIKE '%melon%';

-- ─── EGGPLANT ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 100, frost_free_days_max = 140,
  precip_min_in = 18, precip_max_in = 60,
  temp_min_f = 32, elevation_min_ft = 0, elevation_max_ft = 5500,
  bloom_period = 'Summer', active_growth_period = 'Summer'
WHERE usda_symbol LIKE 'SOME%' OR common_name ILIKE '%eggplant%';

-- ─── BROCCOLI / CAULIFLOWER / CABBAGE ────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Annual', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'High', shade_tolerance = 'Intolerant',
  frost_free_days_min = 80, frost_free_days_max = 100,
  precip_min_in = 16, precip_max_in = 50,
  temp_min_f = 25, elevation_min_ft = 0, elevation_max_ft = 7500,
  bloom_period = 'Spring', active_growth_period = 'Spring and Fall'
WHERE usda_symbol LIKE 'BNOL%' OR common_name ILIKE '%broccoli%'
   OR common_name ILIKE '%cauliflower%' OR common_name ILIKE '%cabbage%';

-- ─── LAVENDER ────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Shrub', duration = 'Perennial', growth_habit = 'Subshrub',
  drought_tolerance = 'High', moisture_use = 'Low', shade_tolerance = 'Intolerant',
  frost_free_days_min = 0, frost_free_days_max = 999,
  precip_min_in = 8, precip_max_in = 35,
  temp_min_f = -10, elevation_min_ft = 0, elevation_max_ft = 8500,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'LAAN%' OR common_name ILIKE '%lavender%';

-- ─── PARSLEY ─────────────────────────────────────────────────────────────────

UPDATE species SET
  category = 'Forb/Herb', duration = 'Biennial', growth_habit = 'Forb/herb',
  drought_tolerance = 'Low', moisture_use = 'Medium', shade_tolerance = 'Intermediate',
  frost_free_days_min = 70, frost_free_days_max = 90,
  precip_min_in = 12, precip_max_in = 40,
  temp_min_f = 20, elevation_min_ft = 0, elevation_max_ft = 7500,
  bloom_period = 'Summer', active_growth_period = 'Spring and Summer'
WHERE usda_symbol LIKE 'PETC%' OR common_name ILIKE '%parsley%';

-- Verify the updates
SELECT common_name, category, duration, drought_tolerance,
       frost_free_days_min, frost_free_days_max,
       elevation_min_ft, elevation_max_ft
FROM species
WHERE common_name ILIKE '%tomato%'
   OR common_name ILIKE '%pepper%'
   OR common_name ILIKE '%squash%'
   OR common_name ILIKE '%garlic%'
   OR common_name ILIKE '%rosemary%'
LIMIT 20;
