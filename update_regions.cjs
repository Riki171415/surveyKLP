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

if (!mapping.fktp) mapping.fktp = {};
if (!mapping.dpm) mapping.dpm = {};

const targets = {
  'Kepulauan Riau': [
    'Bintan', 'Karimun', 'Natuna', 'Lingga', 'Kepulauan Anambas', 'Batam', 'Tanjung Pinang'
  ],
  'Kalimantan Barat': [
    'Sambas', 'Mempawah', 'Sanggau', 'Ketapang', 'Sintang', 'Kapuas Hulu',
    'Bengkayang', 'Landak', 'Sekadau', 'Melawi', 'Kayong Utara', 'Kubu Raya',
    'Pontianak', 'Singkawang'
  ]
};

Object.keys(targets).forEach(prov => {
  if (!mapping.fktp[prov]) mapping.fktp[prov] = {};
  if (!mapping.dpm[prov]) mapping.dpm[prov] = {};
});

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

let matchCounts = {
  'Kepulauan Riau': { pusk: 0, klinik: 0, dpm: 0 },
  'Kalimantan Barat': { pusk: 0, klinik: 0, dpm: 0 }
};

// 1. Process Data_Puskesmas_2026.csv
const puskCsv = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split(/\r?\n/);
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
  
  Object.keys(targets).forEach(prov => {
    let rawLower = rawText.toLowerCase();
    let isMatch = false;
    
    if (prov === 'Kepulauan Riau' && (rawLower.includes('kepulauan riau') || rawLower.includes('kepri') || rawLower.includes('kep. riau'))) {
      isMatch = true;
    }
    if (prov === 'Kalimantan Barat' && (rawLower.includes('kalimantan barat') || rawLower.includes('kalbar'))) {
      isMatch = true;
    }
    
    if (isMatch) {
      let matchedKab = 'Kabupaten Lainnya';
      for (let kab of targets[prov]) {
        if (rawLower.includes(kab.toLowerCase())) {
          matchedKab = kab;
          break;
        }
      }
      
      if (!nama.toLowerCase().startsWith('puskesmas')) nama = 'Puskesmas ' + nama;
      
      let list = getFaskesList(prov, matchedKab, 'fktp');
      if (!list.includes(nama)) {
        list.push(nama);
        matchCounts[prov].pusk++;
      }
    }
  });
}

// 2. Process v_fasyankes.csv
const fasCsv = fs.readFileSync('v_fasyankes.csv', 'utf8').split(/\r?\n/);
const fHeaders = fasCsv[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
const fProvIdx = fHeaders.indexOf('provinsi');
const fKabIdx = fHeaders.indexOf('kabupaten');
const fJenisIdx = fHeaders.indexOf('jenis_fasyankes');
const fNamaIdx = fHeaders.indexOf('nama');

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

  let provCsv = parts[fProvIdx].replace(/"/g, '').trim();
  let normProv = normalizeStr(provCsv);
  
  let targetProv = null;
  if (normProv === 'kepulauanriau' || normProv === 'kepri' || normProv === 'kepriau') {
    targetProv = 'Kepulauan Riau';
  } else if (normProv === 'kalimantanbarat' || normProv === 'kalbar') {
    targetProv = 'Kalimantan Barat';
  }

  if (targetProv) {
    let jenis = parts[fJenisIdx].replace(/"/g, '').trim();
    let kab = parts[fKabIdx].replace(/"/g, '').trim();
    let nama = parts[fNamaIdx].replace(/"/g, '').trim();
    
    kab = kab.replace(/^Kab\.\s*/i, '').replace(/^Kota\s*/i, '');
    
    if (jenis === 'Klinik') {
      if (!nama.toLowerCase().startsWith('klinik')) nama = 'Klinik ' + nama;
      let list = getFaskesList(targetProv, kab, 'fktp');
      if (!list.includes(nama)) { list.push(nama); matchCounts[targetProv].klinik++; }
    } else if (jenis.toLowerCase().includes('dokter') || jenis.toLowerCase().includes('dpm') || jenis.toLowerCase().includes('mandiri')) {
      let list = getFaskesList(targetProv, kab, 'dpm');
      if (!list.includes(nama)) { list.push(nama); matchCounts[targetProv].dpm++; }
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
console.log('Success!', matchCounts);
