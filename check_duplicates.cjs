const fs = require('fs');

const mapping = JSON.parse(fs.readFileSync('./src/data/faskesMapping.json', 'utf8'));

const byProv = {};
for (const key in mapping) {
  const f = mapping[key];
  if (!byProv[f.provinsi]) byProv[f.provinsi] = [];
  byProv[f.provinsi].push({ key, name: f.nama });
}

const normalize = (str) => {
  return str.toLowerCase()
    .replace(/puskesmas /g, '')
    .replace(/pukesmas /g, '')
    .replace(/pukesms /g, '')
    .replace(/pkm /g, '')
    .replace(/kecamatan /g, 'kec ')
    .replace(/kelurahan /g, 'kel ')
    .replace(/[^a-z0-9]/g, ''); // remove spaces and punctuation
};

let found = false;

for (const prov in byProv) {
  const list = byProv[prov];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const normA = normalize(a.name);
      const normB = normalize(b.name);
      
      // If one contains the other, or they are very similar
      if (normA.includes(normB) || normB.includes(normA)) {
        console.log(`POTENTIAL DUPLICATE IN ${prov}:`);
        console.log(`- ${a.key}: ${a.name}`);
        console.log(`- ${b.key}: ${b.name}`);
        console.log('---');
        found = true;
      }
    }
  }
}

if (!found) console.log("No potential duplicates found.");
