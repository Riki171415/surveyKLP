const fs = require('fs');
const path = require('path');

const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const normalizeForCompare = (s) => s ? s.toLowerCase().replace(/kabupaten /g, '').replace(/kota administrasi /g, '').replace(/kota /g, '').replace(/kab\. /g, '').trim() : '';
const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const fktpMappingPath = path.join('src', 'data', 'wilayahMapping.json');
const mapping = JSON.parse(fs.readFileSync(fktpMappingPath, 'utf8'));

// The mapping is currently just { Prov: { Kab: [Faskes] } } based on generate_wilayah_mapping.cjs
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

// 1. Process Data_Puskesmas_2026.csv for Puskesmas
const puskCsv = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split(/\r?\n/);
const puskHeaders = puskCsv[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
const pProvIdx = puskHeaders.findIndex(h => h.includes('provinsi'));
const pKabIdx = puskHeaders.findIndex(h => h.includes('kabupaten') || h.includes('kab_kota'));
const pNamaIdx = puskHeaders.findIndex(h => h.includes('nama_puskesmas') || h.includes('nama'));

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
  
  if (parts.length < Math.max(pProvIdx, pKabIdx, pNamaIdx) + 1) continue;

  let prov = parts[pProvIdx].replace(/"/g, '').trim();
  if (normalizeStr(prov) === 'sulawesiselatan') {
    let kab = parts[pKabIdx].replace(/"/g, '').trim();
    let nama = parts[pNamaIdx].replace(/"/g, '').trim();
    if (!nama.toLowerCase().startsWith('puskesmas')) nama = 'Puskesmas ' + nama;
    
    let list = getFaskesList(prov, kab);
    if (!list.includes(nama)) list.push(nama);
  }
}

// 2. Process v_fasyankes.csv for Klinik and DPM
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

  let prov = parts[fProvIdx].replace(/"/g, '').trim();
  if (normalizeStr(prov) === 'sulawesiselatan') {
    let jenis = parts[fJenisIdx].replace(/"/g, '').trim();
    let kab = parts[fKabIdx].replace(/"/g, '').trim();
    let nama = parts[fNamaIdx].replace(/"/g, '').trim();
    
    if (jenis === 'Klinik') {
      if (!nama.toLowerCase().startsWith('klinik')) nama = 'Klinik ' + nama;
      let list = getFaskesList(prov, kab);
      if (!list.includes(nama)) list.push(nama);
    } else if (jenis.toLowerCase().includes('dokter') || jenis.toLowerCase().includes('dpm') || jenis.toLowerCase().includes('mandiri')) {
      let list = getFaskesList(prov, kab);
      if (!list.includes(nama)) list.push(nama);
    }
  }
}

// Sort the lists
Object.keys(mapping).forEach(p => {
  Object.keys(mapping[p]).forEach(k => mapping[p][k].sort());
});

fs.writeFileSync(fktpMappingPath, JSON.stringify(mapping, null, 2), 'utf8');
console.log('Mapping updated with Sulawesi Selatan.');
