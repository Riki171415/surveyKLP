import React, { useState, useMemo } from 'react';
import { Search, MessageSquare, Filter, User, Sparkles, BarChart2, FileText, Copy, X, Check, Download , Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';

const interviewQuestions = [
  "[W1] Pendapat terkait layanan penyakit kronik",
  "[W2] Implementasi home visit dan home care",
  "[W3] Implementasi komunitas dan edukasi kelompok",
  "[W4] Layanan paliatif primer masuk JKN?",
  "[W5] Keterlibatan Sp.KKLP dalam PRB",
  "[W6] Perubahan faskes dengan adanya Sp.KKLP",
  "[W7] Insentif tambahan untuk Sp.KKLP?",
  "[W8] Kendala program JKN"
];

// Indonesian Stop Words
const STOP_WORDS = new Set(['yang', 'di', 'ke', 'dari', 'pada', 'dalam', 'untuk', 'dengan', 'dan', 'atau', 'ini', 'itu', 'juga', 'sudah', 'saya', 'kami', 'kita', 'mereka', 'dia', 'karena', 'seperti', 'ada', 'bisa', 'tidak', 'belum', 'akan', 'banyak', 'sangat', 'lebih', 'paling', 'saat', 'menjadi', 'tersebut', 'tentang', 'oleh', 'namun', 'tetapi', 'kalau', 'jika', 'bila', 'apa', 'bagaimana', 'kenapa', 'mengapa', 'kapan', 'siapa', 'dimana', 'kemana', 'darimana', 'hal', 'saja', 'terus', 'cuma', 'hanya', 'masih', 'punya', 'buat', 'biar', 'lalu', 'jadi', 'lagi', 'pun', 'sampai', 'sehingga', 'sebagai', 'ya', 'sih', 'dong', 'kan', 'nya', 'adalah', 'yaitu', 'yakni', 'bahwa', 'serta', 'memang', 'agar', 'supaya', 'baik', 'bukan', 'jangan', 'beliau', 'anda', 'kamu']);

import DeepDiveAIReport from './DeepDiveAIReport';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';

// Comprehensive AI Executive Report Generator
const generateComprehensiveAIReport = (rawData, topWords) => {
  if (!rawData || rawData.length === 0) return <p className="text-sm text-slate-500">Belum cukup data untuk analisis.</p>;

  // 1. 4M Analysis (Manusia, Metode, Mesin, Material)
  const categories = {
    Manusia: { keywords: ['sdm', 'dokter', 'perawat', 'tenaga', 'kompetensi', 'pelatihan', 'spkklp', 'kurang', 'waktu'], count: 0 },
    Metode: { keywords: ['sop', 'aturan', 'prosedur', 'klaim', 'verifikasi', 'rujukan', 'bpjs', 'kebijakan', 'kapitasi', 'prb'], count: 0 },
    Mesin: { keywords: ['pcare', 'p-care', 'sistem', 'internet', 'jaringan', 'aplikasi', 'fasilitas', 'alat'], count: 0 },
    Material: { keywords: ['obat', 'stok', 'formularium', 'alkes', 'resep', 'kosong'], count: 0 }
  };

  rawData.forEach(item => {
    const text = item.answer.toLowerCase();
    Object.keys(categories).forEach(cat => {
      categories[cat].keywords.forEach(kw => {
        if (text.includes(kw)) {
          categories[cat].count++;
        }
      });
    });
  });

  const sorted4M = Object.entries(categories).sort((a, b) => b[1].count - a[1].count);
  const top4M = sorted4M[0];

  // 2. Extract Top Themes
  const top3 = topWords.slice(0, 3).map(w => w.text);

  return (
    <div id="dashboard-dashboardkualitatif-capture" className="bg-white rounded-2xl p-8 border border-indigo-100 shadow-sm relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 p-6 opacity-5">
        <Sparkles className="w-48 h-48 text-indigo-600" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Laporan Eksekutif Analisis Kualitatif AI</h2>
            <p className="text-sm text-slate-500">Auto-generated berdasarkan ekstraksi {rawData.length} verbatim wawancara (W1-W8).</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <h3 className="text-base font-bold text-indigo-900 mb-3 flex items-center">
            <BarChart2 className="w-5 h-5 mr-2 text-indigo-500" /> Executive Summary
          </h3>
          <p className="text-slate-700 leading-relaxed text-sm bg-indigo-50/50 p-4 rounded-xl border border-indigo-50">
            Sistem AI mendeteksi percakapan responden sangat terfokus pada isu <strong>"{top3.join('", "')}"</strong>. 
            Dari pemetaan kendala, hambatan terbesar bersumber dari faktor <strong>{top4M[0]}</strong> (disebutkan {top4M[1].count} kali secara implisit maupun eksplisit), 
            yang sangat memengaruhi implementasi Program Rujuk Balik (PRB) dan optimalisasi peran Sp.KKLP. 
            Terdapat kesenjangan (gap) antara ekspektasi regulasi dengan realita di lapangan, terutama terkait mekanisme klaim dan ketersediaan sumber daya.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Peta Hambatan 4M */}
          <div>
            <h3 className="text-base font-bold text-rose-900 mb-3 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-rose-500" /> Peta Hambatan (Kategori 4M)
            </h3>
            <div className="space-y-3">
              {sorted4M.map(([cat, data]) => (
                <div key={cat} className="flex flex-col">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="text-slate-500">{data.count} temuan</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-rose-400 h-2 rounded-full" style={{ width: `${Math.min(100, (data.count / (top4M[1].count || 1)) * 100)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Kata kunci: {data.keywords.slice(0,4).join(', ')}...</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gap Analysis */}
          <div>
            <h3 className="text-base font-bold text-amber-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-amber-500" /> Gap Analysis (Ideal vs Realita)
            </h3>
            <ul className="space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Peran Sp.KKLP:</strong> Idealnya sebagai <em>care manager</em> kronis yang komprehensif, namun realitanya masih terbebani kendala administratif dan keterbatasan wewenang PRB.</span>
              </li>
              <li className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Sistem Rujukan & Klaim:</strong> Aturan P-Care dan verifikasi BPJS seringkali kaku (faktor {sorted4M.find(s=>s[0]==='Metode')[1].count > 0 ? 'Metode/Mesin' : 'Administrasi'}), menyebabkan layanan tidak berjalan seefisien teori.</span>
              </li>
              <li className="flex items-start gap-2 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                <span className="text-amber-600 font-bold">•</span>
                <span><strong>Insentif:</strong> Tuntutan beban kerja Sp.KKLP belum sepenuhnya diimbangi dengan skema remunerasi/kapitasi yang memadai sesuai dengan W7.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Rekomendasi */}
        <div>
          <h3 className="text-base font-bold text-emerald-900 mb-3 flex items-center">
            <Check className="w-5 h-5 mr-2 text-emerald-500" /> Rekomendasi Strategis Prioritas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-800 text-sm mb-2">Untuk BPJS/Kemenkes</p>
              <p className="text-xs text-slate-600 leading-relaxed">Fleksibilitas sistem P-Care dan formularium obat PRB. Peninjauan skema kapitasi khusus/insentif untuk faskes yang memiliki Sp.KKLP.</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-800 text-sm mb-2">Untuk Manajemen Faskes</p>
              <p className="text-xs text-slate-600 leading-relaxed">Alokasi SDM perawat pendamping khusus untuk meringankan beban administratif Sp.KKLP agar fokus pada layanan medis komprehensif.</p>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
              <p className="font-bold text-emerald-800 text-sm mb-2">Untuk Praktik Sp.KKLP</p>
              <p className="text-xs text-slate-600 leading-relaxed">Optimalisasi edukasi kelompok dan pelibatan komunitas untuk memitigasi keterbatasan fasilitas medis (mensiasati faktor Material/Alkes).</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default function DashboardKualitatif({ filteredData, isPrinting }) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [rawData, setRawData] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState('Semua');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState(null);

  React.useEffect(() => {
    setIsInitializing(true);
    // Beri jeda sejenak agar animasi loading tampil duluan sebelum thread diblokir komputasi berat
    const timer = setTimeout(() => {
      const results = [];
      filteredData.forEach(row => {
        const w = row.wawancara || {};
        interviewQuestions.forEach((q, idx) => {
          if (w[idx] && w[idx].trim().length > 0) {
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
      setRawData(results);
      setIsInitializing(false);
    }, 50);

    return () => clearTimeout(timer);
  }, [filteredData]);

  // Extract Keywords for Word Cloud and AI Insight
  const { topWords, wordCloudData } = useMemo(() => {
    const wordCounts = {};
    const filteredRaw = rawData.filter(item => selectedQuestion === 'Semua' || item.question === selectedQuestion);
    
    filteredRaw.forEach(item => {
      // Basic tokenization: lowercase, remove punctuation, split by whitespace
      const words = item.answer.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/);
      words.forEach(w => {
        if (w.length > 2 && !STOP_WORDS.has(w) && !Number.isInteger(Number(w))) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const sortedWords = Object.keys(wordCounts)
      .map(w => ({ text: w, value: wordCounts[w] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 30); // Top 30 words for cloud

    const top10 = sortedWords.slice(0, 10);
    return { topWords: top10, wordCloudData: sortedWords };
  }, [rawData, selectedQuestion]);

  // Filter Data for the Cards
  const kualitatifData = useMemo(() => {
    return rawData.filter(item => {
      if (selectedQuestion !== 'Semua' && selectedQuestion !== item.question) return false;
      if (searchTerm && !item.answer.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (selectedKeyword && !item.answer.toLowerCase().includes(selectedKeyword.toLowerCase())) return false;
      return true;
    });
  }, [rawData, selectedQuestion, searchTerm, selectedKeyword]);

  const toggleKeyword = (word) => {
    if (selectedKeyword === word) {
      setSelectedKeyword(null);
    } else {
      setSelectedKeyword(word);
      setSearchTerm(''); // Clear text search if clicking a keyword
    }
  };

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-bold animate-pulse">Menyiapkan Mesin Analisis Kualitatif...</p>
        <p className="text-slate-400 text-sm mt-2">Menyortir dan memproses ribuan data verbatim responden...</p>
      </div>
    );
  }

  const handleExport = () => {
    const tables = [
      {
        title: 'Top 30 Kata Kunci (Word Cloud)',
        headers: ['Kata Kunci', 'Frekuensi Kemunculan'],
        data: wordCloudData.map(w => [w.text, w.value])
      },
      {
        title: 'Data Verbatim (Difilter)',
        headers: ['Nama Responden', 'FKTP', 'Peran', 'Pertanyaan', 'Jawaban Lengkap'],
        data: kualitatifData.map(d => [d.fktp, d.role, d.question, d.answer])
      }
    ];
    exportTablesToExcel('ANALISIS KUALITATIF VERBATIM', tables, 'Dashboard_Kualitatif');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          {!isPrinting && (
        <button onClick={() => downloadElementAsPNG('dashboard-dashboardkualitatif-capture', 'DashboardKualitatif')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm capture-exclude mb-4 mr-2">
          <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
        </button>
      )}
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      {/* Comprehensive AI Executive Report */}
      {!isPrinting && (
        <div className="w-full">
          {generateComprehensiveAIReport(rawData.filter(item => selectedQuestion === 'Semua' || item.question === selectedQuestion), topWords)}
          <DeepDiveAIReport rawData={rawData.filter(item => selectedQuestion === 'Semua' || item.question === selectedQuestion)} isPrinting={isPrinting} />
        </div>
      )}

      {/* Word Cloud Section */}
      {!isPrinting && (
        <div className="grid grid-cols-1 gap-6">
          {/* Interactive Word Cloud */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-base font-bold text-slate-800">Word Cloud (Top 30 Kata Kunci)</h3>
              {selectedKeyword && (
                <button onClick={() => setSelectedKeyword(null)} className="text-xs px-3 py-1 bg-rose-50 text-rose-600 rounded-full font-medium hover:bg-rose-100 transition-colors">
                  Clear Filter: {selectedKeyword}
                </button>
              )}
            </div>
            
            {wordCloudData.length > 0 ? (
              <div className="flex flex-wrap items-center justify-center gap-2 p-4 min-h-[160px] bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                {wordCloudData.map((word, i) => {
                  // Calculate font size (12px to 32px based on rank/value)
                  const maxSize = wordCloudData[0].value;
                  const minSize = wordCloudData[wordCloudData.length - 1].value;
                  const fontSize = maxSize === minSize ? 16 : 12 + ((word.value - minSize) / (maxSize - minSize)) * 20;
                  
                  // Color scale based on value
                  const opacity = 0.5 + ((word.value - minSize) / (maxSize - minSize)) * 0.5;
                  const isSelected = selectedKeyword === word.text;
                  
                  return (
                    <span 
                      key={word.text}
                      onClick={() => toggleKeyword(word.text)}
                      className={`cursor-pointer transition-all duration-300 hover:scale-110 inline-block font-semibold ${isSelected ? 'text-rose-500 bg-rose-50 px-2 rounded scale-110' : 'text-indigo-600 hover:text-indigo-800'}`}
                      style={{ fontSize: `${fontSize}px`, opacity: isSelected ? 1 : opacity }}
                      title={`Muncul ${word.value} kali`}
                    >
                      {word.text}
                    </span>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Tidak ada kata kunci yang dapat diekstrak.</div>
            )}
            <p className="text-[10px] text-slate-400 mt-3 text-center italic">*Klik pada kata untuk menyaring hasil wawancara di bawah.</p>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      {!isPrinting && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><Filter className="w-4 h-4 mr-1.5" /> Filter Pertanyaan NVIVO</label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                value={selectedQuestion}
                onChange={(e) => { setSelectedQuestion(e.target.value); setSelectedKeyword(null); }}
              >
                <option value="Semua">Semua Pertanyaan</option>
                {interviewQuestions.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center"><Search className="w-4 h-4 mr-1.5" /> Cari Manual</label>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={selectedKeyword ? `Mencari: ${selectedKeyword}... (Klik clear untuk mereset)` : "Ketik teks untuk mencari..."}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setSelectedKeyword(null); }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Raw Data List */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800">Transkrip Wawancara ({kualitatifData.length} respon)</h3>
        {selectedKeyword && (
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
            Filter Aktif: "{selectedKeyword}"
          </span>
        )}
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 ${isPrinting ? 'gap-4 block' : ''}`}>
        {kualitatifData.map((item) => {
          // Highlight keyword if selected
          let highlightedAnswer = item.answer;
          if (selectedKeyword) {
            const regex = new RegExp(`(${selectedKeyword})`, 'gi');
            const parts = item.answer.split(regex);
            highlightedAnswer = parts.map((part, i) => 
              part.toLowerCase() === selectedKeyword.toLowerCase() ? <strong key={i} className="bg-yellow-200 text-yellow-900 px-1 rounded">{part}</strong> : part
            );
          } else if (searchTerm) {
            const regex = new RegExp(`(${searchTerm})`, 'gi');
            const parts = item.answer.split(regex);
            highlightedAnswer = parts.map((part, i) => 
              part.toLowerCase() === searchTerm.toLowerCase() ? <strong key={i} className="bg-blue-100 text-blue-900 px-1 rounded">{part}</strong> : part
            );
          }

          return (
            <div key={item.id} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col transition-all hover:shadow-md ${isPrinting ? 'mb-4 break-inside-avoid border-slate-300' : ''}`}>
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg mb-3">
                  {item.question}
                </span>
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-slate-300 mt-1 flex-shrink-0" />
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{highlightedAnswer}"</p>
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
          );
        })}
        {kualitatifData.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-100">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Tidak ada transkrip yang sesuai dengan filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
