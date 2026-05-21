const fs = require('fs');

const raw = fs.readFileSync('new_faskes.txt', 'utf8');
const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
const mapping = {};
let currentProvinsi = '';

// We use a set to automatically deduplicate exact names within the SAME province
const seen = new Set();

for (const line of lines) {
  if (line === 'REGIONAL IV') continue;
  
  if (line === line.toUpperCase() && !line.includes('PUSKESMAS') && !line.includes('PUKESMAS') && !line.includes('PKM') && !line.includes('PRAKTEK MANDIRI')) {
    currentProvinsi = line;
  } else {
    // Prevent duplicate entries for the exact same puskesmas in the same province
    const uniqueKey = `${currentProvinsi}_${line}`;
    if (!seen.has(uniqueKey)) {
      seen.add(uniqueKey);
      const key = `user_${Object.keys(mapping).length}`;
      mapping[key] = {
        nama: line,
        provinsi: currentProvinsi
      };
    }
  }
}

fs.writeFileSync('src/data/faskesMapping.json', JSON.stringify(mapping, null, 2));
console.log(`Generated ${Object.keys(mapping).length} unique puskesmas mapped to their provinces.`);
