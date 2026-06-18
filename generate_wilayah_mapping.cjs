const fs = require('fs');
const path = require('path');

// Read wilayah_administratif.csv first to get all Provinces and Kabupaten/Kota
const csvPath = path.join(__dirname, 'wilayah_administratif.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const provinsiSet = new Set();

// Parse CSV simple parser
const lines = csvContent.split(/\r?\n/);
// Skip header
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
  if (parts.length < 4) continue;
  
  const kProv = parts[0];
  const kKab = parts[1];
  const kKec = parts[2];
  const nama = parts[3];
  
  const isProv = (!kKab || kKab === 'NULL') && (!kKec || kKec === 'NULL');
  if (isProv) {
    provinsiSet.add(nama);
  }
}

// Re-read to map Kab to Prov
const provNamesByCode = {};
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
  if (parts.length < 4) continue;
  const kProv = parts[0];
  const kKab = parts[1];
  const kKec = parts[2];
  const nama = parts[3];
  
  const isProv = (!kKab || kKab === 'NULL') && (!kKec || kKec === 'NULL');
  if (isProv) {
    provNamesByCode[kProv] = nama.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').replace('Dki', 'DKI').replace('Diy', 'DIY').replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
  }
}

// Format Provinsi and Kab Names nicely
const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const mapping = {};

// Pre-fill mapping with provinces and kab/kota from CSV
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
  if (parts.length < 4) continue;
  const kProv = parts[0];
  const kKab = parts[1];
  const kKec = parts[2];
  const nama = parts[3];
  
  const isKab = (kKab && kKab !== 'NULL') && (!kKec || kKec === 'NULL');
  if (isKab) {
    const provName = provNamesByCode[kProv];
    if (provName) {
      if (!mapping[provName]) {
        mapping[provName] = {};
      }
      const kabName = getTitleCase(nama);
      if (!mapping[provName][kabName]) {
        mapping[provName][kabName] = [];
      }
    }
  }
}

// Read parsed pdf data
const parsedPdfPath = path.join(__dirname, 'pdf_parsed_puskesmas_full.json');
const pdfPuskesmas = JSON.parse(fs.readFileSync(parsedPdfPath, 'utf8'));

// Helper to normalize strings for robust mapping comparison
const normalizeStr = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

// Map puskesmas from PDF into our mapping structure
let mappedCount = 0;
let unmatchedCount = 0;

pdfPuskesmas.forEach(p => {
  const pProv = p.provinsi;
  const pKab = p.kab_kota;
  const pNama = p.nama;
  
  // Find matching province in mapping keys (case-insensitive & relaxed)
  let matchedProv = Object.keys(mapping).find(provKey => normalizeStr(provKey) === normalizeStr(pProv));
  if (!matchedProv) {
    // If not found, use the exact Title Case form
    matchedProv = getTitleCase(pProv);
    if (!mapping[matchedProv]) {
      mapping[matchedProv] = {};
    }
  }
  
  // Find matching kab_kota inside the matched province
  let matchedKab = Object.keys(mapping[matchedProv]).find(kabKey => normalizeStr(kabKey) === normalizeStr(pKab));
  if (!matchedKab) {
    matchedKab = getTitleCase(pKab);
    if (!mapping[matchedProv][matchedKab]) {
      mapping[matchedProv][matchedKab] = [];
    }
    unmatchedCount++;
  } else {
    mappedCount++;
  }
  
  // Add puskesmas to list
  if (!mapping[matchedProv][matchedKab].includes(pNama)) {
    mapping[matchedProv][matchedKab].push(pNama);
  }
});

console.log(`Puskesmas mapped to existing Kab/Kota: ${mappedCount}`);
console.log(`Puskesmas created new Kab/Kota: ${unmatchedCount}`);

// Sort all arrays alphabetically
Object.keys(mapping).forEach(prov => {
  // Sort kab_kota keys
  const sortedKab = {};
  Object.keys(mapping[prov]).sort().forEach(kab => {
    // Sort puskesmas list
    sortedKab[kab] = mapping[prov][kab].sort();
  });
  mapping[prov] = sortedKab;
});

// Sort provinces keys
const sortedMapping = {};
Object.keys(mapping).sort().forEach(prov => {
  sortedMapping[prov] = mapping[prov];
});

const outPath = path.join(__dirname, 'src', 'data', 'wilayahMapping.json');
fs.writeFileSync(outPath, JSON.stringify(sortedMapping, null, 2), 'utf8');

// Stats
const totalProv = Object.keys(sortedMapping).length;
const totalKab = Object.values(sortedMapping).reduce((a, v) => a + Object.keys(v).length, 0);
const totalPusk = Object.values(sortedMapping).reduce((a, v) => 
  a + Object.values(v).reduce((b, arr) => b + arr.length, 0), 0);

console.log(`\n✅ Berhasil generate wilayahMapping.json`);
console.log(`   Provinsi : ${totalProv}`);
console.log(`   Kab/Kota : ${totalKab}`);
console.log(`   Puskesmas: ${totalPusk}`);
console.log(`   Output   : ${outPath}`);

