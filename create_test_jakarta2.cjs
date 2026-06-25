const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const puskesmasFile =')[0];

const runCode = getRegionCode + `
console.log(getRegion("GAMBIR Jl. Tanah Abang I No. 10 Gambir Kota Adm. Jakarta Pusat DKI Jakarta Non Rawat Inap Perkotaan"));
`;
fs.writeFileSync('test_jakarta2.cjs', runCode);
