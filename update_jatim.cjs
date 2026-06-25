const fs = require('fs');

const wilayahMappingFile = './src/data/wilayahMapping.json';
const puskesmasFile = './Data_Puskesmas_2026.csv';
const fasyankesFile = './v_fasyankes.csv';

let mapping = JSON.parse(fs.readFileSync(wilayahMappingFile, 'utf8'));

if (!mapping.fktp['Jawa Timur']) mapping.fktp['Jawa Timur'] = {};
if (!mapping.dpm['Jawa Timur']) mapping.dpm['Jawa Timur'] = {};

// We want to replace Jatim data to avoid duplicates, but preserve other provinces
mapping.fktp['Jawa Timur'] = {};
mapping.dpm['Jawa Timur'] = {};

// 1. Parse Puskesmas from Data_Puskesmas_2026.csv
const jatimKeys = [
  "Kota Kediri", "Kota Blitar", "Kota Malang", "Kota Probolinggo", "Kota Pasuruan",
  "Kota Mojokerto", "Kota Madiun", "Kota Surabaya", "Kota Batu",
  "Pacitan", "Ponorogo", "Trenggalek", "Tulungagung", "Blitar", "Kediri",
  "Malang", "Lumajang", "Jember", "Banyuwangi", "Bondowoso", "Situbondo",
  "Probolinggo", "Pasuruan", "Sidoarjo", "Mojokerto", "Jombang", "Nganjuk",
  "Madiun", "Magetan", "Ngawi", "Bojonegoro", "Tuban", "Lamongan",
  "Gresik", "Bangkalan", "Sampang", "Pamekasan", "Sumenep"
];

const getKabKota = (rawText) => {
  for (const k of jatimKeys) {
    if (rawText.includes(k + " Jawa Timur")) {
      if (k.startsWith("Kota ")) return k;
      return "Kab. " + k;
    }
  }
  return "Tidak Diketahui";
};

const puskesmasLines = fs.readFileSync(puskesmasFile, 'utf8').split('\n');
for (let i = 1; i < puskesmasLines.length; i++) {
  const line = puskesmasLines[i].trim();
  if (!line) continue;
  if (!line.includes("Jawa Timur")) continue;

  // Split by comma. Be careful of quotes, though this CSV looks simple.
  const parts = line.split(',');
  if (parts.length >= 4) {
    let namaPuskesmas = parts[2].replace(/"/g, '').trim();
    // In Data_Puskesmas_2026, some names might be uppercase. We keep it as is.
    if (!namaPuskesmas.toLowerCase().includes("puskesmas")) {
      namaPuskesmas = "Puskesmas " + namaPuskesmas;
    }

    const rawText = parts.slice(3).join(',').replace(/"/g, '');
    const kabKota = getKabKota(rawText);

    if (!mapping.fktp['Jawa Timur'][kabKota]) {
      mapping.fktp['Jawa Timur'][kabKota] = [];
    }
    mapping.fktp['Jawa Timur'][kabKota].push(namaPuskesmas);
  }
}

// 2. Parse Klinik and DPM from v_fasyankes.csv
// Format: "id","provinsi","kabupaten","jenis_fasyankes","jenis_pemilik","kode","kode_yankes","nama"
const fasyankesLines = fs.readFileSync(fasyankesFile, 'utf8').split('\n');
for (let i = 1; i < fasyankesLines.length; i++) {
  let line = fasyankesLines[i].trim();
  if (!line) continue;
  
  // Custom CSV parser for simple quoted values
  const cols = [];
  let inQuotes = false;
  let current = '';
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '"') {
      inQuotes = !inQuotes;
    } else if (line[j] === ',' && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += line[j];
    }
  }
  cols.push(current);

  if (cols.length >= 8) {
    const prov = cols[1];
    if (prov === "Jawa Timur") {
      const kab = cols[2];
      const type = cols[3];
      const nama = cols[7];

      if (type === "Klinik") {
        if (!mapping.fktp['Jawa Timur'][kab]) mapping.fktp['Jawa Timur'][kab] = [];
        if (!mapping.fktp['Jawa Timur'][kab].includes(nama)) {
          mapping.fktp['Jawa Timur'][kab].push(nama);
        }
      } else if (type === "Dokter Praktik Mandiri") {
        if (!mapping.dpm['Jawa Timur'][kab]) mapping.dpm['Jawa Timur'][kab] = [];
        if (!mapping.dpm['Jawa Timur'][kab].includes(nama)) {
          mapping.dpm['Jawa Timur'][kab].push(nama);
        }
      }
    }
  }
}

fs.writeFileSync(wilayahMappingFile, JSON.stringify(mapping, null, 2));
console.log("SUCCESS");
