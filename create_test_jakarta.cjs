const fs = require('fs');
const d = fs.readFileSync('generate_final_mapping2.cjs', 'utf8');

const getRegionCode = d.split('const getRegion')[0];

const runCode = getRegionCode + "\nconsole.log(kabMap['DKI Jakarta']);";
fs.writeFileSync('test_jakarta.cjs', runCode);
