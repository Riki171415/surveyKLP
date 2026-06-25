const fs = require('fs');

const fasyankesLines = fs.readFileSync('v_fasyankes.csv', 'utf8').split('\n');
const nameToRegion = {};
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
    if (cols[3] === 'Puskesmas') {
      nameToRegion[cols[7].toLowerCase().replace('puskesmas ', '')] = { prov: cols[1], kab: cols[2] };
    }
  }
}

const puskesmasLines = fs.readFileSync('Data_Puskesmas_2026.csv', 'utf8').split('\n');
let matchCount = 0;
let failCount = 0;
for (let i = 1; i < puskesmasLines.length; i++) {
  let line = puskesmasLines[i].trim();
  if (!line) continue;
  const parts = line.split(',');
  if (parts.length >= 4) {
    const pName = parts[2].replace(/"/g, '').toLowerCase().replace('puskesmas ', '');
    if (nameToRegion[pName]) matchCount++;
    else failCount++;
  }
}
console.log(`Matched: ${matchCount}, Failed: ${failCount}`);
