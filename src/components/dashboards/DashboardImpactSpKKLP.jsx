import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, LabelList, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { Stethoscope, Activity, Home, HeartPulse, CheckCircle2, AlertCircle, FileText, Download } from 'lucide-react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';

export default function DashboardImpactSpKKLP({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  
  const { spData, radarData, tableData, stats } = useMemo(() => {
    let adaSp = 0, tanpaSp = 0;
    
    const metrikAda = { prbAktif: 0, kepatuhanPrb: 0, rujukanFkrtl: 0, hc: 0, paliatif: 0, kolaborasiHc: 0, perbaikanHc: 0 };
    const metrikTanpa = { prbAktif: 0, kepatuhanPrb: 0, rujukanFkrtl: 0, hc: 0, paliatif: 0, kolaborasiHc: 0, perbaikanHc: 0 };

    let countPrbAda = 0, countPrbTanpa = 0;

    uniqueFktpData.forEach(row => {
      const isAdaSp = row.doc_kklp === 'Ya';
      if (isAdaSp) adaSp++; else tanpaSp++;

      const m = isAdaSp ? metrikAda : metrikTanpa;
      
      // PRB
      const prb = row.prb || {};
      if (prb.jumlah !== undefined && prb.jumlah !== '') {
        m.prbAktif += Number(prb.jumlah) || 0;
        m.rujukanFkrtl += Number(prb.rujukan_fkrtl) || 0;
        
        const aktif = Number(prb.jumlah) || 0;
        const rutin = Number(prb.rutinKunjungan) || 0;
        if (aktif > 0) {
          m.kepatuhanPrb += (rutin / aktif) * 100;
          if (isAdaSp) countPrbAda++; else countPrbTanpa++;
        }
      }

      // Home Care
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        m.hc++;
        if (hc.kolaborasi === 'Ya') m.kolaborasiHc++;
        if (hc.perbaikan === 'Ya') m.perbaikanHc++;
      }

      // Paliatif
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') m.paliatif++;
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

    return { spData: barKinerja, radarData: radar, stats: { adaSp, tanpaSp, dataAda, dataTanpa } };
  }, [filteredData, uniqueFktpData]);

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
    const tables = [
      {
        title: 'Komparasi Kinerja Lintas Program',
        headers: ['Indikator Kinerja', 'Ada Sp.KKLP', 'Tanpa Sp.KKLP'],
        data: spData.map(d => [d.name, `${d['Ada Sp.KKLP'].toFixed(1)}%`, `${d['Tanpa Sp.KKLP'].toFixed(1)}%`])
      },
      {
        title: 'Analisis Spektrum Kemampuan (Radar)',
        headers: ['Aspek Pelayanan', 'Ada Sp.KKLP', 'Tanpa Sp.KKLP'],
        data: radarData.map(d => [d.subject, `${d['Ada'].toFixed(1)}%`, `${d['Tanpa'].toFixed(1)}%`])
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
    <div className="space-y-8 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center"><Stethoscope className="w-6 h-6 mr-2" /> Dampak Keberadaan Sp.KKLP</h2>
            <p className="text-primary-100 font-medium">Komparasi capaian indikator pelayanan antara {stats.adaSp} FKTP dengan Sp.KKLP vs {stats.tanpaSp} FKTP tanpa Sp.KKLP</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Kepatuhan PRB" valueAda={stats.dataAda.avgKepatuhan} valueTanpa={stats.dataTanpa.avgKepatuhan} subtitle="%" icon={Activity} colorClass="bg-blue-500" />
        <StatCard title="Rata-rata Rujukan FKRTL" valueAda={stats.dataAda.avgRujukan} valueTanpa={stats.dataTanpa.avgRujukan} subtitle="x" icon={AlertCircle} colorClass="bg-rose-500" />
        <StatCard title="Ketersediaan Home Care" valueAda={stats.dataAda.percHc} valueTanpa={stats.dataTanpa.percHc} subtitle="%" icon={Home} colorClass="bg-teal-500" />
        <StatCard title="Pelaporan Perbaikan Kondisi" valueAda={stats.dataAda.percPerbaikan} valueTanpa={stats.dataTanpa.percPerbaikan} subtitle="%" icon={CheckCircle2} colorClass="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : 'lg:col-span-2'}`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Perbandingan Kinerja Lintas Program (%)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={spData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => [Number(value).toFixed(1) + '%', 'Capaian']} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
                <Bar dataKey="Ada Sp.KKLP" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="Ada Sp.KKLP" position="top" fill="#0284c7" fontSize={11} fontWeight={600} formatter={(val) => Number(val).toFixed(1) + '%'} />
                </Bar>
                <Bar dataKey="Tanpa Sp.KKLP" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="Tanpa Sp.KKLP" position="top" fill="#64748b" fontSize={11} fontWeight={600} formatter={(val) => Number(val).toFixed(1) + '%'} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-indigo-600" /> Analisis Spektrum Kemampuan (Radar)</h3>
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">Area semakin luas menandakan kualitas/kapasitas pelayanan yang semakin menyeluruh.</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Ada Sp.KKLP" dataKey="Ada" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                <Radar name="Tanpa Sp.KKLP" dataKey="Tanpa" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} />
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
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b">Indikator Kinerja</th>
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b text-center">Ada Sp.KKLP</th>
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b text-center">Tanpa Sp.KKLP</th>
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b text-center">Selisih</th>
                </tr>
              </thead>
              <tbody>
                {spData.map((row, idx) => {
                  const diff = row['Ada Sp.KKLP'] - row['Tanpa Sp.KKLP'];
                  return (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                      <td className="px-4 py-3 text-center text-primary-600 font-bold">{row['Ada Sp.KKLP'].toFixed(1)}%</td>
                      <td className="px-4 py-3 text-center text-slate-500 font-medium">{row['Tanpa Sp.KKLP'].toFixed(1)}%</td>
                      <td className={`px-4 py-3 text-center font-bold ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
