require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const fixes = [
    { symbol: 'CUMOT', name: 'butternut squash' },
    { symbol: 'CUMA3', name: 'hubbard squash' },
    { symbol: 'CUPE',  name: 'zucchini' },
    { symbol: 'CUMI3', name: 'cushaw squash' },
    { symbol: 'LYCO4', name: 'tomato' },
    { symbol: 'LYES',  name: 'cherry tomato' },
  ];

  for (const fix of fixes) {
    const r = await pool.query(
      'UPDATE species SET common_name=$1 WHERE usda_symbol=$2',
      [fix.name, fix.symbol]
    );
    console.log(`${fix.symbol} → "${fix.name}" (${r.rowCount} updated)`);
  }

  console.log('\nDone.');
  await pool.end();
}

main().catch(err => { console.error(err.message); process.exit(1); });
