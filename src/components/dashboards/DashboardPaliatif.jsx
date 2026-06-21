import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { HeartPulse, Users, CheckCircle, Heart, Stethoscope, CheckCircle2 } from 'lucide-react';

export default function DashboardPaliatif({ filteredData, COLORS, isPrinting }) {
  const { palStats, kondisiData, tujuanData, kepatuhanData } = useMemo(() => {
    let totalFktp = filteredData.length;
    let fktpWithPaliatif = 0;
    let adaKolaborasi = 0;
    let adaPerbaikan = 0;

    const kondisiCounts = {};
    const tujuanCounts = {};
    const kepatuhanCounts = { 'Tinggi': 0, 'Sedang': 0, 'Rendah': 0 };

    filteredData.forEach(row => {
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') {
        fktpWithPaliatif++;
        
        if (pal.kolaborasi === 'Ya') adaKolaborasi++;
        if (pal.perbaikan === 'Ya') adaPerbaikan++;
        
        if (pal.kepatuhan) {
          kepatuhanCounts[pal.kepatuhan] = (kepatuhanCounts[pal.kepatuhan] || 0) + 1;
        }

        const kondisiObj = pal.kondisi || {};
        Object.keys(kondisiObj).forEach(k => {
          if (kondisiObj[k]) kondisiCounts[k] = (kondisiCounts[k] || 0) + 1;
        });
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => {
           if (pal[`kondisi_${k}`]) kondisiCounts[k] = (kondisiCounts[k] || 0) + 1;
        });

        const tujuanObj = pal.tujuan || {};
        Object.keys(tujuanObj).forEach(j => {
          if (tujuanObj[j]) tujuanCounts[j] = (tujuanCounts[j] || 0) + 1;
        });
        ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].forEach(t => {
           if (pal[`tujuan_${t}`]) tujuanCounts[t] = (tujuanCounts[t] || 0) + 1;
        });
      }
    });

    return {
      palStats: {
        proporsiPal: totalFktp > 0 ? (fktpWithPaliatif / totalFktp) * 100 : 0,
        fktpWithPaliatif,
        proporsiKolaborasi: fktpWithPaliatif > 0 ? (adaKolaborasi / fktpWithPaliatif) * 100 : 0,
        proporsiPerbaikan: fktpWithPaliatif > 0 ? (adaPerbaikan / fktpWithPaliatif) * 100 : 0,
      },
      kondisiData: Object.keys(kondisiCounts).map(k => ({ name: k, value: kondisiCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0),
      tujuanData: Object.keys(tujuanCounts).map(k => ({ name: k, value: tujuanCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0),
      kepatuhanData: Object.keys(kepatuhanCounts).map(k => ({ name: k, value: kepatuhanCounts[k] })).filter(d => d.value > 0)
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
        <StatCard title="FKTP Memberikan Paliatif" value={`${palStats.fktpWithPaliatif} FKTP`} subtitle={`${palStats.proporsiPal.toFixed(1)}% dari total FKTP`} icon={HeartPulse} colorClass="bg-purple-500 text-purple-600 bg-purple-100" />
        <StatCard title="Tingkat Kolaborasi" value={`${palStats.proporsiKolaborasi.toFixed(1)}%`} subtitle="FKTP yang berkolaborasi dengan nakes lain" icon={Users} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        <StatCard title="Outcome (Perbaikan)" value={`${palStats.proporsiPerbaikan.toFixed(1)}%`} subtitle="FKTP melaporkan perbaikan kualitas hidup" icon={CheckCircle2} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-purple-600" /> Tujuan Utama Pelayanan Paliatif</h3>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={tujuanData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#9333ea" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Heart className="w-5 h-5 mr-2 text-purple-600" /> Kondisi Pasien Paliatif</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={kondisiData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${name}` : ''}>
                  {kondisiData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-purple-600" /> Tingkat Kepatuhan Pasien/Keluarga</h3>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kepatuhanData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={80} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={32}>
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
