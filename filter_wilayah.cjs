const fs = require('fs');
// 1. Load existing mapping from v_fasyankes.csv
const fasyankesData = fs.readFileSync('v_fasyankes.csv', 'utf8').split('\n');
const originalFktp = {};
const originalDpm = {};

for (let i = 1; i < fasyankesData.length; i++) {
  const line = fasyankesData[i].trim();
  if (!line) continue;
  const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  if (parts.length >= 8) {
    const prov = parts[1].replace(/^"|"$/g, '');
    const kab = parts[2].replace(/^"|"$/g, '');
    const type = parts[3].replace(/^"|"$/g, '');
    const nama = parts[7].replace(/^"|"$/g, '');
    
    let targetMap = null;
    if (type === 'Puskesmas' || type === 'Klinik') {
      targetMap = originalFktp;
    } else if (type === 'Dokter Praktik Mandiri') {
      targetMap = originalDpm;
    }
    
    if (targetMap) {
      if (!targetMap[prov]) targetMap[prov] = {};
      if (!targetMap[prov][kab]) targetMap[prov][kab] = [];
      targetMap[prov][kab].push(nama);
    }
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

const finalMapping = { fktp: {}, dpm: {} };

// Helper to normalize names for comparison
function norm(s) { return s.toLowerCase().replace(/kota administrasi/g, 'kota').replace(/kabupaten/g, 'kab.').replace(/\s+/g, ''); }

function processMapping(original, targetObj) {
  for (const prov of Object.keys(original)) {
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
      if (!targetObj[matchedProvKey]) targetObj[matchedProvKey] = {};
      
      for (const kab of Object.keys(original[prov])) {
        const normKab = norm(kab);
        let include = false;
        let kabKey = kab;
        
        if (rule === "*") {
          include = true;
        } else {
          for (const allowedKab of rule) {
            if (normKab.includes(norm(allowedKab)) || norm(allowedKab).includes(normKab)) {
              include = true;
              kabKey = allowedKab;
              break;
            }
          }
        }
        
        if (include) {
          if (!targetObj[matchedProvKey][kabKey]) targetObj[matchedProvKey][kabKey] = [];
          targetObj[matchedProvKey][kabKey].push(...original[prov][kab]);
        }
      }
    }
  }
}

processMapping(originalFktp, finalMapping.fktp);
processMapping(originalDpm, finalMapping.dpm);

fs.writeFileSync('src/data/wilayahMapping.json', JSON.stringify(finalMapping, null, 2));

console.log('Successfully recreated src/data/wilayahMapping.json with fktp and dpm split');

// 3. Add DKI Jakarta manually from Data_Puskesmas_2026.csv
const puskData = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split('\n');
if (!finalMapping.fktp["DKI Jakarta"]) {
  finalMapping.fktp["DKI Jakarta"] = {};
}

const dkiRules = allowedRules["DKI Jakarta"];
for (const ruleKab of dkiRules) {
  finalMapping.fktp["DKI Jakarta"][ruleKab] = [];
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
        finalMapping.fktp["DKI Jakarta"][ruleKab].push(namaPusk);
        break;
      }
    }
  }
}

// Ensure array uniqueness and remove empties
for (const type of ['fktp', 'dpm']) {
  for (const p in finalMapping[type]) {
    for (const k in finalMapping[type][p]) {
      if (finalMapping[type][p][k].length === 0) delete finalMapping[type][p][k];
      else {
        finalMapping[type][p][k] = [...new Set(finalMapping[type][p][k])].sort();
      }
    }
    if (Object.keys(finalMapping[type][p]).length === 0) delete finalMapping[type][p];
  }
}

console.log("Filtered Provinces (FKTP):", Object.keys(finalMapping.fktp));
Object.keys(finalMapping.fktp).forEach(p => console.log(`  ${p}: ${Object.keys(finalMapping.fktp[p]).length} Kab/Kota`));
console.log("Filtered Provinces (DPM):", Object.keys(finalMapping.dpm));
Object.keys(finalMapping.dpm).forEach(p => console.log(`  ${p}: ${Object.keys(finalMapping.dpm[p]).length} Kab/Kota`));

fs.writeFileSync('src/data/wilayahMapping.json', JSON.stringify(finalMapping, null, 2));
console.log("Successfully recreated src/data/wilayahMapping.json");
