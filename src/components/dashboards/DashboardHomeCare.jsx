import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Home, Users, CheckCircle, Heart, Stethoscope, Clock, CheckCircle2 } from 'lucide-react';

export default function DashboardHomeCare({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const { hcStats, kondisiData, jenisData, kepatuhanData } = useMemo(() => {
    let totalFktp = uniqueFktpData.length;
    let fktpWithHomeCare = 0;
    let sumKunjungan = 0;
    let adaKolaborasi = 0;
    let adaPerbaikan = 0;

    uniqueFktpData.forEach(row => {
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        fktpWithHomeCare++;
        sumKunjungan += Number(hc.jumlahKunjungan) || 0;
        if (hc.kolaborasi === 'Ya') adaKolaborasi++;
        if (hc.perbaikan === 'Ya') adaPerbaikan++;
      }
    });

    const kondisiCounts = {};
    const jenisCounts = {};
    const kepatuhanCounts = { 'Tinggi (>80%)': 0, 'Sedang (50–80%)': 0, 'Rendah (<50%)': 0 };

    filteredData.forEach(row => {
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        if (hc.kepatuhan) {
          kepatuhanCounts[hc.kepatuhan] = (kepatuhanCounts[hc.kepatuhan] || 0) + 1;
        }

        const kondisiObj = hc.kondisi || {};
        Object.keys(kondisiObj).forEach(k => {
          if (kondisiObj[k]) kondisiCounts[k] = (kondisiCounts[k] || 0) + 1;
        });
        
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => {
           if (hc[`kondisi_${k}`]) kondisiCounts[k] = (kondisiCounts[k] || 0) + 1;
        });

        const jenisObj = hc.jenisLayanan || {};
        Object.keys(jenisObj).forEach(j => {
          if (jenisObj[j]) jenisCounts[j] = (jenisCounts[j] || 0) + 1;
        });
        ['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'].forEach(j => {
           if (hc[`jenis_${j}`]) jenisCounts[j] = (jenisCounts[j] || 0) + 1;
        });
      }
    });

    return {
      hcStats: {
        proporsiHc: totalFktp > 0 ? (fktpWithHomeCare / totalFktp) * 100 : 0,
        fktpWithHomeCare,
        avgKunjungan: fktpWithHomeCare > 0 ? Math.round(sumKunjungan / fktpWithHomeCare) : 0,
        proporsiKolaborasi: fktpWithHomeCare > 0 ? (adaKolaborasi / fktpWithHomeCare) * 100 : 0,
        proporsiPerbaikan: fktpWithHomeCare > 0 ? (adaPerbaikan / fktpWithHomeCare) * 100 : 0,
      },
      kondisiData: Object.keys(kondisiCounts).map(k => ({ name: k, value: kondisiCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0),
      jenisData: Object.keys(jenisCounts).map(k => ({ name: k, value: jenisCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0),
      kepatuhanData: Object.keys(kepatuhanCounts).map(k => ({ name: k, value: kepatuhanCounts[k] })).filter(d => d.value > 0)
    };
  }, [filteredData, uniqueFktpData]);

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

  const GaugeChart = ({ value, label, color }) => {
    const data = [
      { name: 'Value', value: value },
      { name: 'Empty', value: 100 - value }
    ];
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="h-40 w-full relative">
          <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
            <PieChart>
              <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value" stroke="none">
                <Cell fill={color} />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-3xl font-bold" style={{ color }}>{value.toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-600 mt-4 text-center">{label}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="FKTP Memberikan Home Care" value={`${hcStats.fktpWithHomeCare} FKTP`} subtitle={`${hcStats.proporsiHc.toFixed(1)}% dari total FKTP`} icon={Home} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Rata-rata Kunjungan" value={`${hcStats.avgKunjungan}x`} subtitle="Kunjungan home care per bulan" icon={Clock} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Kolaborasi Nakes Lain" value={`${hcStats.proporsiKolaborasi.toFixed(1)}%`} subtitle="FKTP yang berkolaborasi" icon={Users} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        <StatCard title="Outcome (Perbaikan Kondisi)" value={`${hcStats.proporsiPerbaikan.toFixed(1)}%`} subtitle="FKTP melaporkan perbaikan" icon={CheckCircle2} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-teal-600" /> Jenis Layanan Home Care</h3>
            {!isPrinting && <ExportButton fileName="Jenis Layanan Home Care" />}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={jenisData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#14b8a6" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Heart className="w-5 h-5 mr-2 text-teal-600" /> Kondisi Pasien Home Care</h3>
            {!isPrinting && <ExportButton fileName="Kondisi Pasien Home Care" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={kondisiData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {kondisiData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-teal-600" /> Tingkat Kepatuhan Pasien</h3>
            {!isPrinting && <ExportButton fileName="Tingkat Kepatuhan Pasien" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kepatuhanData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#0ea5e9" radius={[0, 6, 6, 0]} barSize={32}>
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
