import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Stethoscope, Users, Clock, FileText, CheckCircle } from 'lucide-react';

export default function DashboardDPM({ filteredData, COLORS, isPrinting }) {
  const dpmDataFiltered = useMemo(() => {
    return filteredData.filter(row => row.role === 'Dokter Praktik Mandiri' || row.dpm);
  }, [filteredData]);

  const { dpmStats, lamaPraktikData, bebanPasienData, rekamMedisData, kunjunganData, aspekData } = useMemo(() => {
    const lamaCount = {};
    const bebanCount = {};
    const rekamMedisCount = { 'Ya': 0, 'Tidak': 0 };
    const kunjunganCount = { 'Ya (Melakukan)': 0, 'Tidak': 0 };
    const aspekCount = {};

    let totalLayanan = 0;

    dpmDataFiltered.forEach(row => {
      const dpm = row.dpm || {};
      const kar = dpm.karakteristik || {};
      const pen = dpm.pendekatan || {};
      const kon = dpm.kontinuitas || {};
      const gam = dpm.gambaran || {};

      if (kar.lamaPraktik) lamaCount[kar.lamaPraktik] = (lamaCount[kar.lamaPraktik] || 0) + 1;
      if (kar.kunjunganPerHari) bebanCount[kar.kunjunganPerHari] = (bebanCount[kar.kunjunganPerHari] || 0) + 1;

      // Rekam Medis (dari Kontinuitas: sistemPencatatan)
      if (kon.sistemPencatatan) rekamMedisCount[kon.sistemPencatatan]++;

      // Kunjungan Keluarga (dari Pendekatan: melakukanKunjunganRumah)
      if (pen.melakukanKunjunganRumah === 'Ya') kunjunganCount['Ya (Melakukan)']++;
      else if (pen.melakukanKunjunganRumah === 'Tidak') kunjunganCount['Tidak']++;

      // Aspek Digali
      if (Array.isArray(pen.aspekDigali)) {
        pen.aspekDigali.forEach(a => {
          if (a !== 'Tidak ada') {
            aspekCount[a] = (aspekCount[a] || 0) + 1;
            totalLayanan++;
          }
        });
      }
      
      // Kegiatan Dilakukan
      if (Array.isArray(gam.kegiatanDilakukan)) {
        gam.kegiatanDilakukan.forEach(k => {
          if (!k.includes('Tidak pernah')) {
            aspekCount[k] = (aspekCount[k] || 0) + 1;
            totalLayanan++;
          }
        });
      }
    });

    const aspekArr = Object.keys(aspekCount).map(k => ({ name: k, value: aspekCount[k] })).sort((a,b) => b.value - a.value);

    return {
      dpmStats: {
        totalDpm: dpmDataFiltered.length,
        top3Layanan: aspekArr.slice(0, 3)
      },
      lamaPraktikData: Object.keys(lamaCount).map(k => ({ name: k, value: lamaCount[k] })).sort((a,b) => b.value - a.value),
      bebanPasienData: Object.keys(bebanCount).map(k => ({ name: k, value: bebanCount[k] })).sort((a,b) => b.value - a.value),
      rekamMedisData: [
        { name: 'Menerapkan RM Terintegrasi', value: rekamMedisCount['Ya'] },
        { name: 'Belum Menerapkan', value: rekamMedisCount['Tidak'] }
      ].filter(d => d.value > 0),
      kunjunganData: [
        { name: 'Melakukan Kunjungan', value: kunjunganCount['Ya (Melakukan)'] },
        { name: 'Tidak Melakukan', value: kunjunganCount['Tidak'] }
      ].filter(d => d.value > 0),
      aspekData: aspekArr.slice(0, 7) // Top 7 Kegiatan/Aspek
    };
  }, [dpmDataFiltered]);

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

  if (dpmDataFiltered.length === 0) {
    return (
      <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
        <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Belum Ada Data DPM</h3>
        <p className="text-slate-500 mt-2">Dashboard ini khusus menampilkan data dari Dokter Praktik Mandiri.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Responden DPM" value={dpmStats.totalDpm} icon={Stethoscope} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Kegiatan Terbanyak 1" value={dpmStats.top3Layanan[0]?.value || 0} subtitle={dpmStats.top3Layanan[0]?.name || '-'} icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Kegiatan Terbanyak 2" value={dpmStats.top3Layanan[1]?.value || 0} subtitle={dpmStats.top3Layanan[1]?.name || '-'} icon={FileText} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Kegiatan Terbanyak 3" value={dpmStats.top3Layanan[2]?.value || 0} subtitle={dpmStats.top3Layanan[2]?.name || '-'} icon={Users} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Proporsi Kunjungan Keluarga</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={kunjunganData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Penerapan RM / Family Folder</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rekamMedisData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#6366f1" />
                  <Cell fill="#94a3b8" />
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-600" /> Distribusi Lama Praktik</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lamaPraktikData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah DPM" fill="#f59e0b" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-emerald-600" /> Top Kegiatan Holistik & Aspek yang Digali</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aspekData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={180} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah DPM" fill="#10b981" radius={[0, 6, 6, 0]} barSize={32}>
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
