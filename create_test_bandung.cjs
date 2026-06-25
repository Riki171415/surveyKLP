const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
console.log(getRegion("SUKARASA Jl. Geger Kalong Hilir No. 157 Rt 01/Rt 06 Sukasari Kota Bandung Jawa Barat Non Rawat Inap Perkotaan"));
`;
fs.writeFileSync('test_bandung.cjs', runCode);
