import fs from 'fs';
import path from 'path';

const rawData = fs.readFileSync('./faskes_raw.txt', 'utf8');
const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);

const isProvince = (line) => {
  return line === line.toUpperCase() && !line.includes('PUSKESMAS') && !line.includes('PUKESMAS');
};

let currentProvince = '';
const mapping = {};
const usedUsernames = new Set();

for (const line of lines) {
  if (isProvince(line)) {
    currentProvince = line;
    continue;
  }
  if (line === 'Praktek Mandiri') continue;

  let username = line.toLowerCase()
    .replace(/[^a-z0-9 ]/g, '') // remove special chars
    .trim()
    .replace(/\s+/g, '_');
  
  if (usedUsernames.has(username)) {
    let original = username;
    let counter = 1;
    while(usedUsernames.has(username)) {
      username = original + '_' + counter;
      counter++;
    }
  }
  
  usedUsernames.add(username);

  mapping[username] = {
    nama: line,
    provinsi: currentProvince
  };
}

fs.mkdirSync('./src/data', { recursive: true });
fs.writeFileSync('./src/data/faskesMapping.json', JSON.stringify(mapping, null, 2));
console.log('Mapping JSON created at src/data/faskesMapping.json');
