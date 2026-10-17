const express = require('express');
const { Pool } = require('pg');
const app = express();
const port = 3000;
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD
});

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({status:'ok', service:'backend', database:'connected'});
  } catch (err) {
    console.error('Health check failed:', err.message);
    res.status(503).json({status:'error', database:'unavailable'});
  }
});

app.get('/api/messages', async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, message, created_at FROM messages ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error:'Could not read messages'});
  }
});

app.post('/api/messages', async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message || message.length > 200)
    return res.status(400).json({error:'Message must be 1–200 characters.'});
  try {
    const result = await pool.query(
      'INSERT INTO messages(message) VALUES($1) RETURNING id, message, created_at',
      [message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({error:'Could not save message'});
  }
});

app.listen(port, '0.0.0.0', () => console.log(`API listening on ${port}`));
