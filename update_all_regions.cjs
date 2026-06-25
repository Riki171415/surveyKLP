const fs = require('fs');
const path = require('path');

const wilayahMappingFile = './src/data/wilayahMapping.json';
const puskesmasFile = './Data_Puskesmas_2026.csv';
const fasyankesFile = './v_fasyankes.csv';
const adminFile = './wilayah_administratif.csv';

// Read all existing mapping to not overwrite if we fail
let mapping = { fktp: {}, dpm: {} };

// Parse wilayah_administratif.csv
const adminLines = fs.readFileSync(adminFile, 'utf8').split('\n');
const provList = [];
const kabMap = {}; // provName -> array of kab objects { code, name, searchName }

const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

for (let i = 1; i < adminLines.length; i++) {
  const line = adminLines[i].trim();
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
    provList.push({ code: kProv, name: getTitleCase(nama) });
  } else if (isKab) {
    const provName = provList.find(p => p.code === kProv)?.name;
    if (provName) {
      if (!kabMap[provName]) kabMap[provName] = [];
      const titleName = getTitleCase(nama);
      let searchName = titleName.replace(/^Kab\.\s/, ''); // "Kab. Malang" -> "Malang"
      // special cases for cities: "Kota Surabaya" stays "Kota Surabaya"
      kabMap[provName].push({ code: kKab, name: titleName, searchName });
    }
  }
}

// Add Papua DOB 
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
    kabMap[p.name].push({ code: 'NEW', name: titleName, searchName: k });
  }
}

// Sort provinces by length descending (e.g. 'Sumatera Selatan' before 'Sumatera')
provList.sort((a, b) => b.name.length - a.name.length);
// For each prov, sort kabs by length descending (e.g. 'Kota Madiun' before 'Madiun')
for (const prov in kabMap) {
  kabMap[prov].sort((a, b) => b.searchName.length - a.searchName.length);
}

// Initialize mapping
for (const p of provList) {
  mapping.fktp[p.name] = {};
  mapping.dpm[p.name] = {};
}

// Helper to get prov and kab
const getRegion = (rawText) => {
  let foundProv = null;
  // Some CSV data might have "D I Yogyakarta" instead of "DI Yogyakarta"
  let cleanText = rawText.replace("D I Yogyakarta", "DI Yogyakarta").replace("D.I. Yogyakarta", "DI Yogyakarta");

  for (const p of provList) {
    if (cleanText.includes(" " + p.name + " ") || cleanText.endsWith(" " + p.name)) {
      foundProv = p.name;
      break;
    }
  }
  // Fallback
  if (!foundProv) {
    for (const p of provList) {
      if (cleanText.includes(p.name)) {
        foundProv = p.name;
        break;
      }
    }
  }

  let foundKab = null;
  if (foundProv) {
    for (const k of kabMap[foundProv]) {
      if (cleanText.includes(" " + k.searchName + " ") || cleanText.includes(k.searchName + " " + foundProv)) {
        foundKab = k.name;
        break;
      }
    }
    // Fallback search
    if (!foundKab) {
      for (const k of kabMap[foundProv]) {
        if (cleanText.includes(k.searchName)) {
          foundKab = k.name;
          break;
        }
      }
    }
  }
  return { prov: foundProv, kab: foundKab || "Lainnya" };
};

// 1. Parse Puskesmas from Data_Puskesmas_2026.csv
const puskesmasLines = fs.readFileSync(puskesmasFile, 'utf8').split('\n');
for (let i = 1; i < puskesmasLines.length; i++) {
  const line = puskesmasLines[i].trim();
  if (!line) continue;
  
  const parts = line.split(',');
  if (parts.length >= 4) {
    let namaPuskesmas = parts[2].replace(/"/g, '').trim();
    if (!namaPuskesmas.toLowerCase().includes("puskesmas")) {
      namaPuskesmas = "Puskesmas " + namaPuskesmas;
    }
    const rawText = parts.slice(3).join(',').replace(/"/g, '');
    const { prov, kab } = getRegion(rawText);

    if (prov) {
      if (!mapping.fktp[prov][kab]) mapping.fktp[prov][kab] = [];
      mapping.fktp[prov][kab].push(namaPuskesmas);
    }
  }
}

// 2. Parse Klinik and DPM from v_fasyankes.csv
const fasyankesLines = fs.readFileSync(fasyankesFile, 'utf8').split('\n');
for (let i = 1; i < fasyankesLines.length; i++) {
  let line = fasyankesLines[i].trim();
  if (!line) continue;
  
  const cols = [];
  let inQuotes = false;
  let current = '';
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '"') inQuotes = !inQuotes;
    else if (line[j] === ',' && !inQuotes) { cols.push(current); current = ''; }
    else current += line[j];
  }
  cols.push(current);

  if (cols.length >= 8) {
    let prov = cols[1];
    let kab = cols[2];
    const type = cols[3];
    const nama = cols[7];

    if (prov === "D I Yogyakarta") prov = "DI Yogyakarta";

    // Ensure prov is registered
    if (mapping.fktp[prov]) {
      if (type === "Klinik") {
        if (!mapping.fktp[prov][kab]) mapping.fktp[prov][kab] = [];
        if (!mapping.fktp[prov][kab].includes(nama)) {
          mapping.fktp[prov][kab].push(nama);
        }
      } else if (type === "Dokter Praktik Mandiri") {
        if (!mapping.dpm[prov]) mapping.dpm[prov] = {};
        if (!mapping.dpm[prov][kab]) mapping.dpm[prov][kab] = [];
        if (!mapping.dpm[prov][kab].includes(nama)) {
          mapping.dpm[prov][kab].push(nama);
        }
      }
    }
  }
}

// Sort the whole thing alphabetically for neatness
const sortedMapping = { fktp: {}, dpm: {} };
for (const type of ['fktp', 'dpm']) {
  Object.keys(mapping[type]).sort().forEach(prov => {
    sortedMapping[type][prov] = {};
    Object.keys(mapping[type][prov]).sort().forEach(kab => {
      sortedMapping[type][prov][kab] = mapping[type][prov][kab].sort();
    });
  });
}

fs.writeFileSync(wilayahMappingFile, JSON.stringify(sortedMapping, null, 2));

const fktpTotal = Object.values(sortedMapping.fktp).reduce((acc, prov) => acc + Object.values(prov).reduce((sum, kab) => sum + kab.length, 0), 0);
const dpmTotal = Object.values(sortedMapping.dpm).reduce((acc, prov) => acc + Object.values(prov).reduce((sum, kab) => sum + kab.length, 0), 0);

console.log(`SUCCESS! Generated full mapping.`);
console.log(`Total Puskesmas & Klinik: ${fktpTotal}`);
console.log(`Total DPM: ${dpmTotal}`);
