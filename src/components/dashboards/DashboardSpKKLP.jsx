import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Stethoscope, Award, FileSearch, CheckCircle, Activity, HeartPulse } from 'lucide-react';

const relevansiItems = [
  "Pengelolaan Multimorbiditas",
  "Home Care Pasien Kronis",
  "Paliatif Primer",
  "Edukasi Kelompok Kronis",
  "Pendampingan Keluarga",
  "Pemantauan Komunitas",
  "Monitoring Risiko Tinggi",
  "Penguatan PRB",
  "Koordinasi Lintas Profesi",
  "Pembinaan Posbindu",
  "Pengelolaan Geriatri"
];

const layananDirujukItems = [
  "Kasus PTM tanpa komplikasi (DM, Hipertensi)", "Penanganan luka diabetes berat", 
  "Tindakan bedah minor", "Pelayanan paliatif akhir hayat", 
  "Gangguan jiwa ringan-sedang", "Penanganan fraktur tertutup sederhana"
];

export default function DashboardSpKKLP({ filteredData, COLORS, isPrinting }) {
  const { docStats, statusData, relevansiData, dirujukData, topRelevansi, diagData, tindData, analysisText } = useMemo(() => {
    let spkklpYa = 0;
    let spkklpTidak = 0;
    let totalDocUmum = 0;
    let totalDocGigi = 0;

    const relScores = relevansiItems.map(r => ({ name: r, totalScore: 0, count: 0 }));
    const dirujukCounts = {};
    const diagnosisCounts = {};
    const tindakanCounts = {};
    const statusCounts = {};

    const extractTags = (text) => {
      if (!text) return [];
      return text.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 2);
    };

    filteredData.forEach(row => {
      if (row.doc_kklp === 'Ya') spkklpYa++; else spkklpTidak++;
      
      if (row.spkklp_status) {
        statusCounts[row.spkklp_status] = (statusCounts[row.spkklp_status] || 0) + 1;
      }

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
        if (rjk[k] && k !== 'pengaruhPenurunanRujukan') {
          if (!isNaN(k) && k !== 'lainnya' && !layananDirujukItems[k]) return;
          const name = k === 'lainnya' ? rjk.lainnya : (isNaN(k) ? k : layananDirujukItems[k]);
          dirujukCounts[name] = (dirujukCounts[name] || 0) + 1;
        }
      });

      if (row.spkklp_poli?.diagnosis) {
        extractTags(row.spkklp_poli.diagnosis).forEach(tag => {
          let normalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
          const lower = normalized.toLowerCase();
          
          if (lower.includes('i10') || lower.includes('hipertensi esensial')) normalized = 'Hipertensi Esensial (I10)';
          else if (lower.includes('e11') || lower.includes('diabetes')) normalized = 'Diabetes Mellitus Tipe 2 (E11)';
          else if (lower.includes('a15') || lower.includes('a16') || lower.includes('tuberkulosis')) normalized = 'Tuberkulosis (A15-A16)';
          else if (lower.includes('h10') || lower.includes('konjungtivitis')) normalized = 'Konjungtivitis (H10)';
          else if (lower.includes('h65') || lower.includes('h66') || lower.includes('otitis')) normalized = 'Otitis Media Akut (H65-H66)';
          else if (lower.includes('ispa') || lower.includes('j06')) normalized = 'ISPA (J06.9)';
          else if (lower.includes('k30') || lower.includes('dispepsia')) normalized = 'Dispepsia (K30)';

          diagnosisCounts[normalized] = (diagnosisCounts[normalized] || 0) + 1;
        });
      }

      if (row.spkklp_poli?.tindakan) {
        extractTags(row.spkklp_poli.tindakan).forEach(tag => {
          const normalized = tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase();
          tindakanCounts[normalized] = (tindakanCounts[normalized] || 0) + 1;
        });
      }
    });

    const relData = relScores.map(s => ({
      name: s.name,
      avgScore: s.count > 0 ? Number((s.totalScore / s.count).toFixed(2)) : 0
    })).sort((a,b) => b.avgScore - a.avgScore);

    const rjkData = Object.keys(dirujukCounts).map(k => ({
      name: layananDirujukItems[k] || k, // Use array item if key is index
      value: dirujukCounts[k]
    })).filter(d => isNaN(d.name) && d.name !== 'undefined').sort((a,b) => b.value - a.value).slice(0, 5);

    const diagData = Object.keys(diagnosisCounts).map(k => ({ name: k, value: diagnosisCounts[k] }))
      .sort((a,b) => b.value - a.value).slice(0, 10);

    const tindData = Object.keys(tindakanCounts).map(k => ({ name: k, value: tindakanCounts[k] }))
      .sort((a,b) => b.value - a.value).slice(0, 10);

    let analysisText = "Belum ada data diagnosis atau tindakan yang diinput oleh responden.";
    if (diagData.length > 0 && tindData.length > 0) {
      analysisText = `Berdasarkan data input terbaru, diagnosis utama yang paling banyak dilaporkan oleh responden adalah **${diagData[0].name}** (ditemukan di ${diagData[0].value} FKTP)${diagData[1] ? ` dan **${diagData[1].name}** (${diagData[1].value} FKTP)` : ''}. ` + 
      `Sementara itu, prosedur atau tindakan medis yang paling sering dilakukan adalah **${tindData[0].name}** (${tindData[0].value} pelaporan). ` +
      `Data ini memberikan gambaran langsung mengenai pola morbiditas dan tindakan klinis aktual yang paling sering ditangani di tingkat primer.`;
    } else if (diagData.length > 0) {
      analysisText = `Diagnosis utama yang paling banyak dilaporkan adalah **${diagData[0].name}** (ditemukan di ${diagData[0].value} FKTP).`;
    }

    const statusData = Object.keys(statusCounts).map(k => ({
      name: k,
      value: statusCounts[k]
    })).sort((a,b) => b.value - a.value);

    return {
      docStats: {
        spkklpYa, spkklpTidak, totalDocUmum, totalDocGigi
      },
      statusData,
      relevansiData: relData,
      dirujukData: rjkData,
      diagData,
      tindData,
      analysisText,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-blue-600" /> Ketersediaan Dokter Sp.KKLP</h3>
            {!isPrinting && <ExportButton fileName="Ketersediaan Dokter Sp.KKLP" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
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

        {statusData && statusData.length > 0 && (
          <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-violet-600" /> Kualifikasi Sp.KKLP</h3>
              {!isPrinting && <ExportButton fileName="Kualifikasi Sp.KKLP" />}
            </div>
            <div className="h-72">
              <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#8b5cf6', '#ec4899', '#f97316', '#14b8a6'][index % 4]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileSearch className="w-5 h-5 mr-2 text-amber-600" /> Top 5 Layanan Sering Dirujuk ke FKRTL</h3>
            {!isPrinting && <ExportButton fileName="Top 5 Layanan Sering Dirujuk ke FKRTL" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
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
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Award className="w-5 h-5 mr-2 text-emerald-600" /> Rata-Rata Skala Relevansi Peran Sp.KKLP (1-4)</h3>
            {!isPrinting && <ExportButton fileName="Rata-Rata Skala Relevansi Peran Sp.KKLP (1-4)" />}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
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

        {/* Diagnosis & Tindakan */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-rose-500" /> Top 10 Diagnosis Sp.KKLP</h3>
            {!isPrinting && <ExportButton fileName="Top 10 Diagnosis Sp.KKLP" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={diagData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} Kasus`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Frekuensi" fill="#f43f5e" radius={[0, 6, 6, 0]} barSize={24}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><HeartPulse className="w-5 h-5 mr-2 text-indigo-500" /> Top 10 Tindakan/Prosedur</h3>
            {!isPrinting && <ExportButton fileName="Top 10 Tindakan/Prosedur" />}
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={tindData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} Tindakan`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Frekuensi" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={24}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
            <Stethoscope className="w-5 h-5 mr-2 text-indigo-600" /> Analisis Eksekutif: Diagnosis & Tindakan
          </h3>
          <p className="text-indigo-800 leading-relaxed text-sm md:text-base" dangerouslySetInnerHTML={{ __html: analysisText.replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-indigo-900">$1</span>').replace(/\*(.*?)\*/g, '<em class="italic">$1</em>') }}></p>
        </div>
      </div>
    </div>
  );
}
