const fs = require('fs');

const path = './src/data/faskesMapping.json';
const mapping = JSON.parse(fs.readFileSync(path, 'utf8'));

const keysToDelete = [
  'user_99',  // "Puskesmas  Bandar Jaya"
  'user_111', // "Puskesmas Rasimah Ahmad  Bukittinggi"
  'user_124', // "Pukesmas MUaro Bodi"
  'user_169', // "Puskesmas Bandar Seikijang"
  'user_178', // "Puskesmas Tanjung Medang Kecamatan Rupat Utara"
  'user_96',  // "Puskesmas Rawat Inap Sriwijaya Mataram Lampung Tengah"
  'user_161'  // "Puskesmas Muara Tebo" (assuming duplicate of Tebing Tinggi, Muara Tebo)
];

for (const k of keysToDelete) {
  if (mapping[k]) {
    console.log(`Deleting: ${mapping[k].nama}`);
    delete mapping[k];
  }
}

fs.writeFileSync(path, JSON.stringify(mapping, null, 2));
console.log('Cleaned up duplicates successfully.');
