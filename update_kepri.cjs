const fs = require('fs');
const path = require('path');

const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const fktpMappingPath = path.join('src', 'data', 'wilayahMapping.json');
let mapping = JSON.parse(fs.readFileSync(fktpMappingPath, 'utf8'));

// Initialize root mapping if necessary
if (!mapping.fktp) mapping.fktp = {};
if (!mapping.dpm) mapping.dpm = {};

if (!mapping.fktp['Kepulauan Riau']) mapping.fktp['Kepulauan Riau'] = {};
if (!mapping.dpm['Kepulauan Riau']) mapping.dpm['Kepulauan Riau'] = {};

const getFaskesList = (prov, kab, jenis) => {
  const normProv = getTitleCase(prov);
  const normKab = getTitleCase(kab);
  if (jenis === 'dpm') {
    if (!mapping.dpm[normProv]) mapping.dpm[normProv] = {};
    if (!mapping.dpm[normProv][normKab]) mapping.dpm[normProv][normKab] = [];
    return mapping.dpm[normProv][normKab];
  } else {
    if (!mapping.fktp[normProv]) mapping.fktp[normProv] = {};
    if (!mapping.fktp[normProv][normKab]) mapping.fktp[normProv][normKab] = [];
    return mapping.fktp[normProv][normKab];
  }
};

const kepriKabupatens = [
  'Bintan', 'Karimun', 'Natuna', 'Lingga', 'Kepulauan Anambas', 'Batam', 'Tanjung Pinang'
];

// 1. Process Data_Puskesmas_2026.csv
const puskCsv = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split(/\r?\n/);
let matchCount = 0;
for (let i = 1; i < puskCsv.length; i++) {
  const line = puskCsv[i].trim();
  if (!line) continue;
  
  const parts = [];
  let current = '';
  let inQuotes = false;
  for(let char of line) {
      if(char === '"') inQuotes = !inQuotes;
      else if(char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
      } else {
          current += char;
      }
  }
  parts.push(current);
  
  if (parts.length < 3) continue;
  let nama = parts[2].trim();
  let rawText = parts.length >= 4 ? parts[3].trim() : '';
  
  // Note: some regions might just have "kepulauan riau"
  if (rawText.toLowerCase().includes('kepulauan riau') || rawText.toLowerCase().includes('kepri') || rawText.toLowerCase().includes('kep. riau')) {
    let matchedKab = 'Kabupaten Lainnya';
    for (let kab of kepriKabupatens) {
      if (rawText.toLowerCase().includes(kab.toLowerCase())) {
        matchedKab = kab;
        break;
      }
    }
    
    if (!nama.toLowerCase().startsWith('puskesmas')) nama = 'Puskesmas ' + nama;
    
    let list = getFaskesList('Kepulauan Riau', matchedKab, 'fktp');
    if (!list.includes(nama)) {
      list.push(nama);
      matchCount++;
    }
  }
}

// 2. Process v_fasyankes.csv
const fasCsv = fs.readFileSync('v_fasyankes.csv', 'utf8').split(/\r?\n/);
const fHeaders = fasCsv[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
const fProvIdx = fHeaders.indexOf('provinsi');
const fKabIdx = fHeaders.indexOf('kabupaten');
const fJenisIdx = fHeaders.indexOf('jenis_fasyankes');
const fNamaIdx = fHeaders.indexOf('nama');

let kMatch = 0;
let dpmMatch = 0;

for (let i = 1; i < fasCsv.length; i++) {
  const line = fasCsv[i].trim();
  if (!line) continue;
  
  const parts = [];
  let current = '';
  let inQuotes = false;
  for(let char of line) {
      if(char === '"') inQuotes = !inQuotes;
      else if(char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
      } else {
          current += char;
      }
  }
  parts.push(current);
  
  if (parts.length < Math.max(fProvIdx, fKabIdx, fJenisIdx, fNamaIdx) + 1) continue;

  let prov = parts[fProvIdx].replace(/"/g, '').trim();
  // Check variations of Kepulauan Riau
  if (normalizeStr(prov) === 'kepulauanriau' || normalizeStr(prov) === 'kepri' || normalizeStr(prov) === 'kepriau') {
    let jenis = parts[fJenisIdx].replace(/"/g, '').trim();
    let kab = parts[fKabIdx].replace(/"/g, '').trim();
    let nama = parts[fNamaIdx].replace(/"/g, '').trim();
    
    kab = kab.replace(/^Kab\.\s*/i, '').replace(/^Kota\s*/i, '');
    
    if (jenis === 'Klinik') {
      if (!nama.toLowerCase().startsWith('klinik')) nama = 'Klinik ' + nama;
      let list = getFaskesList('Kepulauan Riau', kab, 'fktp');
      if (!list.includes(nama)) { list.push(nama); kMatch++; }
    } else if (jenis.toLowerCase().includes('dokter') || jenis.toLowerCase().includes('dpm') || jenis.toLowerCase().includes('mandiri')) {
      let list = getFaskesList('Kepulauan Riau', kab, 'dpm');
      if (!list.includes(nama)) { list.push(nama); dpmMatch++; }
    }
  }
}

// Sort recursively
['fktp', 'dpm'].forEach(t => {
  if(mapping[t]) {
    Object.keys(mapping[t]).forEach(p => {
      Object.keys(mapping[t][p]).forEach(k => mapping[t][p][k].sort());
    });
  }
});

fs.writeFileSync(fktpMappingPath, JSON.stringify(mapping, null, 2), 'utf8');
console.log(`Success! Added ${matchCount} puskesmas, ${kMatch} Klinik, and ${dpmMatch} DPM from Kepulauan Riau.`);
