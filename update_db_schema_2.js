import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.log("No DB url");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: dbUrl });

async function runUpdate() {
  try {
    await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS spkklp_status VARCHAR(255);`);
    await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS spkklp_status_lainnya TEXT;`);
    await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS spkklp_obat_khusus TEXT;`);
    console.log("✅ Berhasil menambahkan kolom spkklp baru.");
  } catch (err) {
    console.error("❌ Gagal:", err.message);
  } finally {
    pool.end();
  }
}
runUpdate();
