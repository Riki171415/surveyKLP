const fs = require('fs');
const csv = fs.readFileSync('v_fasyankes.csv', 'utf8');
const lines = csv.split('\n');
const fktpNames = [];
const dpmNames = [];

lines.forEach(line => {
  if (line.toLowerCase().includes('jakarta pusat')) {
    const cols = line.split('\",\"');
    if (cols.length > 7) {
      const jenisFasyankes = cols[3].toLowerCase();
      let name = cols[7].replace(/\"/g, '').trim();
      
      if (jenisFasyankes.includes('rumah sakit') || jenisFasyankes.includes('rs') || jenisFasyankes.includes('rsu')) {
        return; // Skip Rumah Sakit
      }

      if (jenisFasyankes.includes('dpm') || jenisFasyankes.includes('praktik mandiri dokter') || name.toLowerCase().includes('dpm')) {
        dpmNames.push(name);
      } else if (jenisFasyankes.includes('puskesmas') || jenisFasyankes.includes('klinik')) {
        fktpNames.push(name);
      }
    }
  }
});

const path = 'src/data/wilayahMapping.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (data.fktp && data.fktp['DKI Jakarta']) {
  data.fktp['DKI Jakarta']['Kota Administrasi Jakarta Pusat'] = Array.from(new Set(fktpNames)).sort();
}
if (data.dpm && data.dpm['DKI Jakarta']) {
  data.dpm['DKI Jakarta']['Kota Administrasi Jakarta Pusat'] = Array.from(new Set(dpmNames)).sort();
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Added ' + fktpNames.length + ' fktp and ' + dpmNames.length + ' dpm to Jakarta Pusat');
