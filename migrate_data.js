import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const dbUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseKey || !dbUrl) {
  console.error("Error: Pastikan VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, dan DATABASE_URL sudah diisi di file .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const pool = new pg.Pool({
  connectionString: dbUrl,
});

async function migrate() {
  console.log("🚀 Memulai proses migrasi data dari Supabase ke PostgreSQL lokal...");

  try {
    // 1. Ambil semua data dari Supabase
    console.log("📥 Mengambil data dari Supabase...");
    const { data: surveys, error: fetchError } = await supabase
      .from('surveys')
      .select('*');

    if (fetchError) throw fetchError;
    
    if (!surveys || surveys.length === 0) {
      console.log("✅ Tidak ada data di Supabase untuk dimigrasikan.");
      return;
    }

    console.log(`📦 Ditemukan ${surveys.length} data survey di Supabase.`);

    // 2. Persiapkan tabel (opsional, asumsikan tabel sudah dibuat sesuai skema di walkthrough)
    // 3. Insert ke PostgreSQL Lokal
    let successCount = 0;
    let errorCount = 0;

    for (const row of surveys) {
      const keys = Object.keys(row);
      const values = Object.values(row);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const columns = keys.join(', ');
      
      const query = `INSERT INTO surveys (${columns}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING RETURNING *`;
      
      try {
        await pool.query(query, values);
        successCount++;
        process.stdout.write(`\r✅ Berhasil memigrasi: ${successCount}/${surveys.length}`);
      } catch (insertErr) {
        console.error(`\n❌ Gagal memigrasi data ID ${row.id}:`, insertErr.message);
        errorCount++;
      }
    }

    console.log(`\n\n🎉 Migrasi Selesai! Berhasil: ${successCount}, Gagal: ${errorCount}`);
    
  } catch (err) {
    console.error("\n💥 Terjadi kesalahan fatal:", err.message);
  } finally {
    pool.end();
    process.exit(0);
  }
}

migrate();
