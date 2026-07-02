import React, { useState, useEffect } from 'react';
import { Lightbulb, Key, X, RefreshCw, CheckCircle2, ChevronRight, MessageSquare, Map, AlertCircle, Coins, Scale, BrainCircuit } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const EXPLORATIONS = [
  {
    id: 'gap_literasi',
    title: 'Eksplorasi 1: Gap Pengetahuan Masyarakat',
    icon: MessageSquare,
    desc: 'Menganalisis sejauh mana responden menyadari rendahnya literasi masyarakat tentang Sp.KKLP.',
    prompt: `Analisis teks dari data survei Formulir C berikut untuk mengidentifikasi sejauh mana responden menyadari adanya gap literasi masyarakat tentang Sp.KKLP. Cari pernyataan yang mengindikasikan: (1) pasien tidak paham peran Sp.KKLP, (2) pasien lebih memilih langsung ke spesialis, (3) sosialisasi yang kurang dari pemerintah. Berikan rekomendasi strategi sosialisasi yang dibutuhkan berdasarkan keluhan responden. Output dalam Markdown rapi dengan struktur: ### Temuan Utama, ### Kutipan Relevan (gunakan bullet), dan ### Rekomendasi Strategi.`
  },
  {
    id: 'policy_gap',
    title: 'Eksplorasi 2: Policy-Practice Gap',
    icon: AlertCircle,
    desc: 'Menganalisis keluhan terkait ketidakjelasan regulasi Sp.KKLP di lapangan.',
    prompt: `Lakukan analisis tematik pada teks berikut untuk mengidentifikasi keluhan terkait ketidakjelasan regulasi Sp.KKLP. Kategorikan keluhan ke dalam: (1) ambiguitas definisi/status profesi, (2) belum adanya petunjuk teknis operasional, (3) ketidakjelasan mekanisme kompensasi/insentif. Berikan kutipan verbatim untuk setiap kategori dan rekomendasi regulasi yang diminta responden. Output dalam Markdown rapi dengan struktur: ### Ketidakjelasan Definisi, ### Kekosongan Juknis, ### Isu Kompensasi, dan ### Rekomendasi Kebijakan.`
  },
  {
    id: 'kesiapan_kompetensi',
    title: 'Eksplorasi 3: Kesiapan Kompetensi',
    icon: BrainCircuit,
    desc: 'Mengeksplorasi persepsi responden tentang kesiapan lulusan dan kompetensi Sp.KKLP.',
    prompt: `Analisis teks berikut untuk mengeksplorasi persepsi responden tentang kompetensi Sp.KKLP. Identifikasi pernyataan yang: (1) meragukan kompetensi Sp.KKLP dibanding dokter umum, (2) mempertanyakan kesiapan lulusan, (3) menyoroti kurangnya pengalaman praktis. Output dalam Markdown rapi dengan struktur: ### Persepsi Kompetensi, ### Keraguan Kesiapan, dan ### Area Pengembangan.`
  },
  {
    id: 'ekonomi_insentif',
    title: 'Eksplorasi 4: Dampak Ekonomi & Insentif',
    icon: Coins,
    desc: 'Menganalisis persepsi ekonomi (Cost-Benefit) terhadap kehadiran Sp.KKLP.',
    prompt: `Analisis teks berikut untuk mengeksplorasi persepsi ekonomi responden terhadap Sp.KKLP. Cari tahu: (1) apakah responden melihat Sp.KKLP sebagai investasi yang menguntungkan atau beban biaya, (2) insentif apa yang mereka harapkan (kapitasi khusus, fee-for-service, insentif kinerja), (3) apakah mereka khawatir Sp.KKLP akan menambah biaya operasional. Output dalam Markdown rapi: ### Cost vs Benefit, ### Harapan Insentif, dan ### Kekhawatiran Biaya.`
  },
  {
    id: 'keadilan_distribusi',
    title: 'Eksplorasi 5: Keadilan Distribusi SDM',
    icon: Map,
    desc: 'Menganalisis ketimpangan akses dan persepsi terhadap distribusi Sp.KKLP antar wilayah.',
    prompt: `Gunakan teks berikut untuk melakukan analisis komparatif antar wilayah (perhatikan asal daerah responden jika ada). Identifikasi apakah: (1) keluhan tentang kurangnya Sp.KKLP lebih tinggi di daerah terpencil, (2) harapan terhadap Sp.KKLP berbeda antar wilayah, (3) kendala implementasi JKN lebih berat di daerah dengan akses SDM terbatas. Berikan rekomendasi kebijakan berbasis wilayah dalam format Markdown.`
  },
  {
    id: 'kontradiksi_dilema',
    title: 'Eksplorasi 6: Kontradiksi & Dilema',
    icon: Scale,
    desc: 'Mengidentifikasi polarisasi dan dilema yang dialami responden terkait kebijakan Sp.KKLP.',
    prompt: `Lakukan analisis kontradiksi internal pada teks berikut. Identifikasi pola di mana responden: (1) mendukung konsep Sp.KKLP tetapi meragukan implementasi, (2) menginginkan perluasan layanan tetapi mengeluhkan biaya dan waktu, (3) setuju dengan program rujuk balik tetapi khawatir dengan beban administrasi. Buat tipologi responden berdasarkan dilema yang mereka hadapi dalam format Markdown.`
  }
];

