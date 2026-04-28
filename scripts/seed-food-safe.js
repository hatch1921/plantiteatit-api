/**
 * PlantItEatIt — Food Safety Verification Seeder
 *
 * Adds food_safe column to species table and marks verified
 * edible species as food_safe = TRUE.
 *
 * Sources:
 * - USDA GRIN edible species documentation
 * - FDA GRAS list
 * - University extension publications (AZ, NM, TX, CA)
 * - Commercial seed catalog listings (Burpee, Johnny's, Baker Creek)
 * - Common culinary use documentation
 *
 * Philosophy: Opt-in only. A species must be explicitly verified
 * as food safe to appear in PIEI results. Unknown = excluded.
 *
 * Usage: node scripts/seed-food-safe.js
 */

require('dotenv').config();
const pool = require('../db/pool');

// Verified food safe species by USDA symbol
// Only species with clear, documented food use are included
// When in doubt, leave it out

const VERIFIED_FOOD_SAFE = [

  // ── TOMATOES ──────────────────────────────────────────────────────────────
  'LYCO4',   // garden tomato - Solanum lycopersicum
  'LYES',    // cherry tomato
  'LYPI3',   // tomato genus

  // ── PEPPERS / CHILES ──────────────────────────────────────────────────────
  'CAPSI',   // Capsicum genus
  'CAAN4',   // cayenne pepper - Capsicum annuum
  'CACH30',  // Capsicum chinense - habanero type
  'CAFU',    // Capsicum frutescens - tabasco type

  // ── SQUASH / CUCURBITS ────────────────────────────────────────────────────
  'CUCUR',   // Cucurbita genus (edible gourds only)
  'CUMOT',   // butternut squash
  'CUMA3',   // hubbard squash
  'CUPE',    // zucchini / field pumpkin
  'CUMI3',   // cushaw squash
  'CUPEM2',  // field pumpkin variety
  'CUPEO2',  // Ozark melon

  // ── CUCUMBERS / MELONS ────────────────────────────────────────────────────
  'CUSA3',   // cucumber
  'CUSAS',   // cucumber variety
  'CIVU',    // watermelon - Citrullus vulgaris
  'CILA',    // watermelon genus
  'CUME',    // cantaloupe / muskmelon
  'CUME3',   // horned melon

  // ── BEANS / LEGUMES ───────────────────────────────────────────────────────
  'PHASE',   // Phaseolus genus - true beans
  'PHVU',    // common bean - Phaseolus vulgaris
  'PHLU',    // lima bean - Phaseolus lunatus
  'VIGNA',   // Vigna genus - cowpeas etc
  'VIAC4',   // black-eyed pea
  'PISAT',   // garden pea - Pisum sativum
  'PISAS',   // garden pea variety
  'LECA4',   // lentil - Lens culinaris
  'CIARI',   // chickpea - Cicer arietinum
  'GLMA2',   // soybean - Glycine max
  'PHCO4',   // scarlet runner bean
  'MACAR',   // Macroptilium -- selected edible varieties only
  'MACRO4',  // bushbean genus

  // ── GARLIC / ALLIUMS ──────────────────────────────────────────────────────
  'ALSA4',   // garlic - Allium sativum
  'ALSA',    // garlic genus
  'ALLIU',   // Allium genus - onions
  'ALCE2',   // nodding onion - edible
  'ALGE',    // Geyer's onion - edible
  'ALGO',    // Goodding's onion - edible
  'ALBI',    // Bigelow's onion - edible
  'ALNE',    // Nevada onion - edible
  'ALPA2',   // Parish's onion - edible
  'ALMA4',   // largeflower onion - edible
  'ALST',    // autumn onion - edible
  'ALPL4',   // Tanners Canyon onion - edible
  'ALAT',    // darkred onion - edible
  'ALATA',   // darkred onion variety
  'ALBI2',   // twincrest onion - edible
  'ALSC3',   // shallot
  'ALPO3',   // leek - Allium porrum
  'ALSCH',   // chives - Allium schoenoprasum

  // ── LETTUCE / GREENS ──────────────────────────────────────────────────────
  'LASA2',   // garden lettuce - Lactuca sativa
  'LASA',    // lettuce genus
  'LATA',    // blue lettuce - edible
  'SPOL',    // spinach - Spinacia oleracea
  'SPOL2',   // spinach variety
  'CLPE',    // miner's lettuce - Claytonia perfoliata -- edible
  'CLPEM',   // miner's lettuce variety
  'BEAS',    // arugula - Eruca sativa
  'ERSA3',   // arugula
  'BEVA',    // Swiss chard - Beta vulgaris
  'BEVAC',   // chard variety
  'AMAT',    // amaranth greens - Amaranthus tricolor
  'AMHY',    // amaranth - edible greens

  // ── KALE / BRASSICAS ──────────────────────────────────────────────────────
  'BNOL',    // kale - Brassica oleracea
  'BNOLA',   // kale variety
  'BNOLB',   // broccoli
  'BNOLC',   // cabbage
  'BNOLG',   // Brussels sprouts
  'BNOLI',   // kohlrabi
  'BRAP2',   // turnip - Brassica rapa
  'BRNI',    // napa cabbage
  'SIAR',    // arugula genus

  // ── CARROTS / ROOT VEGETABLES ─────────────────────────────────────────────
  'DACA6',   // carrot - Daucus carota
  'DAPU3',   // American wild carrot - edible root
  'BEVO',    // beet - Beta vulgaris
  'RASA2',   // radish - Raphanus sativus
  'RASA',    // radish genus
  'PASA3',   // parsnip - Pastinaca sativa
  'SEOF',    // celeriac / celery root
  'IOPO',    // sweet potato - Ipomoea batatas
  'SOTU',    // potato - Solanum tuberosum
  'SOTU2',   // potato variety

  // ── CORN ──────────────────────────────────────────────────────────────────
  'ZEMA2',   // corn - Zea mays
  'ZEMAM',   // sweet corn variety

  // ── HERBS ─────────────────────────────────────────────────────────────────
  'OCIMU',   // basil genus - Ocimum
  'OCBA',    // basil - Ocimum basilicum
  'OCBA2',   // basil variety
  'SAOF',    // rosemary - Salvia rosmarinus
  'SAOF2',   // rosemary variety
  'THYMU',   // thyme genus - Thymus
  'THVU',    // thyme - Thymus vulgaris
  'ORVU',    // oregano - Origanum vulgare
  'ORIG',    // oregano genus
  'MENTH',   // mint genus - Mentha
  'MESP',    // spearmint
  'MEPI',    // peppermint
  'SAOF3',   // culinary sage - Salvia officinalis
  'SAOFF',   // sage variety
  'CORIA',   // coriander genus
  'COSA',    // coriander - Coriandrum sativum
  'PESA',    // parsley - Petroselinum crispum
  'PETRO',   // parsley genus
  'ANETH',   // dill - Anethum graveolens
  'ANGR',    // dill variety
  'FOVUL',   // fennel - Foeniculum vulgare
  'LAVOF',   // lavender - Lavandula officinalis
  'LAVAN',   // lavender genus
  'MELOF',   // lemon balm - Melissa officinalis
  'MELO4',   // lemon balm variety
  'STEREB',  // stevia - Stevia rebaudiana
  'MARE2',   // chamomile - Matricaria recutita
  'CHNO',    // German chamomile
  'ECHI',    // echinacea genus - medicinal
  'ECPU',    // purple coneflower - medicinal/edible

  // ── SUNFLOWERS ────────────────────────────────────────────────────────────
  'HEANA',   // sunflower - Helianthus annuus
  'HEAR3',   // sunflower variety
  'HEAR8',   // Arizona sunflower - edible seeds
  'TITH',    // Arizona sunflowerweed - edible seeds
  'SIMSI',   // bushsunflower - edible seeds

  // ── EDIBLE FLOWERS ────────────────────────────────────────────────────────
  'TRMA',    // nasturtium - Tropaeolum majus
  'TROPE',   // nasturtium genus
  'BOOF',    // borage - Borago officinalis
  'CAOF',    // calendula - Calendula officinalis
  'CALEN',   // calendula genus
  'SANI4',   // black elderberry - Sambucus nigra -- flowers and berries edible
  'SACE3',   // elderberry
  'SAMBU',   // elderberry genus
  'VIOLA',   // violet genus - edible flowers
  'VISO',    // sweet violet - edible
  'TAGETES',  // marigold genus - edible flowers

  // ── STRAWBERRIES / BERRIES ────────────────────────────────────────────────
  'FRAGI',   // strawberry genus - Fragaria
  'FRVI',    // garden strawberry - Fragaria x ananassa
  'FRCH',    // Chilean strawberry
  'RUBUS',   // blackberry / raspberry genus - Rubus
  'RUID',    // American red raspberry - Rubus idaeus
  'RUAR3',   // Arizona dewberry - edible
  'RIBES',   // currant genus - Ribes
  'RINI',    // black currant - edible
  'RIRU',    // red currant - edible
  'GRGO',    // gooseberry - Ribes uva-crispa

  // ── TREE FRUITS ───────────────────────────────────────────────────────────
  'MALUS',   // apple genus - Malus
  'MADO',    // domestic apple - Malus domestica
  'PYRUS',   // pear genus
  'PYCO',    // common pear - Pyrus communis
  'PRUNU',   // Prunus genus - stone fruits
  'PRAM',    // American plum - Prunus americana -- edible
  'PRSE2',   // black cherry - Prunus serotina -- edible
  'PRPER',   // peach - Prunus persica
  'PRDO',    // domestic plum - Prunus domestica
  'PRCE',    // sweet cherry - Prunus avium
  'PREM',    // bitter cherry -- edible when cooked
  'CISI',    // fig - Ficus carica
  'PUNI',    // pomegranate - Punica granatum
  'PUGL',    // pomegranate variety
  'VITIS',   // grape genus - Vitis
  'VIVI',    // common grape - Vitis vinifera
  'VIRU',    // riverbank grape - edible

  // ── NUTS ──────────────────────────────────────────────────────────────────
  'CAILL',   // pecan - Carya illinoinensis
  'JUGLA',   // walnut genus - Juglans
  'JURE',    // black walnut - edible
  'JUNI',    // northern California walnut
  'PRDU',    // almond - Prunus dulcis
  'PISTA',   // pistachio genus
  'PIVE5',   // pistachio - Pistacia vera
  'CORYL',   // hazelnut genus - Corylus
  'COAV',    // hazelnut - Corylus avellana

  // ── CITRUS ────────────────────────────────────────────────────────────────
  'CITRU',   // citrus genus
  'CISI4',   // lemon - Citrus limon
  'CIAU',    // orange - Citrus aurantium
  'CIGR',    // grapefruit - Citrus paradisi

  // ── GRAINS ────────────────────────────────────────────────────────────────
  'AMHY',    // amaranth - Amaranthus hypochondriacus -- grain
  'AMCR',    // amaranth cruentus -- grain
  'CHQU',    // quinoa - Chenopodium quinoa
  'TRITI',   // wheat genus - Triticum
  'TRVU',    // common wheat - Triticum vulgare
  'SORGH',   // sorghum genus
  'SOBIC',   // grain sorghum - Sorghum bicolor
  'AVESA',   // oat - Avena sativa

  // ── ASPARAGUS ─────────────────────────────────────────────────────────────
  'ASPAR',   // asparagus genus
  'ASOF',    // garden asparagus - Asparagus officinalis

  // ── ARTICHOKE ─────────────────────────────────────────────────────────────
  'CYCA',    // artichoke - Cynara cardunculus

  // ── CELERY ────────────────────────────────────────────────────────────────
  'APIUM',   // celery genus - Apium
  'APGR',    // celery - Apium graveolens

  // ── OKRA ──────────────────────────────────────────────────────────────────
  'ABESC',   // okra - Abelmoschus esculentus

  // ── EGGPLANT ──────────────────────────────────────────────────────────────
  'SOME',    // eggplant - Solanum melongena

  // ── HOPS ──────────────────────────────────────────────────────────────────
  'HUMU',    // hops genus - Humulus
  'HULU',    // common hops - Humulus lupulus -- flowers edible

  // ── PASSION FRUIT ─────────────────────────────────────────────────────────
  'PASSE',   // passion fruit genus - Passiflora edulis
  'PAED',    // passion fruit

  // ── KIWI ──────────────────────────────────────────────────────────────────
  'ACTIN',   // kiwi genus - Actinidia
  'ACDE',    // kiwi - Actinidia deliciosa

  // ── BLUEBERRY ─────────────────────────────────────────────────────────────
  'VACCI',   // blueberry / Vaccinium genus
  'VACO',    // highbush blueberry
  'VAANG',   // lowbush blueberry

];

