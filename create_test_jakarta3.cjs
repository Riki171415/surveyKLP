const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
console.log(getRegion("TEBET Jl. Tebet Timur Ii No 9 Rt 006 Rw 005 Tebet Kota Adm. Jakarta Selatan DKI Jakarta Non Rawat Inap Perkotaan"));
`;
fs.writeFileSync('test_jakarta3.cjs', runCode);
