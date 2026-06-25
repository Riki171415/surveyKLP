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
const mapping = JSON.parse(fs.readFileSync(fktpMappingPath, 'utf8'));

if (!mapping['Sulawesi Selatan']) {
  mapping['Sulawesi Selatan'] = {};
}

const getFaskesList = (prov, kab) => {
  const normProv = getTitleCase(prov);
  const normKab = getTitleCase(kab);
  if (!mapping[normProv]) mapping[normProv] = {};
  if (!mapping[normProv][normKab]) mapping[normProv][normKab] = [];
  return mapping[normProv][normKab];
};

const sulselKabupatens = [
  'Kepulauan Selayar', 'Bulukumba', 'Bantaeng', 'Jeneponto', 'Takalar', 'Gowa',
  'Sinjai', 'Bone', 'Maros', 'Pangkajene Kepulauan', 'Barru', 'Soppeng', 'Wajo',
  'Sidenreng Rappang', 'Pinrang', 'Enrekang', 'Luwu', 'Tana Toraja', 'Luwu Utara',
  'Luwu Timur', 'Toraja Utara', 'Makassar', 'Pare Pare', 'Palopo'
];

// 1. Process Data_Puskesmas_2026.csv
// Headers: No,Kode,Nama Puskesmas,Raw Text
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
  
  if (rawText.toLowerCase().includes('sulawesi selatan') || rawText.toLowerCase().includes('sulsel')) {
    // Determine kabupaten
    let matchedKab = 'Kabupaten Lainnya';
    for (let kab of sulselKabupatens) {
      if (rawText.toLowerCase().includes(kab.toLowerCase())) {
        matchedKab = kab;
        break;
      }
    }
    
    if (!nama.toLowerCase().startsWith('puskesmas')) nama = 'Puskesmas ' + nama;
    
    let list = getFaskesList('Sulawesi Selatan', matchedKab);
    if (!list.includes(nama)) {
      list.push(nama);
      matchCount++;
    }
  }
}
console.log(`Added ${matchCount} puskesmas from Sulawesi Selatan`);

// 2. Process v_fasyankes.csv
// Headers: id,provinsi,kabupaten,jenis_fasyankes,jenis_pemilik,kode,kode_yankes,nama
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
  if (normalizeStr(prov) === 'sulawesiselatan') {
    let jenis = parts[fJenisIdx].replace(/"/g, '').trim();
    let kab = parts[fKabIdx].replace(/"/g, '').trim();
    let nama = parts[fNamaIdx].replace(/"/g, '').trim();
    
    // remove Kab. / Kota from kab
    kab = kab.replace(/^Kab\.\s*/i, '').replace(/^Kota\s*/i, '');
    
    if (jenis === 'Klinik') {
      if (!nama.toLowerCase().startsWith('klinik')) nama = 'Klinik ' + nama;
      let list = getFaskesList(prov, kab);
      if (!list.includes(nama)) { list.push(nama); kMatch++; }
    } else if (jenis.toLowerCase().includes('dokter') || jenis.toLowerCase().includes('dpm') || jenis.toLowerCase().includes('mandiri')) {
      let list = getFaskesList(prov, kab);
      if (!list.includes(nama)) { list.push(nama); dpmMatch++; }
    }
  }
}

console.log(`Added ${kMatch} Klinik and ${dpmMatch} DPM from Sulawesi Selatan`);

// Sort
Object.keys(mapping).forEach(p => {
  Object.keys(mapping[p]).forEach(k => mapping[p][k].sort());
});

fs.writeFileSync(fktpMappingPath, JSON.stringify(mapping, null, 2), 'utf8');
console.log('Done!');
