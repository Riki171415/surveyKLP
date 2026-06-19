const fs = require('fs');
const path = require('path');

const allowedRegions = {
  'DI Yogyakarta': ['bantul', 'gunungkidul', 'yogyakarta'],
  'Jawa Barat': ['bandung', 'bogor'],
  'Jawa Tengah': ['purworejo', 'blora', 'batang'],
  'DKI Jakarta': ['jakarta utara', 'jakarta timur', 'jakarta selatan', 'jakarta barat'],
  'Lampung': ['way kanan', 'lampung timur', 'lampung tengah', 'lampung selatan', 'metro', 'bandar lampung'],
  'Sumatera Barat': ['padang', 'bukittinggi', 'pasaman barat', 'dharmasraya', 'agam'],
  'Bali': ['denpasar', 'tabanan', 'klungkung', 'jembrana', 'gianyar'],
  'Sumatera Utara': ['medan', 'mandailing natal', 'karo', 'deli serdang'],
  'Jambi': 'ALL',
  'Gorontalo': 'ALL',
  'Riau': 'ALL',
  'Kalimantan Tengah': 'ALL',
  'Kepulauan Riau': 'ALL',
  'Sumatera Selatan': 'ALL',
  'Kepulauan Bangka Belitung': 'ALL',
  'Sulawesi Utara': 'ALL',
  'Aceh': 'ALL'
};

const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const normalizeForCompare = (s) => s ? s.toLowerCase().replace(/kabupaten /g, '').replace(/kota administrasi /g, '').replace(/kota /g, '').replace(/kab\. /g, '').trim() : '';

const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const mapping = {};

// We still want to map properly based on wilayah_administratif to have standardized names
const csvPath = path.join(__dirname, 'wilayah_administratif.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const provNamesByCode = {};
const lines = csvContent.split(/\r?\n/);
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
    provNamesByCode[kProv] = getTitleCase(nama);
  }
}

// Map allowed regions
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
      // Check if this province is allowed
      const allowedProvKey = Object.keys(allowedRegions).find(p => normalizeStr(p) === normalizeStr(provName));
      if (allowedProvKey) {
        const allowedKabs = allowedRegions[allowedProvKey];
        const kabNameClean = normalizeForCompare(nama);
        
        let isKabAllowed = false;
        if (allowedKabs === 'ALL') {
          isKabAllowed = true;
        } else {
          isKabAllowed = allowedKabs.some(ak => kabNameClean.includes(normalizeForCompare(ak)));
        }

        if (isKabAllowed) {
          if (!mapping[allowedProvKey]) {
            mapping[allowedProvKey] = {};
          }
          const kabName = getTitleCase(nama);
          if (!mapping[allowedProvKey][kabName]) {
            mapping[allowedProvKey][kabName] = [];
          }
        }
      }
    }
  }
}

// Helper to add Faskes
let mappedPuskCount = 0;
let mappedKlinikCount = 0;

const addFaskes = (pProv, pKab, pNama, type) => {
  let normProv = normalizeStr(pProv);
  if (normProv === 'daerahistimewayogyakarta') normProv = 'diyogyakarta';
  if (normProv === 'dkijakarta') normProv = 'dki jakarta'; // well normalizeStr removes spaces so 'dkijakarta' is fine, but mapping has keys 'DKI Jakarta' so normalizeStr('DKI Jakarta') === 'dkijakarta'

  let matchedProv = Object.keys(mapping).find(provKey => normalizeStr(provKey) === normProv);
  if (!matchedProv) return false;

  let matchedKab = Object.keys(mapping[matchedProv]).find(kabKey => normalizeForCompare(kabKey) === normalizeForCompare(pKab));
  if (!matchedKab) return false;

  if (!mapping[matchedProv][matchedKab].includes(pNama)) {
    mapping[matchedProv][matchedKab].push(pNama);
    if (type === 'puskesmas') mappedPuskCount++;
    if (type === 'klinik') mappedKlinikCount++;
  }
  return true;
};

// Add Puskesmas from JSON
const parsedPdfPath = path.join(__dirname, 'pdf_parsed_puskesmas_full.json');
const pdfPuskesmas = JSON.parse(fs.readFileSync(parsedPdfPath, 'utf8'));

pdfPuskesmas.forEach(p => {
  addFaskes(p.provinsi, p.kab_kota, p.nama, 'puskesmas');
});

// Add Klinik from v_fasyankes.csv
const fasyankesPath = path.join(__dirname, 'v_fasyankes.csv');
const fasyankesContent = fs.readFileSync(fasyankesPath, 'utf8');
const fasLines = fasyankesContent.split(/\r?\n/);
const headers = fasLines[0].split(',').map(h => h.replace(/"/g, '').trim());

const pProvIdx = headers.indexOf('provinsi');
const pKabIdx = headers.indexOf('kabupaten');
const pJenisIdx = headers.indexOf('jenis_fasyankes');
const pNamaIdx = headers.indexOf('nama');

for (let i = 1; i < fasLines.length; i++) {
  const line = fasLines[i].trim();
  if (!line) continue;
  
  // simple csv parser handling quotes
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
  
  if (parts.length < Math.max(pProvIdx, pKabIdx, pJenisIdx, pNamaIdx) + 1) continue;

  const jenis = parts[pJenisIdx];
  if (jenis === 'Klinik') {
    const prov = parts[pProvIdx];
    const kab = parts[pKabIdx];
    const nama = parts[pNamaIdx];
    const success = addFaskes(prov, kab, nama, 'klinik');
    if (!success && mappedKlinikCount === 0) {
        console.log(`Failed to add klinik: Prov=${prov}, Kab=${kab}, Nama=${nama}`);
    }
  }
}

// Cleanup empty KabKotas and sort
const sortedMapping = {};
Object.keys(mapping).sort().forEach(prov => {
  const sortedKab = {};
  Object.keys(mapping[prov]).sort().forEach(kab => {
    if (mapping[prov][kab].length > 0) {
      sortedKab[kab] = mapping[prov][kab].sort();
    }
  });
  if (Object.keys(sortedKab).length > 0) {
    sortedMapping[prov] = sortedKab;
  }
});

const outPath = path.join(__dirname, 'src', 'data', 'wilayahMapping.json');
fs.writeFileSync(outPath, JSON.stringify(sortedMapping, null, 2), 'utf8');

const totalProv = Object.keys(sortedMapping).length;
const totalKab = Object.values(sortedMapping).reduce((a, v) => a + Object.keys(v).length, 0);

console.log(`\n✅ Berhasil generate wilayahMapping.json terbatas`);
console.log(`   Provinsi : ${totalProv}`);
console.log(`   Kab/Kota : ${totalKab}`);
console.log(`   Puskesmas: ${mappedPuskCount}`);
console.log(`   Klinik   : ${mappedKlinikCount}`);
console.log(`   Output   : ${outPath}`);
