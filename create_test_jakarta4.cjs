const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
console.log('addFaskesStrict result:', addFaskesStrict('DKI Jakarta', 'Kota Administrasi Jakarta Selatan', 'TEBET', 'puskesmas'));
console.log('mapping contents:', mapping.fktp['DKI Jakarta']['Kota Administrasi Jakarta Selatan']);
`;
fs.writeFileSync('test_jakarta4.cjs', runCode);
