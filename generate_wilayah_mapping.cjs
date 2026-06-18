// generate_wilayah_mapping.cjs
// Generates a 3-level mapping: Provinsi -> Kab/Kota -> Puskesmas
// from wilayah_administratif.csv and data puskesmas.csv

const fs = require('fs');
const path = require('path');

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
    if (parts.length < headers.length) continue;
    const row = {};
    headers.forEach((h, idx) => { row[h] = parts[idx] === 'NULL' ? null : parts[idx]; });
    rows.push(row);
  }
  return rows;
}

const wilayahRaw = parseCSV(path.join(__dirname, 'wilayah_administratif.csv'));
const puskesmasRaw = parseCSV(path.join(__dirname, 'data puskesmas.csv'));

// Build lookup: kode_kab -> nama_kab
const kabLookup = {};
// Build lookup: kode_prov -> nama_prov
const provLookup = {};
// Build lookup: kode_kab -> kode_prov
const kabToProvLookup = {};

wilayahRaw.forEach(row => {
  if (!row.kode_kab && !row.kode_kec) {
    // Provinsi row
    provLookup[row.kode_prov] = row.nama_wilayah;
  } else if (row.kode_kab && !row.kode_kec) {
    // Kab/Kota row
    kabLookup[row.kode_kab] = row.nama_wilayah;
    kabToProvLookup[row.kode_kab] = row.kode_prov;
  }
});

// Build 3-level mapping
// Structure: { [provName]: { [kabName]: [puskesmasList] } }
const wilayahMapping = {};

puskesmasRaw.forEach(row => {
  const kodeKab = row.kode_kab;
  const namaPusk = row.unit_kerja;
  const namaKab = kabLookup[kodeKab];
  const kodeProv = kabToProvLookup[kodeKab];
  const namaProv = provLookup[kodeProv];

  if (!namaProv || !namaKab || !namaPusk) {
    console.warn(`Skip: kode_kab=${kodeKab}, kode_prov=${kodeProv} => prov=${namaProv}, kab=${namaKab}`);
    return;
  }

  if (!wilayahMapping[namaProv]) wilayahMapping[namaProv] = {};
  if (!wilayahMapping[namaProv][namaKab]) wilayahMapping[namaProv][namaKab] = [];
  wilayahMapping[namaProv][namaKab].push(namaPusk);
});

// Sort everything
const sortedMapping = {};
Object.keys(wilayahMapping).sort().forEach(prov => {
  sortedMapping[prov] = {};
  Object.keys(wilayahMapping[prov]).sort().forEach(kab => {
    sortedMapping[prov][kab] = wilayahMapping[prov][kab].sort();
  });
});

const outPath = path.join(__dirname, 'src', 'data', 'wilayahMapping.json');
fs.writeFileSync(outPath, JSON.stringify(sortedMapping, null, 2));

// Stats
const totalProv = Object.keys(sortedMapping).length;
const totalKab = Object.values(sortedMapping).reduce((a, v) => a + Object.keys(v).length, 0);
const totalPusk = Object.values(sortedMapping).reduce((a, v) => 
  a + Object.values(v).reduce((b, arr) => b + arr.length, 0), 0);

console.log(`✅ Berhasil generate wilayahMapping.json`);
console.log(`   Provinsi : ${totalProv}`);
console.log(`   Kab/Kota : ${totalKab}`);
console.log(`   Puskesmas: ${totalPusk}`);
console.log(`   Output   : ${outPath}`);
