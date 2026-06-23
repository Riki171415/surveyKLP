import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large JSON payloads

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  // Di aaPanel/VPS PostgreSQL, Anda bisa memberikan URL misal: postgres://user:pass@localhost:5432/dbname
});

// GET /api/surveys
app.get('/api/surveys', async (req, res) => {
  try {
    // SQL Injection Prevention: Tidak menerima input eksternal untuk klausa query statis
    const { rows } = await pool.query('SELECT * FROM surveys ORDER BY created_at DESC');
    
    // Parse JSON strings to objects (karena Supabase menyimpan sebagai JSONB dan mengembalikannya sebagai object,
    // sedangkan jika PostgreSQL lokal menggunakan kolom TEXT, dia akan mengembalikan string)
    const parsedRows = rows.map(row => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (typeof newRow[key] === 'string' && (newRow[key].startsWith('{') || newRow[key].startsWith('['))) {
          try {
            newRow[key] = JSON.parse(newRow[key]);
          } catch (e) {
            // Biarkan saja jika gagal parse
          }
        }
      }
      return newRow;
    });

    res.json({ data: parsedRows, error: null });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// POST /api/surveys
app.post('/api/surveys', async (req, res) => {
  const payload = req.body;
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ data: null, error: { message: 'Payload is empty' } });
  }

  const keys = Object.keys(payload);
  const values = Object.values(payload);
  
  // SQL Injection Prevention: Menggunakan Parameterized Queries ($1, $2, ...)
  // pg-pool otomatis akan membersihkan input (sanitization)
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');
  
  const query = `INSERT INTO surveys (${columns}) VALUES (${placeholders}) RETURNING *`;
  
  try {
    const { rows } = await pool.query(query, values);
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error('Insert error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// PUT /api/surveys/:id
app.put('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ data: null, error: { message: 'Payload is empty' } });
  }

  const keys = Object.keys(payload);
  const values = Object.values(payload);
  
  // SQL Injection Prevention: Menggunakan Parameterized Queries
  const setString = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  values.push(id);
  
  const query = `UPDATE surveys SET ${setString} WHERE id = $${values.length} RETURNING *`;
  
  try {
    const { rows } = await pool.query(query, values);
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// DELETE /api/surveys/:id
app.delete('/api/surveys/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // SQL Injection Prevention: Parameterized query untuk DELETE
    const { rows } = await pool.query('DELETE FROM surveys WHERE id = $1 RETURNING *', [id]);
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running securely on port ${PORT}`);
});
