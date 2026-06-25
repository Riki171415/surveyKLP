const fs = require('fs');

const file = './src/data/wilayahMapping.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const allowed = [
  "Aceh",
  "Bali",
  "DI Yogyakarta",
  "DKI Jakarta",
  "Gorontalo",
  "Jambi",
  "Jawa Barat",
  "Jawa Tengah",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kepulauan Bangka Belitung",
  "Kepulauan Riau",
  "Lampung",
  "Riau",
  "Sulawesi Selatan",
  "Sulawesi Utara",
  "Sumatera Barat",
  "Sumatera Selatan",
  "Sumatera Utara"
];

const newFktp = {};
const newDpm = {};

for (const prov of allowed) {
  if (data.fktp[prov]) newFktp[prov] = data.fktp[prov];
  if (data.dpm[prov]) newDpm[prov] = data.dpm[prov];
}

const finalData = {
  fktp: newFktp,
  dpm: newDpm
};

fs.writeFileSync(file, JSON.stringify(finalData, null, 2));
console.log("Filtered to 19 provinces.");
