/**
 * PlantItEatIt — Planting Calendar Seeder
 *
 * Seeds days_to_maturity, spacing, and planting window data
 * for the top 30 food plants. Data sourced from:
 * - University extension services (AZ, NM, TX, CA)
 * - USDA agronomic databases
 * - Burpee, Johnny's Seeds, Baker Creek growing guides
 *
 * Usage: node scripts/seed-planting-calendar.js
 */

require('dotenv').config();
const pool = require('../db/pool');

// Planting data keyed by USDA symbol
// weeks_to_last_frost: negative = before last frost, positive = after
// direct_sow: true if can direct sow outdoors
// start_indoors: true if should start indoors first
// For Zone 8a/8b (Hereford AZ area):
//   Last frost: ~Jan 15 (essentially none most years)
//   First frost: ~Dec 15
//   Frost-free: 360 days

const PLANT_DATA = [

  // ── TOMATOES ──────────────────────────────────────────────────────────────
  {
    symbols: ['LYCO4', 'LYES', 'LYPI3'],
    commonNames: ['%tomato%'],
    data: {
      days_to_maturity_min: 60,
      days_to_maturity_max: 85,
      spacing_inches: 24,
      row_spacing_inches: 48,
      mature_height_inches: 48,
      yield_per_plant: '10-15 lbs per season',
      succession_planting: true,
      succession_interval_days: 21,
      start_indoors: true,
      weeks_before_last_frost: -6,
      direct_sow: false,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 6.8,
      needs_amended_soil: true,
      soil_notes: 'Rich, well-draining soil. Add compost before planting. Mulch heavily in high desert.',
      deer_risk: 'Low',
      rabbit_risk: 'Medium',
      javelina_risk: 'High',
      squirrel_risk: 'Medium',
      bird_risk: 'Low',
      wildlife_notes: 'Javelina will eat entire plants. Hardware cloth cage or strong fencing required in southern Arizona.',
      typically_sold_as: 'starts',
      lowes_search_term: 'tomato plant starts',
      seed_search_term: 'tomato seeds',
    }
  },

  // ── PEPPERS / CHILES ──────────────────────────────────────────────────────
  {
    symbols: ['CAAN4', 'CAPSI', 'CACH30'],
    commonNames: ['%pepper%', '%chile%', '%chili%'],
    data: {
      days_to_maturity_min: 70,
      days_to_maturity_max: 90,
      spacing_inches: 18,
      row_spacing_inches: 36,
      mature_height_inches: 24,
      yield_per_plant: '25-50 peppers per season',
      succession_planting: false,
      start_indoors: true,
      weeks_before_last_frost: -8,
      direct_sow: false,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 6.8,
      needs_amended_soil: true,
      soil_notes: 'Well-draining, warm soil. Peppers love heat — ideal for high desert summers.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Medium',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Capsaicin deters most wildlife. Javelina occasionally root near plants.',
      typically_sold_as: 'both',
      lowes_search_term: 'pepper plant starts',
      seed_search_term: 'pepper seeds',
    }
  },

  // ── SQUASH / ZUCCHINI ─────────────────────────────────────────────────────
  {
    symbols: ['CUMOT', 'CUMA3', 'CUPE', 'CUMI3', 'CUPE3'],
    commonNames: ['%squash%', '%zucchini%', '%pumpkin%'],
    data: {
      days_to_maturity_min: 50,
      days_to_maturity_max: 110,
      spacing_inches: 36,
      row_spacing_inches: 60,
      mature_height_inches: 18,
      yield_per_plant: '8-12 fruits per season',
      succession_planting: true,
      succession_interval_days: 30,
      start_indoors: false,
      weeks_before_last_frost: 2,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: true,
      soil_notes: 'Heavy feeders. Add compost and balanced fertilizer. Needs consistent moisture.',
      deer_risk: 'Medium',
      rabbit_risk: 'Medium',
      javelina_risk: 'High',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Javelina love squash. Fencing required in southern AZ. Squash vine borer active June-August.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'squash seeds',
      seed_search_term: 'squash seeds',
    }
  },

  // ── BEANS ─────────────────────────────────────────────────────────────────
  {
    symbols: ['CAEN4', 'CANAV'],
    commonNames: ['%bean%'],
    data: {
      days_to_maturity_min: 50,
      days_to_maturity_max: 70,
      spacing_inches: 4,
      row_spacing_inches: 24,
      mature_height_inches: 18,
      yield_per_plant: '0.5-1 lb per plant',
      succession_planting: true,
      succession_interval_days: 14,
      start_indoors: false,
      weeks_before_last_frost: 2,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: false,
      soil_notes: 'Fix nitrogen — do not over-fertilize. Well-draining soil.',
      deer_risk: 'High',
      rabbit_risk: 'High',
      javelina_risk: 'Medium',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Deer and rabbits love bean plants. Fencing strongly recommended.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'bean seeds',
      seed_search_term: 'bean seeds',
    }
  },

  // ── GARLIC ────────────────────────────────────────────────────────────────
  {
    symbols: ['ALSA4', 'ALSA'],
    commonNames: ['%garlic%'],
    data: {
      days_to_maturity_min: 180,
      days_to_maturity_max: 240,
      spacing_inches: 6,
      row_spacing_inches: 12,
      mature_height_inches: 24,
      yield_per_plant: '1 bulb per clove planted',
      succession_planting: false,
      start_indoors: false,
      weeks_before_last_frost: -8,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: true,
      soil_notes: 'Plant cloves in fall (Oct-Nov in Zone 8), harvest following summer. Loose, well-draining soil.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Garlic repels most wildlife. Excellent companion plant.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'garlic bulbs',
      seed_search_term: 'garlic seed cloves',
    }
  },

  // ── ONIONS ────────────────────────────────────────────────────────────────
  {
    symbols: ['ALLIU', 'ALCE2', 'ALGE', 'ALGO', 'ALBI', 'ALNE'],
    commonNames: ['%onion%'],
    data: {
      days_to_maturity_min: 90,
      days_to_maturity_max: 120,
      spacing_inches: 4,
      row_spacing_inches: 12,
      mature_height_inches: 18,
      yield_per_plant: '1 bulb per plant',
      succession_planting: false,
      start_indoors: true,
      weeks_before_last_frost: -10,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: true,
      soil_notes: 'Loose, well-draining soil. In Zone 8 plant transplants in Jan-Feb for summer harvest.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Allium odor deters most wildlife.',
      typically_sold_as: 'both',
      lowes_search_term: 'onion sets',
      seed_search_term: 'onion seeds',
    }
  },

  // ── LETTUCE ───────────────────────────────────────────────────────────────
  {
    symbols: ['LASA2', 'LASA'],
    commonNames: ['%lettuce%'],
    data: {
      days_to_maturity_min: 45,
      days_to_maturity_max: 60,
      spacing_inches: 8,
      row_spacing_inches: 12,
      mature_height_inches: 10,
      yield_per_plant: '0.5-1 lb per plant',
      succession_planting: true,
      succession_interval_days: 14,
      start_indoors: false,
      weeks_before_last_frost: -4,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: false,
      soil_notes: 'Cool season crop. In Zone 8 plant Feb-Apr and Sep-Nov. Bolts in summer heat.',
      deer_risk: 'High',
      rabbit_risk: 'High',
      javelina_risk: 'Medium',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Rabbits will decimate lettuce overnight. Wire fencing buried 6 inches is essential.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'lettuce seeds',
      seed_search_term: 'lettuce seeds',
    }
  },

  // ── CARROTS ───────────────────────────────────────────────────────────────
  {
    symbols: ['DACA6', 'DAPU3'],
    commonNames: ['%carrot%'],
    data: {
      days_to_maturity_min: 70,
      days_to_maturity_max: 80,
      spacing_inches: 3,
      row_spacing_inches: 12,
      mature_height_inches: 14,
      yield_per_plant: '1 carrot per plant',
      succession_planting: true,
      succession_interval_days: 21,
      start_indoors: false,
      weeks_before_last_frost: -4,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 6.8,
      needs_amended_soil: true,
      soil_notes: 'Deep, loose, rock-free soil essential. Sandy loam ideal. High desert clay needs heavy amendment.',
      deer_risk: 'Medium',
      rabbit_risk: 'High',
      javelina_risk: 'Low',
      squirrel_risk: 'Medium',
      bird_risk: 'Low',
      wildlife_notes: 'Rabbits will dig for carrot roots. Raised beds with wire mesh bottom recommended.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'carrot seeds',
      seed_search_term: 'carrot seeds',
    }
  },

  // ── CUCUMBERS ─────────────────────────────────────────────────────────────
  {
    symbols: ['CUSA3', 'CUSAS'],
    commonNames: ['%cucumber%'],
    data: {
      days_to_maturity_min: 50,
      days_to_maturity_max: 70,
      spacing_inches: 12,
      row_spacing_inches: 48,
      mature_height_inches: 12,
      yield_per_plant: '10-20 cucumbers per season',
      succession_planting: true,
      succession_interval_days: 21,
      start_indoors: false,
      weeks_before_last_frost: 2,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: true,
      soil_notes: 'Warm soil required. Trellis to save space and improve air circulation.',
      deer_risk: 'Medium',
      rabbit_risk: 'Medium',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Moderate wildlife pressure. Trellising helps deter ground-level browsers.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'cucumber seeds',
      seed_search_term: 'cucumber seeds',
    }
  },

  // ── BASIL ─────────────────────────────────────────────────────────────────
  {
    symbols: ['OCBA', 'OCBA2'],
    commonNames: ['%basil%'],
    data: {
      days_to_maturity_min: 60,
      days_to_maturity_max: 90,
      spacing_inches: 12,
      row_spacing_inches: 18,
      mature_height_inches: 18,
      yield_per_plant: 'Continuous harvest for 3-4 months',
      succession_planting: true,
      succession_interval_days: 30,
      start_indoors: true,
      weeks_before_last_frost: -4,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: false,
      soil_notes: 'Well-draining soil. Pinch flowers to extend harvest. Heat-loving — thrives in AZ summer.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Strong scent deters most pests. Excellent companion plant near tomatoes.',
      typically_sold_as: 'both',
      lowes_search_term: 'basil plant',
      seed_search_term: 'basil seeds',
    }
  },

  // ── ROSEMARY ──────────────────────────────────────────────────────────────
  {
    symbols: ['SAOF', 'SAOF2'],
    commonNames: ['%rosemary%'],
    data: {
      days_to_maturity_min: 365,
      days_to_maturity_max: 365,
      spacing_inches: 24,
      row_spacing_inches: 36,
      mature_height_inches: 36,
      yield_per_plant: 'Perennial — harvest year-round',
      succession_planting: false,
      start_indoors: false,
      weeks_before_last_frost: 0,
      direct_sow: false,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 8.0,
      needs_amended_soil: false,
      soil_notes: 'Thrives in poor, alkaline, well-draining soil. Perfect for high desert. Drought tolerant once established.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Strong scent deters all wildlife. Excellent border plant.',
      typically_sold_as: 'starts',
      lowes_search_term: 'rosemary plant',
      seed_search_term: 'rosemary seeds',
    }
  },

  // ── CILANTRO / CORIANDER ──────────────────────────────────────────────────
  {
    symbols: ['COSA', 'CORIA'],
    commonNames: ['%cilantro%', '%coriander%'],
    data: {
      days_to_maturity_min: 45,
      days_to_maturity_max: 55,
      spacing_inches: 6,
      row_spacing_inches: 12,
      mature_height_inches: 18,
      yield_per_plant: '0.25 oz fresh per harvest',
      succession_planting: true,
      succession_interval_days: 14,
      start_indoors: false,
      weeks_before_last_frost: -2,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.2,
      soil_ph_max: 6.8,
      needs_amended_soil: false,
      soil_notes: 'Cool season. Bolts quickly in heat — plant in fall/winter in Zone 8. Successive plantings every 2 weeks.',
      deer_risk: 'Low',
      rabbit_risk: 'Low',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Aromatic herbs generally pest-resistant.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'cilantro seeds',
      seed_search_term: 'cilantro seeds',
    }
  },

  // ── SUNFLOWERS ────────────────────────────────────────────────────────────
  {
    symbols: ['HEAR3', 'HEAR8', 'HEANA'],
    commonNames: ['%sunflower%'],
    data: {
      days_to_maturity_min: 70,
      days_to_maturity_max: 100,
      spacing_inches: 24,
      row_spacing_inches: 24,
      mature_height_inches: 72,
      yield_per_plant: '1 head, 200-800 seeds',
      succession_planting: true,
      succession_interval_days: 14,
      start_indoors: false,
      weeks_before_last_frost: 2,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.5,
      needs_amended_soil: false,
      soil_notes: 'Tolerates poor soil. Deep taproot — excellent for high desert water access.',
      deer_risk: 'High',
      rabbit_risk: 'Medium',
      javelina_risk: 'High',
      squirrel_risk: 'High',
      bird_risk: 'High',
      wildlife_notes: 'Seeds attract birds and squirrels. Javelina will eat young plants. Cover heads with netting as seeds mature.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'sunflower seeds',
      seed_search_term: 'sunflower seeds',
    }
  },

  // ── WATERMELON ────────────────────────────────────────────────────────────
  {
    symbols: ['CILA2', 'CIVU'],
    commonNames: ['%watermelon%'],
    data: {
      days_to_maturity_min: 80,
      days_to_maturity_max: 100,
      spacing_inches: 36,
      row_spacing_inches: 84,
      mature_height_inches: 12,
      yield_per_plant: '2-4 melons per vine',
      succession_planting: false,
      start_indoors: true,
      weeks_before_last_frost: -3,
      direct_sow: true,
      frost_hardy: false,
      soil_ph_min: 6.0,
      soil_ph_max: 7.0,
      needs_amended_soil: true,
      soil_notes: 'Long hot season required — ideal for high desert. Sandy loam preferred. Deep watering.',
      deer_risk: 'High',
      rabbit_risk: 'Medium',
      javelina_risk: 'High',
      squirrel_risk: 'Medium',
      bird_risk: 'Low',
      wildlife_notes: 'Javelina and deer will eat melons. Fencing required.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'watermelon seeds',
      seed_search_term: 'watermelon seeds',
    }
  },

  // ── SPINACH ───────────────────────────────────────────────────────────────
  {
    symbols: ['SPOL', 'SPOL2'],
    commonNames: ['%spinach%'],
    data: {
      days_to_maturity_min: 40,
      days_to_maturity_max: 50,
      spacing_inches: 4,
      row_spacing_inches: 12,
      mature_height_inches: 8,
      yield_per_plant: '0.25-0.5 lb per plant',
      succession_planting: true,
      succession_interval_days: 14,
      start_indoors: false,
      weeks_before_last_frost: -6,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.5,
      soil_ph_max: 7.0,
      needs_amended_soil: false,
      soil_notes: 'Cool season only. In Zone 8 plant Sep-Feb. Bolts quickly when temps exceed 75°F.',
      deer_risk: 'High',
      rabbit_risk: 'High',
      javelina_risk: 'Low',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'High deer and rabbit pressure. Low fencing required.',
      typically_sold_as: 'seeds',
      lowes_search_term: 'spinach seeds',
      seed_search_term: 'spinach seeds',
    }
  },

  // ── KALE ──────────────────────────────────────────────────────────────────
  {
    symbols: ['BNOL', 'BNOLA'],
    commonNames: ['%kale%'],
    data: {
      days_to_maturity_min: 55,
      days_to_maturity_max: 75,
      spacing_inches: 18,
      row_spacing_inches: 24,
      mature_height_inches: 24,
      yield_per_plant: 'Continuous harvest for months',
      succession_planting: false,
      start_indoors: true,
      weeks_before_last_frost: -6,
      direct_sow: true,
      frost_hardy: true,
      soil_ph_min: 6.0,
      soil_ph_max: 7.5,
      needs_amended_soil: true,
      soil_notes: 'Heavy feeder. Rich soil with compost. In Zone 8 plant Sep-Nov and Jan-Mar.',
      deer_risk: 'High',
      rabbit_risk: 'High',
      javelina_risk: 'Medium',
      squirrel_risk: 'Low',
      bird_risk: 'Low',
      wildlife_notes: 'Deer love kale. Fencing essential.',
      typically_sold_as: 'both',
      lowes_search_term: 'kale plant',
      seed_search_term: 'kale seeds',
    }
  },

];

