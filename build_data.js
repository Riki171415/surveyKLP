const fs = require('fs');

const fasyankesText = fs.readFileSync('v_fasyankes.csv', 'utf8').split('\n');
const kodeMap = new Map();
for (let i = 1; i < fasyankesText.length; i++) {
  const line = fasyankesText[i].trim();
  if (!line) continue;
  const parts = line.split(',');
  if (parts.length >= 7) {
    const prov = parts[1].replace(/\"/g, '');
    const kab = parts[2].replace(/\"/g, '');
    let kode = parts[5].replace(/\"/g, '');
    
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
for(let i=1; i<pusk2026.length; i++) {
  const line = pusk2026[i].trim();
  if(!line) continue;
  const parts = line.split(',');
  const kode = parts[1];
  totalCount++;
  if (kodeMap.has(kode)) {
    matchCount++;
  }
}
console.log('Matches in Data_Puskesmas_2026:', matchCount, '/', totalCount);
