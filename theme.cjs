const fs = require('fs');

function applyKemenkesTheme(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace backgrounds
  content = content.replace(/bg-slate-900/g, 'bg-slate-50');
  content = content.replace(/bg-slate-800\/\d+/g, 'bg-white shadow-sm');
  content = content.replace(/bg-slate-800/g, 'bg-white');
  content = content.replace(/bg-slate-700\/\d+/g, 'bg-slate-50');
  content = content.replace(/bg-slate-700/g, 'bg-slate-100');

  // Replace borders
  content = content.replace(/border-slate-800/g, 'border-slate-200');
  content = content.replace(/border-slate-700\/\d+/g, 'border-slate-200');
  content = content.replace(/border-slate-700/g, 'border-slate-200');
  content = content.replace(/border-slate-600\/\d+/g, 'border-slate-200');

  // Replace text colors
  content = content.replace(/text-slate-200/g, 'text-slate-700');
  content = content.replace(/text-slate-300/g, 'text-slate-600');
  content = content.replace(/text-slate-400/g, 'text-slate-500');
  content = content.replace(/text-white/g, 'text-slate-800');

  // Fix button/active tab texts that were text-white but got changed to text-slate-800
  content = content.replace(/'bg-primary-600 text-slate-800/g, "'bg-primary-600 text-white");
  content = content.replace(/to-teal-600 text-slate-800/g, "to-teal-600 text-white");
  content = content.replace(/bg-primary-500 text-slate-800/g, "bg-primary-500 text-white");
  content = content.replace(/rounded text-slate-800/g, "rounded text-white");
  content = content.replace(/bg-rose-400\/10 text-slate-800/g, "bg-rose-400/10 text-rose-500");

  // Recharts colors
  content = content.replace(/backgroundColor: '#1e293b'/g, "backgroundColor: '#ffffff'");
  content = content.replace(/color: '#fff'/g, "color: '#334155'");
  content = content.replace(/stroke="#334155"/g, 'stroke="#e2e8f0"');
  content = content.replace(/stroke: '#334155'/g, "stroke: '#e2e8f0'");
  content = content.replace(/fill: '#94a3b8'/g, "fill: '#64748b'");
  content = content.replace(/fill: '#cbd5e1'/g, "fill: '#475569'");
  content = content.replace(/fill="#334155"/g, 'fill="#e2e8f0"');

  // Kemenkes specific accent adjustments
  // Replace text-primary-400 with text-emerald-600 where appropriate, or keep primary if it's sky.
  // We'll keep primary as is since it's defined in tailwind config (could be kemenkes cyan)

  fs.writeFileSync(filePath, content, 'utf8');
}

applyKemenkesTheme('./src/components/KokpitKemenkes.jsx');
applyKemenkesTheme('./src/components/dashboards/DashboardEksekutif.jsx');

console.log('Theme updated to light Kemenkes.');
