import React, { useState, useMemo, useEffect } from 'react';
import { useScrollPreserve } from '../../utils/useScrollPreserve';
import { saveScroll } from '../../utils/scrollUtils';
import { createPortal } from 'react-dom';
import { AlertTriangle, ChevronDown, ChevronUp, MessageSquare, User, Filter, FileText, Cpu, RefreshCw, Check, Key, X, Lightbulb, Target, Copy, Download , Image as ImageIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList } from 'recharts';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';
import { supabase } from '../../supabaseClient';
import ReportGenerator from '../ui/ReportGenerator';

export default function DashboardKeluhanSentences({ filteredData, isPrinting }) {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [geminiSummary, setGeminiSummary] = useState(null);
  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [geminiError, setGeminiError] = useState('');
  
  const [expandedAuto, setExpandedAuto] = useState(null);
  const [autoSummary, setAutoSummary] = useState(null);

  // Preserve scroll position saat AI state update agar halaman tidak loncat ke atas
  useScrollPreserve([isGeneratingGemini]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
        if (useSupabase) {
          const { data: dataK } = await supabase.from('ai_reports').select('content').eq('id', 'keluhan').single();
          if (dataK && dataK.content) { try { setGeminiSummary(JSON.parse(dataK.content)); } catch(e) { setGeminiSummary(dataK.content); } }
          
          const { data: dataA } = await supabase.from('ai_reports').select('content').eq('id', 'auto_cluster').single();
          if (dataA && dataA.content) { try { setAutoSummary(JSON.parse(dataA.content)); } catch(e) { setAutoSummary(dataA.content); } }
        } else {
          const resK = await fetch('/api/ai-reports/keluhan');
          if (resK.ok) {
            const json = await resK.json();
            if (json.data && json.data.content) { try { setGeminiSummary(JSON.parse(json.data.content)); } catch(e) { setGeminiSummary(json.data.content); } }
          }
          const resA = await fetch('/api/ai-reports/auto_cluster');
          if (resA.ok) {
            const json = await resA.json();
            if (json.data && json.data.content) { try { setAutoSummary(JSON.parse(json.data.content)); } catch(e) { setAutoSummary(json.data.content); } }
          }
        }
      } catch (e) {
        console.error("Error fetching AI reports:", e);
      }
    };
    fetchReports();
  }, []);
  const [isGeneratingAuto, setIsGeneratingAuto] = useState(false);
  const [autoError, setAutoError] = useState('');
  
  // State untuk unblocking proses berat (clustering)
  const [isAnalyzingAutoClusters, setIsAnalyzingAutoClusters] = useState(true);
  const [autoClusters, setAutoClusters] = useState([]);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState(import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash');
  const [activeModalContext, setActiveModalContext] = useState(''); 

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', tempKey);
    localStorage.setItem('GEMINI_MODEL', tempModel);
    setShowKeyModal(false);
    if (activeModalContext === 'keluhan') {
      handleGenerateGeminiSummary(chartData, totalRespondents, tempKey, tempModel);
    } else if (activeModalContext === 'auto') {
      handleGenerateAutoSummary(autoClusters, totalRespondents, tempKey, tempModel);
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

  const buildRegexes = (categories) => {
    const regexes = {};
    Object.keys(categories).forEach(cat => {
      regexes[cat] = categories[cat].map(kw => {
        const escapedKw = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`\\b${escapedKw}\\b`, 'i');
      });
    });
    return regexes;
  };

  const keluhanRegexes = useMemo(() => buildRegexes(keluhanCategories), []);

  const stopwords = new Set(['dan', 'atau', 'yang', 'di', 'ke', 'dari', 'pada', 'untuk', 'dengan', 'ini', 'itu', 'adalah', 'tidak', 'ada', 'bisa', 'karena', 'jika', 'agar', 'juga', 'dalam', 'sangat', 'sudah', 'belum', 'akan', 'harus', 'lebih', 'kurang', 'saat', 'saya', 'kami', 'kita', 'buat', 'seperti']);

  const getTokens = (str) => {
    return Array.from(new Set(
      str.toLowerCase()
         .replace(/[^a-z0-9\s]/g, '')
         .split(/\s+/)
         .filter(w => w.length > 2 && !stopwords.has(w))
    ));
  };

  // Optimize Jaccard
  const jaccard = (tokensA, tokensB) => {
    if (tokensA.length === 0 || tokensB.length === 0) return 0;
    const intersection = tokensA.filter(x => tokensB.includes(x)).length;
    const union = tokensA.length + tokensB.length - intersection;
    return intersection / union;
  };

  const { chartData, allSentences, totalRespondents } = useMemo(() => {
    const results = {};
    Object.keys(keluhanCategories).forEach(cat => {
      results[cat] = { sentences: [], respondents: new Set() };
    });

    const processedRespondents = new Set();
    let sentencesList = [];

    filteredData.forEach(row => {
      const w = row.wawancara || {};
      let hasAnswer = false;
      for (let i = 0; i < 8; i++) {
        if (w[i] && w[i].trim().length > 0) {
          hasAnswer = true;
          const sents = w[i].split(/[.!?\n]+/).map(s => s.trim()).filter(s => s.length > 10);
          
          sents.forEach(sentence => {
            const lowerS = sentence.toLowerCase();
            
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

            sentencesList.push({
               text: sentence,
               tokens: getTokens(sentence),
               fktp: row.fktp_name || 'Tidak diketahui',
               role: row.role || 'Lainnya',
               q: `W${i+1}`,
               id: row.id
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

    // Hanya ambil kalimat dengan minimal 3 kata bersih
    sentencesList = sentencesList.filter(s => s.tokens.length >= 3);

    return { chartData: data, allSentences: sentencesList, totalRespondents: total };
  }, [filteredData, keluhanRegexes]);

  // Efek untuk menjalankan proses auto-clustering di latar belakang agar UI tidak freeze (ngeblank)
  useEffect(() => {
    setIsAnalyzingAutoClusters(true);
    setAutoClusters([]);

    if (!allSentences || allSentences.length === 0) {
      setIsAnalyzingAutoClusters(false);
      return;
    }

    const timer = setTimeout(() => {
      const clusters = [];
      
      allSentences.forEach(sentence => {
         let bestCluster = null;
         let bestScore = 0.40; 
         
         for (const cluster of clusters) {
            const score = jaccard(sentence.tokens, cluster.centroidTokens);
            if (score > bestScore) {
               bestScore = score;
               bestCluster = cluster;
            }
         }

         if (bestCluster) {
            bestCluster.sentences.push(sentence);
            bestCluster.respondents.add(sentence.id);
         } else {
            clusters.push({
               centroidTokens: sentence.tokens,
               representativeText: sentence.text,
               sentences: [sentence],
               respondents: new Set([sentence.id])
            });
         }
      });

      const topClusters = clusters
         .map((c, idx) => ({
            id: `cluster_${idx}`,
            name: c.representativeText, 
            value: c.respondents.size,
            percent: totalRespondents > 0 ? ((c.respondents.size / totalRespondents) * 100).toFixed(1) : 0,
            sentences: c.sentences
         }))
         .filter(c => c.value > 1)
         .sort((a,b) => b.value - a.value)
         .slice(0, 20);

      setAutoClusters(topClusters);
      setIsAnalyzingAutoClusters(false);
    }, 50); // Beri jeda 50ms agar React sempat menggambar komponen (menghindari blank screen)

    return () => clearTimeout(timer);
  }, [allSentences, totalRespondents]);

  const callGeminiApi = async (prompt, overrideKey, overrideModel, retryCount = 0) => {
    const apiKey = overrideKey || localStorage.getItem('GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY;
    const model = overrideModel || localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
    
    if (!apiKey) {
      throw new Error("API_KEY_MISSING");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    if (!response.ok) {
      let rawError = '';
      try {
        const errJson = await response.json();
        rawError = errJson.error ? errJson.error.message : JSON.stringify(errJson);
      } catch(e) {}
      
      const errMsg = rawError ? `[API Error]: ${rawError}` : `(Status: ${response.status})`;
      
      if (response.status === 503) {
        if (retryCount < 3) {
           await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1))); // Exponential backoff: 3s, 6s, 9s
           return callGeminiApi(prompt, overrideKey, overrideModel, retryCount + 1);
        }
        throw new Error(`Server Gemini Error 503 setelah 3x percobaan. ${errMsg}`);
      } else if (response.status === 400 || response.status === 403) {
        throw new Error(`Error ${response.status}. ${errMsg}`);
      } else if (response.status === 404) {
        throw new Error(`Model tidak ditemukan (Error 404). ${errMsg}`);
      }
      throw new Error(`Gagal terhubung ke API Gemini. ${errMsg}`);
    }
    
    const resData = await response.json();
    return resData.candidates[0].content.parts[0].text;
  };

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
    } catch (e) {
      console.error("Error saving report to DB:", e);
    }
  };

  const handleGenerateGeminiSummary = async (data, total, overrideKey, overrideModel) => {
    const restoreScroll = saveScroll();
    try {
      setIsGeneratingGemini(true);
      setGeminiError('');
      
      const allCategories = data.map(d => `${d.name} (${d.percent}%)`).join(', ');
      
      const prompt = `Kamu adalah pakar kebijakan publik dan analis kesehatan (Senior Qualitative Data Analyst). Berdasarkan hasil ekstraksi data dari seluruh pertanyaan wawancara kualitatif (W1 hingga W8), kami telah mengelompokkan keluhan dari ${total} responden tenaga medis di FKTP ke dalam masalah-masalah utama. Berikut adalah persentase responden yang mengeluhkan tiap kategori masalah (diurutkan dari yang paling banyak):
${allCategories}.
      
Tolong buatkan Ringkasan Eksekutif Ilmiah (sekitar 2-3 paragraf) berdasarkan keseluruhan profil masalah tersebut. Bahas urgensi intervensi struktural (fokus pada masalah-masalah dominan), dampaknya terhadap mutu pelayanan komprehensif seperti Program Rujuk Balik (PRB) atau peran Sp.KKLP, serta berikan rekomendasi strategis (misal: debirokratisasi, evaluasi kebijakan, dll). 
Gunakan gaya bahasa akademik, formal, analitis, dan bernada laporan eksekutif resmi.

KEMBALIKAN OUTPUT MURNI DALAM FORMAT JSON SEPERTI BERIKUT (tanpa markdown):
{
  "paragraphs": [
    "Teks ringkasan paragraf 1...",
    "Teks ringkasan paragraf 2...",
    "Teks ringkasan paragraf 3..."
  ]
}`;

      const text = await callGeminiApi(prompt, overrideKey, overrideModel);
      try {
        const parsed = JSON.parse(text);
        const textSum = parsed.paragraphs ? parsed.paragraphs.join('\n\n') : text;
        setGeminiSummary(textSum);
        saveReportToDb('keluhan', textSum);
      } catch (e) {
        setGeminiSummary(text);
        saveReportToDb('keluhan', text);
      }
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setActiveModalContext('keluhan');
        setTempKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setTempModel(localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash');
        setShowKeyModal(true);
      } else {
        setGeminiError(err.message || 'Terjadi kesalahan saat memanggil Gemini API.');
      }
    } finally {
      setIsGeneratingGemini(false);
      restoreScroll();
    }
  };

  const handleGenerateAutoSummary = async (clusters, total, overrideKey, overrideModel) => {
    const restoreScroll = saveScroll();
    try {
      setIsGeneratingAuto(true);
      setAutoError('');
      
      const topSentences = clusters.map((c, i) => `${i+1}. "${c.name}" (Dikemukakan oleh ${c.percent}% responden)`).join('\n');
      
      const prompt = `Kamu adalah Ahli Evaluasi Kebijakan JKN. Kami telah menggunakan algoritma klastering lokal untuk menyaring ribuan kalimat wawancara dari ${total} nakes di FKTP menjadi Top 20 Pola Kalimat Paling Sering Muncul (Unsupervised Benchmark Sentences).
Berikut adalah 20 kalimat representatif terbanyak dari lapangan:
${topSentences}
      
Tugas Anda:
Buatkan Analisis Eksekutif Kualitatif (3 paragraf) yang "mengekstrak Tema Besar/Pilar Kebijakan" apa saja yang sebenarnya sedang terbentuk dari 20 kalimat lapangan di atas. Apakah ada benang merah terkait (1) Cakupan Manfaat & Standar Pelayanan, (2) Kompetensi SDM, (3) Ketersediaan Sumber Daya, atau (4) Mekanisme Pembiayaan? 
Bahas temuan secara tajam, akademis, dan bernada evaluasi strategis berdasarkan data empiris (persentase) di atas.

KEMBALIKAN OUTPUT MURNI DALAM FORMAT JSON SEPERTI BERIKUT (tanpa markdown):
{
  "paragraphs": [
    "Teks ringkasan paragraf 1...",
    "Teks ringkasan paragraf 2...",
    "Teks ringkasan paragraf 3..."
  ]
}`;

      const text = await callGeminiApi(prompt, overrideKey, overrideModel);
      try {
        const parsed = JSON.parse(text);
        const textSum = parsed.paragraphs ? parsed.paragraphs.join('\n\n') : text;
        setAutoSummary(textSum);
        saveReportToDb('auto_cluster', textSum);
      } catch (e) {
        setAutoSummary(text);
        saveReportToDb('auto_cluster', text);
      }
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setActiveModalContext('auto');
        setTempKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setTempModel(localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash');
        setShowKeyModal(true);
      } else {
        setAutoError(err.message || 'Terjadi kesalahan saat memanggil Gemini API.');
      }
    } finally {
      setIsGeneratingAuto(false);
      restoreScroll();
    }
  };

  const renderSummarySection = (data, total, isAuto = false) => {
    if (data.length === 0 && !isAnalyzingAutoClusters) return null;
    
    const title = isAuto ? "Analisis AI atas Top 20 Kalimat Terbanyak" : "Ringkasan Eksekutif Analisis Kualitatif";
    const Icon = isAuto ? Target : FileText;
    const summaryData = isAuto ? autoSummary : geminiSummary;
    const errorData = isAuto ? autoError : geminiError;
    const isGenerating = isAuto ? isGeneratingAuto : isGeneratingGemini;
    const generateFn = isAuto ? handleGenerateAutoSummary : handleGenerateGeminiSummary;
    
    const defaultParagraphs = isAuto ? (
      <p>Algoritma telah menyaring ribuan kutipan wawancara menjadi 20 pola kalimat (klaster) paling dominan secara objektif. Pola teratas saat ini, yaitu: <em>"{data[0]?.name}"</em> muncul pada <strong>{data[0]?.percent}%</strong> responden. Silakan *Generate AI Report* untuk meminta AI menarik kesimpulan Tema/Pilar Kebijakan dari ke-20 kalimat patokan ini.</p>
    ) : (
      <p>
        Berdasarkan ekstraksi data kualitatif dari <strong>{total}</strong> responden tenaga medis di berbagai Fasilitas Kesehatan Tingkat Pertama (FKTP), analisis menunjukkan bahwa hambatan operasional utama dalam implementasi program JKN secara signifikan didominasi oleh isu <strong>{data[0]?.name}</strong>, yang dikeluhkan secara eksplisit oleh <strong>{data[0]?.percent}%</strong> responden.
      </p>
    );

    return (
    <div id="dashboard-dashboardkeluhansentences-capture" className={`border p-8 rounded-2xl shadow-sm relative overflow-hidden ${isAuto ? 'bg-emerald-50 border-emerald-100' : 'bg-indigo-50 border-indigo-100'}`}>
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
          <Icon className={`w-32 h-32 ${isAuto ? 'text-emerald-600' : 'text-indigo-600'}`} />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className={`text-lg font-bold flex items-center ${isAuto ? 'text-emerald-900' : 'text-indigo-900'}`}>
              <Icon className={`w-6 h-6 mr-2 ${isAuto ? 'text-emerald-600' : 'text-indigo-600'}`} /> {title}
            </h3>
            
          <div className="flex items-center gap-3">
            {errorData && (
              <button 
                onClick={() => {
                  let prompt = '';
                  if (isAuto) {
                    const topSentences = data.map((c, i) => `${i+1}. "${c.name}" (Dikemukakan oleh ${c.percent}% responden)`).join('\\n');
                    prompt = `Kamu adalah Ahli Evaluasi Kebijakan JKN. Berdasarkan algoritma klastering dari ${total} nakes di FKTP, berikut adalah 20 kalimat keluhan paling sering muncul:\\n\\n${topSentences}\\n\\nBuatkan Analisis Eksekutif Kualitatif (3 paragraf) yang mengekstrak Tema Besar/Pilar Kebijakan apa saja yang sedang terbentuk dari 20 kalimat lapangan di atas. Apakah ada benang merah terkait (1) Cakupan Manfaat, (2) Kompetensi SDM, (3) Ketersediaan Sumber Daya, atau (4) Mekanisme Pembiayaan? Bahas temuan secara tajam, akademis, dan bernada evaluasi strategis.`;
                  } else {
                    const allCategories = data.map(d => `${d.name} (${d.percent}%)`).join(', ');
                    prompt = `Kamu adalah pakar kebijakan publik dan analis kesehatan. Berdasarkan ekstraksi wawancara kualitatif dari ${total} nakes di FKTP, berikut adalah persentase responden yang mengeluhkan tiap kategori masalah:\\n\\n${allCategories}\\n\\nTolong buatkan Ringkasan Eksekutif Ilmiah (2-3 paragraf) berdasarkan keseluruhan profil masalah tersebut. Bahas urgensi intervensi struktural (fokus masalah dominan), dampaknya terhadap mutu pelayanan, serta berikan rekomendasi strategis. Gunakan bahasa akademik dan formal.`;
                  }
                  navigator.clipboard.writeText(prompt);
                  alert('Prompt berhasil disalin! Silakan paste ke ChatGPT atau Gemini (Web) Anda.');
                }}
                className="flex items-center gap-2 text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-bold transition border border-rose-200"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Prompt Manual
              </button>
            )}
            {!isPrinting && !isAnalyzingAutoClusters && (
              summaryData ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-200"><Check className="w-4 h-4" /> Digenerate oleh Gemini AI</div>
                  <button onClick={() => generateFn(data, total)} className={`text-xs flex items-center gap-1 font-medium transition underline ${isAuto ? 'text-emerald-600 hover:text-emerald-800' : 'text-indigo-600 hover:text-indigo-800'}`}>
                    <RefreshCw className="w-3 h-3" /> Generate Ulang
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => generateFn(data, total)} 
                  disabled={isGenerating}
                  className={`flex items-center gap-2 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm disabled:opacity-50 ${isAuto ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  {isGenerating ? 'Menganalisis...' : 'Generate AI Report'}
                </button>
              )
            )}
          </div>
          </div>
          
          {errorData && <p className="text-xs text-rose-500 font-medium mb-4 mt-2">{errorData}</p>}

          <div className="text-sm text-slate-700 leading-relaxed text-justify space-y-4">
            {isAnalyzingAutoClusters && isAuto ? (
              <div className="flex flex-col items-center justify-center py-6">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
                <p className="font-semibold text-emerald-700">Menganalisis dan mengelompokkan ribuan kalimat (Local Clustering)...</p>
                <p className="text-xs text-emerald-600/70 mt-1">Harap tunggu sebentar, algoritma sedang berjalan tanpa internet.</p>
              </div>
            ) : summaryData ? (
              <div dangerouslySetInnerHTML={{ __html: summaryData.replace(/\n\n/g, '<br/><br/>') }} />
            ) : defaultParagraphs}
          </div>
        </div>
      </div>
    );
  };

  const renderAccordionList = (data, expandedState, setExpandedFn, isAuto = false) => {
    return (
      <div className="divide-y divide-slate-100">
        {data.map((category, index) => (
          <div key={category.name + index} className="group">
            <button 
              onClick={() => setExpandedFn(expandedState === category.name ? null : category.name)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors focus:outline-none"
            >
              <div className="flex items-center gap-4">
                <span className={`w-12 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm border ${isAuto ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                  {category.percent}%
                </span>
                <div className="text-left max-w-2xl">
                  <h4 className="font-bold text-slate-800 text-base line-clamp-1">{isAuto ? `Pola ${index+1}: "${category.name}"` : category.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{category.sentences.length} variasi kalimat dari {category.value} responden</p>
                </div>
              </div>
              {expandedState === category.name ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedState === category.name && (
              <div className="px-6 pb-6 pt-2 bg-slate-50">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {category.sentences.map((s, idx) => {
                    return (
                      <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
                        <p className="text-sm text-slate-700 leading-relaxed italic">"{s.text}."</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                          <div className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                            <User className="w-3.5 h-3.5" />
                            {s.role} ({s.fktp})
                          </div>
                          <span className={`font-semibold px-2 py-1 rounded-md ${isAuto ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
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

  const handleExport = () => {
    const tables = [
      {
        title: 'Analisis Keluhan Berdasarkan Kategori',
        headers: ['Kategori Keluhan', 'Jumlah Responden (FKTP)', 'Persentase'],
        data: chartData.map(d => [d.name, d.value, `${d.percent}%`])
      },
      {
        title: 'Analisis Sentimen Otomatis AI (Top Clusters)',
        headers: ['Topik Keluhan / Isu', 'Jumlah Responden', 'Persentase'],
        data: autoClusters.map(c => [c.name, c.value, `${c.percent}%`])
      }
    ];

    // Raw data: setiap baris = 1 responden × 1 pertanyaan wawancara yang diisi
    const rawRows = [];
    filteredData.forEach((row, idx) => {
      const w = row.wawancara || {};
      const kategoriMap = { 0: 'W1', 1: 'W2', 2: 'W3', 3: 'W4', 4: 'W5', 5: 'W6', 6: 'W7', 7: 'W8' };
      Object.keys(kategoriMap).forEach(k => {
        if (w[k] && w[k].trim().length > 0) {
          rawRows.push([idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-', row.role || '-', kategoriMap[k], w[k]]);
        }
      });
    });

    const rawData = {
      headers: ['No', 'Nama Responden', 'Nama Faskes', 'Provinsi', 'Peran', 'Pertanyaan', 'Isi Jawaban'],
      rows: rawRows
    };

    exportTablesToExcel('ANALISIS KELUHAN & SENTIMEN', tables, 'Dashboard_Keluhan', rawData);
  };


  return (
    <>
    <div className="space-y-6 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          {!isPrinting && (
        <button onClick={() => downloadElementAsPNG('dashboard-dashboardkeluhansentences-capture', 'DashboardKeluhanSentences')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm capture-exclude mb-4 mr-2">
          <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
        </button>
      )}
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
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
        {renderAccordionList(chartData, expandedCategory, setExpandedCategory, false)}
      </div>

      {/* --- SEKSI AUTO CLUSTERING TOP 20 --- */}
      <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-200">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Target className="text-emerald-500" /> Top 20 Klaster Kalimat (Auto-Benchmark)</h2>
          <p className="text-slate-500">Sistem otomatis mengelompokkan ribuan kalimat dengan makna serupa untuk mencari patokan masalah teratas dari lapangan tanpa campur tangan manusia.</p>
        </div>

        {renderSummarySection(autoClusters, totalRespondents, true)}

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden mt-6">
          <div className="p-6 border-b border-slate-100 bg-emerald-50/30 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-slate-800">Top 20 Pola Kalimat Paling Sering Diulang</h3>
          </div>
          
          {isAnalyzingAutoClusters ? (
            <div className="p-16 flex flex-col items-center justify-center bg-white">
               <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
               <h4 className="text-lg font-bold text-slate-700">Sedang memproses algoritma AI lokal...</h4>
               <p className="text-sm text-slate-500 text-center max-w-md mt-2">Membaca ribuan kalimat, menyaring token, dan menghitung Jaccard Similarity untuk membentuk klaster-klaster tanpa *delay* internet.</p>
            </div>
          ) : (
            renderAccordionList(autoClusters, expandedAuto, setExpandedAuto, true)
          )}
        </div>
      </div>
    </div>

    <ReportGenerator
      dashboardId="keluhan"
      dashboardName="Analisis Keluhan dan Sentimen"
      promptContext={`Total responden wawancara: ${totalRespondents ?? 0}. Jumlah kategori keluhan teridentifikasi: ${chartData?.length ?? 0}. Kategori keluhan dominan: ${chartData?.[0]?.name ?? '-'} (${chartData?.[0]?.percent ?? 0}%). Kategori keluhan kedua: ${chartData?.[1]?.name ?? '-'} (${chartData?.[1]?.percent ?? 0}%). Kategori keluhan ketiga: ${chartData?.[2]?.name ?? '-'} (${chartData?.[2]?.percent ?? 0}%). Total kalimat teranalisis (semua pertanyaan W1-W8): ${allSentences?.length ?? 0}. Jumlah klaster auto-benchmark terdeteksi: ${autoClusters?.length ?? 0}. Klaster kalimat paling dominan: "${autoClusters?.[0]?.name ?? '-'}" (${autoClusters?.[0]?.percent ?? 0}% responden).`}
    />
    </>
  );
}
