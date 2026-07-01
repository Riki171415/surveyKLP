import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, Legend
} from 'recharts';
import { HeartPulse, Users, CheckCircle, Heart, Stethoscope, CheckCircle2, Download } from 'lucide-react';

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardPaliatif({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [tujuanView, setTujuanView] = useState('responden');
  const [kondisiView, setKondisiView] = useState('responden');
  const [kepatuhanView, setKepatuhanView] = useState('responden');
  const [diagnosisView, setDiagnosisView] = useState('responden');
  const { palStats, kondisiDataR, kondisiDataF, tujuanDataR, tujuanDataF, kepatuhanDataR, kepatuhanDataF } = useMemo(() => {
    let totalFktp = uniqueFktpData.length;
    let fktpWithPaliatif = 0;
    let adaKolaborasi = 0;
    let adaPerbaikan = 0;

    uniqueFktpData.forEach(row => {
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') {
        fktpWithPaliatif++;
        if (pal.kolaborasi === 'Ya') adaKolaborasi++;
        if (pal.perbaikan === 'Ya') adaPerbaikan++;
      }
    });

    // ── Per Responden ──
    const tujuanCountsR = {}, kondisiCountsR = {}, kepatuhanCountsR = { 'Tinggi': 0, 'Sedang': 0, 'Rendah': 0 };
    const diagnosisCountsR = {};
    filteredData.forEach(row => {
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') {
        if (pal.kepatuhan) kepatuhanCountsR[pal.kepatuhan] = (kepatuhanCountsR[pal.kepatuhan] || 0) + 1;
        const kondisiObj = pal.kondisi || {};
        Object.keys(kondisiObj).forEach(k => { if (kondisiObj[k]) kondisiCountsR[k] = (kondisiCountsR[k] || 0) + 1; });
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => { if (pal[`kondisi_${k}`]) kondisiCountsR[k] = (kondisiCountsR[k] || 0) + 1; });
        const tujuanObj = pal.tujuan || {};
        Object.keys(tujuanObj).forEach(j => { if (tujuanObj[j]) tujuanCountsR[j] = (tujuanCountsR[j] || 0) + 1; });
        ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].forEach(t => { if (pal[`tujuan_${t}`]) tujuanCountsR[t] = (tujuanCountsR[t] || 0) + 1; });
        
        // Diagnosis
        if (pal.diagnosis) {
          const diagnoses = pal.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
          diagnoses.forEach(d => diagnosisCountsR[d] = (diagnosisCountsR[d] || 0) + 1);
        }
      }
    });
    // ── Per FKTP (uniqueFktpData) ──
    const kondisiCountsF = {}, tujuanCountsF = {}, kepatuhanCountsF = { 'Tinggi': 0, 'Sedang': 0, 'Rendah': 0 };
    const diagnosisCountsF = {};
    uniqueFktpData.forEach(row => {
      const pal = row.paliatif || {};
      if (pal.screening === 'Ya') {
        if (pal.kepatuhan) kepatuhanCountsF[pal.kepatuhan] = (kepatuhanCountsF[pal.kepatuhan] || 0) + 1;
        const kondisiObj = pal.kondisi || {};
        Object.keys(kondisiObj).forEach(k => { if (kondisiObj[k]) kondisiCountsF[k] = (kondisiCountsF[k] || 0) + 1; });
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => { if (pal[`kondisi_${k}`]) kondisiCountsF[k] = (kondisiCountsF[k] || 0) + 1; });
        const tujuanObj = pal.tujuan || {};
        Object.keys(tujuanObj).forEach(j => { if (tujuanObj[j]) tujuanCountsF[j] = (tujuanCountsF[j] || 0) + 1; });
        ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].forEach(t => { if (pal[`tujuan_${t}`]) tujuanCountsF[t] = (tujuanCountsF[t] || 0) + 1; });
        
        // Diagnosis
        if (pal.diagnosis) {
          const diagnoses = pal.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
          diagnoses.forEach(d => diagnosisCountsF[d] = (diagnosisCountsF[d] || 0) + 1);
        }
      }
    });
    const toArr = (obj) => Object.keys(obj).map(k => ({ name: k, value: obj[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);
    return {
      palStats: {
        proporsiPaliatif: totalFktp > 0 ? (fktpWithPaliatif / totalFktp) * 100 : 0,
        fktpWithPaliatif,
        proporsiKolaborasi: fktpWithPaliatif > 0 ? (adaKolaborasi / fktpWithPaliatif) * 100 : 0,
        proporsiPerbaikan: fktpWithPaliatif > 0 ? (adaPerbaikan / fktpWithPaliatif) * 100 : 0
      },
      tujuanDataR: toArr(tujuanCountsR), tujuanDataF: toArr(tujuanCountsF),
      kondisiDataR: toArr(kondisiCountsR), kondisiDataF: toArr(kondisiCountsF),
      kepatuhanDataR: toArr(kepatuhanCountsR), kepatuhanDataF: toArr(kepatuhanCountsF),
      diagnosisDataR: toArr(diagnosisCountsR).slice(0, 10), diagnosisDataF: toArr(diagnosisCountsF).slice(0, 10),
    };
  }, [filteredData, uniqueFktpData]);

  const tujuanData   = tujuanView   === 'fktp' ? tujuanDataF   : tujuanDataR;
  const kondisiData  = kondisiView  === 'fktp' ? kondisiDataF  : kondisiDataR;
  const kepatuhanData = kepatuhanView === 'fktp' ? kepatuhanDataF : kepatuhanDataR;
  const diagnosisData = diagnosisView === 'fktp' ? diagnosisDataF : diagnosisDataR;

  const tujuanLabel   = tujuanView   === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kondisiLabel  = kondisiView  === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kepatuhanLabel = kepatuhanView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const diagnosisLabel = diagnosisView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';

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
        title: 'Statistik Utama Paliatif (Per FKTP)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden', filteredData.length],
          ['Total FKTP (Unik)', uniqueFktpData.length],
          ['FKTP dengan Pelayanan Paliatif', `${palStats.fktpWithPaliatif} (${palStats.proporsiPaliatif.toFixed(2)}%)`],
          ['Proporsi Kolaborasi Nakes Lain', `${palStats.proporsiKolaborasi.toFixed(2)}%`],
          ['Proporsi Pelaporan Perbaikan Kualitas Hidup', `${palStats.proporsiPerbaikan.toFixed(2)}%`]
        ]
      },
      { title: 'Tujuan Pelayanan Paliatif (Per Responden)', headers: ['Tujuan', 'Jumlah Responden'], data: tujuanDataR },
      { title: 'Tujuan Pelayanan Paliatif (Per FKTP)', headers: ['Tujuan', 'Jumlah FKTP'], data: tujuanDataF },
      { title: 'Kondisi Pasien Paliatif (Per Responden)', headers: ['Kondisi Pasien', 'Jumlah Responden'], data: kondisiDataR },
      { title: 'Kondisi Pasien Paliatif (Per FKTP)', headers: ['Kondisi Pasien', 'Jumlah FKTP'], data: kondisiDataF },
      { title: 'Tingkat Kepatuhan Pasien (Per Responden)', headers: ['Tingkat Kepatuhan', 'Jumlah Responden'], data: kepatuhanDataR },
      { title: 'Tingkat Kepatuhan Pasien (Per FKTP)', headers: ['Tingkat Kepatuhan', 'Jumlah FKTP'], data: kepatuhanDataF },
    ];

    const tujuanKeys = ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'];
    const kondisiKeys = ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'];

    const rawData = {
      headers: [
        'No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi',
        'Ada Paliatif', 'Diagnosis', 'Kolaborasi Nakes', 'Perbaikan Kualitas Hidup', 'Kepatuhan',
        'Tujuan: Kendali Nyeri', 'Tujuan: Kendali Gejala', 'Tujuan: Psikosoial', 'Tujuan: Edukasi Keluarga', 'Tujuan: Akhir Hayat', 'Tujuan: Lainnya',
        'Kondisi: Mandiri', 'Kondisi: Bantuan Sebagian', 'Kondisi: Bantuan Penuh', 'Kondisi: Tirah Baring', 'Kondisi: Lainnya'
      ],
      rows: filteredData.map((row, idx) => {
        const pal = row.paliatif || {};
        const tujuanObj = pal.tujuan || {};
        const kondisiObj = pal.kondisi || {};
        const getTujuan  = t => (tujuanObj[t]  || pal[`tujuan_${t}`])  ? 'Ya' : 'Tidak';
        const getKondisi = k => (kondisiObj[k] || pal[`kondisi_${k}`]) ? 'Ya' : 'Tidak';
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          pal.screening || 'Tidak',
          pal.diagnosis || '-',
          pal.kolaborasi || '-',
          pal.perbaikan || '-',
          pal.kepatuhan || '-',
          ...tujuanKeys.map(getTujuan),
          ...kondisiKeys.map(getKondisi)
        ];
      })
    };

    exportTablesToExcel('PELAYANAN PALIATIF', tables, 'Dashboard_Paliatif', rawData);
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
        <StatCard title="FKTP Memberikan Paliatif" value={`${palStats.fktpWithPaliatif} FKTP`} subtitle={`${palStats.proporsiPaliatif.toFixed(1)}% dari total FKTP`} icon={HeartPulse} colorClass="bg-purple-500 text-purple-600 bg-purple-100" />
        <StatCard title="Tingkat Kolaborasi" value={`${palStats.proporsiKolaborasi.toFixed(1)}%`} subtitle="FKTP yang berkolaborasi dengan nakes lain" icon={Users} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        <StatCard title="Outcome (Perbaikan)" value={`${palStats.proporsiPerbaikan.toFixed(1)}%`} subtitle="FKTP melaporkan perbaikan kualitas hidup" icon={CheckCircle2} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-purple-600" /> Tujuan Utama Pelayanan Paliatif</h3>
            {!isPrinting && <ViewToggle value={tujuanView} onChange={setTujuanView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{tujuanView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={tujuanData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${tujuanLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={tujuanLabel} fill={tujuanView === 'fktp' ? '#10b981' : '#9333ea'} radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Heart className="w-5 h-5 mr-2 text-purple-600" /> Kondisi Pasien Paliatif</h3>
            {!isPrinting && <ViewToggle value={kondisiView} onChange={setKondisiView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{kondisiView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <PieChart>
                <Pie data={kondisiData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {kondisiData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} ${kondisiLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-purple-600" /> Tingkat Kepatuhan Pasien/Keluarga</h3>
            {!isPrinting && <ViewToggle value={kepatuhanView} onChange={setKepatuhanView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{kepatuhanView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <BarChart data={kepatuhanData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={80} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${kepatuhanLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={kepatuhanLabel} fill={kepatuhanView === 'fktp' ? '#10b981' : '#8b5cf6'} radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnosis */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Heart className="w-5 h-5 mr-2 text-rose-600" /> Top 10 Diagnosis Pasien</h3>
            {!isPrinting && <ViewToggle value={diagnosisView} onChange={setDiagnosisView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{diagnosisView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <BarChart data={diagnosisData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${diagnosisLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={diagnosisLabel} fill={diagnosisView === 'fktp' ? '#10b981' : '#f43f5e'} radius={[0, 6, 6, 0]} barSize={20}>
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
