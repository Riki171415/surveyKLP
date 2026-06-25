const fs = require('fs');
const path = require('path');

const allowedRegions = {
  'DI Yogyakarta': ['bantul', 'gunungkidul', 'yogyakarta'],
  'Jawa Barat': ['bandung', 'bogor'],
  'Jawa Tengah': ['purworejo', 'blora', 'batang'],
  'DKI Jakarta': ['jakarta utara', 'jakarta timur', 'jakarta selatan', 'jakarta barat'],
  'Lampung': ['way kanan', 'lampung timur', 'lampung tengah', 'lampung selatan', 'metro', 'bandar lampung', 'lampung utara'],
  'Sumatera Barat': ['padang', 'bukittinggi', 'pasaman barat', 'dharmasraya', 'agam'],
  'Bali': ['denpasar', 'tabanan', 'klungkung', 'jembrana', 'gianyar', 'badung'],
  'Sumatera Utara': ['medan', 'mandailing natal', 'karo', 'deli serdang'],
  'Jambi': 'ALL',
  'Gorontalo': 'ALL',
  'Riau': 'ALL',
  'Kalimantan Tengah': 'ALL',
  'Kepulauan Riau': 'ALL',
  'Sumatera Selatan': 'ALL',
  'Kepulauan Bangka Belitung': 'ALL',
  'Sulawesi Utara': 'ALL',
  'Aceh': 'ALL',
  'Kalimantan Barat': 'ALL',
  'Sulawesi Selatan': 'ALL'
};

const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const normalizeForCompare = (s) => s ? s.toLowerCase().replace(/kabupaten /g, '').replace(/kota administrasi /g, '').replace(/kota /g, '').replace(/kab\. /g, '').trim() : '';

const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const mapping = { fktp: {}, dpm: {} };

const csvPath = path.join(__dirname, 'wilayah_administratif.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const provList = [];
const kabMap = {}; // provName -> array of { code, name, searchName }

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
  const isKab = (kKab && kKab !== 'NULL') && (!kKec || kKec === 'NULL');

  if (isProv) {
    const pName = getTitleCase(nama);
    provNamesByCode[kProv] = pName;
    provList.push({ code: kProv, name: pName });
  } else if (isKab) {
    const provName = provNamesByCode[kProv];
    if (provName) {
      if (!kabMap[provName]) kabMap[provName] = [];
      const titleName = getTitleCase(nama);
      // FIXED SEARCH NAME EXTRACTION
      let searchName = titleName.replace(/^(Kab\.|Kabupaten|Kota Administrasi|Kota)\s+/, ''); 
      kabMap[provName].push({ code: kKab, name: titleName, searchName });
      
      // Filter mapping
      const allowedProvKey = Object.keys(allowedRegions).find(p => normalizeStr(p) === normalizeStr(provName));
      if (allowedProvKey) {
        const allowedKabs = allowedRegions[allowedProvKey];
        const kabNameClean = normalizeForCompare(titleName);
        let isKabAllowed = false;
        if (allowedKabs === 'ALL') {
          isKabAllowed = true;
        } else {
          isKabAllowed = allowedKabs.some(ak => kabNameClean.includes(normalizeForCompare(ak)));
        }

        if (isKabAllowed) {
          if (!mapping.fktp[allowedProvKey]) {
            mapping.fktp[allowedProvKey] = {};
            mapping.dpm[allowedProvKey] = {};
          }
          if (!mapping.fktp[allowedProvKey][titleName]) {
            mapping.fktp[allowedProvKey][titleName] = [];
            mapping.dpm[allowedProvKey][titleName] = [];
          }
        }
      }
    }
  }
}

