const fs = require('fs');

// 1. Load existing mapping from v_fasyankes.csv
const fasyankesData = fs.readFileSync('v_fasyankes.csv', 'utf8').split('\n');
const originalMapping = {};

for (let i = 1; i < fasyankesData.length; i++) {
  const line = fasyankesData[i].trim();
  if (!line) continue;
  const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  if (parts.length >= 8) {
    const prov = parts[1].replace(/^"|"$/g, '');
    const kab = parts[2].replace(/^"|"$/g, '');
    const nama = parts[7].replace(/^"|"$/g, '');
    
    if (!originalMapping[prov]) originalMapping[prov] = {};
    if (!originalMapping[prov][kab]) originalMapping[prov][kab] = [];
    originalMapping[prov][kab].push(nama);
  }
}

// 2. Define user's allowed rules
const allowedRules = {
  "DI Yogyakarta": ["Kabupaten Bantul", "Kabupaten Gunungkidul", "Kota Yogyakarta"],
  "Jawa Barat": ["Kota Bandung", "Kota Bogor"],
  "Jawa Tengah": ["Kabupaten Purworejo", "Kabupaten Blora", "Kabupaten Batang"],
  "DKI Jakarta": ["Kota Administrasi Jakarta Utara", "Kota Administrasi Jakarta Timur", "Kota Administrasi Jakarta Selatan", "Kota Administrasi Jakarta Barat"],
  "Lampung": ["Kabupaten Way Kanan", "Kabupaten Lampung Timur", "Kabupaten Lampung Tengah", "Kabupaten Lampung Selatan", "Kota Metro", "Kota Bandar Lampung"],
  "Sumatera Barat": ["Kota Padang", "Kota Bukittinggi", "Kabupaten Pasaman Barat", "Kabupaten Dharmasraya", "Kabupaten Agam"],
  "Bali": ["Kota Denpasar", "Kabupaten Tabanan", "Kabupaten Klungkung", "Kabupaten Jembrana", "Kabupaten Gianyar"],
  "Sumatera Utara": ["Kota Medan", "Kabupaten Mandailing Natal", "Kabupaten Karo", "Kabupaten Deli Serdang"],
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

const finalMapping = {};

// Helper to normalize names for comparison
function norm(s) { return s.toLowerCase().replace(/kota administrasi/g, 'kota').replace(/kabupaten/g, 'kab.').replace(/\s+/g, ''); }

for (const prov of Object.keys(originalMapping)) {
  const normProv = norm(prov);
  let matchedProvKey = null;
  let rule = null;
  
  for (const k of Object.keys(allowedRules)) {
    if (normProv.includes(norm(k)) || norm(k).includes(normProv)) {
      matchedProvKey = k;
      rule = allowedRules[k];
      break;
    }
  }
  
  if (matchedProvKey) {
    if (!finalMapping[matchedProvKey]) finalMapping[matchedProvKey] = {};
    
    for (const kab of Object.keys(originalMapping[prov])) {
      const normKab = norm(kab);
      let include = false;
      let kabKey = kab;
      
      if (rule === "*") {
        include = true;
      } else {
        for (const allowedKab of rule) {
          if (normKab.includes(norm(allowedKab)) || norm(allowedKab).includes(normKab)) {
            include = true;
            kabKey = allowedKab; // use user's precise name
            break;
          }
        }
      }
      
      if (include) {
        if (!finalMapping[matchedProvKey][kabKey]) finalMapping[matchedProvKey][kabKey] = [];
        finalMapping[matchedProvKey][kabKey].push(...originalMapping[prov][kab]);
      }
    }
  }
}

// 3. Add DKI Jakarta manually from Data_Puskesmas_2026.csv
const puskData = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split('\n');
if (!finalMapping["DKI Jakarta"]) {
  finalMapping["DKI Jakarta"] = {};
}

const dkiRules = allowedRules["DKI Jakarta"];
for (const ruleKab of dkiRules) {
  finalMapping["DKI Jakarta"][ruleKab] = [];
}

for (let i = 1; i < puskData.length; i++) {
  const line = puskData[i].trim();
  if (!line) continue;
  const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  if (parts.length < 4) continue;
  
  const rawText = parts[3].toLowerCase();
  const namaPusk = parts[2].replace(/^"|"$/g, '');
  
  if (rawText.includes("dki jakarta") || rawText.includes("jakarta")) {
    for (const ruleKab of dkiRules) {
      // Check e.g., "jakarta utara"
      let checkName = ruleKab.toLowerCase().replace("kota administrasi ", "");
      if (rawText.includes(checkName)) {
        finalMapping["DKI Jakarta"][ruleKab].push(namaPusk);
        break;
      }
    }
  }
}

// Ensure array uniqueness and remove empties
for (const p in finalMapping) {
  for (const k in finalMapping[p]) {
    if (finalMapping[p][k].length === 0) delete finalMapping[p][k];
    else {
      finalMapping[p][k] = [...new Set(finalMapping[p][k])].sort();
    }
  }
  if (Object.keys(finalMapping[p]).length === 0) delete finalMapping[p];
}

console.log("Filtered Provinces:", Object.keys(finalMapping));
Object.keys(finalMapping).forEach(p => console.log(`  ${p}: ${Object.keys(finalMapping[p]).length} Kab/Kota`));

fs.writeFileSync('src/data/wilayahMapping.json', JSON.stringify(finalMapping, null, 2));
console.log("Successfully recreated src/data/wilayahMapping.json");