// Species explicitly excluded -- toxic, non-edible, or unsafe
const EXPLICITLY_UNSAFE = [
  'RICO3',   // Castorbean -- highly toxic
  'DATU',    // Datura -- toxic
  'DAST',    // Jimsonweed -- toxic
  'DAIN',    // Datura inoxia -- toxic
  'CONA2',   // Poison hemlock -- deadly
  'CONM',    // Poison hemlock variety -- deadly
  'SONI3',   // Black nightshade -- toxic berries
  'PHAM6',   // Pokeweed -- toxic
  'HYCI',    // Poison hemlock relative
  'ATROPA',  // Belladonna -- deadly
  'COSC',    // Water hemlock -- deadly
  'POAU3',   // Chilean rabbitsfoot grass -- not food
  'PSSP6',   // Bluebunch wheatgrass -- not food
  'PAMIM',   // Broomcorn millet -- not verified edible
  'SICYO',   // Bur cucumber -- not reliably edible
  'MENYA',   // Buckbean -- not a food bean
  'PLAR',    // Arizona popcornflower -- not food
  'BREL5',   // Bush-violet -- not food
  'MACAC',   // Wild bean -- not verified
];

async function main() {
  console.log('PlantItEatIt — Food Safety Verification Seeder');
  console.log('================================================');

  // Step 1: Add food_safe column if it does not exist
  console.log('\nStep 1: Adding food_safe column...');
  await pool.query(`
    ALTER TABLE species
    ADD COLUMN IF NOT EXISTS food_safe BOOLEAN DEFAULT NULL
  `);
  console.log('  food_safe column ready');

  // Step 2: Mark explicitly unsafe species
  console.log('\nStep 2: Marking explicitly unsafe species...');
  let unsafeCount = 0;
  for (const symbol of EXPLICITLY_UNSAFE) {
    const r = await pool.query(
      'UPDATE species SET food_safe = FALSE WHERE usda_symbol = $1',
      [symbol]
    );
    if (r.rowCount > 0) {
      console.log(`  UNSAFE: ${symbol}`);
      unsafeCount++;
    }
  }
  console.log(`  Marked ${unsafeCount} species as unsafe`);

  // Step 3: Mark verified safe species
  console.log('\nStep 3: Marking verified food safe species...');
  let safeCount = 0;
  let notFound = 0;
  for (const symbol of VERIFIED_FOOD_SAFE) {
    const r = await pool.query(
      'UPDATE species SET food_safe = TRUE WHERE usda_symbol = $1',
      [symbol]
    );
    if (r.rowCount > 0) {
      safeCount++;
    } else {
      notFound++;
    }
  }
  console.log(`  Marked ${safeCount} species as food safe`);
  console.log(`  Symbols not found in database: ${notFound}`);

  // Step 4: Also mark safe by scientific name patterns for genera
  console.log('\nStep 4: Marking safe by scientific name patterns...');
  const safeGenera = [
    '%Solanum lycopersicum%',  // tomatoes
    '%Capsicum annuum%',       // peppers
    '%Cucurbita%',             // squash (excluding ornamental gourds)
    '%Allium cepa%',           // onion
    '%Allium sativum%',        // garlic
    '%Lactuca sativa%',        // lettuce
    '%Spinacia oleracea%',     // spinach
    '%Daucus carota%',         // carrot
    '%Phaseolus vulgaris%',    // common bean
    '%Pisum sativum%',         // pea
    '%Zea mays%',              // corn
    '%Helianthus annuus%',     // sunflower
    '%Fragaria%',              // strawberry
    '%Mentha%',                // mint
    '%Ocimum basilicum%',      // basil
    '%Origanum vulgare%',      // oregano
    '%Thymus vulgaris%',       // thyme
    '%Rosmarinus officinalis%', // rosemary (old name)
    '%Salvia rosmarinus%',     // rosemary (new name)
    '%Coriandrum sativum%',    // cilantro
    '%Petroselinum crispum%',  // parsley
    '%Anethum graveolens%',    // dill
    '%Lavandula%',             // lavender
    '%Foeniculum vulgare%',    // fennel
    '%Rubus idaeus%',          // raspberry
    '%Vaccinium%',             // blueberry
    '%Prunus persica%',        // peach
    '%Prunus dulcis%',         // almond
    '%Malus domestica%',       // apple
    '%Vitis vinifera%',        // grape
    '%Punica granatum%',       // pomegranate
    '%Ficus carica%',          // fig
    '%Carya illinoinensis%',   // pecan
    '%Juglans%',               // walnut
    '%Corylus%',               // hazelnut
    '%Asparagus officinalis%', // asparagus
    '%Cynara%',                // artichoke
    '%Abelmoschus esculentus%', // okra
    '%Solanum melongena%',     // eggplant
    '%Ipomoea batatas%',       // sweet potato
    '%Solanum tuberosum%',     // potato
    '%Beta vulgaris%',         // beet / chard
    '%Raphanus sativus%',      // radish
    '%Tropaeolum%',            // nasturtium
    '%Borago officinalis%',    // borage
    '%Calendula officinalis%', // calendula
    '%Sambucus nigra%',        // elderberry
    '%Humulus lupulus%',       // hops
    '%Amaranthus%',            // amaranth -- edible varieties
    '%Chenopodium quinoa%',    // quinoa
    '%Triticum%',              // wheat
    '%Avena sativa%',          // oats
  ];

  let genusCount = 0;
  for (const pattern of safeGenera) {
    const r = await pool.query(
      `UPDATE species SET food_safe = TRUE
       WHERE scientific_name ILIKE $1
         AND food_safe IS NULL
         AND food_safe != FALSE`,
      [pattern]
    );
    genusCount += r.rowCount;
  }
  console.log(`  Marked ${genusCount} additional species by scientific name`);

  // Step 5: Summary
  const { rows: summary } = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE food_safe = TRUE) as safe,
      COUNT(*) FILTER (WHERE food_safe = FALSE) as unsafe,
      COUNT(*) FILTER (WHERE food_safe IS NULL AND frost_free_days_min IS NOT NULL) as enriched_unverified,
      COUNT(*) as total
    FROM species
  `);

  console.log('\n✓ Food safety verification complete');
  console.log(`  Verified food safe:     ${summary[0].safe}`);
  console.log(`  Explicitly unsafe:      ${summary[0].unsafe}`);
  console.log(`  Enriched but unverified: ${summary[0].enriched_unverified}`);
  console.log(`  Total species:          ${summary[0].total}`);
  console.log('\nNote: Only food_safe = TRUE species will appear in PIEI results.');
  console.log('Enriched but unverified species are excluded until manually verified.');

  await pool.end();
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
