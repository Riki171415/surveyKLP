import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Stethoscope, Award, FileSearch, CheckCircle } from 'lucide-react';

const relevansiItems = [
  "Dokter Sp.KKLP memberikan layanan promotif-preventif yang lebih komprehensif dibandingkan dokter umum.",
  "Dokter Sp.KKLP mampu menangani pasien dengan multimorbiditas (lebih dari 2 penyakit kronis) tanpa harus merujuk, dibanding dokter umum.",
  "Dalam manajemen pasien PRB, dokter Sp.KKLP lebih aktif melakukan pemantauan dan edukasi sehingga kepatuhan pasien lebih tinggi.",
  "Angka rujukan ke rumah sakit pada pasien yang ditangani Sp.KKLP lebih rendah dibanding pasien yang ditangani dokter umum.",
  "Dokter Sp.KKLP lebih sering melakukan kunjungan rumah dan family conference dibanding dokter umum.",
  "Kehadiran Sp.KKLP meningkatkan mutu rekam medis dan dokumentasi klinis.",
  "Waktu konsultasi rata-rata yang diberikan Sp.KKLP per pasien lebih lama dan lebih mendalam."
];

const layananDirujukItems = [
  "Kasus PTM tanpa komplikasi (DM, Hipertensi)", "Penanganan luka diabetes berat", 
  "Tindakan bedah minor", "Pelayanan paliatif akhir hayat", 
  "Gangguan jiwa ringan-sedang", "Penanganan fraktur tertutup sederhana"
];

export default function DashboardSpKKLP({ filteredData, COLORS, isPrinting }) {
  const { docStats, relevansiData, dirujukData, topRelevansi } = useMemo(() => {
    let spkklpYa = 0;
    let spkklpTidak = 0;
    let totalDocUmum = 0;
    let totalDocGigi = 0;

    const relScores = relevansiItems.map(r => ({ name: r, totalScore: 0, count: 0 }));
    const dirujukCounts = {};

    filteredData.forEach(row => {
      if (row.doc_kklp === 'Ya') spkklpYa++; else spkklpTidak++;
      totalDocUmum += Number(row.doc_umum) || 0;
      totalDocGigi += Number(row.doc_gigi) || 0;

      const rel = row.relevansi_spkklp || {};
      relevansiItems.forEach((_, idx) => {
        if (rel[idx]) {
          relScores[idx].totalScore += Number(rel[idx]);
          relScores[idx].count++;
        }
      });

      const rjk = row.layanan_dirujuk || {};
      Object.keys(rjk).forEach(k => {
        if (rjk[k]) dirujukCounts[k] = (dirujukCounts[k] || 0) + 1;
      });
      // Handle legacy boolean mapping
      layananDirujukItems.forEach((_, idx) => {
        if (rjk[idx]) {
          const name = layananDirujukItems[idx];
          dirujukCounts[name] = (dirujukCounts[name] || 0) + 1;
        }
      });
    });

    const relData = relScores.map(s => ({
      name: s.name,
      avgScore: s.count > 0 ? Number((s.totalScore / s.count).toFixed(2)) : 0
    })).sort((a,b) => b.avgScore - a.avgScore);

    const rjkData = Object.keys(dirujukCounts).map(k => ({
      name: layananDirujukItems[k] || k, // Use array item if key is index
      value: dirujukCounts[k]
    })).filter(d => isNaN(d.name) && d.name !== 'undefined').sort((a,b) => b.value - a.value).slice(0, 5);

    return {
      docStats: {
        spkklpYa, spkklpTidak, totalDocUmum, totalDocGigi
      },
      relevansiData: relData,
      dirujukData: rjkData,
      topRelevansi: relData.slice(0, 3)
    };
  }, [filteredData]);

  const docPieData = [
    { name: 'FKTP Ada Sp.KKLP', value: docStats.spkklpYa },
    { name: 'Tidak Ada Sp.KKLP', value: docStats.spkklpTidak }
  ].filter(d => d.value > 0);

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
        <StatCard title="FKTP Memiliki Sp.KKLP" value={docStats.spkklpYa} subtitle={`${filteredData.length > 0 ? Math.round((docStats.spkklpYa/filteredData.length)*100) : 0}% dari total`} icon={Stethoscope} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Top 1 Peran Sp.KKLP" value={topRelevansi[0]?.avgScore || 0} subtitle={topRelevansi[0]?.name || '-'} icon={Award} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Top 2 Peran Sp.KKLP" value={topRelevansi[1]?.avgScore || 0} subtitle={topRelevansi[1]?.name || '-'} icon={CheckCircle} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Layanan Sering Dirujuk" value={dirujukData[0]?.value || 0} subtitle={dirujukData[0]?.name || '-'} icon={FileSearch} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-blue-600" /> Ketersediaan Dokter Sp.KKLP</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={docPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  <Cell fill="#3b82f6" /> {/* Ya */}
                  <Cell fill="#94a3b8" /> {/* Tidak */}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileSearch className="w-5 h-5 mr-2 text-amber-600" /> Top 5 Layanan Sering Dirujuk ke FKRTL</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dirujukData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-emerald-600" /> Rata-Rata Skala Relevansi Peran Sp.KKLP (1-4)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={relevansiData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} domain={[0, 4]} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`Skala ${value}`, 'Rata-rata']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="avgScore" name="Skala Relevansi" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="avgScore" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
