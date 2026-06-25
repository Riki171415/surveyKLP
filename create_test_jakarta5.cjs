const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
const debugAddFaskesStrict = (pProv, pKab, pNama, type) => {
  let normProv = normalizeStr(pProv);
  if (normProv === 'daerahistimewayogyakarta') normProv = 'diyogyakarta';
  if (normProv === 'dkijakarta') normProv = 'dki jakarta'; // Wait! normalizeStr removes spaces! dkijakarta === 'dki jakarta'? NO!
  console.log('normProv:', normProv);

  let matchedProv = Object.keys(mapping.fktp).find(provKey => normalizeStr(provKey) === normProv);
  console.log('matchedProv:', matchedProv);
  if (!matchedProv) return false;

  let matchedKab = Object.keys(mapping.fktp[matchedProv]).find(kabKey => normalizeForCompare(kabKey) === normalizeForCompare(pKab));
  console.log('matchedKab:', matchedKab);
  if (!matchedKab) return false;
  return true;
};
debugAddFaskesStrict('DKI Jakarta', 'Kota Administrasi Jakarta Selatan', 'TEBET', 'puskesmas');
`;
fs.writeFileSync('test_jakarta5.cjs', runCode);
