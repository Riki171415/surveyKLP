const fs = require('fs');
let content = fs.readFileSync('./src/components/KokpitKemenkes.jsx', 'utf8');

content = content.replace(/bg-gradient-to-r from-primary-900\/40 to-emerald-900\/40/g, 'bg-emerald-50');
content = content.replace(/shadow-primary-900\/20/g, 'shadow-sm');

fs.writeFileSync('./src/components/KokpitKemenkes.jsx', content, 'utf8');
console.log('Fixed gradient bg');
