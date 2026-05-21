const fs = require('fs');

const raw = fs.readFileSync('final_faskes.txt', 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
const mapping = {};
let currentProvinsi = '';

const seen = new Set();
let duplicatesFound = 0;

for (const line of lines) {
  // If line doesn't start with a number (e.g., "1. "), it's a province
  const match = line.match(/^\d+\.\s*(.+)/);
  if (!match) {
    // Check if it's a known province string to be safe
    if (line === line.toUpperCase()) {
      currentProvinsi = line;
    }
  } else {
    // It's a faskes name
    const nama = match[1].trim();
    
    // Quick duplicate check (exact string inside province)
    const uniqueKey = `${currentProvinsi}_${nama.toLowerCase()}`;
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      const key = `user_${Object.keys(mapping).length}`;
      mapping[key] = {
        nama: nama,
        provinsi: currentProvinsi
      };
    } else {
      console.log(`Duplicate skipped: ${nama} in ${currentProvinsi}`);
      duplicatesFound++;
    }
  }
}

fs.writeFileSync('src/data/faskesMapping.json', JSON.stringify(mapping, null, 2));
console.log(`Generated ${Object.keys(mapping).length} unique puskesmas.`);
if (duplicatesFound > 0) {
  console.log(`Skipped ${duplicatesFound} exact duplicates.`);
}
