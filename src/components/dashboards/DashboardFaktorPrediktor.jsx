import React, { useMemo, useState, useEffect } from 'react';
import { useScrollPreserve } from '../../utils/useScrollPreserve';
import { saveScroll } from '../../utils/scrollUtils';
import { createPortal } from 'react-dom';
import { Target, Activity, Stethoscope, AlertTriangle, Info, FileSearch, CheckCircle2, Cpu, RefreshCw, Key, X, Download } from 'lucide-react';
import { performChiSquare, performLogisticRegression } from '../../utils/advancedStatsUtils';
import { callGeminiApi, saveAiReportToDb, fetchAiReportFromDb } from '../../utils/aiUtils';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import ReportGenerator from '../ui/ReportGenerator';

export default function DashboardFaktorPrediktor({ uniqueFktpData, isPrinting }) {
  const [activeTab, setActiveTab] = useState('logistic');
  const [isExporting, setIsExporting] = useState(false);

  const [aiReports, setAiReports] = useState({ logistic: null, chisquare: null, internal: null });
  const [isGenerating, setIsGenerating] = useState({ logistic: false, chisquare: false, internal: false });
  const [aiErrors, setAiErrors] = useState({ logistic: '', chisquare: '', internal: '' });
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');
  const [tempModel, setTempModel] = useState(import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');
  const [activeModalContext, setActiveModalContext] = useState('');

  // Preserve scroll position saat AI state update agar halaman tidak loncat ke atas
  useScrollPreserve([isGenerating]);

  useEffect(() => {
    const loadReports = async () => {
      const logReport = await fetchAiReportFromDb('prediktor_logistic');
      const chiReport = await fetchAiReportFromDb('prediktor_chisquare');
      const intReport = await fetchAiReportFromDb('prediktor_internal');
      setAiReports({
        logistic: logReport,
        chisquare: chiReport,
        internal: intReport
      });
    };
    loadReports();
  }, []);

  const { logisticData, chiSquareData, internalData } = useMemo(() => {
    if (!uniqueFktpData || uniqueFktpData.length === 0) return { logisticData: [], chiSquareData: null };

    // Valid data filter (we need fktps with valid PRB data)
    const validData = uniqueFktpData.filter(d => {
      const aktif = Number(d.prb?.jumlah || d.prb?.totalPeserta) || 0;
      return aktif > 0; // Hanya hitung faskes yang punya pasien PRB
    });

    if (validData.length === 0) return { logisticData: [], chiSquareData: null };

    // --- 1. LOGISTIC REGRESSION ---
    // Outcome: Kepatuhan PRB > 50%
    const outcomeFn = (d) => {
      const aktif = Number(d.prb?.jumlah || d.prb?.totalPeserta) || 0;
      const rutin = Number(d.prb?.rutinKunjungan || d.prb?.kunjunganRutin) || 0;
      return (rutin / aktif) > 0.5; // True jika lebih dari 50%
    };

    const predictors = [
      { name: 'Ada Sp.KKLP', fn: d => d.doc_kklp === 'Ya' ? 1 : 0 },
      { name: 'Total Pasien PRB', fn: d => Number(d.prb?.jumlah || d.prb?.totalPeserta) || 0 },
      { name: 'Beban Pasien DM', fn: d => Number(d.prb?.peserta_dm || d.prb?.kasus?.DM) || 0 },
      { name: 'Waktu Poli (mnt)', fn: d => Number(d.time_in_poli) || 0 }
    ];

    let logRes = [];
    try {
      logRes = performLogisticRegression(validData, predictors, outcomeFn);
    } catch (err) {
      console.warn("Logistic Regression failed:", err);
    }

    const logisticData = logRes.map(res => ({
      name: res.name,
      oddsRatio: res.oddsRatio,
      pValue: res.pValue,
      isSignificant: res.isSignificant,
      // We plot Log Odds for BarChart so 0 is neutral
      logOdds: res.coefficient
    }));

    // --- 2. CHI-SQUARE ---
    // Hubungan: Status Sp.KKLP vs Kategori Kepatuhan
    const cat1Fn = d => d.doc_kklp === 'Ya' ? 'Ada Sp.KKLP' : 'Tanpa Sp.KKLP';
    const cat2Fn = d => {
      const aktif = Number(d.prb?.jumlah || d.prb?.totalPeserta) || 0;
      const rutin = Number(d.prb?.rutinKunjungan || d.prb?.kunjunganRutin) || 0;
      if (aktif === 0) return 'Tidak Valid';
      const pct = rutin / aktif;
      return pct > 0.6 ? 'Kepatuhan Tinggi (>60%)' : 'Kepatuhan Rendah';
    };

    const validChiData = validData.filter(d => cat2Fn(d) !== 'Tidak Valid');
    const chiRes = performChiSquare(validChiData, cat1Fn, cat2Fn);

    // --- 3. ANALISIS INTERNAL SP.KKLP (Univariate Logistic Regression) ---
    // Khusus data dengan Sp.KKLP
    const internalValidData = validData.filter(d => d.doc_kklp === 'Ya');
    
    const internalVariables = [
      { id: 'ruj', name: 'Berpengaruh thd Penurunan Rujukan', fn: d => Number(d.layanan_dirujuk?.pengaruhPenurunanRujukan) || 0 },
      { id: 'p0', name: 'Skrining Komprehensif', fn: d => Number(d.peran_spkklp?.[0]) || 0 },
      { id: 'p1', name: 'Kolaborasi Spesialis Lain', fn: d => Number(d.peran_spkklp?.[1]) || 0 },
      { id: 'p2', name: 'Optimalisasi Rujukan', fn: d => Number(d.peran_spkklp?.[2]) || 0 },
      { id: 'p3', name: 'Pemantauan Pengobatan Jangka Panjang', fn: d => Number(d.peran_spkklp?.[3]) || 0 },
      { id: 'l0', name: 'Dampak Kasus PTM tanpa Komplikasi', fn: d => d.layanan_dirujuk?.[0] ? 1 : 0 },
      { id: 'l4', name: 'Dampak Kasus Gangguan Jiwa', fn: d => d.layanan_dirujuk?.[4] ? 1 : 0 },
      { id: 'l3', name: 'Pelayanan Paliatif Akhir Hayat', fn: d => d.layanan_dirujuk?.[3] ? 1 : 0 },
      { id: 'l1', name: 'Penanganan Luka Diabetes Berat', fn: d => d.layanan_dirujuk?.[1] ? 1 : 0 },
      { id: 'l2', name: 'Tindakan Bedah Minor', fn: d => d.layanan_dirujuk?.[2] ? 1 : 0 },
      { id: 'b0', name: 'Manajemen Multimorbiditas', fn: d => d.layanan_belum_berjalan?.[0] ? 1 : 0 },
      { id: 'b1', name: 'Home Care Medis', fn: d => d.layanan_belum_berjalan?.[1] ? 1 : 0 },
      { id: 'b2', name: 'Pelayanan Paliatif Primer', fn: d => d.layanan_belum_berjalan?.[2] ? 1 : 0 },
      { id: 'b11', name: 'Koordinasi Rujuk Balik FKRTL', fn: d => d.layanan_belum_berjalan?.[11] ? 1 : 0 },
      { id: 'b4', name: 'Monitoring Pasien Terintegrasi', fn: d => d.layanan_belum_berjalan?.[4] ? 1 : 0 },
    ];

    let internalData = [];
    if (internalValidData.length > 5) {
      internalVariables.forEach(v => {
        try {
          const res = performLogisticRegression(internalValidData, [v], outcomeFn);
          if (res && res.length > 0) {
            internalData.push({
              name: res[0].name,
              oddsRatio: res[0].oddsRatio,
              pValue: res[0].pValue,
              isSignificant: res[0].isSignificant,
              logOdds: res[0].coefficient
            });
          }
        } catch (e) {
           // Skip if singular
        }
      });
      // Sort by LogOdds descending
      internalData.sort((a,b) => b.logOdds - a.logOdds);
    }

    return { logisticData, chiSquareData: chiRes, internalData, internalValidCount: internalValidData.length };
    return { logisticData, chiSquareData: chiRes, internalData, internalValidCount: internalValidData.length };
  }, [uniqueFktpData]);

  const handleGenerateAi = async (context, overrideKey, overrideModel) => {
    const restoreScroll = saveScroll();
    try {
      setIsGenerating(prev => ({ ...prev, [context]: true }));
      setAiErrors(prev => ({ ...prev, [context]: '' }));
      
      const key = overrideKey || tempKey;
      const model = overrideModel || tempModel;

      let prompt = '';
      if (context === 'logistic') {
        const str = logisticData.map(d => `${d.name}: OR=${d.oddsRatio.toFixed(2)} (p=${d.pValue.toFixed(3)})`).join(', ');
        prompt = `Kamu analis kesehatan. Berikut hasil regresi logistik faktor prediktor kepatuhan PRB: ${str}. Buat 2-3 paragraf ringkas interpretasi eksekutif. KEMBALIKAN DALAM FORMAT JSON murni: { "paragraphs": ["Paragraf 1..."] }`;
      } else if (context === 'chisquare') {
        const { table, pValue } = chiSquareData;
        const str = `Tinggi: Ada(${table['Ada Sp.KKLP']['Kepatuhan Tinggi (>60%)']}) Tanpa(${table['Tanpa Sp.KKLP']['Kepatuhan Tinggi (>60%)']}), Rendah: Ada(${table['Ada Sp.KKLP']['Kepatuhan Rendah']}) Tanpa(${table['Tanpa Sp.KKLP']['Kepatuhan Rendah']}). p-value=${pValue.toFixed(3)}`;
        prompt = `Kamu analis kesehatan. Berikut hasil chi-square kepatuhan PRB vs keberadaan Sp.KKLP: ${str}. Buat 2-3 paragraf ringkas interpretasi eksekutif. KEMBALIKAN DALAM FORMAT JSON murni: { "paragraphs": ["Paragraf 1..."] }`;
      } else {
        const str = internalData.map(d => `${d.name}: OR=${d.oddsRatio.toFixed(2)} (p=${d.pValue.toFixed(3)})`).join(', ');
        prompt = `Kamu analis kesehatan. Berikut hasil regresi spesifik peran Sp.KKLP terhadap kepatuhan PRB: ${str}. Buat 2-3 paragraf ringkas interpretasi eksekutif tentang peran mana yang paling berdampak. KEMBALIKAN DALAM FORMAT JSON murni: { "paragraphs": ["Paragraf 1..."] }`;
      }
      
      const text = await callGeminiApi(prompt, key, model);
      let textSum = [text];
      try {
        const parsed = JSON.parse(text);
        if (parsed.paragraphs) textSum = parsed.paragraphs;
      } catch (e) {}
      
      setAiReports(prev => ({ ...prev, [context]: textSum }));
      await saveAiReportToDb(`prediktor_${context}`, textSum);
      
    } catch (err) {
      if (err.message === "API_KEY_MISSING") {
        setActiveModalContext(context);
        setTempKey(localStorage.getItem('GEMINI_API_KEY') || '');
        setTempModel(localStorage.getItem('GEMINI_MODEL') || import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.5-flash');
        setShowKeyModal(true);
      } else {
        setAiErrors(prev => ({ ...prev, [context]: err.message || 'Terjadi kesalahan saat memanggil Gemini API.' }));
      }
    } finally {
      setIsGenerating(prev => ({ ...prev, [context]: false }));
      restoreScroll();
    }
  };

  const handleExportExcel = async () => {
    if (!logisticData || logisticData.length === 0) return;
    setIsExporting(true);
    
    // Setup tables for export (just a basic one to pass as `tables`)
    const tables = [
      {
        title: 'Ringkasan Faktor Prediktor',
        headers: ['Prediktor', 'Odds Ratio', 'P-Value', 'Signifikansi'],
        data: logisticData.map(d => [d.name, Number(d.oddsRatio?.toFixed(4)), Number(d.pValue?.toFixed(4)), d.isSignificant ? 'Ya' : 'Tidak'])
      }
    ];

    // Setup detail statistik
    const statsDetails = [];

    // 1. Logistic
    statsDetails.push({
      type: 'LogisticRegression',
      title: 'A. Regresi Logistik Multivariat',
      description: [
        'Model regresi logistik ini menggunakan metode Iteratively Reweighted Least Squares (IRLS).',
        'Tujuannya adalah mencari nilai Odds Ratio (OR) yang merepresentasikan peluang suatu prediktor meningkatkan Kepatuhan PRB.'
      ],
      tables: [
        {
          title: 'Tabel Koefisien & Odds Ratio',
          headers: ['Variabel', 'Koefisien (Beta)', 'Standard Error', 'Wald Z', 'P-Value', 'Odds Ratio'],
          data: logisticData.map(d => [
            d.name, 
            Number(d.coefficient?.toFixed(4)) || 0,
            Number(d.standardError?.toFixed(4)) || 0,
            Number(d.waldZ?.toFixed(4)) || 0,
            Number(d.pValue?.toFixed(4)) || 0,
            Number(d.oddsRatio?.toFixed(4)) || 0
          ])
        }
      ]
    });

    // 2. Chi-Square
    if (chiSquareData && chiSquareData.table && chiSquareData.expectedTable) {
      const { table, expectedTable, chi2, df, pValue } = chiSquareData;
      
      const observedData = [];
      const expectedData = [];
      const cols = chiSquareData.cols || [];
      
      chiSquareData.rows.forEach(r => {
        const obsRow = [r];
        const expRow = [r];
        cols.forEach(c => {
          obsRow.push(table[r][c] || 0);
          expRow.push(Number(expectedTable[r][c]?.toFixed(2)) || 0);
        });
        observedData.push(obsRow);
        expectedData.push(expRow);
      });

      statsDetails.push({
        type: 'ChiSquare',
        title: 'B. Uji Chi-Square (Kepatuhan vs Sp.KKLP)',
        description: [
          `Nilai Uji Chi-Square (χ²): ${chi2?.toFixed(4) ?? 0}`,
          `Derajat Kebebasan (df): ${df ?? 0}`,
          `P-Value: ${pValue?.toFixed(4) ?? 1}`
        ],
        tables: [
          {
            title: 'Tabel Frekuensi Observasi (Observed)',
            headers: ['Kategori Sp.KKLP', ...cols],
            data: observedData
          },
          {
            title: 'Tabel Frekuensi Ekspektasi (Expected)',
            headers: ['Kategori Sp.KKLP', ...cols],
            data: expectedData
          }
        ]
      });
    }

    // 3. Internal
    if (internalData && internalData.length > 0) {
      statsDetails.push({
        type: 'LogisticRegressionInternal',
        title: 'C. Regresi Logistik Internal Sp.KKLP',
        description: [
          'Model regresi logistik ini difokuskan hanya pada FKTP yang memiliki Sp.KKLP.',
          'Bertujuan mencari peran mana dari Sp.KKLP yang paling memengaruhi Kepatuhan PRB.'
        ],
        tables: [
          {
            title: 'Tabel Koefisien & Odds Ratio (Internal)',
            headers: ['Peran', 'Koefisien (Beta)', 'Standard Error', 'Wald Z', 'P-Value', 'Odds Ratio'],
            data: internalData.map(d => [
              d.name, 
              Number(d.coefficient?.toFixed(4)) || 0,
              Number(d.standardError?.toFixed(4)) || 0,
              Number(d.waldZ?.toFixed(4)) || 0,
              Number(d.pValue?.toFixed(4)) || 0,
              Number(d.oddsRatio?.toFixed(4)) || 0
            ])
          }
        ]
      });
    }

    await exportTablesToExcel('Faktor Prediktor', tables, 'Dashboard_FaktorPrediktor', null, statsDetails);
    
    setIsExporting(false);
  };

  const handleSaveKey = () => {
    localStorage.setItem('GEMINI_API_KEY', tempKey);
    localStorage.setItem('GEMINI_MODEL', tempModel);
    setShowKeyModal(false);
    if (activeModalContext) {
      handleGenerateAi(activeModalContext, tempKey, tempModel);
    }
  };

  if (!logisticData || logisticData.length === 0) return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-500">
      Data PRB tidak cukup untuk melakukan analisis prediktif.
    </div>
  );

  return (
    <>
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex flex-col md:flex-row justify-between md:items-center relative z-10 gap-4 mb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center"><Target className="w-7 h-7 mr-3 text-emerald-600" /> Analisis Faktor Prediktor</h2>
          <div className="flex flex-wrap items-center gap-3">
            {!isPrinting && (
              <button 
                onClick={handleExportExcel}
                disabled={isExporting}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-sm active:scale-95 text-sm disabled:opacity-50"
              >
                {isExporting ? 'Mengekspor...' : <><Download className="w-4 h-4 mr-2" /> Export Excel</>}
              </button>
            )}
          </div>
        </div>
        <p className="text-slate-500 relative z-10 text-sm md:text-base max-w-4xl">
          Dashboard ini menggunakan <strong>Regresi Logistik</strong> dan <strong>Uji Chi-Square</strong> untuk mencari tahu faktor apa yang paling memprediksi <strong>Kepatuhan PRB</strong> yang tinggi.
        </p>
      </div>

      {/* Tabs */}
      {!isPrinting && (
        <div className="flex flex-col md:flex-row gap-2 bg-slate-100/70 p-1.5 rounded-xl md:w-fit">
          <button 
            onClick={() => setActiveTab('logistic')} 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'logistic' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Regresi Logistik (Odds Ratio)
          </button>
          <button 
            onClick={() => setActiveTab('chisquare')} 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'chisquare' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Chi-Square (Korelasi Kategori)
          </button>
          <button 
            onClick={() => setActiveTab('internal')} 
            className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'internal' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
          >
            Analisis Internal Sp.KKLP
          </button>
        </div>
      )}

      {/* Content */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* LOGISTIC REGRESSION VIEW */}
        {(activeTab === 'logistic' || isPrinting) && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6">
              <Activity className="w-5 h-5 mr-2 text-emerald-600" />
              Forest Plot: Prediktor Kepatuhan PRB
            </h3>
            
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex gap-3 text-sm text-emerald-800 mb-8">
              <Info className="w-5 h-5 text-emerald-600 shrink-0" />
              <p>
                <strong>Cara membaca:</strong> Batang yang mengarah ke kanan (hijau) menunjukkan faktor yang <strong>meningkatkan peluang</strong> kepatuhan PRB. Batang ke kiri (merah) menunjukkan faktor yang menurunkan peluang. Odds Ratio {'>'} 1 berarti probabilitas meningkat.
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={logisticData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={120} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-sm border border-slate-700">
                            <p className="font-bold mb-1">{data.name}</p>
                            <p>Odds Ratio: <span className="text-emerald-400 font-mono">{data.oddsRatio.toFixed(2)}x</span></p>
                            <p>p-value: <span className={data.isSignificant ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'}>{data.pValue.toFixed(4)}</span></p>
                            <p className="text-xs text-slate-400 mt-1">{data.isSignificant ? 'Signifikan' : 'Tidak Signifikan'}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine x={0} stroke="#94a3b8" />
                  <Bar dataKey="logOdds" radius={[0, 4, 4, 0]}>
                    {logisticData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.logOdds > 0 ? '#10b981' : '#ef4444'} opacity={entry.isSignificant ? 1 : 0.4} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* AI Insight for Logistic Regression */}
            <div className={`bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden mt-6 ${isPrinting ? 'break-inside-avoid shadow-none' : ''}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 relative z-10">
                <h4 className="text-lg font-bold flex items-center"><Cpu className="w-5 h-5 mr-3 text-emerald-400" /> Insight Regresi Logistik</h4>
                {!isPrinting && (
                  <div className="flex items-center gap-3">
                    {aiErrors.logistic && <span className="text-rose-400 text-xs font-semibold">{aiErrors.logistic}</span>}
                    <button
                      onClick={() => handleGenerateAi('logistic')}
                      disabled={isGenerating.logistic}
                      className={`flex items-center px-4 py-2 text-sm font-bold rounded-xl transition shadow-md active:scale-95 ${isGenerating.logistic ? 'bg-emerald-700/50 text-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                    >
                      {isGenerating.logistic ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Cpu className="w-4 h-4 mr-2" />}
                      {isGenerating.logistic ? 'Menganalisis...' : 'Generate AI Insight'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm text-slate-300 leading-relaxed relative z-10">
                <p>
                  Berdasarkan pemodelan <strong>Regresi Logistik</strong>, prediktor terbaik untuk menentukan apakah suatu FKTP mampu mencapai kepatuhan PRB di atas 50% adalah faktor dengan Odds Ratio tertinggi yang signifikan secara statistik.
                </p>
                <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 mb-6">
                  {logisticData.filter(d => d.isSignificant && d.oddsRatio > 1).length > 0 ? (
                    <div>
                      <span className="font-bold text-white block mb-2 text-sm">Prediktor Positif Signifikan Utama:</span>
                      <ul className="list-disc pl-5 space-y-1 text-emerald-200">
                        {logisticData.filter(d => d.isSignificant && d.oddsRatio > 1).sort((a,b) => b.oddsRatio - a.oddsRatio).map((item, idx) => (
                          <li key={idx}><strong>{item.name}</strong> (Meningkatkan probabilitas sukses sebesar {(item.oddsRatio * 100 - 100).toFixed(1)}%)</li>
                        ))}
                      </ul>
                      <p className="mt-3 text-xs italic opacity-90">Kehadiran faktor-faktor ini secara eksponensial meningkatkan kemungkinan pasien kronis untuk patuh minum obat dan berkunjung secara rutin.</p>
                    </div>
                  ) : (
                    <div className="flex items-start text-amber-200">
                      <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                      <span>Belum ditemukan prediktor positif yang cukup kuat secara statistik (α=0.05) pada observasi ini.</span>
                    </div>
                  )}
                </div>

                {aiReports.logistic && (
                  <div className="mt-6 pt-6 border-t border-emerald-500/30 space-y-3">
                    <h4 className="text-sm font-bold text-emerald-300 mb-2 flex items-center">
                      <Cpu className="w-4 h-4 mr-2" />
                      Insight Tambahan (AI Generated)
                    </h4>
                    {aiReports.logistic.map((p, i) => <p key={i}>{p}</p>)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHI-SQUARE VIEW */}
        {(activeTab === 'chisquare' || isPrinting) && (
          <div className={isPrinting ? 'mt-12 space-y-6 break-inside-avoid' : 'space-y-6'}>
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6">
              <FileSearch className="w-5 h-5 mr-2 text-indigo-600" />
              Chi-Square: Sp.KKLP vs Kategori Kepatuhan
            </h3>
            
            {chiSquareData && chiSquareData.table ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Result Card */}
                <div className="lg:col-span-1 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 flex flex-col justify-center items-center text-center">
                  <div className="text-sm font-bold text-indigo-800 uppercase tracking-wider mb-2">Nilai p-Value</div>
                  <div className={`text-4xl font-black ${chiSquareData.isSignificant ? 'text-emerald-600' : 'text-slate-500'} mb-2`}>
                    {chiSquareData.pValue < 0.001 ? '< 0.001' : chiSquareData.pValue.toFixed(3)}
                  </div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${chiSquareData.isSignificant ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {chiSquareData.isSignificant ? 'Ada Hubungan Signifikan!' : 'Tidak Ada Hubungan Signifikan'}
                  </div>
                  <div className="text-xs text-indigo-600/80 mt-4 font-mono">
                    Chi2 = {chiSquareData.chi2.toFixed(2)}, df = {chiSquareData.df}
                  </div>
                </div>

                {/* Contingency Table */}
                <div className="lg:col-span-2 overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="p-3 border-b border-slate-200 rounded-tl-xl font-bold">Status Sp.KKLP</th>
                        {chiSquareData.cols.map(c => (
                          <th key={c} className="p-3 border-b border-slate-200 font-bold text-center">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {chiSquareData.rows.map(r => (
                        <tr key={r} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-semibold">{r}</td>
                          {chiSquareData.cols.map(c => (
                            <td key={c} className="p-3 text-center bg-white border-l border-slate-50">
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-indigo-50 text-indigo-700 font-bold rounded-full">
                                {chiSquareData.table[r][c] || 0}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-400 mt-4 italic">* Angka di dalam tabel menunjukkan jumlah FKTP (frekuensi observasi).</p>
                </div>
              </div>
            ) : (
               <div className="text-slate-500 text-center p-8 bg-slate-50 rounded-xl">Data tidak cukup untuk komputasi Chi-Square.</div>
            )}

            {/* AI Insight for Chi-Square */}
            {chiSquareData && chiSquareData.table && (
              <div className={`bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden mt-6 ${isPrinting ? 'break-inside-avoid shadow-none' : ''}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 relative z-10">
                  <h4 className="text-lg font-bold flex items-center"><Cpu className="w-5 h-5 mr-3 text-indigo-400" /> Insight Uji Chi-Square</h4>
                  {!isPrinting && (
                    <div className="flex items-center gap-3">
                      {aiErrors.chisquare && <span className="text-rose-400 text-xs font-semibold">{aiErrors.chisquare}</span>}
                      <button
                        onClick={() => handleGenerateAi('chisquare')}
                        disabled={isGenerating.chisquare}
                        className={`flex items-center px-4 py-2 text-sm font-bold rounded-xl transition shadow-md active:scale-95 ${isGenerating.chisquare ? 'bg-indigo-700/50 text-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                      >
                        {isGenerating.chisquare ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Cpu className="w-4 h-4 mr-2" />}
                        {isGenerating.chisquare ? 'Menganalisis...' : 'Generate AI Insight'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed relative z-10">
                  <p>
                    Uji independensi <strong>Chi-Square</strong> mengukur apakah distribusi kategori (tinggi vs rendah) memiliki ketergantungan yang signifikan secara statistik terhadap status keberadaan Sp.KKLP.
                  </p>
                  <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 mb-6">
                    {chiSquareData.isSignificant ? (
                      <div>
                        <span className="font-bold text-emerald-300 block mb-1 text-sm flex items-center">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Ditemukan Asosiasi Signifikan
                        </span>
                        <p>Nilai p-Value sebesar {chiSquareData.pValue < 0.001 ? '< 0.001' : chiSquareData.pValue.toFixed(4)} membuktikan secara matematis bahwa keberhasilan FKTP mencapai kategori kepatuhan PRB yang tinggi secara signifikan <strong>bergantung / berkaitan erat</strong> dengan kehadiran Sp.KKLP. (Menolak hipotesis nol).</p>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold text-amber-300 block mb-1 text-sm flex items-center">
                          <AlertTriangle className="w-4 h-4 mr-2" /> Tidak Ditemukan Asosiasi Signifikan
                        </span>
                        <p>Berdasarkan uji ini, perbedaan proporsi kepatuhan antara FKTP dengan dan tanpa Sp.KKLP masih bisa dijelaskan oleh variansi kebetulan (p-Value = {chiSquareData.pValue.toFixed(4)} {'>'} 0.05). Kategori capaian saat ini belum menunjukkan dependensi statistik yang meyakinkan terhadap peran Sp.KKLP.</p>
                      </div>
                    )}
                  </div>

                  {aiReports.chisquare && (
                    <div className="mt-6 pt-6 border-t border-indigo-500/30 space-y-3">
                      <h4 className="text-sm font-bold text-indigo-300 mb-2 flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        Insight Tambahan (AI Generated)
                      </h4>
                      {aiReports.chisquare.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERNAL SPKKLP VIEW */}
        {(activeTab === 'internal' || isPrinting) && (
          <div className={isPrinting ? 'mt-12 space-y-6 break-inside-avoid' : 'space-y-6'}>
            <h3 className="text-lg font-bold text-slate-800 flex items-center mb-6">
              <Stethoscope className="w-5 h-5 mr-2 text-indigo-600" />
              Forest Plot: Prediksi Kepatuhan PRB Khusus Faskes Sp.KKLP
            </h3>
            
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex gap-3 text-sm text-indigo-800 mb-8">
              <Info className="w-5 h-5 text-indigo-600 shrink-0" />
              <p>
                <strong>Cara membaca:</strong> Grafik ini menganalisis 15 variabel spesifik Sp.KKLP (Skrining, Rujukan, dsb). Faktor dengan Odds Ratio yang jauh di sebelah kanan (hijau) adalah kunci utama yang membuat suatu faskes Sp.KKLP lebih berhasil mengelola pasien kronis (PRB) dibandingkan faskes Sp.KKLP lainnya.
              </p>
            </div>

            {internalData && internalData.length > 0 ? (
              <div className="h-[600px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={internalData} layout="vertical" margin={{ top: 20, right: 30, left: 160, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} width={250} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-800 text-white p-3 rounded-lg shadow-xl text-sm border border-slate-700">
                              <p className="font-bold mb-1">{data.name}</p>
                              <p>Odds Ratio: <span className="text-indigo-400 font-mono">{data.oddsRatio.toFixed(2)}x</span></p>
                              <p>p-value: <span className={data.isSignificant ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'}>{data.pValue.toFixed(4)}</span></p>
                              <p className="text-xs text-slate-400 mt-1">{data.isSignificant ? 'Signifikan' : 'Tidak Signifikan'}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" />
                    <Bar dataKey="logOdds" radius={[0, 4, 4, 0]}>
                      {internalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.logOdds > 0 ? '#4f46e5' : '#ef4444'} opacity={entry.isSignificant ? 1 : 0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-slate-500 text-center p-8 bg-slate-50 rounded-xl">Data Sp.KKLP tidak cukup untuk melakukan regresi logistik internal.</div>
            )}

            {/* AI Insight for Internal Analysis */}
            {internalData && internalData.length > 0 && (
              <div className={`bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden mt-6 ${isPrinting ? 'break-inside-avoid shadow-none' : ''}`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 relative z-10">
                  <h4 className="text-lg font-bold flex items-center"><Cpu className="w-5 h-5 mr-3 text-indigo-400" /> Insight Peran Spesifik Sp.KKLP</h4>
                  {!isPrinting && (
                    <div className="flex items-center gap-3">
                      {aiErrors.internal && <span className="text-rose-400 text-xs font-semibold">{aiErrors.internal}</span>}
                      <button
                        onClick={() => handleGenerateAi('internal')}
                        disabled={isGenerating.internal}
                        className={`flex items-center px-4 py-2 text-sm font-bold rounded-xl transition shadow-md active:scale-95 ${isGenerating.internal ? 'bg-indigo-700/50 text-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                      >
                        {isGenerating.internal ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Cpu className="w-4 h-4 mr-2" />}
                        {isGenerating.internal ? 'Menganalisis...' : 'Generate AI Insight'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed relative z-10">
                  <p>
                    Analisis ini mengisolasi faskes yang sudah memiliki Sp.KKLP untuk mencari tahu <strong>peran spesifik apa</strong> yang paling menentukan tingginya kepatuhan PRB.
                  </p>
                  <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20 mb-6">
                    {internalData.filter(d => d.isSignificant && d.oddsRatio > 1).length > 0 ? (
                      <div>
                        <span className="font-bold text-white block mb-2 text-sm">Peran Paling Berdampak Positif (Signifikan):</span>
                        <ul className="list-disc pl-5 space-y-1 text-indigo-200">
                          {internalData.filter(d => d.isSignificant && d.oddsRatio > 1).sort((a,b) => b.oddsRatio - a.oddsRatio).map((item, idx) => (
                            <li key={idx}><strong>{item.name}</strong> (Meningkatkan probabilitas sukses sebesar {(item.oddsRatio * 100 - 100).toFixed(1)}%)</li>
                          ))}
                        </ul>
                        <p className="mt-3 text-xs italic opacity-90">Fokus utama pengembangan kapasitas Sp.KKLP di masa depan sebaiknya diarahkan pada kompetensi-kompetensi di atas, karena terbukti memberikan ROI (Return on Investment) klinis tertinggi.</p>
                      </div>
                    ) : (
                      <div className="flex items-start text-amber-200">
                        <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                        <span>Belum ditemukan peran spesifik yang mendominasi kesuksesan kepatuhan PRB secara statistik signifikan di antara sesama Sp.KKLP (butuh ukuran sampel Sp.KKLP yang lebih besar untuk konfirmasi).</span>
                      </div>
                    )}
                  </div>

                  {aiReports.internal && (
                    <div className="mt-6 pt-6 border-t border-indigo-500/30 space-y-3">
                      <h4 className="text-sm font-bold text-indigo-300 mb-2 flex items-center">
                        <Cpu className="w-4 h-4 mr-2" />
                        Insight Tambahan (AI Generated)
                      </h4>
                      {aiReports.internal.map((p, i) => <p key={i}>{p}</p>)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showKeyModal && typeof document !== 'undefined' && createPortal(
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button onClick={() => setShowKeyModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Key className="w-5 h-5"/></div>
                <h3 className="text-lg font-bold text-slate-800">Set Gemini API Key</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4">Masukkan API Key Anda untuk menghubungkan data dengan mesin LLM Gemini secara langsung.</p>
              <input type="password" value={tempKey} onChange={e => setTempKey(e.target.value)} placeholder="AIzaSy..." className="w-full border border-slate-200 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
              <p className="text-sm text-slate-600 mb-2">Versi Model Gemini:</p>
              <input type="text" value={tempModel} onChange={e => setTempModel(e.target.value)} placeholder="gemini-1.5-pro" className="w-full border border-slate-200 rounded-xl px-4 py-2 mb-6 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm" />
              <button onClick={handleSaveKey} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 transition">Simpan & Mulai Analisis</button>
            </div>
          </div>,
          document.body
        )}

      </div>
    </div>

    <ReportGenerator
      dashboardId="faktor_prediktor"
      dashboardName="Faktor Prediktor Kepatuhan PRB"
      promptContext={`Total FKTP dianalisis: ${uniqueFktpData?.length ?? 0}. Prediktor logistik: ${logisticData?.length ?? 0} variabel. Prediktor signifikan (logistik): ${logisticData?.filter(d => d.isSignificant)?.length ?? 0}. Prediktor positif signifikan (OR>1): ${logisticData?.filter(d => d.isSignificant && d.oddsRatio > 1)?.length ?? 0}. Chi-Square p-value: ${chiSquareData?.pValue?.toFixed(4) ?? 'N/A'}. Chi-Square signifikan: ${chiSquareData?.isSignificant ? 'Ya' : 'Tidak'}. Chi2: ${chiSquareData?.chi2?.toFixed(2) ?? 'N/A'}, df: ${chiSquareData?.df ?? 'N/A'}. Analisis internal Sp.KKLP: ${internalData?.length ?? 0} variabel. Peran internal signifikan: ${internalData?.filter(d => d.isSignificant)?.length ?? 0}. Prediktor logistik utama (tertinggi OR): ${logisticData?.[0]?.name ?? 'N/A'} OR=${logisticData?.[0]?.oddsRatio?.toFixed(2) ?? 'N/A'} p=${logisticData?.[0]?.pValue?.toFixed(3) ?? 'N/A'}. Peran internal tertinggi: ${internalData?.[0]?.name ?? 'N/A'} OR=${internalData?.[0]?.oddsRatio?.toFixed(2) ?? 'N/A'} p=${internalData?.[0]?.pValue?.toFixed(3) ?? 'N/A'}.`}
    />
    </>
  );
}
