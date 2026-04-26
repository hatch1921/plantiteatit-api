/**
 * PlantItEatIt — All States Ingestion Script
 * Reads all CSV/TXT files from data/states/ and ingests them.
 * Supports multiple files per state (e.g. Texas split by county group).
 * Includes checkpointing — run with --resume to continue after stall.
 *
 * Usage:        node scripts/ingest-all-states.js
 * Resume:       node scripts/ingest-all-states.js --resume
 * Single state: node scripts/ingest-all-states.js --state AZ
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const pool = require('../db/pool');

const STATES_DIR       = path.join(__dirname, '../data/states');
const CHECKPOINT_FILE  = path.join(__dirname, '../data/ingest-checkpoint.json');
const BATCH_SIZE       = 200;

// State FIPS lookup and county lists
const STATE_META = {
  AZ: { fips:'04', counties:['04001','04003','04005','04007','04009','04011','04012','04013','04015','04017','04019','04021','04023','04025','04027'] },
  NM: { fips:'35', counties:['35001','35003','35005','35006','35007','35009','35011','35013','35015','35017','35019','35021','35023','35025','35027','35028','35029','35031','35033','35035','35037','35039','35041','35043','35045','35047','35049','35051','35053','35055','35057','35059','35061'] },
  TX: { fips:'48', counties:['48001','48003','48005','48007','48009','48011','48013','48015','48017','48019','48021','48023','48025','48027','48029','48031','48033','48035','48037','48039','48041','48043','48045','48047','48049','48051','48053','48055','48057','48059','48061','48063','48065','48067','48069','48071','48073','48075','48077','48079','48081','48083','48085','48087','48089','48091','48093','48095','48097','48099','48101','48103','48105','48107','48109','48111','48113','48115','48117','48119','48121','48123','48125','48127','48129','48131','48133','48135','48137','48139','48141','48143','48145','48147','48149','48151','48153','48155','48157','48159','48161','48163','48165','48167','48169','48171','48173','48175','48177','48179','48181','48183','48185','48187','48189','48191','48193','48195','48197','48199','48201','48203','48205','48207','48209','48211','48213','48215','48217','48219','48221','48223','48225','48227','48229','48231','48233','48235','48237','48239','48241','48243','48245','48247','48249','48251','48253','48255','48257','48259','48261','48263','48265','48267','48269','48271','48273','48275','48277','48279','48281','48283','48285','48287','48289','48291','48293','48295','48297','48299','48301','48303','48305','48307','48309','48311','48313','48315','48317','48319','48321','48323','48325','48327','48329','48331','48333','48335','48337','48339','48341','48343','48345','48347','48349','48351','48353','48355','48357','48359','48361','48363','48365','48367','48369','48371','48373','48375','48377','48379','48381','48383','48385','48387','48389','48391','48393','48395','48397','48399','48401','48403','48405','48407','48409','48411','48413','48415','48417','48419','48421','48423','48425','48427','48429','48431','48433','48435','48437','48439','48441','48443','48445','48447','48449','48451','48453','48455','48457','48459','48461','48463','48465','48467','48469','48471','48473','48475','48477','48479','48481','48483','48485','48487','48489','48491','48493','48495','48497','48499'] },
  CA: { fips:'06', counties:['06001','06003','06005','06007','06009','06011','06013','06015','06017','06019','06021','06023','06025','06027','06029','06031','06033','06035','06037','06039','06041','06043','06045','06047','06049','06051','06053','06055','06057','06059','06061','06063','06065','06067','06069','06071','06073','06075','06077','06079','06081','06083','06085','06087','06089','06091','06093','06095','06097','06099','06101','06103','06105','06107','06109','06111','06113','06115'] },
  CO: { fips:'08', counties:['08001','08003','08005','08007','08009','08011','08013','08014','08015','08017','08019','08021','08023','08025','08027','08029','08031','08033','08035','08037','08039','08041','08043','08045','08047','08049','08051','08053','08055','08057','08059','08061','08063','08065','08067','08069','08071','08073','08075','08077','08079','08081','08083','08085','08087','08089','08091','08093','08095','08097','08099','08101','08103','08105','08107','08109','08111','08113','08115','08117','08119','08121','08123','08125'] },
  UT: { fips:'49', counties:['49001','49003','49005','49007','49009','49011','49013','49015','49017','49019','49021','49023','49025','49027','49029','49031','49033','49035','49037','49039','49041','49043','49045','49047','49049','49051','49053','49055','49057'] },
  NV: { fips:'32', counties:['32001','32003','32005','32007','32009','32011','32013','32015','32017','32019','32021','32023','32027','32029','32031','32033','32510'] },
  ID: { fips:'16', counties:['16001','16003','16005','16007','16009','16011','16013','16015','16017','16019','16021','16023','16025','16027','16029','16031','16033','16035','16037','16039','16041','16043','16045','16047','16049','16051','16053','16055','16057','16059','16061','16063','16065','16067','16069','16071','16073','16075','16077','16079','16081','16083','16085','16087'] },
  OR: { fips:'41', counties:['41001','41003','41005','41007','41009','41011','41013','41015','41017','41019','41021','41023','41025','41027','41029','41031','41033','41035','41037','41039','41041','41043','41045','41047','41049','41051','41053','41055','41057','41059','41061','41063','41065','41067','41069','41071'] },
  WA: { fips:'53', counties:['53001','53003','53005','53007','53009','53011','53013','53015','53017','53019','53021','53023','53025','53027','53029','53031','53033','53035','53037','53039','53041','53043','53045','53047','53049','53051','53053','53055','53057','53059','53061','53063','53065','53067','53069','53071','53073','53075','53077'] },
  MT: { fips:'30', counties:['30001','30003','30005','30007','30009','30011','30013','30015','30017','30019','30021','30023','30025','30027','30029','30031','30033','30035','30037','30039','30041','30043','30045','30047','30049','30051','30053','30055','30057','30059','30061','30063','30065','30067','30069','30071','30073','30075','30077','30079','30081','30083','30085','30087','30089','30091','30093','30095','30097','30099','30101','30103','30105','30107','30109','30111'] },
  WY: { fips:'56', counties:['56001','56003','56005','56007','56009','56011','56013','56015','56017','56019','56021','56023','56025','56027','56029','56031','56033','56035','56037','56039','56041','56043','56045'] },
  FL: { fips:'12', counties:['12001','12003','12005','12007','12009','12011','12013','12015','12017','12019','12021','12023','12027','12029','12031','12033','12035','12037','12039','12041','12043','12045','12047','12049','12051','12053','12055','12057','12059','12061','12063','12065','12067','12069','12071','12073','12075','12077','12079','12081','12083','12085','12086','12087','12089','12091','12093','12095','12097','12099','12101','12103','12105','12107','12109','12111','12113','12115','12117','12119','12121','12123','12125','12127','12129','12131','12133'] },
  GA: { fips:'13', counties:['13001','13003','13005','13007','13009','13011','13013','13015','13017','13019','13021','13023','13025','13027','13029','13031','13033','13035','13037','13039','13041','13043','13045','13047','13049','13051','13053','13055','13057','13059','13061','13063','13065','13067','13069','13071','13073','13075','13077','13079','13081','13083','13085','13087','13089','13091','13093','13095','13097','13099','13101','13103','13105','13107','13109','13111','13113','13115','13117','13119','13121','13123','13125','13127','13129','13131','13133','13135','13137','13139','13141','13143','13145','13147','13149','13151','13153','13155','13157','13159','13161','13163','13165','13167','13169','13171','13173','13175','13177','13179','13181','13183','13185','13187','13189','13191','13193','13195','13197','13199','13201','13205','13207','13209','13211','13213','13215','13217','13219','13221','13223','13225','13227','13229','13231','13233','13235','13237','13239','13241','13243','13245','13247','13249','13251','13253','13255','13257','13259','13261','13263','13265','13267','13269','13271','13273','13275','13277','13279','13281','13283','13285','13287','13289','13291','13293','13295','13297','13299','13301','13303','13305','13307','13309','13311','13313','13315','13317','13319','13321'] },
};

// Detect which state a file belongs to based on filename
function detectState(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('arizona') || lower.startsWith('az_')) return 'AZ';
  if (lower.includes('new_mexico') || lower.startsWith('nm_')) return 'NM';
  if (lower.includes('texas') || lower.startsWith('tx_')) return 'TX';
  if (lower.includes('california') || lower.startsWith('ca_')) return 'CA';
  if (lower.includes('colorado') || lower.startsWith('co_')) return 'CO';
  if (lower.includes('utah') || lower.startsWith('ut_')) return 'UT';
  if (lower.includes('nevada') || lower.startsWith('nv_')) return 'NV';
  if (lower.includes('idaho') || lower.startsWith('id_')) return 'ID';
  if (lower.includes('oregon') || lower.startsWith('or_')) return 'OR';
  if (lower.includes('washington') || lower.startsWith('wa_')) return 'WA';
  if (lower.includes('montana') || lower.startsWith('mt_')) return 'MT';
  if (lower.includes('wyoming') || lower.startsWith('wy_')) return 'WY';
  if (lower.includes('florida') || lower.startsWith('fl_')) return 'FL';
  if (lower.includes('georgia') || lower.startsWith('ga_')) return 'GA';
  return null;
}

function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    const raw = fs.readFileSync(filePath, 'utf8');

    // Detect and skip metadata header line
    const lines = raw.split('\n');
    const startLine = lines[0].toLowerCase().includes('search type') ||
                      lines[0].toLowerCase().includes('search:') ? 2 : 1;

    const delimiter = lines[0].includes('\t') ? '\t' : ',';

    const content = lines.slice(startLine - 1).join('\n');

    require('stream').Readable.from([content])
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter,
        relax_quotes: true,
        relax_column_count: true,
      }))
      .on('data', r => records.push(r))
      .on('end', () => resolve(records))
      .on('error', reject);
  });
}

function getSymbol(row) {
  return (
    row['Symbol'] || row['Accepted Symbol'] || row['acceptedSymbol'] ||
    row['symbol'] || row['SYMBOL'] || ''
  ).trim().replace(/['"]/g, '');
}

async function ingestFile(filePath, stateSymbol) {
  const meta = STATE_META[stateSymbol];
  if (!meta) {
    console.log(`  No metadata for ${stateSymbol} — skipping`);
    return 0;
  }

  const records = await parseCSV(filePath);
  if (records.length === 0) {
    console.log(`  No records parsed from ${path.basename(filePath)}`);
    return 0;
  }

  console.log(`  ${path.basename(filePath)}: ${records.length} records`);

  let matched = 0;
  let inserted = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const row of batch) {
        const symbol = getSymbol(row);
        if (!symbol) continue;

        const res = await client.query(
          'SELECT id FROM species WHERE usda_symbol = $1', [symbol]
        );
        if (!res.rows.length) continue;

        matched++;
        const speciesId = res.rows[0].id;
        const nativeStatus = row['Native Status'] || row['Nativity'] || null;

        for (const fips of meta.counties) {
          await client.query(`
            INSERT INTO species_counties (species_id, state_fips, county_fips, native_status)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT DO NOTHING
          `, [speciesId, meta.fips, fips, nativeStatus]);
          inserted++;
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  Batch error:`, err.message);
    } finally {
      client.release();
    }
  }

  return inserted;
}

function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
  }
  return { processed: [] };
}

function saveCheckpoint(cp) {
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

async function main() {
  const resume = process.argv.includes('--resume');
  const stateFilter = (() => {
    const idx = process.argv.indexOf('--state');
    return idx >= 0 ? process.argv[idx + 1]?.toUpperCase() : null;
  })();

  const checkpoint = loadCheckpoint();

  console.log('PlantItEatIt — All States Ingestion');
  console.log('=====================================');

  // Get all files in states directory
  const allFiles = fs.readdirSync(STATES_DIR)
    .filter(f => f.endsWith('.csv') || f.endsWith('.txt'))
    .sort();

  console.log(`Found ${allFiles.length} files in data/states/`);

  // Group files by state
  const byState = {};
  const unrecognized = [];

  for (const file of allFiles) {
    const stateSymbol = detectState(file);
    if (!stateSymbol) {
      unrecognized.push(file);
      continue;
    }
    if (!byState[stateSymbol]) byState[stateSymbol] = [];
    byState[stateSymbol].push(file);
  }

  console.log(`States detected: ${Object.keys(byState).join(', ')}`);
  if (unrecognized.length > 0) {
    console.log(`Unrecognized files (skipping): ${unrecognized.join(', ')}`);
  }

  let totalInserted = 0;

  for (const [stateSymbol, files] of Object.entries(byState)) {
    if (stateFilter && stateSymbol !== stateFilter) continue;

    const alreadyDone = files.every(f => checkpoint.processed.includes(f));
    if (resume && alreadyDone) {
      console.log(`\n${stateSymbol}: already complete — skipping`);
      continue;
    }

    console.log(`\nProcessing ${stateSymbol} (${files.length} file${files.length > 1 ? 's' : ''})...`);

    for (const file of files) {
      if (resume && checkpoint.processed.includes(file)) {
        console.log(`  ${file}: already processed — skipping`);
        continue;
      }

      const filePath = path.join(STATES_DIR, file);
      const inserted = await ingestFile(filePath, stateSymbol);
      totalInserted += inserted;
      console.log(`  ${file}: ${inserted} county records inserted`);

      checkpoint.processed.push(file);
      saveCheckpoint(checkpoint);
    }
  }

  console.log(`\n✓ Complete. Total county records inserted: ${totalInserted}`);
  console.log(`  Files processed: ${checkpoint.processed.length}`);

  await pool.end();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
