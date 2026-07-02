import React, { useMemo, useState } from 'react';
import { Target, Activity, Stethoscope, AlertTriangle, Info, FileSearch } from 'lucide-react';
import { performChiSquare, performLogisticRegression } from '../../utils/advancedStatsUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function DashboardFaktorPrediktor({ uniqueFktpData, isPrinting }) {
  const [activeTab, setActiveTab] = useState('logistic');

  const { logisticData, chiSquareData } = useMemo(() => {
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
  }, [uniqueFktpData]);

  if (!logisticData || logisticData.length === 0) return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center text-slate-500">
      Data PRB tidak cukup untuk melakukan analisis prediktif.
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center relative z-10"><Target className="w-7 h-7 mr-3 text-emerald-600" /> Analisis Faktor Prediktor</h2>
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
          </div>
        )}

      </div>
    </div>
  );
}
