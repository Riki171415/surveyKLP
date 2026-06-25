const fs = require('fs');

const file = './src/data/wilayahMapping.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

// Filter logic
const specificFilters = {
  'DI Yogyakarta': ['Kab. Bantul', 'Kab. Gunungkidul', 'Kota Yogyakarta'],
  'Jawa Barat': ['Kab. Bandung', 'Kota Bandung', 'Kota Bogor', 'Kab. Bogor'],
  'Jawa Tengah': ['Kab. Purworejo', 'Kab. Blora', 'Kab. Batang'],
  'DKI Jakarta': ['Kota Jakarta Utara', 'Kota Jakarta Timur', 'Kota Jakarta Selatan', 'Kota Jakarta Barat', 'Jakarta Utara', 'Jakarta Timur', 'Jakarta Selatan', 'Jakarta Barat'], // Wilayah administratif might not have 'Kota Administrasi' exactly
  'Lampung': ['Kab. Way Kanan', 'Kab. Lampung Timur', 'Kab. Lampung Tengah', 'Kab. Lampung Selatan', 'Kota Metro', 'Kota Bandar Lampung'],
  'Sumatera Barat': ['Kota Padang', 'Kota Bukittinggi', 'Kab. Pasaman Barat', 'Kab. Dharmasraya', 'Kab. Agam'],
  'Bali': ['Kota Denpasar', 'Kab. Tabanan', 'Kab. Klungkung', 'Kab. Jembrana', 'Kab. Gianyar'],
  'Sumatera Utara': ['Kota Medan', 'Kab. Mandailing Natal', 'Kab. Karo', 'Kab. Deli Serdang']
};

const normalizeName = (s) => s.toLowerCase().replace(/^(kabupaten|kab\.|kota administrasi|kota)\s+/g, '').replace(/[^a-z0-9]/g, '');

for (const prov in specificFilters) {
  const allowedNorm = specificFilters[prov].map(normalizeName);
  
  if (data.fktp[prov]) {
    const newKabs = {};
    for (const kab in data.fktp[prov]) {
      if (allowedNorm.includes(normalizeName(kab))) {
        newKabs[kab] = data.fktp[prov][kab];
      }
    }
    data.fktp[prov] = newKabs;
  }
  
  if (data.dpm[prov]) {
    const newKabs = {};
    for (const kab in data.dpm[prov]) {
      if (allowedNorm.includes(normalizeName(kab))) {
        newKabs[kab] = data.dpm[prov][kab];
      }
    }
    data.dpm[prov] = newKabs;
  }
}

fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Filtered strictly to the specified Kab/Kota for the 8 provinces.');
