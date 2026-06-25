const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
const debugAddFaskesStrict = (pProv, pKab, pNama, type) => {
  let normProv = normalizeStr(pProv);
  if (normProv === 'daerahistimewayogyakarta') normProv = 'diyogyakarta';

  let matchedProv = Object.keys(mapping.fktp).find(provKey => normalizeStr(provKey) === normProv);
  console.log('matchedProv:', matchedProv);
  if (!matchedProv) return false;

  let matchedKab = Object.keys(mapping.fktp[matchedProv]).find(kabKey => normalizeForCompare(kabKey) === normalizeForCompare(pKab));
  console.log('matchedKab:', matchedKab, 'pKab:', pKab, 'normKab:', normalizeForCompare(pKab));
  if (!matchedKab) return false;
  return true;
};
debugAddFaskesStrict('Jawa Barat', 'Kota Bandung', 'SUKARASA', 'puskesmas');
`;
fs.writeFileSync('test_bandung2.cjs', runCode);
