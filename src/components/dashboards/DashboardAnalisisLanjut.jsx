import React, { useMemo, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  ScatterChart, Scatter, ReferenceLine, ZAxis 
} from 'recharts';
import { Activity, Beaker, FileText, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, Stethoscope, Download } from 'lucide-react';
import { performPSM } from '../../utils/statisticsUtils';
import { calculateSMD, getPropensityScoreHistogram, performTTest, performMultivariateRegression } from '../../utils/advancedStatsUtils';
import { exportAnalisisLanjutToExcel } from '../../utils/exportExcelUtils';

export default function DashboardAnalisisLanjut({ uniqueFktpData, isPrinting }) {
  const [isExporting, setIsExporting] = useState(false);

  const outcomeOptions = [
    { id: 'kepatuhan_prb', label: 'Kepatuhan PRB (%)', fn: (d) => {
      const aktif = Number(d.prb?.jumlah) || 0;
      const rutin = Number(d.prb?.rutinKunjungan) || 0;
      return aktif > 0 ? (rutin / aktif) * 100 : 0;
    }},
    { id: 'beban_luar_gedung', label: 'Proporsi Beban Luar Gedung (%)', fn: (d) => Number(d.prop_out_fktp) || 0 },
    { id: 'rata_rujukan', label: 'Rata-Rata Rujukan PRB (%)', fn: (d) => Number(d.prb?.rataRujukan) || 0 },
    { id: 'waktu_poli', label: 'Waktu Rata-rata Poli (Menit)', fn: (d) => Number(d.time_in_poli) || 0 },
    { id: 'waktu_homevisit', label: 'Waktu Rata-rata Home Visit (Menit)', fn: (d) => Number(d.time_home_visit) || 0 }
  ];

  const { dataAsIs, dataMatched, psHistogram, smdData, allOutcomesResults } = useMemo(() => {
    if (!uniqueFktpData || uniqueFktpData.length === 0) return {};

    // 1. Definisikan Fungsi Perlakuan & Kovariat
    const treatmentFn = (d) => d.doc_kklp === 'Ya';
    const covariates = ['provinsi', 'jenis_faskes'];

    // 2. Perform Matching
    const dataAsIs = uniqueFktpData.map(d => ({ ...d, _weight: 1 })); 
    const dataMatched = performPSM(uniqueFktpData, treatmentFn, covariates);

    // 3. PSM Histogram
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

    // 5. Calculate T-Test and Regression for ALL outcomes
    const allOutcomesResults = outcomeOptions.map(opt => {
      const tTestResult = performTTest(dataMatched, treatmentFn, opt.fn);
      let regressionResult = null;
      try {
        regressionResult = performMultivariateRegression(dataAsIs, treatmentFn, opt.fn, covariates);
      } catch (err) {
        console.warn(`Regression failed for ${opt.id}:`, err);
      }
      return {
        id: opt.id,
        label: opt.label,
        tTestResult,
        regressionResult
      };
    });

    return { dataAsIs, dataMatched, psHistogram, smdData, allOutcomesResults };
  }, [uniqueFktpData]);

  const handleExportExcel = async () => {
    if (!dataAsIs) return;
    setIsExporting(true);

    const statsDetails = [];

    // 1. Tambahkan detail PSM T-Test
    const tTestTables = allOutcomesResults.filter(o => o.tTestResult).map(o => {
      const res = o.tTestResult;
      return {
        title: `Uji T (T-Test) setelah Matching: ${o.label}`,
        headers: ['Rata-rata Ada Sp.KKLP', 'Rata-rata Tanpa Sp.KKLP', 'Selisih (Beda)', 'T-Statistic', 'P-Value', 'Signifikansi'],
        data: [
          [
            res.tMean.toFixed(4),
            res.cMean.toFixed(4),
            res.diff.toFixed(4),
            res.tStat.toFixed(4),
            res.pValue.toFixed(4),
            res.isSignificant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN'
          ]
        ]
      };
    });

    if (tTestTables.length > 0) {
      statsDetails.push({
        type: 'TTest',
        title: 'A. Detail Uji Beda Rata-rata (T-Test) Post-Matching',
        description: [
          'Pengujian T-Test dilakukan pada dataset yang sudah diseimbangkan (Matched Data).',
          'Tujuannya adalah menguji apakah selisih (beda) rata-rata antara fasilitas yang memiliki Sp.KKLP dan tidak memiliki Sp.KKLP bermakna secara statistik (p < 0.05).'
        ],
        tables: tTestTables
      });
    }

    // 2. Tambahkan detail Regression
    const regTables = allOutcomesResults.filter(o => o.regressionResult).map(o => {
      const res = o.regressionResult;
      return {
        title: `Regresi Multivariat: ${o.label}`,
        headers: ['Efek Sp.KKLP (Beta)', 'Standard Error', 'T-Statistic', 'P-Value', 'R-Squared', 'Signifikansi'],
        data: [
          [
            res.treatmentEffect.toFixed(4),
            res.standardError.toFixed(4),
            res.tStat.toFixed(4),
            res.pValue.toFixed(4),
            res.rSquared ? res.rSquared.toFixed(4) : '-',
            res.isSignificant ? 'SIGNIFIKAN' : 'TIDAK SIGNIFIKAN'
          ]
        ]
      };
    });

    if (regTables.length > 0) {
      statsDetails.push({
        type: 'Regression',
        title: 'B. Detail Regresi Linier Multivariat (As-Is Data)',
        description: [
          'Regresi Linier Multivariat menggunakan dataset awal tanpa matching (As-Is Data).',
          'Tujuannya adalah melihat efek murni (koefisien Beta) dari keberadaan Sp.KKLP setelah dikontrol terhadap berbagai variabel perancu (seperti Provinsi dan Jenis Faskes).'
        ],
        tables: regTables
      });
    }

    await exportAnalisisLanjutToExcel(dataAsIs, dataMatched, psHistogram, smdData, allOutcomesResults, statsDetails);
    setIsExporting(false);
  };

  if (!dataAsIs) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex flex-col md:flex-row justify-between md:items-center relative z-10 gap-4 mb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center"><Beaker className="w-7 h-7 mr-3 text-indigo-600" /> Analisis Statistik & Pembuktian Kausalitas</h2>
          
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
          Dashboard ini melakukan perhitungan statistik lanjutan menggunakan <strong>Propensity Score Matching (PSM)</strong> dan <strong>Regresi Linear Multivariat</strong> untuk membuktikan secara matematis dampak dari kehadiran Sp.KKLP di FKTP terhadap berbagai indikator performa klinis secara komprehensif.
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

      {allOutcomesResults.map(({ id, label, tTestResult, regressionResult }) => (
        <div key={id} className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-slate-600" /> Hasil Pengujian Kausalitas: Dampak Sp.KKLP terhadap {label}</h3>
          
          <div className="overflow-x-auto mb-6">
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
                  <td className="px-4 py-4 text-center font-bold text-primary-600">{tTestResult ? `${tTestResult.diff > 0 ? '+' : ''}${tTestResult.diff.toFixed(2)}` : '-'}</td>
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
                  <td className="px-4 py-4 text-center font-bold text-indigo-600">{regressionResult ? `${regressionResult.treatmentEffect > 0 ? '+' : ''}${regressionResult.treatmentEffect.toFixed(2)}` : '-'}</td>
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

          <div className={`bg-gradient-to-br from-slate-800 to-indigo-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden ${isPrinting ? 'break-inside-avoid shadow-none' : ''}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <h4 className="text-lg font-bold mb-3 flex items-center"><Activity className="w-5 h-5 mr-3 text-indigo-400" /> Interpretasi Naratif (AI Generated) - {label}</h4>
            <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
              <p>
                {tTestResult && tTestResult.isSignificant ? (
                  <span className="text-emerald-300 font-medium">Berdasarkan Uji-T pada data yang telah disetarakan (matched), kehadiran Sp.KKLP terbukti memberikan efek sebesar {tTestResult.diff.toFixed(2)} pada {label}. Perbedaan ini signifikan secara statistik (p &lt; 0.05). </span>
                ) : (
                  <span className="text-amber-300 font-medium">Berdasarkan Uji-T pada data yang disetarakan (matched), efek Sp.KKLP sebesar {tTestResult ? tTestResult.diff.toFixed(2) : 0} pada {label} tidak signifikan secara statistik (p &gt; 0.05). </span>
                )}
              </p>
              <p>
                {regressionResult && regressionResult.isSignificant ? (
                  <span>Lebih lanjut, hasil pemodelan <strong>Regresi Linier Multivariat</strong> yang mengontrol seluruh kovariat sekaligus juga mengonfirmasi adanya efek murni yang signifikan dari Sp.KKLP terhadap {label} sebesar <strong>{regressionResult.treatmentEffect > 0 ? '+' : ''}{regressionResult.treatmentEffect.toFixed(2)}</strong> (p = {regressionResult.pValue.toFixed(3)}). </span>
                ) : (
                  <span>Hasil pemodelan <strong>Regresi Linier Multivariat</strong> juga mengonfirmasi temuan tersebut, di mana efek murni Sp.KKLP (setelah dikontrol terhadap kovariat) adalah <strong>{regressionResult && regressionResult.treatmentEffect > 0 ? '+' : ''}{regressionResult ? regressionResult.treatmentEffect.toFixed(2) : 0}</strong> dan belum signifikan (p = {regressionResult ? regressionResult.pValue.toFixed(3) : 1}). </span>
                )}
              </p>
              <div className="mt-4 p-3 bg-white/10 rounded-xl border border-white/20">
                <h5 className="text-white font-bold text-xs mb-1">Kesimpulan Utama:</h5>
                {tTestResult?.isSignificant || regressionResult?.isSignificant ? (
                  <div className="flex items-start">
                    <TrendingUp className="w-4 h-4 text-emerald-400 mr-2 shrink-0 mt-0.5" />
                    <span>Secara ilmiah (dengan tingkat signifikansi 5%), dapat disimpulkan bahwa kehadiran Sp.KKLP memiliki dampak yang secara meyakinkan dan signifikan terhadap {label}.</span>
                  </div>
                ) : (
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-amber-400 mr-2 shrink-0 mt-0.5" />
                    <span>Saat ini belum ditemukan bukti statistik yang cukup kuat untuk menyimpulkan bahwa Sp.KKLP memengaruhi {label} secara signifikan setelah dikontrol perancu.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
