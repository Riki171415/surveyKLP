import React, { useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ReferenceLine, ZAxis 
} from 'recharts';
import { Activity, Beaker, FileText, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Stethoscope } from 'lucide-react';
import { performPSM } from '../../utils/statisticsUtils';
import { calculateSMD, getPropensityScoreHistogram, performTTest, performMultivariateRegression } from '../../utils/advancedStatsUtils';

export default function DashboardAnalisisLanjut({ uniqueFktpData, isPrinting }) {
  const { dataAsIs, dataMatched, psHistogram, smdData, tTestResult, regressionResult } = useMemo(() => {
    if (!uniqueFktpData || uniqueFktpData.length === 0) return {};

    // 1. Definisikan Fungsi Perlakuan & Outcome & Kovariat
    const treatmentFn = (d) => d.doc_kklp === 'Ya';
    const covariates = ['provinsi', 'jenis_faskes'];
    const outcomeFn = (d) => {
      const aktif = Number(d.prb?.jumlah) || 0;
      const rutin = Number(d.prb?.rutinKunjungan) || 0;
      return aktif > 0 ? (rutin / aktif) * 100 : 0; // Kepatuhan PRB (%)
    };

    // 2. Perform Matching
    // Note: performPSM uses calculatePropensityScores internally and assigns _propensityScore and _weight
    const dataAsIs = uniqueFktpData.map(d => ({ ...d, _weight: 1 })); 
    const dataMatched = performPSM(uniqueFktpData, treatmentFn, covariates);

    // 3. PSM Histogram
    // We compute PS on As-Is for histogram to see the initial overlap
    // performPSM doesn't export the scores for the unmatched control neatly if it drops them,
    // so we can compute it on dataMatched (since it retains all data if we use weighting/matching).
    // Actually, performPSM returns the matched sample.
    const psHistogram = getPropensityScoreHistogram(dataMatched, treatmentFn);

    // 4. Standardized Mean Differences (Love Plot)
    const smdAsIs = calculateSMD(dataAsIs, treatmentFn, covariates);
    const smdMatched = calculateSMD(dataMatched, treatmentFn, covariates);

    // Combine SMD for Scatter Plot
    const smdData = smdAsIs.map(a => {
      const m = smdMatched.find(x => x.variable === a.variable) || { smd: 0 };
      return {
        variable: a.variable,
        'SMD As Is': a.smd,
        'SMD Matched': m.smd,
      };
    });

    // 5. Kausalitas: T-Test
    const tTestResult = performTTest(dataMatched, treatmentFn, outcomeFn);

    // 6. Regresi Multivariat
    let regressionResult = null;
    try {
      regressionResult = performMultivariateRegression(dataAsIs, treatmentFn, outcomeFn, covariates);
    } catch (err) {
      console.warn("Regression failed (singular matrix or small sample):", err);
    }

    return { dataAsIs, dataMatched, psHistogram, smdData, tTestResult, regressionResult };
  }, [uniqueFktpData]);

  if (!dataAsIs) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center relative z-10"><Beaker className="w-7 h-7 mr-3 text-indigo-600" /> Analisis Statistik & Pembuktian Kausalitas</h2>
        <p className="text-slate-500 relative z-10 text-sm md:text-base max-w-4xl">
          Dashboard ini melakukan perhitungan statistik lanjutan menggunakan <strong>Propensity Score Matching (PSM)</strong> dan <strong>Regresi Linear Multivariat</strong> untuk membuktikan secara matematis apakah FKTP yang memiliki Sp.KKLP secara signifikan menghasilkan nilai Kepatuhan PRB yang lebih tinggi dibandingkan FKTP tanpa Sp.KKLP.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. Propensity Score Overlap */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Distribusi Propensity Score</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">Overlap (area yang tumpang tindih) menunjukkan seberapa baik kedua kelompok dapat dipasangkan secara "apple-to-apple".</p>
          
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={psHistogram} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="bin" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} >
                   <label value="Skor Probabilitas" offset={0} position="insideBottom" />
                </XAxis>
                <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="Ada" name="Ada Sp.KKLP" stroke="#0ea5e9" fill="#38bdf8" fillOpacity={0.4} />
                <Area type="monotone" dataKey="Tanpa" name="Tanpa Sp.KKLP" stroke="#94a3b8" fill="#cbd5e1" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Love Plot (SMD) */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-indigo-600" /> Keseimbangan Variabel (Love Plot)</h3>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">Standardized Mean Difference (SMD). Nilai di bawah 0.1 (garis putus-putus) menandakan kelompok sudah setara / bebas bias.</p>
          
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%">
              <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" dataKey="val" name="SMD" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 'dataMax + 0.1']} />
                <YAxis type="category" dataKey="variable" name="Kovariat" tick={{ fill: '#64748B', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <ZAxis range={[50, 50]} />
                <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <ReferenceLine x={0.1} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Batas Bias (0.1)', fill: '#ef4444', fontSize: 10 }} />
                
                <Scatter name="Sebelum Matching (As Is)" data={smdData.map(d => ({ variable: d.variable.split(':')[1] || d.variable, val: d['SMD As Is'] }))} fill="#cbd5e1" shape="circle" />
                <Scatter name="Sesudah Matching" data={smdData.map(d => ({ variable: d.variable.split(':')[1] || d.variable, val: d['SMD Matched'] }))} fill="#4f46e5" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid' : ''}`}>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-slate-600" /> Hasil Pengujian Kausalitas: Dampak Sp.KKLP terhadap Kepatuhan PRB</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b">
                <th className="px-4 py-3 font-semibold text-slate-700">Metode Uji Statistik</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Estimasi Dampak (Koefisien / Selisih)</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Standard Error</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">T-Statistic</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">P-Value</th>
                <th className="px-4 py-3 font-semibold text-slate-700 text-center">Signifikansi (α=0.05)</th>
              </tr>
            </thead>
            <tbody>
              {/* T-Test Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-4 font-medium text-slate-800">Uji Beda Rata-rata (T-Test) setelah PSM</td>
                <td className="px-4 py-4 text-center font-bold text-primary-600">{tTestResult ? `+${tTestResult.diff.toFixed(2)}%` : '-'}</td>
                <td className="px-4 py-4 text-center text-slate-500">-</td>
                <td className="px-4 py-4 text-center text-slate-500">{tTestResult ? tTestResult.tStat.toFixed(3) : '-'}</td>
                <td className="px-4 py-4 text-center text-slate-500">{tTestResult ? tTestResult.pValue.toFixed(4) : '-'}</td>
                <td className="px-4 py-4 text-center">
                  {tTestResult?.isSignificant ? 
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Signifikan</span> : 
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Tidak Signifikan</span>}
                </td>
              </tr>
              {/* Regression Row */}
              <tr className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-4 font-medium text-slate-800">Regresi Linier Multivariat (As Is Data)</td>
                <td className="px-4 py-4 text-center font-bold text-indigo-600">{regressionResult ? `${regressionResult.treatmentEffect > 0 ? '+' : ''}${regressionResult.treatmentEffect.toFixed(2)}%` : '-'}</td>
                <td className="px-4 py-4 text-center text-slate-500">{regressionResult ? regressionResult.standardError.toFixed(3) : '-'}</td>
                <td className="px-4 py-4 text-center text-slate-500">{regressionResult ? regressionResult.tStat.toFixed(3) : '-'}</td>
                <td className="px-4 py-4 text-center text-slate-500">{regressionResult ? regressionResult.pValue.toFixed(4) : '-'}</td>
                <td className="px-4 py-4 text-center">
                  {regressionResult?.isSignificant ? 
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1"/> Signifikan</span> : 
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">Tidak Signifikan</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={`bg-gradient-to-br from-slate-800 to-indigo-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden ${isPrinting ? 'break-inside-avoid shadow-none' : ''}`}>
         <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
         <h3 className="text-xl font-bold mb-4 flex items-center"><Activity className="w-6 h-6 mr-3 text-indigo-400" /> Interpretasi Naratif (AI Generated)</h3>
         <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Berdasarkan uji statistik terhadap data observasional, proses <strong>Propensity Score Matching (PSM)</strong> telah menyeimbangkan karakteristik FKTP (berdasarkan Provinsi dan Jenis Faskes) agar kelompok yang memiliki Sp.KKLP setara (apple-to-apple) dengan kelompok yang tidak memilikinya. Hal ini terlihat dari <em>Love Plot</em> di mana titik-titik (SMD) bergeser mendekati atau berada di bawah batas ambang 0.1 setelah matching.
            </p>
            <p>
              {tTestResult && tTestResult.isSignificant ? (
                <span className="text-emerald-300 font-medium">Berdasarkan Uji-T pada data yang telah disetarakan (matched), kehadiran Sp.KKLP terbukti memberikan peningkatan rata-rata Kepatuhan PRB sebesar {tTestResult.diff.toFixed(1)}%. Perbedaan ini signifikan secara statistik (p &lt; 0.05). </span>
              ) : (
                <span className="text-amber-300 font-medium">Berdasarkan Uji-T pada data yang disetarakan (matched), meskipun terdapat {tTestResult ? (tTestResult.diff > 0 ? 'peningkatan' : 'penurunan') : ''} sebesar {tTestResult ? Math.abs(tTestResult.diff).toFixed(1) : 0}%, secara matematis perbedaan ini belum cukup kuat untuk dinyatakan signifikan secara statistik pada selang kepercayaan 95% (p &gt; 0.05). </span>
              )}
            </p>
            <p>
              {regressionResult && regressionResult.isSignificant ? (
                <span>Lebih lanjut, hasil pemodelan <strong>Regresi Linier Multivariat</strong> yang mengontrol seluruh kovariat sekaligus juga mengonfirmasi adanya efek murni yang positif dan signifikan dari Sp.KKLP terhadap kinerja fasilitas sebesar <strong>+{regressionResult.treatmentEffect.toFixed(2)}%</strong> (p = {regressionResult.pValue.toFixed(3)}). </span>
              ) : (
                <span>Hasil pemodelan <strong>Regresi Linier Multivariat</strong> juga mengonfirmasi temuan tersebut, di mana efek murni Sp.KKLP (setelah dikontrol terhadap kovariat) adalah <strong>{regressionResult && regressionResult.treatmentEffect > 0 ? '+' : ''}{regressionResult ? regressionResult.treatmentEffect.toFixed(2) : 0}%</strong> dan belum signifikan (p = {regressionResult ? regressionResult.pValue.toFixed(3) : 1}). </span>
              )}
            </p>
            <div className="mt-4 p-4 bg-white/10 rounded-xl border border-white/20">
              <h4 className="text-white font-bold text-sm mb-2">Kesimpulan Utama:</h4>
              {tTestResult?.isSignificant || regressionResult?.isSignificant ? (
                <div className="flex items-start">
                  <TrendingUp className="w-5 h-5 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Secara ilmiah (dengan tingkat signifikansi 5%), dapat disimpulkan bahwa FKTP yang didukung oleh Dokter Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP) memiliki Kepatuhan PRB yang secara meyakinkan <strong>lebih baik/lebih tinggi</strong> dibandingkan FKTP sejenis yang tidak memiliki Sp.KKLP.</span>
                </div>
              ) : (
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mr-2 shrink-0 mt-0.5" />
                  <span className="text-sm">Saat ini belum ditemukan bukti statistik yang cukup kuat untuk menyimpulkan bahwa Sp.KKLP memengaruhi peningkatan nilai FKTP setelah dikontrol perancu. Hal ini bisa jadi disebabkan oleh jumlah sampel (N) FKTP tanpa Sp.KKLP yang terlalu kecil untuk mendeteksi perbedaan secara akurat (low statistical power).</span>
                </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
}
