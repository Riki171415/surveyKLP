import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Error: DATABASE_URL tidak ditemukan di file .env");
  console.log("Silakan jalankan SQL berikut secara manual di database Anda (Supabase SQL Editor):");
  console.log("\nALTER TABLE surveys ADD COLUMN IF NOT EXISTS data_pasien_bulanan JSONB DEFAULT '{}';\n");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: dbUrl,
});

async function runUpdate() {
  console.log("🚀 Menjalankan migrasi database...");
  try {
    const query = `ALTER TABLE surveys ADD COLUMN IF NOT EXISTS data_pasien_bulanan JSONB DEFAULT '{}';`;
    await pool.query(query);
    console.log("✅ Berhasil menambahkan kolom 'data_pasien_bulanan' ke tabel 'surveys'.");
  } catch (err) {
    console.error("❌ Gagal menjalankan migrasi:", err.message);
    console.log("\nAnda juga dapat menjalankan SQL berikut secara manual di Supabase SQL Editor:");
    console.log("ALTER TABLE surveys ADD COLUMN IF NOT EXISTS data_pasien_bulanan JSONB DEFAULT '{}';\n");
  } finally {
    pool.end();
  }
}

runUpdate();