const parseMarkdown = (text) => {
  if (!text) return null;
  const html = text
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-800 mt-6 mb-2 border-b pb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-800 mt-6 mb-3 border-b pb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-800 mt-6 mb-4">$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong class="text-slate-800 font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc mb-1">$1</li>')
    .replace(/\n/gim, '<br />')
    // Fix broken lists that have multiple <br />
    .replace(/(<\/li>)<br \/>/gim, '$1'); 

  return <div dangerouslySetInnerHTML={{ __html: html }} className="text-slate-600 text-sm leading-relaxed" />;
};

export default function DashboardEksplorasiKualitatif({ filteredData, isPrinting }) {
  const [activeTab, setActiveTab] = useState(EXPLORATIONS[0].id);
  const [reports, setReports] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState(import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');

  // Load existing reports from DB
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
        let fetchedReports = [];
        if (useSupabase) {
          const { data } = await supabase.from('ai_reports').select('id, content');
          fetchedReports = data || [];
        } else {
          const res = await fetch('/api/ai-reports');
          if (res.ok) {
             const json = await res.json();
             fetchedReports = json.data || [];
          }
        }
        
        const reportMap = {};
        fetchedReports.forEach(r => {
          if (r.id.startsWith('eksplorasi_')) {
            try {
              reportMap[r.id] = JSON.parse(r.content);
            } catch(e) {
              reportMap[r.id] = r.content;
            }
          }
        });
        setReports(reportMap);
      } catch (e) {
        console.error("Error fetching AI reports:", e);
      }
    };
    fetchReports();
  }, []);

  const saveReportToDb = async (id, content) => {
    try {
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      if (useSupabase) {
        await supabase.from('ai_reports').upsert({ id, content: JSON.stringify(content) });
      } else {
        await fetch('/api/ai-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, content: JSON.stringify(content) })
        });
      }
      setReports(prev => ({ ...prev, [id]: content }));
    } catch (e) {
      console.error("Error saving report to DB:", e);
    }
  };

  const callGeminiApi = async (prompt, textData, overrideKey, overrideModel) => {
    const apiKey = overrideKey || localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    const model = overrideModel || localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash';
    
    if (!apiKey) throw new Error("API_KEY_MISSING");

    // Batasi input jika terlalu panjang (10k karakter aman untuk prompt dasar)
    const MAX_TEXT_LENGTH = 30000;
    const truncatedText = textData.length > MAX_TEXT_LENGTH ? textData.substring(0, MAX_TEXT_LENGTH) + '... [TERPOTONG]' : textData;
    
    const finalPrompt = `${prompt}\n\nDATA JAWABAN KUALITATIF RESPONDEN (Dibatasi sebagian):\n${truncatedText}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        generationConfig: { temperature: 0.4 } // Non-JSON mode, let it be natural text
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gagal terhubung ke API Gemini");
    }

    const resData = await response.json();
    return resData.candidates[0].content.parts[0].text;
  };

  const extractTextData = () => {
    const texts = filteredData.map(d => {
      let answers = [];
      // 1. Ambil data wawancara (Pendalaman Kualitatif F)
      if (d.wawancara) {
        Object.keys(d.wawancara).forEach(k => {
          if (k !== 'pewawancara' && d.wawancara[k] && d.wawancara[k].trim().length > 5) {
             answers.push(`Q${k}: ${d.wawancara[k]}`);
          }
        });
      }
      
      // 2. Ambil teks bebas dari PRB & Kendala
      if (d.prb?.kendala) answers.push(`Kendala PRB: ${d.prb.kendala}`);
      if (d.spkklpKendala?.diagnosis) answers.push(`Kendala Diagnosis SpKKLP: ${d.spkklpKendala.diagnosis}`);
      if (d.spkklpKendala?.tindakan) answers.push(`Kendala Tindakan SpKKLP: ${d.spkklpKendala.tindakan}`);
      if (d.layanan_dirujuk?.lainnya) answers.push(`Lainnya dirujuk: ${d.layanan_dirujuk.lainnya}`);
      if (d.layanan_belum_berjalan?.lainnya) answers.push(`Lainnya belum jalan: ${d.layanan_belum_berjalan.lainnya}`);

      if (answers.length === 0) return null;
      return `[Faskes: ${d.fktp_name || 'NN'}, Wilayah: ${d.provinsi || 'NN'}]: ${answers.join(' | ')}`;
    }).filter(Boolean);

    return texts.join('\n\n');
  };

  const handleGenerate = async (expId, overrideKey = '', overrideModel = '') => {
    try {
      setError('');
      setIsGenerating(true);
      const exploration = EXPLORATIONS.find(e => e.id === expId);
      const textData = extractTextData();

      if (textData.trim().length === 0) {
        throw new Error("Tidak ada data teks kualitatif pada filter saat ini.");
      }

      const result = await callGeminiApi(exploration.prompt, textData, overrideKey, overrideModel);
      await saveReportToDb(`eksplorasi_${expId}`, result);
      
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setShowKeyModal(true);
      } else {
        setError(err.message);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', tempKey);
    localStorage.setItem('GEMINI_MODEL', tempModel);
    setShowKeyModal(false);
    handleGenerate(activeTab, tempKey, tempModel);
  };

  const activeExp = EXPLORATIONS.find(e => e.id === activeTab);
  const currentReport = reports[`eksplorasi_${activeTab}`];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center relative z-10"><Lightbulb className="w-7 h-7 mr-3 text-amber-500" /> Eksplorasi Analisis Tematik (AI)</h2>
        <p className="text-slate-500 relative z-10 text-sm md:text-base max-w-4xl">
          Dashboard ini menggunakan <strong>Generative AI</strong> untuk menggali dan menerjemahkan ribuan jawaban kualitatif (teks bebas) menjadi *policy insights* terstruktur berdasarkan 6 arah eksplorasi strategis.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full lg:w-1/3 flex flex-col gap-3">
          {EXPLORATIONS.map(exp => (
            <button
              key={exp.id}
              onClick={() => setActiveTab(exp.id)}
              className={`p-4 rounded-2xl text-left border transition-all duration-300 flex items-start gap-4 ${
                activeTab === exp.id 
                  ? 'bg-amber-50 border-amber-200 shadow-sm ring-1 ring-amber-400/50' 
                  : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className={`p-2 rounded-xl mt-1 shrink-0 ${activeTab === exp.id ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                <exp.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-sm ${activeTab === exp.id ? 'text-slate-800' : 'text-slate-600'}`}>{exp.title}</h3>
                <p className={`text-xs mt-1 leading-relaxed ${activeTab === exp.id ? 'text-slate-600' : 'text-slate-400'}`}>{exp.desc}</p>
                {reports[`eksplorasi_${exp.id}`] && (
                  <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Telah Dianalisis
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="w-full lg:w-2/3 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 md:p-8 relative min-h-[500px]">
          {activeExp && (
            <div className="animate-fade-in">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{activeExp.title}</h3>
                  <p className="text-sm text-slate-500">{activeExp.desc}</p>
                </div>
                {!isPrinting && (
                  <button
                    onClick={() => handleGenerate(activeExp.id)}
                    disabled={isGenerating}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-600 shadow-sm transition active:scale-95 disabled:opacity-50 text-sm whitespace-nowrap ml-4 shrink-0"
                  >
                    {isGenerating ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Menganalisis...</>
                    ) : (
                      <><BrainCircuit className="w-4 h-4 mr-2" /> {currentReport ? 'Jalankan Ulang AI' : 'Jalankan AI'}</>
                    )}
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start">
                  <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {currentReport ? (
                <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                   {parseMarkdown(currentReport)}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <BrainCircuit className="w-10 h-10 text-slate-300" />
                  </div>
                  <h4 className="text-slate-600 font-semibold mb-2">Belum Ada Hasil Analisis</h4>
                  <p className="text-slate-400 text-sm max-w-sm">Klik tombol "Jalankan AI" di kanan atas untuk mulai menganalisis ribuan data survei menggunakan Gemini AI.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal API Key */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center"><Key className="w-5 h-5 mr-2 text-primary-500" /> Kredensial AI Diperlukan</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1.5 rounded-lg shadow-sm border border-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Fitur Eksplorasi Kualitatif memerlukan akses ke <strong>Google Gemini AI</strong> untuk membaca dan menyimpulkan ribuan baris jawaban teks. Anda membutuhkan API Key gratis dari Google AI Studio.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Model Gemini</label>
                  <select value={tempModel} onChange={(e) => setTempModel(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition">
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Tercepat & Default)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Lebih Cerdas & Detail)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Google Gemini API Key</label>
                  <input type="password" value={tempKey} onChange={(e) => setTempKey(e.target.value)} placeholder="AIzaSy..." className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none transition placeholder-slate-300" />
                  <p className="text-[11px] text-slate-400 mt-2">API Key hanya disimpan secara lokal di browser Anda.</p>
                </div>
              </div>
              <div className="mt-8">
                <button onClick={handleSaveKey} disabled={!tempKey} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-md hover:bg-primary-700 active:scale-95 transition disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Simpan & Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
