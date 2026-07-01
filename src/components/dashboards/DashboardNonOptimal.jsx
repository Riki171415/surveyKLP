import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, ShieldAlert, CheckCircle, TrendingDown, Download } from 'lucide-react';

const nonOptimalServices = [
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Manajemen pasien geriatri frailty", 
  "Precision medicine/konseling genetik dasar", "Layanan promotif berbasis keluarga"
];

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardNonOptimal({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [jknView, setJknView] = useState('responden');
  const [hambatanView, setHambatanView] = useState('responden');
  const [usulanView, setUsulanView] = useState('responden');

  const { nonOptStats, jknDataR, jknDataF, hambatanDataR, hambatanDataF, usulanDetailDataR, usulanDetailDataF } = useMemo(() => {
    let totalIdentified = 0;
    let totalIdentifiedF = 0;
    
    // -- Per Responden --
    const serviceStatsR = nonOptimalServices.map(service => ({
      name: service, identifiedCount: 0, jknYa: 0, jknTidak: 0, skala1: 0, skala2: 0, skala3: 0, skala4: 0
    }));

    filteredData.forEach(row => {
      const nonOpt = row.non_optimal || [];
      nonOptimalServices.forEach((service, idx) => {
        const item = nonOpt[idx] || {};
        if (item.masukJkn || item.skala) {
          totalIdentified++;
          serviceStatsR[idx].identifiedCount++;
          if (item.masukJkn === 'Ya') serviceStatsR[idx].jknYa++;
          else if (item.masukJkn === 'Tidak') serviceStatsR[idx].jknTidak++;

          if (item.skala === '1') serviceStatsR[idx].skala1++;
          else if (item.skala === '2') serviceStatsR[idx].skala2++;
          else if (item.skala === '3') serviceStatsR[idx].skala3++;
          else if (item.skala === '4') serviceStatsR[idx].skala4++;
        }
      });
    });

    // -- Per FKTP --
    const serviceStatsF = nonOptimalServices.map(service => ({
      name: service, identifiedCount: 0, jknYa: 0, jknTidak: 0, skala1: 0, skala2: 0, skala3: 0, skala4: 0
    }));

    uniqueFktpData?.forEach(fktp => {
      const fktpRespondents = filteredData.filter(r => r.fktp_name === fktp.fktp_name);
      
      nonOptimalServices.forEach((service, idx) => {
        let hasIdentified = false;
        let isYa = false;
        let isTidak = false;
        let maxSkala = 0;

        fktpRespondents.forEach(row => {
          const item = (row.non_optimal || [])[idx] || {};
          if (item.masukJkn || item.skala) hasIdentified = true;
          if (item.masukJkn === 'Ya') isYa = true;
          else if (item.masukJkn === 'Tidak') isTidak = true;
          if (item.skala) maxSkala = Math.max(maxSkala, Number(item.skala));
        });

        if (hasIdentified) {
          totalIdentifiedF++;
          serviceStatsF[idx].identifiedCount++;
          if (isYa) serviceStatsF[idx].jknYa++;
          else if (isTidak) serviceStatsF[idx].jknTidak++;

          if (maxSkala === 1) serviceStatsF[idx].skala1++;
          else if (maxSkala === 2) serviceStatsF[idx].skala2++;
          else if (maxSkala === 3) serviceStatsF[idx].skala3++;
          else if (maxSkala === 4) serviceStatsF[idx].skala4++;
        }
      });
    });

    const top3 = [...serviceStatsF].sort((a,b) => b.identifiedCount - a.identifiedCount).slice(0, 3);
    
    const getJknAgg = (stats) => {
      let totalYa = 0;
      let totalTidak = 0;
      stats.forEach(s => { totalYa += s.jknYa; totalTidak += s.jknTidak; });
      return [
        { name: 'Diusulkan Masuk JKN', value: totalYa },
        { name: 'Tidak Diusulkan', value: totalTidak }
      ].filter(d => d.value > 0);
    };

    const getUsulan = (stats) => stats.filter(s => s.jknYa > 0 || s.jknTidak > 0).map(s => ({
      name: s.name.replace('Pelayanan ', '').replace('Konsultasi ', ''),
      'Diusulkan JKN': s.jknYa,
      'Tidak Diusulkan': s.jknTidak,
      total: s.jknYa + s.jknTidak
    })).sort((a,b) => b['Diusulkan JKN'] - a['Diusulkan JKN']);

    const getHambatan = (stats) => stats.filter(s => s.identifiedCount > 0).map(s => ({
      name: s.name.replace('Pelayanan ', '').replace('Konsultasi ', ''),
      'Skala 1 (Sangat Kurang)': s.skala1,
      'Skala 2 (Kurang)': s.skala2,
      'Skala 3 (Cukup)': s.skala3,
      'Skala 4 (Sangat Baik)': s.skala4,
      total: s.identifiedCount
    })).sort((a,b) => b.total - a.total);

    return {
      nonOptStats: { totalIdentified, totalIdentifiedF, top3 },
      jknDataR: getJknAgg(serviceStatsR),
      jknDataF: getJknAgg(serviceStatsF),
      usulanDetailDataR: getUsulan(serviceStatsR),
      usulanDetailDataF: getUsulan(serviceStatsF),
      hambatanDataR: getHambatan(serviceStatsR),
      hambatanDataF: getHambatan(serviceStatsF)
    };
  }, [filteredData, uniqueFktpData]);

  const jknData = jknView === 'fktp' ? jknDataF : jknDataR;
  const hambatanData = hambatanView === 'fktp' ? hambatanDataF : hambatanDataR;
  const usulanDetailData = usulanView === 'fktp' ? usulanDetailDataF : usulanDetailDataR;
  const jknLabel = jknView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const hambatanLabel = hambatanView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const usulanLabel = usulanView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-600')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  const handleExport = () => {
    const tables = [
      {
        title: 'Statistik Layanan Non-Optimal (Per FKTP)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Respon Teridentifikasi', nonOptStats.totalIdentified],
          ['Total FKTP Teridentifikasi', nonOptStats.totalIdentifiedF],
          ['Diusulkan Masuk JKN', jknDataF.find(d => d.name === 'Diusulkan Masuk JKN')?.value || 0]
        ]
      },
      { title: 'Proporsi Usulan Masuk JKN (Per Responden)', headers: ['Kategori', 'Jumlah Responden'], data: jknDataR },
      { title: 'Proporsi Usulan Masuk JKN (Per FKTP)', headers: ['Kategori', 'Jumlah FKTP'], data: jknDataF },
      {
        title: 'Detail Usulan Layanan Masuk JKN (Per Responden)',
        headers: ['Layanan', 'Diusulkan JKN', 'Tidak Diusulkan', 'Total Respon'],
        data: usulanDetailDataR.map(d => [d.name, d['Diusulkan JKN'], d['Tidak Diusulkan'], d.total])
      },
      {
        title: 'Detail Usulan Layanan Masuk JKN (Per FKTP)',
        headers: ['Layanan', 'Diusulkan JKN', 'Tidak Diusulkan', 'Total FKTP'],
        data: usulanDetailDataF.map(d => [d.name, d['Diusulkan JKN'], d['Tidak Diusulkan'], d.total])
      },
      {
        title: 'Distribusi Skala Hambatan Pelaksanaan (Per Responden)',
        headers: ['Layanan', 'Skala 1 (Sangat Kurang)', 'Skala 2 (Kurang)', 'Skala 3 (Cukup)', 'Skala 4 (Sangat Baik)', 'Total'],
        data: hambatanDataR.map(h => [h.name, h['Skala 1 (Sangat Kurang)'], h['Skala 2 (Kurang)'], h['Skala 3 (Cukup)'], h['Skala 4 (Sangat Baik)'], h.total])
      },
      {
        title: 'Distribusi Skala Hambatan Pelaksanaan (Per FKTP)',
        headers: ['Layanan', 'Skala 1 (Sangat Kurang)', 'Skala 2 (Kurang)', 'Skala 3 (Cukup)', 'Skala 4 (Sangat Baik)', 'Total'],
        data: hambatanDataF.map(h => [h.name, h['Skala 1 (Sangat Kurang)'], h['Skala 2 (Kurang)'], h['Skala 3 (Cukup)'], h['Skala 4 (Sangat Baik)'], h.total])
      }
    ];

    const rawData = {
      headers: [
        'No', 'Nama Faskes', 'Provinsi',
        ...nonOptimalServices.flatMap(s => [
          `${s}: Teridentifikasi`, `${s}: Masuk JKN`, `${s}: Skala Hambatan`
        ])
      ],
      rows: filteredData.map((row, idx) => {
        const nonOpt = row.non_optimal || [];
        return [
          idx + 1, row.fktp_name || '-', row.provinsi || '-',
          ...nonOptimalServices.flatMap((_, sIdx) => {
            const item = nonOpt[sIdx] || {};
            return [
              (item.masukJkn || item.skala) ? 'Ya' : 'Tidak',
              item.masukJkn || '-',
              item.skala || '-'
            ];
          })
        ];
      })
    };

    exportTablesToExcel('LAYANAN NON-OPTIMAL', tables, 'Dashboard_NonOptimal', rawData);
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Layanan Teridentifikasi" value={nonOptStats.totalIdentified} subtitle="Respon layanan non-optimal" icon={Activity} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Top 1 Layanan Non-Optimal" value={nonOptStats.top3[0]?.identifiedCount || 0} subtitle={nonOptStats.top3[0]?.name || '-'} icon={TrendingDown} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Top 2 Layanan Non-Optimal" value={nonOptStats.top3[1]?.identifiedCount || 0} subtitle={nonOptStats.top3[1]?.name || '-'} icon={ShieldAlert} colorClass="bg-orange-500 text-orange-600 bg-orange-100" />
        <StatCard title="Diusulkan Masuk JKN" value={jknData.find(d => d.name === 'Diusulkan Masuk JKN')?.value || 0} subtitle="Dari total identifikasi" icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-rose-600" /> Proporsi Usulan Masuk JKN</h3>
            {!isPrinting && <ViewToggle value={jknView} onChange={setJknView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{jknView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData?.length || 0} FKTP unik`}</p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={jknData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#10b981" /> {/* Diusulkan */}
                  <Cell fill="#f43f5e" /> {/* Tidak Diusulkan */}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} ${jknLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-rose-600" /> Distribusi Skala Hambatan Pelaksanaan (1-4)</h3>
            {!isPrinting && <ViewToggle value={hambatanView} onChange={setHambatanView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{hambatanView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData?.length || 0} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={hambatanData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${hambatanLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Skala 1 (Sangat Kurang)" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Skala 2 (Kurang)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Skala 3 (Cukup)" stackId="a" fill="#eab308" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Skala 4 (Sangat Baik)" stackId="a" fill="#22c55e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-rose-600" /> Detail Usulan Layanan Masuk JKN</h3>
            {!isPrinting && <ViewToggle value={usulanView} onChange={setUsulanView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{usulanView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData?.length || 0} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={usulanDetailData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${usulanLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Diusulkan JKN" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Tidak Diusulkan" stackId="a" fill="#f43f5e" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
