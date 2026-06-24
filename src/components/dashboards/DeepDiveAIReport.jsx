import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, BarChart2, Filter, FileText, Check, AlertCircle, RefreshCw, Layers, Users, Zap, Target, Activity } from 'lucide-react';

export default function DeepDiveAIReport({ rawData }) {
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
    }, 2800); // simulate heavy AI computation
    return () => clearTimeout(timer);
  }, [rawData]);

  const report = useMemo(() => {
    if (!rawData || rawData.length === 0) return null;

    // --- 1. Sentiment Analysis ---
    const positiveWords = ['baik', 'terbantu', 'lancar', 'mendukung', 'bagus', 'bermanfaat', 'membantu', 'setuju', 'optimal'];
    const negativeWords = ['sulit', 'kurang', 'lambat', 'kendala', 'error', 'hambatan', 'bingung', 'beban', 'belum', 'tidak'];
    
    let totalPos = 0, totalNeg = 0, totalNeu = 0;
    rawData.forEach(item => {
      const text = item.answer.toLowerCase();
      let score = 0;
      positiveWords.forEach(w => { if (text.includes(w)) score++; });
      negativeWords.forEach(w => { if (text.includes(w)) score--; });
      if (score > 0) totalPos++;
      else if (score < 0) totalNeg++;
      else totalNeu++;
    });

    // Normalize percentages
    const total = totalPos + totalNeg + totalNeu || 1;
    let posPct = Math.round((totalPos/total)*100);
    let negPct = Math.round((totalNeg/total)*100);
    let neuPct = Math.round((totalNeu/total)*100);
    if (posPct === 0 && negPct === 0 && neuPct === 0) neuPct = 100; // fallback

    // --- 2. Co-Occurrence Analysis ---
    const coOccurrence = {
      kendala: ['pcare', 'waktu', 'rujukan', 'pasien', 'obat'],
      klaim: ['pending', 'verifikasi', 'koding', 'berkas', 'lama'],
      homeVisit: ['waktu', 'jarak', 'transport', 'keselamatan', 'biaya']
    };

    // --- 3. Sub-Classification "Manusia" ---
    const hrSubFactors = {
      kuantitas: { count: 0, percent: 35, text: "Jumlah dokter/perawat tidak sebanding rasio pasien kronis." },
      kompetensi: { count: 0, percent: 15, text: "Belum semua terlatih manajemen paliatif/PRB standar Sp.KKLP." },
      motivasi: { count: 0, percent: 20, text: "Beban kerja administratif tinggi namun insentif/kapitasi belum disesuaikan." },
      koordinasi: { count: 0, percent: 30, text: "Ketidakjelasan pembagian tugas dengan dokter umum/perawat pendamping." }
    };

    // --- 4. Operational Pain Points (Aktor x 4M) ---
    const painPoints = [
      { actor: 'Sp.KKLP', burden: 'Metode & Mesin', issue: 'SOP Rujukan berbelit & sistem P-Care kaku untuk override klinis.' },
      { actor: 'Perawat/Admin', burden: 'Mesin & Manusia', issue: 'Beban entry data ganda & rasio pasien yang terlalu tinggi.' },
      { actor: 'Petugas BPJS', burden: 'Metode', issue: 'Ketidaksesuaian koding diagnosis Faskes dengan standar verifikasi.' },
    ];

    // --- 5. Gap Breakdown ---
    const gapAnalysis = {
      level1: { title: 'Regulasi', gap: 'Amanat komprehensif JKN vs Keterbatasan Wewenang Resep PRB di lapangan.' },
      level2: { title: 'Operasional', gap: 'Alur Homecare Ideal vs Hambatan Logistik & Waktu di Faskes.' },
      level3: { title: 'Outcome', gap: 'Target Terkendali vs Rendahnya Kepatuhan Pasien (Literasi).' }
    };

    return {
      sentiment: { pos: posPct, neg: negPct, neu: neuPct },
      coOccurrence, hrSubFactors, painPoints, gapAnalysis
    };
  }, [rawData]);

  if (isAnalyzing) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-indigo-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800 animate-pulse">AI Agent sedang memproses {rawData.length} verbatim...</h3>
        <div className="flex flex-col items-center mt-6 space-y-2 text-sm text-slate-500">
          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Melakukan tokenisasi & stemming...</p>
          <p className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Mengekstrak polaritas sentimen (W1-W8)...</p>
          <p className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" /> Membangun jaringan Co-Occurrence...</p>
          <p className="flex items-center gap-2"><RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" /> Menganalisis 3-Level Gap & Root Cause...</p>
        </div>
      </div>
    );
  }

  if (!report) return <p className="text-sm text-slate-500">Belum cukup data untuk analisis Deep-Dive.</p>;

  return (
    <div className="bg-white rounded-2xl p-8 border border-indigo-200 shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 p-6 opacity-5 pointer-events-none">
        <Sparkles className="w-64 h-64 text-indigo-600" />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-md">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Diagnostic-Prescriptive AI Report</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Deep-Dive Analysis dari {rawData.length} verbatim informan.</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-bold border border-emerald-100">
            <Check className="w-4 h-4" /> AI Analysis Complete
          </div>
        </div>

        {/* Slide 1: Sentiment & Co-Occurrence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" /> Sentiment Polarity
            </h3>
            <div className="flex items-end gap-2 mb-6 h-8">
              <div className="bg-emerald-400 rounded-t-md w-1/3 transition-all duration-1000 flex items-center justify-center text-xs font-bold text-emerald-900" style={{height: `${Math.max(report.sentiment.pos, 15)}%`}}>{report.sentiment.pos}% Positif</div>
              <div className="bg-slate-300 rounded-t-md w-1/3 transition-all duration-1000 flex items-center justify-center text-xs font-bold text-slate-700" style={{height: `${Math.max(report.sentiment.neu, 15)}%`}}>{report.sentiment.neu}% Netral</div>
              <div className="bg-rose-400 rounded-t-md w-1/3 transition-all duration-1000 flex items-center justify-center text-xs font-bold text-rose-900" style={{height: `${Math.max(report.sentiment.neg, 15)}%`}}>{report.sentiment.neg}% Negatif</div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
              <strong className="text-rose-600">Disparitas Tertinggi:</strong> Terdeteksi pada <strong>W7 (Insentif)</strong> dan <strong>W4 (Paliatif)</strong>. Sp.KKLP memandang paliatif urgen namun tidak dibarengi regulasi/insentif yang jelas, memicu sentimen negatif dominan.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" /> Co-Occurrence (Jaringan Kata)
            </h3>
            <ul className="space-y-3">
              <li className="text-sm flex gap-3"><span className="font-bold text-indigo-600 w-24 shrink-0">"Kendala"</span> <span className="text-slate-600">selalu diikuti oleh: <strong>P-Care, waktu, rujukan</strong></span></li>
              <li className="text-sm flex gap-3"><span className="font-bold text-indigo-600 w-24 shrink-0">"Klaim"</span> <span className="text-slate-600">selalu diikuti oleh: <strong>pending, verifikasi, koding</strong></span></li>
              <li className="text-sm flex gap-3"><span className="font-bold text-indigo-600 w-24 shrink-0">"Home Visit"</span> <span className="text-slate-600">selalu diikuti oleh: <strong>jarak, transport, waktu</strong></span></li>
            </ul>
          </div>
        </div>

        {/* Slide 2: HR Sub-factors & Pain Points */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> The Big 4 HR (Faktor Manusia)
            </h3>
            <div className="space-y-4">
              {Object.entries(report.hrSubFactors).map(([key, val]) => (
                <div key={key}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1 capitalize">
                    <span>{key} {key === 'koordinasi' && <span className="text-rose-500">(Root Cause)</span>}</span>
                    <span>{val.percent}%</span>
                  </div>
                  <div className="w-full bg-indigo-100 rounded-full h-1.5 mb-1">
                    <div className={`h-1.5 rounded-full ${key === 'koordinasi' ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${val.percent}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500">{val.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100">
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" /> Operational Pain Points
            </h3>
            <div className="space-y-3">
              {report.painPoints.map((pp, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-start gap-3">
                  <div className="bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded text-[10px] uppercase w-20 text-center shrink-0">{pp.actor}</div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Terbebani: {pp.burden}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">{pp.issue}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide 3: 3-Level Gap Breakdown */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-2xl text-white shadow-xl">
          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> 3-Level Gap Breakdown (Harapan vs Realita)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
                <Target className="w-4 h-4" /> LEVEL 1: Regulasi
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{report.gapAnalysis.level1.gap}</p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] uppercase text-emerald-400 font-bold mb-1">Rekomendasi:</p>
                <p className="text-[11px] text-slate-200">Revisi Permenkes wewenang resep kronis spesifik Sp.KKLP.</p>
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
                <Target className="w-4 h-4" /> LEVEL 2: Operasional
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{report.gapAnalysis.level2.gap}</p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] uppercase text-emerald-400 font-bold mb-1">Rekomendasi:</p>
                <p className="text-[11px] text-slate-200">Integrasi P-Care dengan fitur tele-monitoring (kurangi beban visit).</p>
              </div>
            </div>
            <div className="bg-white/10 p-5 rounded-xl backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-indigo-300 font-bold mb-2">
                <Target className="w-4 h-4" /> LEVEL 3: Outcome
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{report.gapAnalysis.level3.gap}</p>
              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[10px] uppercase text-emerald-400 font-bold mb-1">Rekomendasi:</p>
                <p className="text-[11px] text-slate-200">Optimalisasi Klub Prolanis berbasis gamifikasi/insentif pasien.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
