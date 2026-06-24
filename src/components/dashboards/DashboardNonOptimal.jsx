import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, ShieldAlert, CheckCircle, TrendingDown } from 'lucide-react';

const nonOptimalServices = [
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Manajemen pasien geriatri frailty", 
  "Precision medicine/konseling genetik dasar", "Layanan promotif berbasis keluarga"
];

export default function DashboardNonOptimal({ filteredData, COLORS, isPrinting }) {
  const { nonOptStats, jknData, hambatanData } = useMemo(() => {
    let totalIdentified = 0;
    
    // Per service stats
    const serviceStats = nonOptimalServices.map(service => ({
      name: service,
      identifiedCount: 0,
      jknYa: 0,
      jknTidak: 0,
      skala1: 0,
      skala2: 0,
      skala3: 0,
      skala4: 0
    }));

    filteredData.forEach(row => {
      const nonOpt = row.non_optimal || [];
      nonOptimalServices.forEach((service, idx) => {
        const item = nonOpt[idx] || {};
        if (item.masukJkn || item.skala) {
          totalIdentified++;
          serviceStats[idx].identifiedCount++;
          if (item.masukJkn === 'Ya') serviceStats[idx].jknYa++;
          else if (item.masukJkn === 'Tidak') serviceStats[idx].jknTidak++;

          if (item.skala === '1') serviceStats[idx].skala1++;
          else if (item.skala === '2') serviceStats[idx].skala2++;
          else if (item.skala === '3') serviceStats[idx].skala3++;
          else if (item.skala === '4') serviceStats[idx].skala4++;
        }
      });
    });

    const top3 = [...serviceStats].sort((a,b) => b.identifiedCount - a.identifiedCount).slice(0, 3);
    
    // Aggregate for JKN Pie Chart
    let totalJknYa = 0;
    let totalJknTidak = 0;
    serviceStats.forEach(s => {
      totalJknYa += s.jknYa;
      totalJknTidak += s.jknTidak;
    });

    const jknDataAgg = [
      { name: 'Diusulkan Masuk JKN', value: totalJknYa },
      { name: 'Tidak Diusulkan', value: totalJknTidak }
    ].filter(d => d.value > 0);

    return {
      nonOptStats: {
        totalIdentified,
        top3
      },
      jknData: jknDataAgg,
      hambatanData: serviceStats.filter(s => s.identifiedCount > 0).map(s => ({
        name: s.name.replace('Pelayanan ', '').replace('Konsultasi ', ''),
        'Skala 1 (Sangat Kurang)': s.skala1,
        'Skala 2 (Kurang)': s.skala2,
        'Skala 3 (Cukup)': s.skala3,
        'Skala 4 (Sangat Baik)': s.skala4,
        total: s.identifiedCount
      })).sort((a,b) => b.total - a.total)
    };
  }, [filteredData]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Layanan Teridentifikasi" value={nonOptStats.totalIdentified} subtitle="Respon layanan non-optimal" icon={Activity} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Top 1 Layanan Non-Optimal" value={nonOptStats.top3[0]?.identifiedCount || 0} subtitle={nonOptStats.top3[0]?.name || '-'} icon={TrendingDown} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Top 2 Layanan Non-Optimal" value={nonOptStats.top3[1]?.identifiedCount || 0} subtitle={nonOptStats.top3[1]?.name || '-'} icon={ShieldAlert} colorClass="bg-orange-500 text-orange-600 bg-orange-100" />
        <StatCard title="Diusulkan Masuk JKN" value={jknData.find(d => d.name === 'Diusulkan Masuk JKN')?.value || 0} subtitle="Dari total identifikasi" icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-rose-600" /> Proporsi Usulan Masuk JKN</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Usulan Masuk JKN" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={jknData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#10b981" /> {/* Diusulkan */}
                  <Cell fill="#f43f5e" /> {/* Tidak Diusulkan */}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Respon`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><TrendingDown className="w-5 h-5 mr-2 text-rose-600" /> Distribusi Skala Hambatan Pelaksanaan (1-4)</h3>
            {!isPrinting && <ExportButton fileName="Distribusi Skala Hambatan Pelaksanaan (1-4)" />}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={hambatanData} layout="vertical" margin={{ top: 10, right: 30, left: 100, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
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
    </div>
  );
}
