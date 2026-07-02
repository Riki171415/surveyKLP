import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Stethoscope, Activity, Home, HeartPulse, CheckCircle2, AlertCircle, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';
import { performRandomSampling, performPSM, performIPW, performStratifiedMatching } from '../../utils/statisticsUtils';

// ── Komponen Toggle Pill ──────────────────────────────────────────────────────
const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-white/20 backdrop-blur-md rounded-lg p-1 text-xs font-semibold shrink-0 mt-4 sm:mt-0 shadow-inner">
    <button
      onClick={() => onChange('responden')}
      className={`px-4 py-1.5 rounded-md transition-all ${value === 'responden' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:text-white'}`}
    >
      Per Responden
    </button>
    <button
      onClick={() => onChange('fktp')}
      className={`px-4 py-1.5 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-indigo-600 shadow-sm' : 'text-indigo-100 hover:text-white'}`}
    >
      Per FKTP
    </button>
  </div>
);

export default function DashboardImpactSpKKLP({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [view, setView] = useState('responden');
  const [statMethod, setStatMethod] = useState('psm');
  
  const calculateMetrics = (dataset) => {
    let adaSp = 0, tanpaSp = 0;
    
    const metrikAda = { prbAktif: 0, kepatuhanPrb: 0, rujukanFkrtl: 0, hc: 0, paliatif: 0, kolaborasiHc: 0, perbaikanHc: 0 };
    const metrikTanpa = { prbAktif: 0, kepatuhanPrb: 0, rujukanFkrtl: 0, hc: 0, paliatif: 0, kolaborasiHc: 0, perbaikanHc: 0 };

    let countPrbAda = 0, countPrbTanpa = 0;

    dataset.forEach(row => {
      const isAdaSp = row.doc_kklp === 'Ya';
      const w = row._weight || 1;
      
      if (isAdaSp) adaSp += w; else tanpaSp += w;

      const m = isAdaSp ? metrikAda : metrikTanpa;
      
      // PRB
      const prb = row.prb || {};
      if (prb.jumlah !== undefined && prb.jumlah !== '') {
        m.prbAktif += (Number(prb.jumlah) || 0) * w;
        m.rujukanFkrtl += (Number(prb.rataRujukan) || 0) * w;
        
        const aktif = Number(prb.jumlah) || 0;
        const rutin = Number(prb.rutinKunjungan) || 0;
        if (aktif > 0) {
          m.kepatuhanPrb += (rutin / aktif) * 100 * w;
          if (isAdaSp) countPrbAda += w; else countPrbTanpa += w;
        }
      }

      // Home Care
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        m.hc += w;
        if (hc.kolaborasi === 'Ya') m.kolaborasiHc += w;
        if (hc.perbaikan === 'Ya') m.perbaikanHc += w;
      }

      // Paliatif
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') m.paliatif += w;
    });

    const getAvg = (sum, count) => count > 0 ? (sum / count) : 0;
    const getPerc = (part, total) => total > 0 ? (part / total) * 100 : 0;

    const dataAda = {
      avgPrb: getAvg(metrikAda.prbAktif, adaSp),
      avgKepatuhan: getAvg(metrikAda.kepatuhanPrb, countPrbAda),
      avgRujukan: getAvg(metrikAda.rujukanFkrtl, countPrbAda),
      percHc: getPerc(metrikAda.hc, adaSp),
      percPaliatif: getPerc(metrikAda.paliatif, adaSp),
      percKolaborasi: getPerc(metrikAda.kolaborasiHc, metrikAda.hc),
      percPerbaikan: getPerc(metrikAda.perbaikanHc, metrikAda.hc)
    };

    const dataTanpa = {
      avgPrb: getAvg(metrikTanpa.prbAktif, tanpaSp),
      avgKepatuhan: getAvg(metrikTanpa.kepatuhanPrb, countPrbTanpa),
      avgRujukan: getAvg(metrikTanpa.rujukanFkrtl, countPrbTanpa),
      percHc: getPerc(metrikTanpa.hc, tanpaSp),
      percPaliatif: getPerc(metrikTanpa.paliatif, tanpaSp),
      percKolaborasi: getPerc(metrikTanpa.kolaborasiHc, metrikTanpa.hc),
      percPerbaikan: getPerc(metrikTanpa.perbaikanHc, metrikTanpa.hc)
    };

    const radar = [
      { subject: 'Kepatuhan PRB (%)', Ada: dataAda.avgKepatuhan, Tanpa: dataTanpa.avgKepatuhan, fullMark: 100 },
      { subject: 'Ketersediaan Home Care (%)', Ada: dataAda.percHc, Tanpa: dataTanpa.percHc, fullMark: 100 },
      { subject: 'Ketersediaan Paliatif (%)', Ada: dataAda.percPaliatif, Tanpa: dataTanpa.percPaliatif, fullMark: 100 },
      { subject: 'Kolaborasi Nakes (%)', Ada: dataAda.percKolaborasi, Tanpa: dataTanpa.percKolaborasi, fullMark: 100 },
      { subject: 'Perbaikan Kondisi (%)', Ada: dataAda.percPerbaikan, Tanpa: dataTanpa.percPerbaikan, fullMark: 100 }
    ];

    const barKinerja = [
      { name: 'Kepatuhan PRB', 'Ada Sp.KKLP': dataAda.avgKepatuhan, 'Tanpa Sp.KKLP': dataTanpa.avgKepatuhan },
      { name: 'Home Care', 'Ada Sp.KKLP': dataAda.percHc, 'Tanpa Sp.KKLP': dataTanpa.percHc },
      { name: 'Paliatif', 'Ada Sp.KKLP': dataAda.percPaliatif, 'Tanpa Sp.KKLP': dataTanpa.percPaliatif },
      { name: 'Kolaborasi Interdisiplin', 'Ada Sp.KKLP': dataAda.percKolaborasi, 'Tanpa Sp.KKLP': dataTanpa.percKolaborasi },
      { name: 'Outcome (Perbaikan)', 'Ada Sp.KKLP': dataAda.percPerbaikan, 'Tanpa Sp.KKLP': dataTanpa.percPerbaikan }
    ];
    
    // Convert to 1 decimal place for tables
    Object.keys(dataAda).forEach(k => dataAda[k] = Number(dataAda[k].toFixed(1)));
    Object.keys(dataTanpa).forEach(k => dataTanpa[k] = Number(dataTanpa[k].toFixed(1)));

    const rawAda = { countPrb: countPrbAda.toFixed(0), hc: metrikAda.hc.toFixed(0), paliatif: metrikAda.paliatif.toFixed(0), kolaborasi: metrikAda.kolaborasiHc.toFixed(0), perbaikan: metrikAda.perbaikanHc.toFixed(0), total: adaSp.toFixed(0) };
    const rawTanpa = { countPrb: countPrbTanpa.toFixed(0), hc: metrikTanpa.hc.toFixed(0), paliatif: metrikTanpa.paliatif.toFixed(0), kolaborasi: metrikTanpa.kolaborasiHc.toFixed(0), perbaikan: metrikTanpa.perbaikanHc.toFixed(0), total: tanpaSp.toFixed(0) };

    return { spData: barKinerja, radarData: radar, stats: { adaSp: adaSp.toFixed(0), tanpaSp: tanpaSp.toFixed(0), dataAda, dataTanpa, rawAda, rawTanpa } };
  };

  const applyStatistics = (data, method) => {
    if (!data || data.length === 0) return data;
    if (method === 'as-is') return data;
    
    const treatmentFn = (d) => d.doc_kklp === 'Ya';
    const covariates = ['provinsi', 'kab_kota', 'jenis_faskes'];
    
    switch (method) {
      case 'random': return performRandomSampling(data, treatmentFn);
      case 'psm': return performPSM(data, treatmentFn, covariates);
      case 'ipw': return performIPW(data, treatmentFn, covariates);
      case 'stratified': return performStratifiedMatching(data, treatmentFn, covariates);
      default: return data;
  const getCovariateBalance = (dataAsIs, dataMatched) => {
    const balance = {};
    const processData = (data, type) => {
      data.forEach(d => {
        const val = d.jenis_faskes || 'Lainnya';
        if (!balance[val]) balance[val] = { name: val, asIsAda: 0, asIsTanpa: 0, matchedAda: 0, matchedTanpa: 0 };
        const isT = d.doc_kklp === 'Ya';
        const w = d._weight || 1;
        if (type === 'asIs') {
          if (isT) balance[val].asIsAda += w; else balance[val].asIsTanpa += w;
        } else {
          if (isT) balance[val].matchedAda += w; else balance[val].matchedTanpa += w;
        }
      });
    };
    processData(dataAsIs || [], 'asIs');
    processData(dataMatched || [], 'matched');
    return Object.values(balance).sort((a,b) => b.asIsAda - a.asIsAda);
  };

  const { metricsRAsIs, metricsRMatched, metricsFAsIs, metricsFMatched, covBalanceR, covBalanceF } = useMemo(() => {
    const dataRAsIs = applyStatistics(filteredData, 'as-is');
    const dataRMatched = applyStatistics(filteredData, statMethod);
    const dataFAsIs = applyStatistics(uniqueFktpData, 'as-is');
    const dataFMatched = applyStatistics(uniqueFktpData, statMethod);
    
    return {
      metricsRAsIs: calculateMetrics(dataRAsIs),
      metricsRMatched: calculateMetrics(dataRMatched),
      metricsFAsIs: calculateMetrics(dataFAsIs),
      metricsFMatched: calculateMetrics(dataFMatched),
      covBalanceR: getCovariateBalance(dataRAsIs, dataRMatched),
      covBalanceF: getCovariateBalance(dataFAsIs, dataFMatched)
    };
  }, [filteredData, uniqueFktpData, statMethod]);

  const activeMetricsAsIs = view === 'responden' ? metricsRAsIs : metricsFAsIs;
  const activeMetricsMatched = view === 'responden' ? metricsRMatched : metricsFMatched;
  
  // Combine spData for BarChart
  const combinedSpData = activeMetricsAsIs.spData.map((item, i) => {
    const matchedItem = activeMetricsMatched.spData[i];
    return {
      name: item.name,
      'Ada (As Is)': item['Ada Sp.KKLP'],
      'Tanpa (As Is)': item['Tanpa Sp.KKLP'],
      'Ada (Matched)': matchedItem['Ada Sp.KKLP'],
      'Tanpa (Matched)': matchedItem['Tanpa Sp.KKLP'],
    };
  });

  // Combine radarData for RadarChart
  const combinedRadarData = activeMetricsAsIs.radarData.map((item, i) => {
    const matchedItem = activeMetricsMatched.radarData[i];
    return {
      subject: item.subject,
      'Ada (As Is)': item.Ada,
      'Tanpa (As Is)': item.Tanpa,
      'Ada (Matched)': matchedItem.Ada,
      'Tanpa (Matched)': matchedItem.Tanpa,
      fullMark: item.fullMark
    };
  });

  // We use Matched metrics for the main StatCards and summaries, and fallback stats where needed
  const { stats } = activeMetricsMatched;
  const statsAsIs = activeMetricsAsIs.stats;

  const StatCard = ({ title, valueAda, valueTanpa, subtitle, icon: Icon, colorClass }) => {
    const diff = valueAda - valueTanpa;
    const isPositive = diff > 0;
    
    return (
      <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10`}></div>
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Ada: {valueAda.toFixed(1)}{subtitle}</h3>
            <h3 className="text-xl font-bold text-slate-500 tracking-tight">Tanpa: {valueTanpa.toFixed(1)}{subtitle}</h3>
          </div>
          <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-600')}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className={`text-sm font-semibold px-3 py-1.5 rounded-lg inline-flex items-center ${isPositive ? 'bg-emerald-100 text-emerald-700' : diff < 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
          {isPositive ? '+' : ''}{diff.toFixed(1)}{subtitle} vs Tanpa Sp.KKLP
        </div>
      </div>
    );
  };

  const handleExport = () => {
    const formatExportData = (metrics) => {
      const s = metrics.stats;
      const getVal = (name, adaN, adaTotal, tanpaN, tanpaTotal, percAda, percTanpa) => [
        name,
        `${adaN} dari ${adaTotal}`,
        `${percAda.toFixed(1)}%`,
        `${tanpaN} dari ${tanpaTotal}`,
        `${percTanpa.toFixed(1)}%`
      ];

      return [
        [
          'Kepatuhan PRB', 
          `(N = ${s.rawAda.countPrb})`, `${s.dataAda.avgKepatuhan.toFixed(1)}%`, 
          `(N = ${s.rawTanpa.countPrb})`, `${s.dataTanpa.avgKepatuhan.toFixed(1)}%`
        ],
        getVal('Home Care', s.rawAda.hc, s.rawAda.total, s.rawTanpa.hc, s.rawTanpa.total, s.dataAda.percHc, s.dataTanpa.percHc),
        getVal('Paliatif', s.rawAda.paliatif, s.rawAda.total, s.rawTanpa.paliatif, s.rawTanpa.total, s.dataAda.percPaliatif, s.dataTanpa.percPaliatif),
        getVal('Kolaborasi Interdisiplin', s.rawAda.kolaborasi, s.rawAda.hc, s.rawTanpa.kolaborasi, s.rawTanpa.hc, s.dataAda.percKolaborasi, s.dataTanpa.percKolaborasi),
        getVal('Outcome (Perbaikan)', s.rawAda.perbaikan, s.rawAda.hc, s.rawTanpa.perbaikan, s.rawTanpa.hc, s.dataAda.percPerbaikan, s.dataTanpa.percPerbaikan),
        [
          'Rata-rata Rujukan FKRTL',
          `(N = ${s.rawAda.countPrb})`, `${s.dataAda.avgRujukan.toFixed(2)}x`,
          `(N = ${s.rawTanpa.countPrb})`, `${s.dataTanpa.avgRujukan.toFixed(2)}x`
        ]
      ];
    };

    const headersList = ['Indikator Kinerja', 'Ada Sp.KKLP (Nilai/N)', 'Ada Sp.KKLP (Nilai %/x)', 'Tanpa Sp.KKLP (Nilai/N)', 'Tanpa Sp.KKLP (Nilai %/x)'];

    const tables = [
      {
        title: 'Ringkasan Kinerja Keseluruhan (Per Responden) - Matched',
        headers: headersList,
        data: formatExportData(metricsRMatched)
      },
      {
        title: 'Ringkasan Kinerja Keseluruhan (Per FKTP) - Matched',
        headers: headersList,
        data: formatExportData(metricsFMatched)
      },
      {
        title: 'Analisis Spektrum Kemampuan (Radar - Per Responden)',
        headers: ['Aspek Pelayanan', 'Ada (As Is)', 'Tanpa (As Is)', 'Ada (Matched)', 'Tanpa (Matched)'],
        data: combinedRadarData.map(d => [d.subject, `${d['Ada (As Is)'].toFixed(1)}%`, `${d['Tanpa (As Is)'].toFixed(1)}%`, `${d['Ada (Matched)'].toFixed(1)}%`, `${d['Tanpa (Matched)'].toFixed(1)}%`])
      },
      {
        title: 'Analisis Spektrum Kemampuan (Radar - Per FKTP)',
        headers: ['Aspek Pelayanan', 'Ada (As Is)', 'Tanpa (As Is)', 'Ada (Matched)', 'Tanpa (Matched)'],
        data: combinedRadarData.map(d => [d.subject, `${d['Ada (As Is)'].toFixed(1)}%`, `${d['Tanpa (As Is)'].toFixed(1)}%`, `${d['Ada (Matched)'].toFixed(1)}%`, `${d['Tanpa (Matched)'].toFixed(1)}%`])
      }
    ];

    const rawData = {
      headers: [
        'No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi', 'Ada Sp.KKLP',
        'Peserta PRB Aktif', 'Peserta PRB Rutin', 'Kepatuhan PRB (%)', 'Rata-rata Rujukan FKRTL',
        'Pelayanan Home Care', 'HC: Kolaborasi Nakes', 'HC: Ada Perbaikan',
        'Pelayanan Paliatif'
      ],
      rows: filteredData.map((row, idx) => {
        const prb = row.prb || {};
        const hc = row.home_care || {};
        const pal = row.paliatif || {};
        
        const prbAktif = Number(prb.jumlah) || 0;
        const prbRutin = Number(prb.rutinKunjungan) || 0;
        const prbPatuh = prbAktif > 0 ? ((prbRutin / prbAktif) * 100).toFixed(1) : 0;
        const rujukan = Number(prb.rataRujukan) || 0;

        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          row.doc_kklp || '-',
          prbAktif, prbRutin, prbPatuh, rujukan,
          hc.screening || 'Tidak',
          hc.kolaborasi || 'Tidak',
          hc.perbaikan || 'Tidak',
          pal.screening || 'Tidak'
        ];
      })
    };

    exportTablesToExcel('IMPACT SP.KKLP', tables, 'Dashboard_Impact_SpKKLP', rawData);
  };

  return (
    <div id="dashboard-impact-capture" className="space-y-8 animate-fade-in relative">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print gap-2 capture-exclude">
          <button onClick={() => downloadElementAsPNG('dashboard-impact-capture', 'Dashboard_Impact_SpKKLP')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm">
            <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
          </button>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center"><Stethoscope className="w-6 h-6 mr-2" /> Dampak Keberadaan Sp.KKLP</h2>
            <p className="text-primary-100 font-medium text-sm">
              Komparasi indikator pelayanan antara {statsAsIs.adaSp} (Ada) vs {statsAsIs.tanpaSp} (Tanpa) ➔ Diubah menjadi proporsional (Matched)
            </p>
          </div>
          {!isPrinting && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="bg-white/20 backdrop-blur-md rounded-lg p-1.5 flex items-center shadow-inner">
                <span className="text-xs font-semibold mr-2 opacity-80">Metode Statistik:</span>
                <select 
                  value={statMethod}
                  onChange={(e) => setStatMethod(e.target.value)}
                  className="bg-white/10 text-white border border-white/20 rounded-md text-xs font-semibold px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-white/50"
                  title="Metode Statistik"
                >
                  <option value="random" className="text-slate-800">1. Random Sampling (1:1)</option>
                  <option value="psm" className="text-slate-800">2. Propensity Score Matching (PSM)</option>
                  <option value="ipw" className="text-slate-800">3. Inverse Probability Weighting (IPW)</option>
                  <option value="stratified" className="text-slate-800">4. Stratified Analysis</option>
                </select>
              </div>
              <ViewToggle value={view} onChange={setView} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Kepatuhan PRB" valueAda={stats.dataAda.avgKepatuhan} valueTanpa={stats.dataTanpa.avgKepatuhan} subtitle="%" icon={Activity} colorClass="bg-blue-500" />
        <StatCard title="Rata-rata Rujukan FKRTL" valueAda={stats.dataAda.avgRujukan} valueTanpa={stats.dataTanpa.avgRujukan} subtitle="x" icon={AlertCircle} colorClass="bg-rose-500" />
        <StatCard title="Ketersediaan Home Care" valueAda={stats.dataAda.percHc} valueTanpa={stats.dataTanpa.percHc} subtitle="%" icon={Home} colorClass="bg-teal-500" />
        <StatCard title="Pelaporan Perbaikan Kondisi" valueAda={stats.dataAda.percPerbaikan} valueTanpa={stats.dataTanpa.percPerbaikan} subtitle="%" icon={CheckCircle2} colorClass="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="impact-kinerja-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : 'lg:col-span-2'}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('impact-kinerja-chart', 'Perbandingan_Kinerja_SpKKLP')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-6 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Perbandingan Kinerja Lintas Program (%)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={combinedSpData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [Number(value).toFixed(1) + '%', 'Capaian']} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                <Bar dataKey="Ada (As Is)" fill="#7dd3fc" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList dataKey="Ada (As Is)" position="top" fill="#38bdf8" fontSize={9} fontWeight={600} formatter={(val) => Number(val).toFixed(1)} />
                </Bar>
                <Bar dataKey="Tanpa (As Is)" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList dataKey="Tanpa (As Is)" position="top" fill="#94a3b8" fontSize={9} fontWeight={600} formatter={(val) => Number(val).toFixed(1)} />
                </Bar>
                <Bar dataKey="Ada (Matched)" fill="#0284c7" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList dataKey="Ada (Matched)" position="top" fill="#0369a1" fontSize={11} fontWeight={600} formatter={(val) => Number(val).toFixed(1) + '%'} />
                </Bar>
                <Bar dataKey="Tanpa (Matched)" fill="#475569" radius={[4, 4, 0, 0]} maxBarSize={30}>
                  <LabelList dataKey="Tanpa (Matched)" position="top" fill="#334155" fontSize={11} fontWeight={600} formatter={(val) => Number(val).toFixed(1) + '%'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="impact-radar-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('impact-radar-chart', 'Spektrum_Kemampuan_Radar')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-indigo-600" /> Analisis Spektrum Kemampuan (Radar)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">Area semakin luas menandakan kualitas/kapasitas pelayanan yang semakin menyeluruh.</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={combinedRadarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Ada (As Is)" dataKey="Ada (As Is)" stroke="#7dd3fc" fill="#7dd3fc" fillOpacity={0.1} />
                <Radar name="Tanpa (As Is)" dataKey="Tanpa (As Is)" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.1} />
                <Radar name="Ada (Matched)" dataKey="Ada (Matched)" stroke="#0284c7" fill="#0284c7" fillOpacity={0.4} />
                <Radar name="Tanpa (Matched)" dataKey="Tanpa (Matched)" stroke="#475569" fill="#475569" fillOpacity={0.4} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [Number(value).toFixed(1) + '%']} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-slate-600" /> Ringkasan Tabular</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th rowSpan={2} className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b border-r align-middle">Indikator Kinerja</th>
                  <th colSpan={3} className="px-4 py-2 bg-slate-50 font-semibold text-slate-700 border-b border-r text-center">Sebelum Matching (As Is)</th>
                  <th colSpan={3} className="px-4 py-2 bg-indigo-50 font-semibold text-indigo-900 border-b text-center">Sesudah Matching ({statMethod.toUpperCase()})</th>
                </tr>
                <tr>
                  <th className="px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-b text-center border-r">Ada</th>
                  <th className="px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-b text-center border-r">Tanpa</th>
                  <th className="px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-b text-center border-r">Selisih</th>
                  <th className="px-3 py-2 bg-indigo-50 font-semibold text-indigo-700 border-b text-center border-r">Ada</th>
                  <th className="px-3 py-2 bg-indigo-50 font-semibold text-indigo-700 border-b text-center border-r">Tanpa</th>
                  <th className="px-3 py-2 bg-indigo-50 font-semibold text-indigo-700 border-b text-center">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {combinedSpData.map((row, idx) => {
                  const diffAsIs = row['Ada (As Is)'] - row['Tanpa (As Is)'];
                  const diffMatched = row['Ada (Matched)'] - row['Tanpa (Matched)'];
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 border-r">{row.name}</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-500 border-r">{row['Ada (As Is)'].toFixed(1)}%</td>
                      <td className="px-3 py-3 text-center text-slate-400 border-r">{row['Tanpa (As Is)'].toFixed(1)}%</td>
                      <td className={`px-3 py-3 text-center font-bold border-r ${diffAsIs > 0 ? 'text-emerald-500' : 'text-rose-400'}`}>
                        {diffAsIs > 0 ? '+' : ''}{diffAsIs.toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-center font-bold text-primary-600 bg-indigo-50/30 border-r">{row['Ada (Matched)'].toFixed(1)}%</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-500 bg-indigo-50/30 border-r">{row['Tanpa (Matched)'].toFixed(1)}%</td>
                      <td className={`px-3 py-3 text-center font-bold bg-indigo-50/30 ${diffMatched > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diffMatched > 0 ? '+' : ''}{diffMatched.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center"><FileText className="w-5 h-5 mr-2 text-slate-600" /> Distribusi Kovariat (Jenis Faskes)</h3>
          <p className="text-xs text-slate-500 mb-4">Menunjukkan keseimbangan populasi (N) antara kelompok Ada dan Tanpa Sp.KKLP sebelum dan sesudah matching statistik.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th rowSpan={2} className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b border-r align-middle">Jenis Faskes</th>
                  <th colSpan={2} className="px-4 py-2 bg-slate-50 font-semibold text-slate-700 border-b border-r text-center">As Is (Raw N)</th>
                  <th colSpan={2} className="px-4 py-2 bg-indigo-50 font-semibold text-indigo-900 border-b text-center">Matched (Weighted N)</th>
                </tr>
                <tr>
                  <th className="px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-b text-center border-r">Ada</th>
                  <th className="px-3 py-2 bg-slate-50 font-semibold text-slate-600 border-b text-center border-r">Tanpa</th>
                  <th className="px-3 py-2 bg-indigo-50 font-semibold text-indigo-700 border-b text-center border-r">Ada</th>
                  <th className="px-3 py-2 bg-indigo-50 font-semibold text-indigo-700 border-b text-center">Tanpa</th>
                </tr>
              </thead>
              <tbody>
                {(view === 'responden' ? covBalanceR : covBalanceF).map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800 border-r">{row.name}</td>
                      <td className="px-3 py-3 text-center font-semibold text-slate-500 border-r">{row.asIsAda.toFixed(0)}</td>
                      <td className="px-3 py-3 text-center text-slate-400 border-r">{row.asIsTanpa.toFixed(0)}</td>
                      <td className="px-3 py-3 text-center font-bold text-primary-600 bg-indigo-50/30 border-r">{row.matchedAda.toFixed(1)}</td>
                      <td className="px-3 py-3 text-center font-medium text-slate-500 bg-indigo-50/30">{row.matchedTanpa.toFixed(1)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
