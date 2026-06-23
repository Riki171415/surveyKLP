const fs = require('fs');

function fixColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix emerald text that's too light for white background
  content = content.replace(/text-emerald-100\/80/g, 'text-slate-600');
  content = content.replace(/text-emerald-100/g, 'text-slate-600');
  content = content.replace(/text-emerald-200/g, 'text-emerald-700');
  content = content.replace(/text-emerald-300/g, 'text-emerald-700');
  content = content.replace(/text-emerald-400/g, 'text-emerald-600');

  // Fix indigo/blue text
  content = content.replace(/text-indigo-100/g, 'text-slate-600');
  content = content.replace(/text-indigo-200/g, 'text-indigo-700');
  content = content.replace(/text-indigo-300/g, 'text-indigo-600');
  content = content.replace(/text-indigo-400/g, 'text-indigo-600');
  
  // Fix rose/red text
  content = content.replace(/text-rose-100/g, 'text-slate-600');
  content = content.replace(/text-rose-200/g, 'text-rose-700');
  content = content.replace(/text-rose-300/g, 'text-rose-600');
  content = content.replace(/text-rose-400/g, 'text-rose-600');

  // Fix amber/yellow text
  content = content.replace(/text-amber-100/g, 'text-slate-600');
  content = content.replace(/text-amber-200/g, 'text-amber-700');
  content = content.replace(/text-amber-300/g, 'text-amber-600');
  content = content.replace(/text-amber-400/g, 'text-amber-600');

  // Fix primary text (which is probably sky or emerald)
  content = content.replace(/text-primary-100/g, 'text-slate-600');
  content = content.replace(/text-primary-200/g, 'text-primary-700');
  content = content.replace(/text-primary-300/g, 'text-primary-600');
  
  // Fix backgrounds that might be hard to read
  content = content.replace(/bg-indigo-500\/10/g, 'bg-indigo-50');
  content = content.replace(/bg-rose-500\/10/g, 'bg-rose-50');
  content = content.replace(/bg-amber-500\/10/g, 'bg-amber-50');
  content = content.replace(/bg-emerald-500\/10/g, 'bg-emerald-50');
  content = content.replace(/bg-primary-500\/10/g, 'bg-primary-50');
  
  // Fix "Rekomendasi Kebijakan Hari Ini" background if it's too dark
  // It looks like a slate/emerald mix. Maybe bg-emerald-900/20 in original?
  content = content.replace(/bg-emerald-900\/20/g, 'bg-emerald-50 border border-emerald-100');
  content = content.replace(/bg-emerald-900\/30/g, 'bg-emerald-50 border border-emerald-100');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

fixColors('./src/components/KokpitKemenkes.jsx');
fixColors('./src/components/dashboards/DashboardEksekutif.jsx');

console.log('Colors fixed!');
