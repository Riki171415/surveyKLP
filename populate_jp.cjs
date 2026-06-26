const fs = require('fs');
const csv = fs.readFileSync('v_fasyankes.csv', 'utf8');
const lines = csv.split('\n');
const names = [];
lines.forEach(line => {
  if (line.toLowerCase().includes('jakarta pusat')) {
    const cols = line.split('\",\"');
    if (cols.length > 7) {
      let name = cols[7].replace(/\"/g, '').trim();
      names.push(name);
    }
  }
});

const dpmNames = [];
lines.forEach(line => {
  if (line.toLowerCase().includes('jakarta pusat') && line.toLowerCase().includes('dpm')) {
    const cols = line.split('\",\"');
    if (cols.length > 7) {
      let name = cols[7].replace(/\"/g, '').trim();
      dpmNames.push(name);
    }
  }
});

const path = 'src/data/wilayahMapping.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

if (data.fktp && data.fktp['DKI Jakarta']) {
  data.fktp['DKI Jakarta']['Kota Administrasi Jakarta Pusat'] = Array.from(new Set(names)).sort();
}
if (data.dpm && data.dpm['DKI Jakarta']) {
  data.dpm['DKI Jakarta']['Kota Administrasi Jakarta Pusat'] = Array.from(new Set(dpmNames)).sort();
}

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Added ' + names.length + ' fktp and ' + dpmNames.length + ' dpm to Jakarta Pusat');