// Papua DOB
const newPapuaProvinces = [
  {name: 'Papua Barat Daya', kabs: ['Kota Sorong', 'Sorong', 'Sorong Selatan', 'Raja Ampat', 'Tambrauw', 'Maybrat']},
  {name: 'Papua Pegunungan', kabs: ['Jayawijaya', 'Keerom', 'Lanny Jaya', 'Mamberamo Raya', 'Mamberamo Tengah', 'Nduga', 'Pegunungan Bintang', 'Sarmi', 'Supiori', 'Tolikara', 'Waropen', 'Yahukimo', 'Yalimo']},
  {name: 'Papua Selatan', kabs: ['Asmat', 'Boven Digoel', 'Mappi', 'Merauke']},
  {name: 'Papua Tengah', kabs: ['Deiyai', 'Dogiyai', 'Intan Jaya', 'Mimika', 'Nabire', 'Paniai', 'Puncak', 'Puncak Jaya']}
];
for (const p of newPapuaProvinces) {
  provList.push({ code: 'NEW', name: p.name });
  kabMap[p.name] = [];
  for (const k of p.kabs) {
    const isKota = k.startsWith('Kota');
    const titleName = isKota ? k : 'Kab. ' + k;
    kabMap[p.name].push({ code: 'NEW', name: titleName, searchName: k.replace(/^(Kab\.|Kabupaten|Kota Administrasi|Kota)\s+/, '') });
  }
}

provList.sort((a, b) => b.name.length - a.name.length);
for (const prov in kabMap) {
  kabMap[prov].sort((a, b) => b.searchName.length - a.searchName.length);
}

const getRegion = (rawText) => {
  let foundProv = null;
  let cleanText = rawText.replace("D I Yogyakarta", "DI Yogyakarta").replace("D.I. Yogyakarta", "DI Yogyakarta");

  for (const p of provList) {
    if (cleanText.includes(" " + p.name + " ") || cleanText.endsWith(" " + p.name) || cleanText.includes(p.name)) {
      foundProv = p.name;
      break;
    }
  }
  if (!foundProv) {
    for (const p of provList) {
      if (cleanText.includes(p.name)) {
        foundProv = p.name;
        break;
      }
    }
  }

  let foundKab = null;
  if (foundProv && kabMap[foundProv]) {
    // First pass: try to match the exact full name (e.g. "Kota Bandung")
    for (const k of kabMap[foundProv]) {
      if (cleanText.includes(" " + k.name + " ") || cleanText.includes(k.name + " " + foundProv) || cleanText.includes(k.name)) {
        foundKab = k.name;
        break;
      }
    }
    
    // Second pass: if no exact match, fallback to searchName
    if (!foundKab) {
      for (const k of kabMap[foundProv]) {
        if (cleanText.includes(" " + k.searchName + " ") || cleanText.includes(k.searchName + " " + foundProv) || cleanText.includes(k.searchName)) {
          if (foundProv.includes(k.searchName)) {
             const matches = cleanText.match(new RegExp(k.searchName, 'g'));
             const provMatches = cleanText.match(new RegExp(foundProv, 'g'));
             if (matches && provMatches && matches.length === provMatches.length) {
                continue; // Skip false positive where searchName is just part of the province
             }
          }
          foundKab = k.name;
          break;
        }
      }
    }
    
    if (!foundKab) {
        const fallbackKab = kabMap[foundProv].find(k => foundProv.includes(k.searchName));
        if (fallbackKab) foundKab = fallbackKab.name;
    }
  }
  return { prov: foundProv, kab: foundKab || "Lainnya" };
};

let mappedPuskCount = 0;
let mappedKlinikCount = 0;
let mappedDpmCount = 0;

