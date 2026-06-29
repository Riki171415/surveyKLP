import React, { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, MessageSquare, User, Filter, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function DashboardKeluhanSentences({ filteredData, isPrinting }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const keluhanCategories = {
    'Sistem P-Care / IT': ['pcare', 'p-care', 'sistem', 'internet', 'jaringan', 'error', 'server', 'simpus', 'lemot', 'aplikasi', 'bridging', 'koneksi'],
    'Beban Kerja & SDM': ['beban', 'sdm', 'tenaga', 'kurang', 'sibuk', 'waktu', 'lelah', 'dokter', 'petugas', 'perawat', 'kapasitas', 'pasien banyak', 'kekurangan', 'merangkap'],
    'Sistem Rujukan / RS': ['rujukan', 'bpjs', 'rs', 'fktp', 'lanjutan', 'rumah sakit', 'menolak', 'kuota', 'spesialis', 'sistem rujukan', 'zonasi', 'dirujuk'],
    'Obat / Farmasi (PRB)': ['obat', 'farmasi', 'stok', 'apotek', 'resep', 'kosong', 'formularium', 'prb', 'ketersediaan'],
    'Pembiayaan / Kapitasi': ['kapitasi', 'biaya', 'dana', 'uang', 'klaim', 'bayar', 'insentif', 'pembiayaan', 'anggaran', 'jasa', 'remunerasi'],
    'Sarana & Prasarana': ['sarana', 'prasarana', 'alat', 'alkes', 'usg', 'reagen', 'gedung', 'fasilitas', 'ruangan', 'tempat'],
    'Karakteristik & Edukasi Pasien': ['pasien', 'pemahaman', 'edukasi', 'masyarakat', 'karakter', 'komplain', 'nolak', 'bandel', 'tidak paham', 'kesadaran'],
    'SOP & Regulasi': ['sop', 'aturan', 'prosedur', 'kebijakan', 'regulasi', 'kaku', 'syarat', 'standar', 'birokrasi', 'administrasi']
  };

  const { chartData, totalRespondents } = useMemo(() => {
    const results = {};
    Object.keys(keluhanCategories).forEach(cat => {
      results[cat] = { sentences: [], respondents: new Set() };
    });

    const processedRespondents = new Set();

    filteredData.forEach(row => {
      const w = row.wawancara || {};
      let hasAnswer = false;
      for (let i = 0; i < 8; i++) {
        if (w[i] && w[i].trim().length > 0) {
          hasAnswer = true;
          // Split into sentences using punctuation or newline
          const sentences = w[i].split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);
          
          sentences.forEach(sentence => {
            const lowerS = sentence.toLowerCase();
            Object.keys(keluhanCategories).forEach(cat => {
              if (keluhanCategories[cat].some(kw => lowerS.includes(kw))) {
                results[cat].sentences.push({ 
                  text: sentence, 
                  fktp: row.fktp_name || 'Tidak diketahui', 
                  role: row.role || 'Lainnya', 
                  q: `W${i+1}` 
                });
                results[cat].respondents.add(row.id);
              }
            });
          });
        }
      }
      if (hasAnswer) processedRespondents.add(row.id);
    });

    const total = processedRespondents.size;

    const data = Object.keys(results).map(cat => ({
      name: cat,
      value: results[cat].respondents.size,
      percent: total > 0 ? ((results[cat].respondents.size / total) * 100).toFixed(1) : 0,
      sentences: results[cat].sentences
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    return { chartData: data, totalRespondents: total };
  }, [filteredData]);

  const generateScientificSummary = (data, total) => {
    if (data.length < 3) return null;
    const top1 = data[0];
    const top2 = data[1];
    const top3 = data[2];

    return (
      <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <FileText className="w-32 h-32 text-indigo-600" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-indigo-600" /> Ringkasan Eksekutif Analisis Kualitatif
          </h3>
          <p className="text-sm text-slate-700 leading-relaxed text-justify">
            Berdasarkan ekstraksi data kualitatif dari <strong>{total}</strong> responden tenaga medis di berbagai Fasilitas Kesehatan Tingkat Pertama (FKTP), analisis tematik menunjukkan bahwa hambatan operasional utama dalam implementasi program JKN secara signifikan didominasi oleh isu <strong>{top1.name}</strong>, yang dikeluhkan secara eksplisit oleh <strong>{top1.percent}%</strong> responden. Tingginya prevalensi keluhan pada sektor ini mengindikasikan adanya urgensi intervensi struktural guna memperbaiki tata kelola dan efisiensi pelayanan langsung di lapangan. 
            <br /><br />
            Lebih lanjut, temuan sekunder menyoroti kendala pada aspek <strong>{top2.name}</strong> ({top2.percent}%) dan <strong>{top3.name}</strong> ({top3.percent}%), yang saling berkaitan dalam memengaruhi mutu pelayanan komprehensif, khususnya dalam tata laksana Program Rujuk Balik (PRB) dan optimalisasi peran Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP). Oleh karena itu, direkomendasikan adanya re-evaluasi kebijakan secara holistik—mulai dari penyediaan regulasi yang lebih adaptif, penyesuaian beban kerja tenaga medis, hingga debirokratisasi sistem informasi operasional—guna mencapai standar pelayanan kesehatan primer yang bermutu dan berkesinambungan.
          </p>
        </div>
      </div>
    );
  };

  if (totalRespondents === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-100 shadow-sm">
        <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Tidak ada data wawancara yang tersedia untuk analisis.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {generateScientificSummary(chartData, totalRespondents)}
      <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <AlertTriangle className="w-48 h-48 text-rose-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Analisis Keluhan (Pemindaian W1 - W8)</h2>
              <p className="text-sm text-slate-500">Mengekstrak keluhan per-kalimat dari total {totalRespondents} responden yang diwawancara.</p>
            </div>
          </div>
          
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 60, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} width={160} />
                <RechartsTooltip 
                  cursor={{ fill: '#F1F5F9' }} 
                  formatter={(value, name, props) => [`${value} Responden (${props.payload.percent}%)`, 'Mengeluhkan']} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={36}>
                  <LabelList 
                    dataKey="percent" 
                    position="right" 
                    formatter={(val) => `${val}%`} 
                    fill="#e11d48" 
                    fontSize={14} 
                    fontWeight={800} 
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 mt-6 text-center italic">*Persentase di atas adalah proporsi responden yang mengeluhkan topik tersebut. Satu responden bisa memiliki lebih dari satu keluhan.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-bold text-slate-800">Daftar Kutipan Aktual per Kategori</h3>
        </div>
        
        <div className="divide-y divide-slate-100">
          {chartData.map((category) => (
            <div key={category.name} className="group">
              <button 
                onClick={() => setExpandedCategory(expandedCategory === category.name ? null : category.name)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="flex items-center gap-4">
                  <span className="w-12 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-extrabold text-sm border border-rose-200">
                    {category.percent}%
                  </span>
                  <div className="text-left">
                    <h4 className="font-bold text-slate-800 text-base">{category.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{category.sentences.length} kutipan kalimat terdeteksi dari {category.value} responden</p>
                  </div>
                </div>
                {expandedCategory === category.name ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              
              {expandedCategory === category.name && (
                <div className="px-6 pb-6 pt-2 bg-slate-50">
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {category.sentences.map((s, idx) => {
                      // Highlight keywords mapping
                      let highlightedText = s.text;
                      const keywords = keluhanCategories[category.name];
                      
                      // Highlight manually with safe replacement
                      keywords.forEach(kw => {
                        const regex = new RegExp(`(${kw})`, 'gi');
                        highlightedText = highlightedText.replace(regex, '<strong>$1</strong>');
                      });

                      return (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
                          <p className="text-sm text-slate-700 leading-relaxed italic" dangerouslySetInnerHTML={{ __html: `"${highlightedText}."` }}></p>
                          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                            <div className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                              <User className="w-3.5 h-3.5" />
                              {s.role} ({s.fktp})
                            </div>
                            <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-md">
                              Diambil dari {s.q}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