async function seedVeggieData(symbol, data) {
  // Get species id
  const res = await pool.query(
    'SELECT id FROM species WHERE usda_symbol = $1', [symbol]
  );
  if (!res.rows.length) return 0;

  const speciesId = res.rows[0].id;

  await pool.query(`
    INSERT INTO species_veggies (
      species_id,
      days_to_maturity_min, days_to_maturity_max,
      spacing_inches, row_spacing_inches,
      mature_height_inches, spread_inches,
      yield_per_plant,
      succession_planting, succession_interval_days,
      start_indoors, weeks_before_last_frost,
      direct_sow, frost_hardy,
      soil_ph_min, soil_ph_max,
      needs_amended_soil, soil_notes,
      deer_risk, rabbit_risk, javelina_risk,
      squirrel_risk, bird_risk, wildlife_notes,
      typically_sold_as,
      lowes_search_term, seed_search_term
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27
    )
    ON CONFLICT (species_id) DO UPDATE SET
      days_to_maturity_min     = EXCLUDED.days_to_maturity_min,
      days_to_maturity_max     = EXCLUDED.days_to_maturity_max,
      spacing_inches           = EXCLUDED.spacing_inches,
      row_spacing_inches       = EXCLUDED.row_spacing_inches,
      mature_height_inches     = EXCLUDED.mature_height_inches,
      yield_per_plant          = EXCLUDED.yield_per_plant,
      succession_planting      = EXCLUDED.succession_planting,
      succession_interval_days = EXCLUDED.succession_interval_days,
      start_indoors            = EXCLUDED.start_indoors,
      weeks_before_last_frost  = EXCLUDED.weeks_before_last_frost,
      direct_sow               = EXCLUDED.direct_sow,
      frost_hardy              = EXCLUDED.frost_hardy,
      soil_ph_min              = EXCLUDED.soil_ph_min,
      soil_ph_max              = EXCLUDED.soil_ph_max,
      needs_amended_soil       = EXCLUDED.needs_amended_soil,
      soil_notes               = EXCLUDED.soil_notes,
      deer_risk                = EXCLUDED.deer_risk,
      rabbit_risk              = EXCLUDED.rabbit_risk,
      javelina_risk            = EXCLUDED.javelina_risk,
      squirrel_risk            = EXCLUDED.squirrel_risk,
      bird_risk                = EXCLUDED.bird_risk,
      wildlife_notes           = EXCLUDED.wildlife_notes,
      typically_sold_as        = EXCLUDED.typically_sold_as,
      lowes_search_term        = EXCLUDED.lowes_search_term,
      seed_search_term         = EXCLUDED.seed_search_term
  `, [
    speciesId,
    data.days_to_maturity_min, data.days_to_maturity_max,
    data.spacing_inches, data.row_spacing_inches,
    data.mature_height_inches, data.spacing_inches,
    data.yield_per_plant,
    data.succession_planting, data.succession_interval_days || null,
    data.start_indoors, data.weeks_before_last_frost,
    data.direct_sow, data.frost_hardy,
    data.soil_ph_min, data.soil_ph_max,
    data.needs_amended_soil, data.soil_notes,
    data.deer_risk, data.rabbit_risk, data.javelina_risk,
    data.squirrel_risk, data.bird_risk, data.wildlife_notes,
    data.typically_sold_as,
    data.lowes_search_term, data.seed_search_term,
  ]);

  return 1;
}

