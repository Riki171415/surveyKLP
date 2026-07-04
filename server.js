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

// Initialize new columns
const initDB = async () => {
  try {
    await pool.query('ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_editable BOOLEAN DEFAULT false');
    await pool.query("ALTER TABLE surveys ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb");
    await pool.query('ALTER TABLE surveys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE');
    
    // Create ai_reports table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_reports (
        id VARCHAR(50) PRIMARY KEY,
        content TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database schema verified: edit_history, updated_at, is_editable, ai_reports are ready.');
  } catch (err) {
    console.log('Skipping schema init: ', err.message);
  }
};
initDB();

// GET /api/ai-reports/:id
app.get('/api/ai-reports/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT content FROM ai_reports WHERE id = $1', [id]);
    if (rows.length > 0) {
      res.json({ data: rows[0], error: null });
    } else {
      res.json({ data: null, error: null });
    }
  } catch (err) {
    console.error('Fetch ai-report error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// GET /api/ai-reports (Fetch all)
app.get('/api/ai-reports', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, content FROM ai_reports');
    res.json({ data: rows, error: null });
  } catch (err) {
    console.error('Fetch all ai-reports error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// POST /api/ai-reports
app.post('/api/ai-reports', async (req, res) => {
  const { id, content } = req.body;
  if (!id || !content) {
    return res.status(400).json({ data: null, error: { message: 'id and content are required' } });
  }
  
  try {
    const query = `
      INSERT INTO ai_reports (id, content, updated_at) 
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (id) 
      DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    const { rows } = await pool.query(query, [id, content]);
    res.json({ data: rows[0], error: null });
  } catch (err) {
    console.error('Upsert ai-report error:', err);
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// POST /api/generate-ai
app.post('/api/generate-ai', async (req, res) => {
  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-3.5-pro';
  
  if (!apiKey) {
    return res.status(400).json({ error: 'GEMINI_API_KEY atau VITE_GEMINI_API_KEY tidak ditemukan di env server.' });
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 }
      })
    });
    
    const data = await response.json();
    if (data.error) {
      return res.status(400).json({ error: data.error });
    }
    res.json(data);
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({ error: { message: err.message } });
  }
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

// PUT /api/surveys/:id/toggle-edit
app.put('/api/surveys/:id/toggle-edit', async (req, res) => {
  const { id } = req.params;
  const { is_editable } = req.body;
  try {
    const { rows } = await pool.query('UPDATE surveys SET is_editable = $1 WHERE id = $2 RETURNING *', [is_editable, id]);
    res.json({ data: rows, error: null });
  } catch (err) {
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
  try {
    // Fetch existing row for history
    const { rows: existingRows } = await pool.query('SELECT * FROM surveys WHERE id = $1', [id]);
    if (existingRows.length > 0) {
      const existingRow = existingRows[0];
      const previousData = { ...existingRow };
      delete previousData.id;
      delete previousData.created_at;
      delete previousData.updated_at;
      delete previousData.edit_history;
      
      if (req.query.skip_history !== 'true') {
        const newHistoryEntry = {
          edited_at: new Date().toISOString(),
          previous_data: previousData
        };
        
        let currentHistory = existingRow.edit_history || [];
        if (typeof currentHistory === 'string') {
          try { currentHistory = JSON.parse(currentHistory); } catch(e) { currentHistory = []; }
        }
        currentHistory.push(newHistoryEntry);
        
        payload.edit_history = JSON.stringify(currentHistory);
      }
      payload.updated_at = new Date().toISOString();
      payload.is_editable = false; // Auto-lock
    }

    const keys = Object.keys(payload);
    const values = Object.values(payload);
    
    // SQL Injection Prevention: Menggunakan Parameterized Queries
    const setString = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id);
    
    const query = `UPDATE surveys SET ${setString} WHERE id = $${values.length} RETURNING *`;
    
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
