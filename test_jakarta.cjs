const fs = require('fs');
const path = require('path');

const allowedRegions = {
  'DI Yogyakarta': ['bantul', 'gunungkidul', 'yogyakarta'],
  'Jawa Barat': ['bandung', 'bogor'],
  'Jawa Tengah': ['purworejo', 'blora', 'batang'],
  'DKI Jakarta': ['jakarta utara', 'jakarta timur', 'jakarta selatan', 'jakarta barat'],
  'Lampung': ['way kanan', 'lampung timur', 'lampung tengah', 'lampung selatan', 'metro', 'bandar lampung'],
  'Sumatera Barat': ['padang', 'bukittinggi', 'pasaman barat', 'dharmasraya', 'agam'],
  'Bali': ['denpasar', 'tabanan', 'klungkung', 'jembrana', 'gianyar'],
  'Sumatera Utara': ['medan', 'mandailing natal', 'karo', 'deli serdang'],
  'Jambi': 'ALL',
  'Gorontalo': 'ALL',
  'Riau': 'ALL',
  'Kalimantan Tengah': 'ALL',
  'Kepulauan Riau': 'ALL',
  'Sumatera Selatan': 'ALL',
  'Kepulauan Bangka Belitung': 'ALL',
  'Sulawesi Utara': 'ALL',
  'Aceh': 'ALL'
};

const normalizeStr = (s) => s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
const normalizeForCompare = (s) => s ? s.toLowerCase().replace(/kabupaten /g, '').replace(/kota administrasi /g, '').replace(/kota /g, '').replace(/kab\. /g, '').trim() : '';

const getTitleCase = (str) => {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    .replace('Dki', 'DKI')
    .replace('Diy', 'DIY')
    .replace('Daerah Istimewa Yogyakarta', 'DI Yogyakarta');
};

const mapping = { fktp: {}, dpm: {} };

const csvPath = path.join(__dirname, 'wilayah_administratif.csv');
const csvContent = fs.readFileSync(csvPath, 'utf8');

const provList = [];
const kabMap = {}; // provName -> array of { code, name, searchName }

const provNamesByCode = {};
const lines = csvContent.split(/\r?\n/);
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const parts = line.split(',').map(p => p.replace(/"/g, '').trim());
  if (parts.length < 4) continue;
  
  const kProv = parts[0];
  const kKab = parts[1];
  const kKec = parts[2];
  const nama = parts[3];

  const isProv = (!kKab || kKab === 'NULL') && (!kKec || kKec === 'NULL');
  const isKab = (kKab && kKab !== 'NULL') && (!kKec || kKec === 'NULL');

  if (isProv) {
    const pName = getTitleCase(nama);
    provNamesByCode[kProv] = pName;
    provList.push({ code: kProv, name: pName });
  } else if (isKab) {
    const provName = provNamesByCode[kProv];
    if (provName) {
      if (!kabMap[provName]) kabMap[provName] = [];
      const titleName = getTitleCase(nama);
      // FIXED SEARCH NAME EXTRACTION
      let searchName = titleName.replace(/^(Kab\.|Kabupaten|Kota Administrasi|Kota)\s+/, ''); 
      kabMap[provName].push({ code: kKab, name: titleName, searchName });
      
      // Filter mapping
      const allowedProvKey = Object.keys(allowedRegions).find(p => normalizeStr(p) === normalizeStr(provName));
      if (allowedProvKey) {
        const allowedKabs = allowedRegions[allowedProvKey];
        const kabNameClean = normalizeForCompare(titleName);
        let isKabAllowed = false;
        if (allowedKabs === 'ALL') {
          isKabAllowed = true;
        } else {
          isKabAllowed = allowedKabs.some(ak => kabNameClean.includes(normalizeForCompare(ak)));
        }

        if (isKabAllowed) {
          if (!mapping.fktp[allowedProvKey]) {
            mapping.fktp[allowedProvKey] = {};
            mapping.dpm[allowedProvKey] = {};
          }
          if (!mapping.fktp[allowedProvKey][titleName]) {
            mapping.fktp[allowedProvKey][titleName] = [];
            mapping.dpm[allowedProvKey][titleName] = [];
          }
        }
      }
    }
  }
}

// Papua DOB
const newPapuaProvinces = [
  {name: 'Papua Barat Daya', kabs: ['Kota Sorong', 'Sorong', 'Sorong Selatan', 'Raja Ampat', 'Tambrauw', 'Maybrat']},
  {name: 'Papua Pegunungan', kabs: ['Jayawijaya', 'Keerom', 'Lanny Jaya', 'Mamberamo Raya', 'Mamberamo Tengah', 'Nduga', 'Pegunungan Bintang', 'Sarmi', 'Supiori', 'Tolikara', 'Waropen', 'Yahukimo', 'Yalimo']},
  {name: 'Papua Selatan', kabs: ['Asmat', 'Boven Digoel', 'Mappi', 'Merauke']},
  {name: 'Papua Tengah', kabs: ['Deiyai', 'Dogiyai', 'Intan Jaya', 'Mimika', 'Nabire', 'Paniai', 'Puncak', 'Puncak Jaya']}
];
for (const p of newPapuaProvinces) {
  provList.push({ code: 'NEW', name: p.name });
  kabMap[p.name] = [];
  for (const k of p.kabs) {
    const isKota = k.startsWith('Kota');
    const titleName = isKota ? k : 'Kab. ' + k;
    kabMap[p.name].push({ code: 'NEW', name: titleName, searchName: k.replace(/^(Kab\.|Kabupaten|Kota Administrasi|Kota)\s+/, '') });
  }
}

provList.sort((a, b) => b.name.length - a.name.length);
for (const prov in kabMap) {
  kabMap[prov].sort((a, b) => b.searchName.length - a.searchName.length);
}


console.log(kabMap['DKI Jakarta']);