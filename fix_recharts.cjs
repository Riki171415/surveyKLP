const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src/components', (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix ResponsiveContainer crashes by enforcing a minHeight and minWidth directly on the component
    // Recharts 2.x supports minHeight and minWidth on ResponsiveContainer.
    // Also, we change width="100%" to width="99%" to avoid ResizeObserver loops in flex containers
    content = content.replace(/<ResponsiveContainer width="100%" height="100%">/g, '<ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>');
    content = content.replace(/<ResponsiveContainer width="100%" height={300}>/g, '<ResponsiveContainer width="99%" height={300} minHeight={250} minWidth={0}>');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed', filePath);
    }
  }
});
