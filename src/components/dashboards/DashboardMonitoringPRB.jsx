import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, AlertCircle, FileSearch, ShieldAlert } from 'lucide-react';

export default function DashboardMonitoringPRB({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const { monStats, mekanismeData, kendalaData } = useMemo(() => {
    let fktpWithMekanisme = 0;
    const mekCounts = {
      'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 
      'Tidak ada mekanisme khusus': 0, 'Lainnya': 0
    };

    const kendalaMap = {};

    uniqueFktpData.forEach(row => {
      const prb = row.prb || {};
      
      let hasMekanisme = false;
      Object.keys(mekCounts).forEach(mek => {
        if (prb[`mek_${mek}`]) {
          mekCounts[mek]++;
          if (mek !== 'Tidak ada mekanisme khusus') hasMekanisme = true;
        }
      });
      if (hasMekanisme) fktpWithMekanisme++;

      if (prb.kendala && prb.kendala.trim().length > 3) {
        // Extract words for a simple "kendala" distribution (pseudo word cloud / bar chart)
        const text = (prb.kendala || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        const words = text.split(/\s+/).filter(w => w.length > 3 && !['yang', 'dari', 'pada', 'untuk', 'dengan', 'dan', 'atau', 'ini', 'itu', 'karena', 'tidak', 'belum', 'kurang'].includes(w));
        words.forEach(w => {
          kendalaMap[w] = (kendalaMap[w] || 0) + 1;
        });
      }
    });

    const topKendala = Object.keys(kendalaMap).map(k => ({ name: k, value: kendalaMap[k] })).sort((a,b) => b.value - a.value).slice(0, 10);
    const proporsiMekanisme = uniqueFktpData.length > 0 ? (fktpWithMekanisme / uniqueFktpData.length) * 100 : 0;

    return {
      monStats: {
        fktpWithMekanisme,
        proporsiMekanisme
      },
      mekanismeData: Object.keys(mekCounts).map(k => ({ name: k, value: mekCounts[k] })).filter(d => d.value > 0),
      kendalaData: topKendala
    };
  }, [uniqueFktpData]);

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
        <StatCard title="Total FKTP dengan Mekanisme" value={monStats.fktpWithMekanisme} subtitle={`${monStats.proporsiMekanisme.toFixed(1)}% dari total FKTP`} icon={Activity} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Top Mekanisme" value={mekanismeData.sort((a,b)=>b.value-a.value)[0]?.name || '-'} subtitle="Paling banyak digunakan" icon={FileSearch} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Top Kendala Pelaksanaan" value={kendalaData[0]?.name || '-'} subtitle={`${kendalaData[0]?.value || 0} penyebutan`} icon={AlertCircle} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Kata Kunci Kendala #2" value={kendalaData[1]?.name || '-'} subtitle={`${kendalaData[1]?.value || 0} penyebutan`} icon={ShieldAlert} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-600" /> Proporsi Mekanisme Utama PRB</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Mekanisme Utama PRB" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={mekanismeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {mekanismeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-amber-600" /> Top 10 Kata Kunci Kendala Pelaksanaan</h3>
            {!isPrinting && <ExportButton fileName="Top 10 Kata Kunci Kendala Pelaksanaan" />}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kendalaData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={80} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} sebutan`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Frekuensi Kata" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
