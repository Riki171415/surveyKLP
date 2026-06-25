import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { AlertTriangle, Users, FileText, Database } from 'lucide-react';

export default function DashboardKendala({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const { kendalaStats, kendalaData, dukunganData } = useMemo(() => {
    let fktpWithKendala = 0;
    const kendalaCounts = {
      'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 
      'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0
    };

    uniqueFktpData.forEach(row => {
      const k = row.spkklp_kendala || {};
      if (k.hasKendala === 'Ya') {
        fktpWithKendala++;
        Object.keys(kendalaCounts).forEach(key => {
          if (k[`kendala_${key}`]) kendalaCounts[key]++;
        });
      }
    });

    const kData = Object.keys(kendalaCounts).map(k => ({ name: k, value: kendalaCounts[k] })).sort((a,b) => b.value - a.value);

    // Kebutuhan dukungan (proxy dari kendala pembiayaan vs regulasi dll)
    const dukData = [
      { name: 'Butuh Dukungan Pendanaan', value: kendalaCounts['Pembiayaan'] },
      { name: 'Butuh Dukungan Regulasi', value: kendalaCounts['Regulasi'] },
      { name: 'Butuh Dukungan SDM/Alkes', value: kendalaCounts['SDM'] + kendalaCounts['Alat kesehatan'] + kendalaCounts['Sarana prasarana'] }
    ].filter(d => d.value > 0);

    return {
      kendalaStats: {
        totalFktpKendala: fktpWithKendala,
        proporsiKendala: uniqueFktpData.length > 0 ? (fktpWithKendala / uniqueFktpData.length) * 100 : 0,
        top3: kData.slice(0, 3)
      },
      kendalaData: kData.filter(d => d.value > 0),
      dukunganData: dukData
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
        <StatCard title="FKTP Melaporkan Kendala" value={kendalaStats.totalFktpKendala} subtitle={`${kendalaStats.proporsiKendala.toFixed(1)}% dari total FKTP`} icon={AlertTriangle} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Top 1 Kendala Utama" value={kendalaStats.top3[0]?.value || 0} subtitle={kendalaStats.top3[0]?.name || '-'} icon={Users} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Top 2 Kendala Utama" value={kendalaStats.top3[1]?.value || 0} subtitle={kendalaStats.top3[1]?.name || '-'} icon={Database} colorClass="bg-orange-500 text-orange-600 bg-orange-100" />
        <StatCard title="Top 3 Kendala Utama" value={kendalaStats.top3[2]?.value || 0} subtitle={kendalaStats.top3[2]?.name || '-'} icon={FileText} colorClass="bg-red-500 text-red-600 bg-red-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-rose-600" /> Distribusi Kendala Pelayanan</h3>
            {!isPrinting && <ExportButton fileName="Distribusi Kendala Pelayanan" />}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kendalaData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Database className="w-5 h-5 mr-2 text-rose-600" /> Proporsi Kebutuhan Dukungan</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Kebutuhan Dukungan" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={dukunganData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {dukunganData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Jawaban`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
