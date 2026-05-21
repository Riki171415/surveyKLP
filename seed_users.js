import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kvpslcbhjthwmxgshfoe.supabase.co';
const SUPABASE_KEY = 'sb_publishable_368pEsST-qbiSYZFINgNpA_hCsJS9XJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = fs.readFileSync('./faskes_raw.txt', 'utf8');
const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const isProvince = (line) => {
  return line === line.toUpperCase() && !line.includes('PUSKESMAS') && !line.includes('PUKESMAS');
};

const usersToInsert = [];
const faskesToInsert = [];

for (const line of lines) {
  if (isProvince(line)) continue;
  if (line === 'Praktek Mandiri') continue; // Probably not a specific faskes name, but let's just make it a user anyway
  
  // Format username: lowercase, replace spaces with underscores, remove special chars
  let username = line.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '_');
  
  // To avoid duplicates
  if (usersToInsert.find(u => u.username === username)) {
    username = username + '_' + Math.floor(Math.random() * 100);
  }

  usersToInsert.push({
    username: username,
    password: 'password123', // Default password
    role: 'puskesmas'
  });

  faskesToInsert.push({
    nama: line,
    kode: username // generate a simple code
  });
}

async function seed() {
  console.log(`Menyiapkan ${usersToInsert.length} akun puskesmas...`);
  
  // Insert users
  const { error: userErr } = await supabase.from('app_users').insert(usersToInsert);
  if (userErr) {
    console.error('Error inserting users:', userErr.message);
  } else {
    console.log('Berhasil menambahkan akun ke tabel app_users!');
  }

  // Insert faskes
  const { error: faskesErr } = await supabase.from('faskes').insert(faskesToInsert);
  if (faskesErr) {
    console.error('Error inserting faskes:', faskesErr.message);
  } else {
    console.log('Berhasil menambahkan daftar puskesmas ke tabel faskes!');
  }
}

seed();
