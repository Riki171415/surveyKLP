const fs = require('fs');

const fasyankesText = fs.readFileSync('v_fasyankes.csv', 'utf8').split('\n');
const kodeMap = new Map();
for (let i = 1; i < fasyankesText.length; i++) {
  const line = fasyankesText[i].trim();
  if (!line) continue;
  // Parse simple CSV line correctly handling quotes if needed
  // A naive split by comma is not enough because names might contain commas
  // Let's use a regex to split by comma outside quotes
  const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  if (parts.length >= 7) {
    const prov = parts[1].replace(/^"|"$/g, '');
    const kab = parts[2].replace(/^"|"$/g, '');
    let kode = parts[5].replace(/^"|"$/g, '');
    
    // Normalize kode to handle 'P' prefix
    let numKode = kode;
    if (kode.startsWith('P')) numKode = kode.substring(1);
    
    kodeMap.set(numKode, {prov, kab});
  }
}

console.log('v_fasyankes map size:', kodeMap.size);

const pusk2026 = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split('\n');
let matchCount = 0;
let totalCount = 0;
const results = {};

for(let i=1; i<pusk2026.length; i++) {
  const line = pusk2026[i].trim();
  if(!line) continue;
  const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  if(parts.length < 3) continue;
  
  const kode = parts[1].replace(/^"|"$/g, '');
  const nama = parts[2].replace(/^"|"$/g, '');
  
  totalCount++;
  
  const mapData = kodeMap.get(kode) || kodeMap.get('P'+kode) || kodeMap.get(kode.replace('P',''));
  if (mapData) {
    matchCount++;
    const prov = mapData.prov;
    const kab = mapData.kab;
    if(!results[prov]) results[prov] = {};
    if(!results[prov][kab]) results[prov][kab] = [];
    results[prov][kab].push(nama);
  } else {
    // Attempt fallback parsing from Raw Text if possible
    // Very unreliable, so skip or mark Unmapped
  }
}

console.log('Matches in Data_Puskesmas_2026:', matchCount, '/', totalCount);

// Now apply user's rules to filter and create final wilayahMapping.json

const finalMapping = {};

const allowed = {
  "DI Yogyakarta": ["Kab. Bantul", "Kab. Gunungkidul", "Kota Yogyakarta"],
  "Jawa Barat": ["Kota Bandung", "Kota Bogor"],
  "Jawa Tengah": ["Kab. Purworejo", "Kab. Blora", "Kab. Batang"],
  "DKI Jakarta": ["Kota Jakarta Utara", "Kota Jakarta Timur", "Kota Jakarta Selatan", "Kota Jakarta Barat"],
  "Lampung": ["Kab. Way Kanan", "Kab. Lampung Timur", "Kab. Lampung Tengah", "Kab. Lampung Selatan", "Kota Metro", "Kota Bandar Lampung"],
  "Sumatera Barat": ["Kota Padang", "Kota Bukittinggi", "Kab. Pasaman Barat", "Kab. Dharmasraya", "Kab. Agam"],
  "Bali": ["Kota Denpasar", "Kab. Tabanan", "Kab. Klungkung", "Kab. Jembrana", "Kab. Gianyar"],
  "Sumatera Utara": ["Kota Medan", "Kab. Mandailing Natal", "Kab. Karo", "Kab. Deli Serdang"],
  // For these, we include ALL kab/kota inside them
  "Jambi": "*",
  "Gorontalo": "*",
  "Riau": "*",
  "Kalimantan Tengah": "*",
  "Kepulauan Riau": "*",
  "Sumatera Selatan": "*",
  "Kepulauan Bangka Belitung": "*",
  "Sulawesi Utara": "*",
  "Aceh": "*"
};

// Also we need to fix the naming convention since v_fasyankes uses "Kab." and "Kota Administrasi" might be just "Kota"
// Let's normalize names for checking
function norm(s) { return s.toLowerCase().replace(/kabupaten/g, 'kab.').replace(/kota administrasi/g, 'kota').trim(); }

for(const prov in results) {
  const normProv = norm(prov);
  let matchedProvKey = null;
  let rule = null;
  
  for(const k in allowed) {
    if (normProv.includes(norm(k)) || norm(k).includes(normProv)) {
      matchedProvKey = k;
      rule = allowed[k];
      break;
    }
  }
  
  if (matchedProvKey) {
    if (!finalMapping[matchedProvKey]) finalMapping[matchedProvKey] = {};
    
    for(const kab in results[prov]) {
      const normKab = norm(kab);
      let include = false;
      let kabKey = kab;
      
      if (rule === "*") {
        include = true;
      } else {
        for(const allowedKab of rule) {
          if (normKab.includes(norm(allowedKab)) || norm(allowedKab).includes(normKab)) {
            include = true;
            kabKey = allowedKab; // use standard name
            break;
          }
        }
      }
      
      if (include) {
        if (!finalMapping[matchedProvKey][kabKey]) finalMapping[matchedProvKey][kabKey] = [];
        finalMapping[matchedProvKey][kabKey].push(...results[prov][kab]);
      }
    }
  }
}

// Remove empty provinces/kabs
for (const p in finalMapping) {
  for (const k in finalMapping[p]) {
    if (finalMapping[p][k].length === 0) delete finalMapping[p][k];
    else {
      finalMapping[p][k] = [...new Set(finalMapping[p][k])].sort();
    }
  }
  if (Object.keys(finalMapping[p]).length === 0) delete finalMapping[p];
}

console.log("Final allowed provinces:", Object.keys(finalMapping));
fs.writeFileSync('src/data/wilayahMapping.json', JSON.stringify(finalMapping, null, 2));
console.log("Created src/data/wilayahMapping.json");
