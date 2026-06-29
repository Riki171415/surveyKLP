import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown, ChevronUp, MessageSquare, User, Filter, FileText, Cpu, RefreshCw, Check, Key, X, Lightbulb } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';

export default function DashboardKeluhanSentences({ filteredData, isPrinting }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState(null);
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  
  const [expandedThematic, setExpandedThematic] = useState(null);
  const [thematicSummary, setThematicSummary] = useState(null);
  const [isGeneratingThematic, setIsGeneratingThematic] = useState(false);
  const [thematicError, setThematicError] = useState('');

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState(import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');
  const [activeModalContext, setActiveModalContext] = useState(''); // 'keluhan' or 'thematic'

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', tempKey);
    localStorage.setItem('GEMINI_MODEL', tempModel);
    setShowKeyModal(false);
    if (activeModalContext === 'keluhan') {
      handleGenerateGeminiSummary(chartData, totalRespondents, tempKey, tempModel);
    } else if (activeModalContext === 'thematic') {
      handleGenerateThematicSummary(thematicChartData, totalRespondents, tempKey, tempModel);
    }
  };

  const keluhanCategories = {
    'Sistem Rujukan / P-Care / IT': ['pcare', 'p-care', 'sistem', 'internet', 'jaringan', 'error', 'server', 'simpus', 'lemot', 'aplikasi', 'bridging', 'koneksi', 'rujukan', 'bpjs', 'rs', 'fktp', 'lanjutan', 'rumah sakit', 'menolak', 'kuota', 'spesialis', 'zonasi', 'dirujuk'],
    'Beban Kerja & SDM': ['beban', 'sdm', 'tenaga', 'kurang', 'sibuk', 'waktu', 'lelah', 'dokter', 'petugas', 'perawat', 'kapasitas', 'pasien banyak', 'kekurangan', 'merangkap'],
    'Obat / Farmasi (PRB)': ['obat', 'farmasi', 'stok', 'apotek', 'resep', 'kosong', 'formularium', 'prb', 'ketersediaan'],
    'Pembiayaan / Kapitasi': ['kapitasi', 'biaya', 'dana', 'uang', 'klaim', 'bayar', 'insentif', 'pembiayaan', 'anggaran', 'jasa', 'remunerasi'],
    'Sarana & Prasarana': ['sarana', 'prasarana', 'alat', 'alkes', 'usg', 'reagen', 'gedung', 'fasilitas', 'ruangan', 'tempat'],
    'Karakteristik & Edukasi Pasien': ['pasien', 'pemahaman', 'edukasi', 'masyarakat', 'karakter', 'komplain', 'nolak', 'bandel', 'tidak paham', 'kesadaran'],
    'SOP & Regulasi': ['sop', 'aturan', 'prosedur', 'kebijakan', 'regulasi', 'kaku', 'syarat', 'standar', 'birokrasi', 'administrasi']
  };

  const thematicCategories = {
    'Cakupan Manfaat & Standar Pelayanan': ['cakupan', 'manfaat', 'standar', 'pelayanan', 'mutu', 'kualitas', 'layanan'],
    'Penguatan Kompetensi SDM': ['kompetensi', 'sdm', 'pelatihan', 'pendidikan', 'keahlian', 'skill', 'bimbingan', 'pengembangan', 'sosialisasi'],
    'Ketersediaan Sumber Daya': ['sumber daya', 'fasilitas', 'sarana', 'prasarana', 'alat', 'alkes', 'obat', 'ketersediaan', 'stok', 'infrastruktur'],
    'Mekanisme Pembiayaan': ['pembiayaan', 'mekanisme', 'dana', 'anggaran', 'kapitasi', 'klaim', 'tarif', 'bayar', 'insentif', 'honor']
  };

  // Helper untuk regex pencocokan kata (word boundaries) agar aman (contoh: "rs" tidak terdeteksi di "tersebut")
  const buildRegexes = (categories) => {
    const regexes = {};
    Object.keys(categories).forEach(cat => {
      regexes[cat] = categories[cat].map(kw => {
        // Jika keyword mengandung spasi atau tanda baca khusus, butuh penanganan ekstra
        const escapedKw = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`\\b${escapedKw}\\b`, 'i');
      });
    });
    return regexes;
  };

  const keluhanRegexes = useMemo(() => buildRegexes(keluhanCategories), []);
  const thematicRegexes = useMemo(() => buildRegexes(thematicCategories), []);

  const { chartData, thematicChartData, totalRespondents } = useMemo(() => {
    const results = {};
    const thematicResults = {};
    
    Object.keys(keluhanCategories).forEach(cat => {
      results[cat] = { sentences: [], respondents: new Set() };
    });
    Object.keys(thematicCategories).forEach(cat => {
      thematicResults[cat] = { sentences: [], respondents: new Set() };
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
            
            // Evaluasi Keluhan
            Object.keys(keluhanCategories).forEach(cat => {
              if (keluhanRegexes[cat].some(regex => regex.test(lowerS))) {
                results[cat].sentences.push({ 
                  text: sentence, 
                  fktp: row.fktp_name || 'Tidak diketahui', 
                  role: row.role || 'Lainnya', 
                  q: `W${i+1}` 
                });
                results[cat].respondents.add(row.id);
              }
            });

            // Evaluasi Tematik Kebijakan
            Object.keys(thematicCategories).forEach(cat => {
              if (thematicRegexes[cat].some(regex => regex.test(lowerS))) {
                thematicResults[cat].sentences.push({ 
                  text: sentence, 
                  fktp: row.fktp_name || 'Tidak diketahui', 
                  role: row.role || 'Lainnya', 
                  q: `W${i+1}` 
                });
                thematicResults[cat].respondents.add(row.id);
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

    const thematicData = Object.keys(thematicResults).map(cat => ({
      name: cat,
      value: thematicResults[cat].respondents.size,
      percent: total > 0 ? ((thematicResults[cat].respondents.size / total) * 100).toFixed(1) : 0,
      sentences: thematicResults[cat].sentences
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    return { chartData: data, thematicChartData: thematicData, totalRespondents: total };
  }, [filteredData, keluhanRegexes, thematicRegexes]);

  const callGeminiApi = async (prompt, overrideKey, overrideModel) => {
    const apiKey = overrideKey || localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    const model = overrideModel || localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3 }
      })
    });

    if (!response.ok) {
      if (response.status === 503) {
        throw new Error("Server Gemini Google sedang sibuk/overload (Error 503). Silakan coba beberapa saat lagi.");
      } else if (response.status === 400 || response.status === 403) {
        throw new Error("API Key tidak valid atau terblokir (Error " + response.status + "). Silakan periksa kembali API Key Anda.");
      } else if (response.status === 404) {
        throw new Error("Model Gemini yang diminta tidak ditemukan (Error 404). Cek pengaturan model Anda.");
      }
      throw new Error("Gagal terhubung ke API Gemini (Status: " + response.status + ").");
    }
    
    const resData = await response.json();
    return resData.candidates[0].content.parts[0].text;
  };

  const handleGenerateGeminiSummary = async (data, total, overrideKey, overrideModel) => {
    try {
      setIsGeneratingGemini(true);
      setGeminiError('');
      
      const allCategories = data.map(d => `${d.name} (${d.percent}%)`).join(', ');
      
      const prompt = `Kamu adalah pakar kebijakan publik dan analis kesehatan (Senior Qualitative Data Analyst). Berdasarkan hasil ekstraksi data dari seluruh pertanyaan wawancara kualitatif (W1 hingga W8), kami telah mengelompokkan keluhan dari ${total} responden tenaga medis di FKTP ke dalam masalah-masalah utama. Berikut adalah persentase responden yang mengeluhkan tiap kategori masalah (diurutkan dari yang paling banyak):
${allCategories}.
      
Tolong buatkan Ringkasan Eksekutif Ilmiah (sekitar 2-3 paragraf) berdasarkan keseluruhan profil masalah tersebut. Bahas urgensi intervensi struktural (fokus pada masalah-masalah dominan), dampaknya terhadap mutu pelayanan komprehensif seperti Program Rujuk Balik (PRB) atau peran Sp.KKLP, serta berikan rekomendasi strategis (misal: debirokratisasi, evaluasi kebijakan, dll). 
Gunakan gaya bahasa akademik, formal, analitis, dan bernada laporan eksekutif resmi. Format output langsung paragraf teks saja (gunakan tag <strong> HTML untuk penekanan pada kata kunci jika perlu, jangan gunakan format markdown seperti **).`;

      const text = await callGeminiApi(prompt, overrideKey, overrideModel);
      setGeminiSummary(text);
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setActiveModalContext('keluhan');
        setTempKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setTempModel(localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');
        setShowKeyModal(true);
      } else {
        setGeminiError(err.message || 'Terjadi kesalahan saat memanggil Gemini API.');
      }
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  const handleGenerateThematicSummary = async (data, total, overrideKey, overrideModel) => {
    try {
      setIsGeneratingThematic(true);
      setThematicError('');
      
      const allCategories = data.map(d => `${d.name} (${d.percent}%)`).join(', ');
      
      const prompt = `Kamu adalah Ahli Evaluasi Kebijakan Kesehatan. Kami telah menyeleksi hasil wawancara dari ${total} responden nakes di FKTP ke dalam 4 Pilar Kebijakan Utama JKN. Berikut adalah persentase responden yang secara spesifik menyinggung atau mengeluhkan pilar-pilar kebijakan tersebut dalam kalimat mereka:
${allCategories}.
      
Tolong buatkan Analisis Tematik Kebijakan (sekitar 2-3 paragraf) yang membahas keterkaitan antara keempat pilar tersebut di lapangan. Bagaimana gap antara "Cakupan Manfaat" dan "Ketersediaan Sumber Daya" memengaruhi jalannya pelayanan? Apakah "Mekanisme Pembiayaan" sudah sejalan dengan tuntutan "Penguatan Kompetensi SDM"? 
Gunakan gaya bahasa akademik, tajam, komprehensif, dan bernada evaluasi strategis. Format output langsung paragraf teks saja (gunakan tag <strong> HTML untuk penekanan pada kata kunci utama).`;

      const text = await callGeminiApi(prompt, overrideKey, overrideModel);
      setThematicSummary(text);
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setActiveModalContext('thematic');
        setTempKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setTempModel(localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');
        setShowKeyModal(true);
      } else {
        setThematicError(err.message || 'Terjadi kesalahan saat memanggil Gemini API.');
      }
    } finally {
      setIsGeneratingThematic(false);
    }
  };

  const renderSummarySection = (data, total, isThematic = false) => {
    if (data.length === 0) return null;
    
    const title = isThematic ? "Analisis Eksekutif Pilar Tematik" : "Ringkasan Eksekutif Analisis Kualitatif";
    const Icon = isThematic ? Lightbulb : FileText;
    const summaryData = isThematic ? thematicSummary : geminiSummary;
    const errorData = isThematic ? thematicError : geminiError;
    const isGenerating = isThematic ? isGeneratingThematic : isGeneratingGemini;
    const generateFn = isThematic ? handleGenerateThematicSummary : handleGenerateGeminiSummary;
    const defaultParagraphs = isThematic ? (
      <p>Berdasarkan pengelompokan semantik terhadap 4 Pilar Kebijakan JKN, teridentifikasi bahwa aspek operasional utama masih terpusat pada isu <strong>{data[0]?.name}</strong> ({data[0]?.percent}%). Hasil ini menunjukkan diperlukannya penyelarasan mendalam antara regulasi strategis dengan ketersediaan di tingkat Fasilitas Kesehatan Tingkat Pertama.</p>
    ) : (
      <p>
        Berdasarkan ekstraksi data kualitatif dari <strong>{total}</strong> responden tenaga medis di berbagai Fasilitas Kesehatan Tingkat Pertama (FKTP), analisis menunjukkan bahwa hambatan operasional utama dalam implementasi program JKN secara signifikan didominasi oleh isu <strong>{data[0]?.name}</strong>, yang dikeluhkan secara eksplisit oleh <strong>{data[0]?.percent}%</strong> responden. Tingginya prevalensi keluhan pada sektor ini mengindikasikan adanya urgensi intervensi struktural guna memperbaiki tata kelola dan efisiensi pelayanan langsung di lapangan. 
      </p>
    );

    return (
      <div className={`border p-8 rounded-2xl shadow-sm relative overflow-hidden ${isThematic ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'}`}>
        {showKeyModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowKeyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Key className="w-5 h-5"/></div>
                <h3 className="text-lg font-bold text-slate-800">Set Gemini API Key</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Masukkan API Key Anda untuk menghubungkan data wawancara ini dengan mesin LLM Gemini secara langsung.</p>
              <input type="password" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="AIzaSy..." className="w-full border border-slate-200 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
              <p className="text-sm text-slate-600 mb-2">Versi Model Gemini:</p>
              <input type="text" value={tempModel} onChange={e => setTempModel(e.target.value)} placeholder="gemini-1.5-pro" className="w-full border border-slate-200 rounded-xl px-4 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
              <button onClick={handleSaveKey} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition">Simpan & Mulai Analisis</button>
            </div>
          </div>,
          document.body
        )}
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Icon className={`w-32 h-32 ${isThematic ? 'text-amber-600' : 'text-indigo-600'}`} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className={`text-lg font-bold flex items-center ${isThematic ? 'text-amber-900' : 'text-indigo-900'}`}>
              <Icon className={`w-6 h-6 mr-2 ${isThematic ? 'text-amber-600' : 'text-indigo-600'}`} /> {title}
            </h3>
            
            {!isPrinting && (
              summaryData ? (
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200"><Check className="w-4 h-4" /> Digenerate oleh Gemini AI</div>
              ) : (
                <button 
                  onClick={() => generateFn(data, total)} 
                  disabled={isGenerating}
                  className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 ${isThematic ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  {isGenerating ? 'Menganalisis...' : 'Generate AI Report'}
                </button>
              )
            )}
          </div>
          
          {errorData && <p className="text-xs text-rose-500 font-medium mb-4">{errorData}</p>}

          <div className="text-sm text-slate-700 leading-relaxed text-justify space-y-4">
            {summaryData ? (
              <div dangerouslySetInnerHTML={{ __html: summaryData.replace(/\n\n/g, '<br/><br/>') }} />
            ) : defaultParagraphs}
          </div>
        </div>
      </div>
    );
  };

  const renderAccordionList = (data, expandedState, setExpandedFn, categoriesDict, colorTheme = "rose") => {
    return (
      <div className="divide-y divide-slate-100">
        {data.map((category) => (
          <div key={category.name} className="group">
            <button 
              onClick={() => setExpandedFn(expandedState === category.name ? null : category.name)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <span className={`w-12 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border ${colorTheme === 'rose' ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-amber-100 text-amber-600 border-amber-200'}`}>
                  {category.percent}%
                </span>
                <div className="text-left">
                  <h4 className="font-bold text-slate-800 text-base">{category.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{category.sentences.length} kutipan kalimat terdeteksi dari {category.value} responden</p>
                </div>
              </div>
              {expandedState === category.name ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedState === category.name && (
              <div className="px-6 pb-6 pt-2 bg-slate-50">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {category.sentences.map((s, idx) => {
                    let highlightedText = s.text;
                    const keywords = categoriesDict[category.name];
                    
                    keywords.forEach(kw => {
                      const escapedKw = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
                      const regex = new RegExp(`(\\b${escapedKw}\\b)`, 'gi');
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
                          <span className={`font-semibold px-2 py-1 rounded-md ${colorTheme === 'rose' ? 'text-rose-600 bg-rose-50' : 'text-amber-600 bg-amber-50'}`}>
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
      {renderSummarySection(chartData, totalRespondents, false)}
      
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
              <h2 className="text-xl font-bold text-slate-800">Analisis Keluhan Berdasarkan Kategori (W1 - W8)</h2>
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
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-500" />
          <h3 className="text-lg font-bold text-slate-800">Daftar Kutipan Aktual (Kategori Masalah)</h3>
        </div>
        {renderAccordionList(chartData, expandedCategory, setExpandedCategory, keluhanCategories, "rose")}
      </div>

      {/* --- SEKSI ANALISIS TEMATIK PILAR KEBIJAKAN --- */}
      <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-800">Analisis Tematik Pilar Kebijakan</h2>
          <p className="text-slate-500">Pemetaan kalimat jawaban yang secara spesifik membahas 4 pilar penting kebijakan JKN.</p>
        </div>

        {renderSummarySection(thematicChartData, totalRespondents, true)}

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-100 bg-amber-50/30 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">Pengelompokan Kutipan per Pilar Kebijakan</h3>
          </div>
          {renderAccordionList(thematicChartData, expandedThematic, setExpandedThematic, thematicCategories, "amber")}
        </div>
      </div>
    </div>
  );
}
