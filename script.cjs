const fs = require('fs');
const code = fs.readFileSync('src/components/DataManagement.jsx', 'utf-8');

const panelStart = code.indexOf('<div className="flex-1 bg-white');
const panelEnd = code.lastIndexOf(')}');
const jsx = code.substring(panelStart, panelEnd);

const modalJsx = `import React from 'react';
import { X, CheckCircle, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { 
  penyakitPasienBulanan, layananDirujukItems, layananBelumBerjalanItems,
  interviewQuestionsWithSpkklp, interviewQuestionsWithoutSpkklp, relevansiItems, peranSpkklpItems
} from './SurveyForm';
import { jknBenefits, nonOptimalServices, kompetensiLayanan } from './DataManagement';

export default function SurveyDetailModal({ selected, onClose, user, deleteSurvey }) {
  if (!selected) return null;

  const statusBadge = (status) => {
    if (status === 'sudah') return 'bg-emerald-100 text-emerald-700';
    if (status === 'belum') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const scaleBadge = (skala) => {
    if (skala === '4' || skala === 'Sangat Setuju' || skala === 'Ya') return 'bg-emerald-100 text-emerald-700';
    if (skala === '3' || skala === 'Setuju') return 'bg-blue-100 text-blue-700';
    if (skala === '2' || skala === 'Tidak Setuju' || skala === 'Tidak') return 'bg-amber-100 text-amber-700';
    if (skala === '1' || skala === 'Sangat Tidak Setuju') return 'bg-rose-100 text-rose-700';
    return 'bg-slate-100 text-slate-600';
  };

  const SectionHeader = ({ label }) => (
    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 pb-2 border-b border-slate-100 flex items-center gap-2">
      <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
      {label}
    </h4>
  );

  const Field = ({ label, value }) => (
    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xs font-medium text-slate-800">{value || '-'}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in relative">
        <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-start justify-between gap-4 shrink-0 shadow-inner">
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wider text-primary-200 uppercase mb-1">Detail Isian Survey</p>
            <h3 className="font-extrabold text-lg leading-tight tracking-tight">{selected.fktp_name || 'Responden'}</h3>
            <p className="text-xs font-medium text-primary-100 mt-1 opacity-90">{selected.provinsi || selected.city} {selected.kab_kota ? \`· \${selected.kab_kota}\` : ''}</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl shrink-0 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
${jsx.substring(jsx.indexOf('{/* ── A. Informasi Faskes ── */}'))}
    </div>
  );
}
`;

fs.writeFileSync('src/components/SurveyDetailModal.jsx', modalJsx);
console.log('SurveyDetailModal created successfully!');
