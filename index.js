require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/species', require('./routes/species'));
app.use('/api/veggies', require('./routes/veggies'));
app.use('/api/climate', require('./routes/climate'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PlantItEatIt API',
    version: '1.0.0',
    ts: new Date().toISOString()
  });
});

// TEMPORARY SETUP ROUTE — remove after schema is created
app.get('/api/setup', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const pool = require('./db/pool');
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
    await pool.query(sql);
    res.json({ status: 'Schema created successfully', ts: new Date().toISOString() });
  } catch (err) {
    console.error('Schema error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PlantItEatIt API running on port ${PORT}`);
});