const addFaskesStrict = (pProv, pKab, pNama, type) => {
  let normProv = normalizeStr(pProv);
  if (normProv === 'daerahistimewayogyakarta') normProv = 'diyogyakarta';

  let matchedProv = Object.keys(mapping.fktp).find(provKey => normalizeStr(provKey) === normProv);
  if (!matchedProv) return false;

  let possibleKabs = Object.keys(mapping.fktp[matchedProv]).filter(kabKey => normalizeForCompare(kabKey) === normalizeForCompare(pKab));
  let matchedKab = null;
  
  if (possibleKabs.length === 1) {
    matchedKab = possibleKabs[0];
  } else if (possibleKabs.length > 1) {
    const pKabLower = pKab.toLowerCase();
    if (pKabLower.includes('kota')) {
      matchedKab = possibleKabs.find(k => k.toLowerCase().includes('kota'));
    } else if (pKabLower.includes('kab') || pKabLower.includes('kabupaten')) {
      matchedKab = possibleKabs.find(k => k.toLowerCase().includes('kab'));
    }
    if (!matchedKab) matchedKab = possibleKabs[0];
  }
  
  if (!matchedKab) return false;

  let finalNama = pNama;
  if (type === 'puskesmas' && !finalNama.toLowerCase().includes('puskesmas') && !finalNama.toLowerCase().includes('pkm')) {
    finalNama = 'Puskesmas ' + finalNama;
  }
  if (type === 'klinik' && !finalNama.toLowerCase().includes('klinik')) {
    finalNama = 'Klinik ' + finalNama;
  }

  if (type === 'puskesmas' || type === 'klinik') {
    if (!mapping.fktp[matchedProv][matchedKab].includes(finalNama)) {
      mapping.fktp[matchedProv][matchedKab].push(finalNama);
      if (type === 'puskesmas') mappedPuskCount++;
      if (type === 'klinik') mappedKlinikCount++;
    }
  } else if (type === 'dpm') {
    if (!mapping.dpm[matchedProv][matchedKab].includes(finalNama)) {
      mapping.dpm[matchedProv][matchedKab].push(finalNama);
      mappedDpmCount++;
    }
  }
  return true;
};

// Add Puskesmas from CSV
const puskesmasFile = './Data_Puskesmas_2026.csv';
if (fs.existsSync(puskesmasFile)) {
  const puskesmasLines = fs.readFileSync(puskesmasFile, 'utf8').split('\n');
  for (let i = 1; i < puskesmasLines.length; i++) {
    const line = puskesmasLines[i].trim();
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

    if (parts.length >= 4) {
      let namaPuskesmas = parts[2].replace(/"/g, '').trim();
      const rawText = parts.slice(3).join(',').replace(/"/g, '');
      const { prov, kab } = getRegion(rawText);

      if (prov && kab !== "Lainnya") {
        addFaskesStrict(prov, kab, namaPuskesmas, 'puskesmas');
      }
    }
  }
}

// Add Klinik and DPM from CSV
const fasyankesPath = path.join(__dirname, 'v_fasyankes.csv');
if (fs.existsSync(fasyankesPath)) {
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
    const prov = parts[pProvIdx];
    const kab = parts[pKabIdx];
    const nama = parts[pNamaIdx];

    if (jenis === 'Klinik') {
      addFaskesStrict(prov, kab, nama, 'klinik');
    } else if (jenis === 'Dokter Praktik Mandiri') {
      addFaskesStrict(prov, kab, nama, 'dpm');
    }
  }
}

const sortedMapping = { fktp: {}, dpm: {} };
for (const type of ['fktp', 'dpm']) {
  Object.keys(mapping[type]).sort().forEach(prov => {
    const sortedKab = {};
    Object.keys(mapping[type][prov]).sort().forEach(kab => {
      sortedKab[kab] = mapping[type][prov][kab].sort();
    });
    if (Object.keys(sortedKab).length > 0) {
      sortedMapping[type][prov] = sortedKab;
    }
  });
}

const outPath = path.join(__dirname, 'src', 'data', 'wilayahMapping.json');
fs.writeFileSync(outPath, JSON.stringify(sortedMapping, null, 2), 'utf8');

console.log(`✅ Success! Generated structured wilayahMapping.json with fktp and dpm`);
console.log(`   Puskesmas: ${mappedPuskCount}`);
console.log(`   Klinik   : ${mappedKlinikCount}`);
console.log(`   DPM      : ${mappedDpmCount}`);
