import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Filter, User } from 'lucide-react';

const interviewQuestions = [
  "[W1] Pendapat terkait layanan penyakit kronik",
  "[W2] Implementasi home visit dan home care",
  "[W3] Implementasi komunitas dan edukasi kelompok",
  "[W4] Layanan paliatif primer masuk JKN?",
  "[W5] Keterlibatan Sp.KKLP dalam PRB",
  "[W6] Perubahan faskes dengan adanya Sp.KKLP",
  "[W7] Insentif tambahan untuk Sp.KKLP?"
];

export default function DashboardKualitatif({ filteredData, isPrinting }) {
  const [selectedQuestion, setSelectedQuestion] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');

  const kualitatifData = useMemo(() => {
    const results = [];
    filteredData.forEach(row => {
      const w = row.wawancara || {};
      interviewQuestions.forEach((q, idx) => {
        if (w[idx] && w[idx].trim().length > 0) {
          if (selectedQuestion !== 'Semua' && selectedQuestion !== q) return;
          if (searchTerm && !(w[idx] || '').toLowerCase().includes(searchTerm.toLowerCase())) return;
          
          results.push({
            id: `${row.id}-${idx}`,
            fktp: row.fktp_name || 'Tidak diketahui',
            role: row.role || 'Lainnya',
            provinsi: row.provinsi || 'Lainnya',
            question: q,
            answer: w[idx]
          });
        }
      });
    });
    return results;
  }, [filteredData, selectedQuestion, searchTerm]);

  return (
    <div className="space-y-6 animate-fade-in">
      {!isPrinting && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><Filter className="w-4 h-4 mr-1.5" /> Filter Pertanyaan</label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
              >
                <option value="Semua">Semua Pertanyaan</option>
                {interviewQuestions.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><Search className="w-4 h-4 mr-1.5" /> Cari Kata Kunci</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari dalam jawaban..." 
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Hasil Pendalaman Kualitatif ({kualitatifData.length} respon)</h3>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${isPrinting ? 'gap-4 block' : ''}`}>
        {kualitatifData.map((item) => (
          <div key={item.id} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md ${isPrinting ? 'mb-4 break-inside-avoid border-slate-300' : ''}`}>
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg mb-2">
                {item.question}
              </span>
              <div className="flex items-start gap-2">
                <MessageSquare className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <p className="text-sm text-slate-700 leading-relaxed italic">"{item.answer}"</p>
              </div>
            </div>
            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="w-4 h-4 text-slate-400" />
                {item.role}
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-800">{item.fktp}</div>
                <div>{item.provinsi}</div>
              </div>
            </div>
          </div>
        ))}
        {kualitatifData.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada data kualitatif yang sesuai dengan filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
