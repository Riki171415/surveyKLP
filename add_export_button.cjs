const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const dashboardsDir = path.join(componentsDir, 'dashboards');

const filesToProcess = [
  path.join(componentsDir, 'KokpitKemenkes.jsx'),
  ...fs.readdirSync(dashboardsDir).filter(f => f.endsWith('.jsx')).map(f => path.join(dashboardsDir, f))
];

let modifiedCount = 0;

filesToProcess.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('<ResponsiveContainer')) return;
  
  let changed = false;
  if (!content.includes('import ExportButton')) {
    const depth = file.includes('dashboards') ? '../ExportButton' : './ExportButton';
    content = content.replace(/(import React.*?;\n)/, `$1import ExportButton from '${depth}';\n`);
    changed = true;
  }

  const regex = /<h3 className="([^"]*?flex items-center[^"]*?)"(.*?)>(.*?)<\/h3>/g;
  content = content.replace(regex, (match, classes, attrs, inner) => {
    if (inner.includes('ExportButton')) return match;
    changed = true;
    let cleanTitle = inner.replace(/<[^>]*>?/gm, '').trim();
    if (cleanTitle.startsWith('{') || cleanTitle === '') cleanTitle = 'Grafik';
    return `<div className="flex justify-between items-start mb-6">\n            <h3 className="${classes}"${attrs}>${inner}</h3>\n            {!isPrinting && <ExportButton fileName="${cleanTitle}" />}\n          </div>`;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Modified', path.basename(file));
  }
});

console.log('Done! Modified ' + modifiedCount + ' files.');