async function main() {
  console.log('PlantItEatIt — Planting Calendar Seeder');
  console.log('========================================');

  let totalSeeded = 0;
  let notFound = 0;

  for (const plant of PLANT_DATA) {
    // Seed by explicit symbols
    for (const symbol of plant.symbols) {
      const count = await seedVeggieData(symbol, plant.data);
      if (count > 0) {
        totalSeeded++;
      } else {
        notFound++;
      }
    }

    // Also seed by common name pattern
    for (const pattern of plant.commonNames) {
      const { rows } = await pool.query(
        'SELECT usda_symbol FROM species WHERE common_name ILIKE $1',
        [pattern]
      );
      for (const row of rows) {
        const count = await seedVeggieData(row.usda_symbol, plant.data);
        if (count > 0) totalSeeded++;
      }
    }
  }

  console.log(`\n✓ Done`);
  console.log(`  Species seeded: ${totalSeeded}`);
  console.log(`  Symbols not found: ${notFound}`);

  // Verify
  const { rows } = await pool.query(`
    SELECT s.common_name, v.days_to_maturity_min, v.spacing_inches,
           v.deer_risk, v.javelina_risk, v.start_indoors
    FROM species_veggies v
    JOIN species s ON s.id = v.species_id
    WHERE v.days_to_maturity_min IS NOT NULL
    LIMIT 10
  `);

  console.log('\nSample seeded data:');
  rows.forEach(r => {
    console.log(`  ${r.common_name}: ${r.days_to_maturity_min}d, ${r.spacing_inches}" spacing, deer=${r.deer_risk}, javelina=${r.javelina_risk}, start_indoors=${r.start_indoors}`);
  });

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
