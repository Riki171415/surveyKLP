import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Heart, Home, Clock, Users, CheckCircle2, Stethoscope, CheckCircle, Download, Image as ImageIcon } from 'lucide-react';
import CustomWordCloud from '../ui/CustomWordCloud';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';
import ReportGenerator from '../ui/ReportGenerator';

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardHomeCare({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [jenisView, setJenisView] = useState('responden');
  const [kondisiView, setKondisiView] = useState('responden');
  const [kepatuhanView, setKepatuhanView] = useState('responden');
  const [tenagaView, setTenagaView] = useState('responden');
  const [kunjunganView, setKunjunganView] = useState('responden');
  const [diagnosisView, setDiagnosisView] = useState('responden');
  const { hcStats, kondisiDataR, kondisiDataF, jenisDataR, jenisDataF, kepatuhanDataR, kepatuhanDataF, tenagaDataR, tenagaDataF, diagnosisDataR, diagnosisDataF, kunjunganDataR, kunjunganDataF } = useMemo(() => {
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

    // ── Per Responden ──
    const kondisiCountsR = {}, jenisCountsR = {}, kepatuhanCountsR = { 'Tinggi (>80%)': 0, 'Sedang (50–80%)': 0, 'Rendah (<50%)': 0 };
    const tenagaCountsR = {}, diagnosisCountsR = {}, kunjunganCountsR = { '1x': 0, '2x': 0, '3x': 0, '4x': 0, '>4x': 0 };
    filteredData.forEach(row => {
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        if (hc.kepatuhan) kepatuhanCountsR[hc.kepatuhan] = (kepatuhanCountsR[hc.kepatuhan] || 0) + 1;
        const kondisiObj = hc.kondisi || {};
        Object.keys(kondisiObj).forEach(k => { if (kondisiObj[k]) kondisiCountsR[k] = (kondisiCountsR[k] || 0) + 1; });
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => { if (hc[`kondisi_${k}`]) kondisiCountsR[k] = (kondisiCountsR[k] || 0) + 1; });
        const jenisObj = hc.jenisLayanan || {};
        Object.keys(jenisObj).forEach(j => { if (jenisObj[j]) jenisCountsR[j] = (jenisCountsR[j] || 0) + 1; });
        ['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'].forEach(j => { if (hc[`jenis_${j}`]) jenisCountsR[j] = (jenisCountsR[j] || 0) + 1; });
        
        // Tenaga
        if (hc.tenaga) {
          const tenagas = hc.tenaga.split(',').map(t => t.trim()).filter(Boolean);
          tenagas.forEach(t => tenagaCountsR[t] = (tenagaCountsR[t] || 0) + 1);
        }
        // Diagnosis
        if (hc.diagnosis) {
          const diagnoses = hc.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
          diagnoses.forEach(d => diagnosisCountsR[d] = (diagnosisCountsR[d] || 0) + 1);
        }
        // Kunjungan
        let jml = Number(hc.jumlahKunjungan) || 0;
        if (jml > 0) {
          let label = jml > 4 ? '>4x' : `${jml}x`;
          kunjunganCountsR[label] = (kunjunganCountsR[label] || 0) + 1;
        }
      }
    });
    // ── Per FKTP ──
    const kondisiCountsF = {}, jenisCountsF = {}, kepatuhanCountsF = { 'Tinggi (>80%)': 0, 'Sedang (50–80%)': 0, 'Rendah (<50%)': 0 };
    const tenagaCountsF = {}, diagnosisCountsF = {}, kunjunganCountsF = { '1x': 0, '2x': 0, '3x': 0, '4x': 0, '>4x': 0 };
    uniqueFktpData.forEach(row => {
      const hc = row.home_care || {};
      if (hc.screening === 'Ya') {
        if (hc.kepatuhan) kepatuhanCountsF[hc.kepatuhan] = (kepatuhanCountsF[hc.kepatuhan] || 0) + 1;
        const kondisiObj = hc.kondisi || {};
        Object.keys(kondisiObj).forEach(k => { if (kondisiObj[k]) kondisiCountsF[k] = (kondisiCountsF[k] || 0) + 1; });
        ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => { if (hc[`kondisi_${k}`]) kondisiCountsF[k] = (kondisiCountsF[k] || 0) + 1; });
        const jenisObj = hc.jenisLayanan || {};
        Object.keys(jenisObj).forEach(j => { if (jenisObj[j]) jenisCountsF[j] = (jenisCountsF[j] || 0) + 1; });
        ['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'].forEach(j => { if (hc[`jenis_${j}`]) jenisCountsF[j] = (jenisCountsF[j] || 0) + 1; });

        // Tenaga
        if (hc.tenaga) {
          const tenagas = hc.tenaga.split(',').map(t => t.trim()).filter(Boolean);
          tenagas.forEach(t => tenagaCountsF[t] = (tenagaCountsF[t] || 0) + 1);
        }
        // Diagnosis
        if (hc.diagnosis) {
          const diagnoses = hc.diagnosis.split(',').map(d => d.trim()).filter(Boolean);
          diagnoses.forEach(d => diagnosisCountsF[d] = (diagnosisCountsF[d] || 0) + 1);
        }
        // Kunjungan
        let jml = Number(hc.jumlahKunjungan) || 0;
        if (jml > 0) {
          let label = jml > 4 ? '>4x' : `${jml}x`;
          kunjunganCountsF[label] = (kunjunganCountsF[label] || 0) + 1;
        }
      }
    });
    const toArr = (obj) => Object.keys(obj).map(k => ({ name: k, value: obj[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);
    const toArrText = (obj) => Object.keys(obj).map(k => ({ text: k, value: obj[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);
    return {
      hcStats: {
        proporsiHc: totalFktp > 0 ? (fktpWithHomeCare / totalFktp) * 100 : 0,
        fktpWithHomeCare,
        avgKunjungan: fktpWithHomeCare > 0 ? Math.round(sumKunjungan / fktpWithHomeCare) : 0,
        proporsiKolaborasi: fktpWithHomeCare > 0 ? (adaKolaborasi / fktpWithHomeCare) * 100 : 0,
        proporsiPerbaikan: fktpWithHomeCare > 0 ? (adaPerbaikan / fktpWithHomeCare) * 100 : 0,
      },
      kondisiDataR: toArr(kondisiCountsR), kondisiDataF: toArr(kondisiCountsF),
      jenisDataR: toArr(jenisCountsR),   jenisDataF: toArr(jenisCountsF),
      kepatuhanDataR: toArr(kepatuhanCountsR), kepatuhanDataF: toArr(kepatuhanCountsF),
      tenagaDataR: toArrText(tenagaCountsR), tenagaDataF: toArrText(tenagaCountsF),
      diagnosisDataR: toArr(diagnosisCountsR).slice(0, 10), diagnosisDataF: toArr(diagnosisCountsF).slice(0, 10),
      kunjunganDataR: toArr(kunjunganCountsR), kunjunganDataF: toArr(kunjunganCountsF),
    };
  }, [filteredData, uniqueFktpData]);

  const jenisData     = jenisView     === 'fktp' ? jenisDataF     : jenisDataR;
  const kondisiData   = kondisiView   === 'fktp' ? kondisiDataF   : kondisiDataR;
  const kepatuhanData = kepatuhanView === 'fktp' ? kepatuhanDataF : kepatuhanDataR;
  const tenagaData    = tenagaView    === 'fktp' ? tenagaDataF    : tenagaDataR;
  const diagnosisData = diagnosisView === 'fktp' ? diagnosisDataF : diagnosisDataR;
  const kunjunganData = kunjunganView === 'fktp' ? kunjunganDataF : kunjunganDataR;

  const jenisLabel     = jenisView     === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kondisiLabel   = kondisiView   === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kepatuhanLabel = kepatuhanView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const tenagaLabel    = tenagaView    === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const diagnosisLabel = diagnosisView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kunjunganLabel = kunjunganView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';



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

  const handleExport = () => {
    const tables = [
      {
        title: 'Statistik Utama Home Care (Per FKTP)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden', filteredData.length],
          ['Total FKTP (Unik)', uniqueFktpData.length],
          ['FKTP Memberikan Home Care', `${hcStats.fktpWithHomeCare} (${hcStats.proporsiHc.toFixed(2)}%)`],
          ['Rata-rata Kunjungan per Bulan (per FKTP HC)', hcStats.avgKunjungan],
          ['Proporsi Kolaborasi Nakes Lain', `${hcStats.proporsiKolaborasi.toFixed(2)}%`],
          ['Proporsi Pelaporan Perbaikan Kondisi', `${hcStats.proporsiPerbaikan.toFixed(2)}%`]
        ]
      },
      { title: 'Jenis Layanan Home Care (Per Responden)', headers: ['Jenis Layanan', 'Jumlah (Nilai)', 'Persentase (%)'], data: jenisDataR.map(d => [d.name, d.value, `${filteredData.length > 0 ? ((d.value / filteredData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Jenis Layanan Home Care (Per FKTP)', headers: ['Jenis Layanan', 'Jumlah FKTP (Nilai)', 'Persentase (%)'], data: jenisDataF.map(d => [d.name, d.value, `${uniqueFktpData.length > 0 ? ((d.value / uniqueFktpData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Kondisi Pasien Home Care (Per Responden)', headers: ['Kondisi Pasien', 'Jumlah (Nilai)', 'Persentase (%)'], data: kondisiDataR.map(d => [d.name, d.value, `${filteredData.length > 0 ? ((d.value / filteredData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Kondisi Pasien Home Care (Per FKTP)', headers: ['Kondisi Pasien', 'Jumlah FKTP (Nilai)', 'Persentase (%)'], data: kondisiDataF.map(d => [d.name, d.value, `${uniqueFktpData.length > 0 ? ((d.value / uniqueFktpData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Tingkat Kepatuhan Pasien (Per Responden)', headers: ['Tingkat Kepatuhan', 'Jumlah (Nilai)', 'Persentase (%)'], data: kepatuhanDataR.map(d => [d.name, d.value, `${filteredData.length > 0 ? ((d.value / filteredData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Tingkat Kepatuhan Pasien (Per FKTP)', headers: ['Tingkat Kepatuhan', 'Jumlah FKTP (Nilai)', 'Persentase (%)'], data: kepatuhanDataF.map(d => [d.name, d.value, `${uniqueFktpData.length > 0 ? ((d.value / uniqueFktpData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'SDM Pelaksana (Per Responden)', headers: ['SDM', 'Frekuensi'], data: tenagaDataR.map(d => [d.text, d.value]) },
      { title: 'SDM Pelaksana (Per FKTP)', headers: ['SDM', 'Frekuensi'], data: tenagaDataF.map(d => [d.text, d.value]) },
      { title: 'Top 10 Diagnosis Pasien (Per Responden)', headers: ['Diagnosis', 'Jumlah (Nilai)'], data: diagnosisDataR.map(d => [d.name, d.value]) },
      { title: 'Top 10 Diagnosis Pasien (Per FKTP)', headers: ['Diagnosis', 'Jumlah FKTP (Nilai)'], data: diagnosisDataF.map(d => [d.name, d.value]) },
      { title: 'Distribusi Kunjungan (Per Responden)', headers: ['Distribusi Kunjungan', 'Jumlah (Nilai)'], data: kunjunganDataR.map(d => [d.name, d.value]) },
      { title: 'Distribusi Kunjungan (Per FKTP)', headers: ['Distribusi Kunjungan', 'Jumlah FKTP (Nilai)'], data: kunjunganDataF.map(d => [d.name, d.value]) }
    ];

    const kondisiKeys = ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'];
    const jenisKeys = ['Pemeriksaan kesehatan', 'Pemantauan penyakit kronis', 'Perawatan luka', 'Rehabilitasi sederhana', 'Edukasi keluarga', 'Lainnya'];

    const rawData = {
      headers: [
        'No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi',
        'Ada Home Care', 'SDM Pelaksana', 'Diagnosis Pasien', 'Jml Kunjungan/Bulan', 'Kolaborasi Nakes', 'Perbaikan Kondisi', 'Kepatuhan',
        'Kondisi: Mandiri', 'Kondisi: Bantuan Sebagian', 'Kondisi: Bantuan Penuh', 'Kondisi: Tirah Baring', 'Kondisi: Lainnya',
        'Jenis: Pemeriksaan', 'Jenis: Pmtauan Kronis', 'Jenis: Perawatan Luka', 'Jenis: Rehabilitasi', 'Jenis: Edukasi Keluarga', 'Jenis: Lainnya'
      ],
      rows: filteredData.map((row, idx) => {
        const hc = row.home_care || {};
        const kondisiObj = hc.kondisi || {};
        const jenisObj = hc.jenisLayanan || {};
        const getKondisi = k => (kondisiObj[k] || hc[`kondisi_${k}`]) ? 'Ya' : 'Tidak';
        const getJenis  = j => (jenisObj[j]  || hc[`jenis_${j}`])  ? 'Ya' : 'Tidak';
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          hc.screening || 'Tidak',
          hc.tenaga || '-',
          hc.diagnosis || '-',
          Number(hc.jumlahKunjungan) || 0,
          hc.kolaborasi || '-',
          hc.perbaikan || '-',
          hc.kepatuhan || '-',
          ...kondisiKeys.map(getKondisi),
          ...jenisKeys.map(getJenis)
        ];
      })
    };

    exportTablesToExcel('PELAYANAN HOME CARE', tables, 'Dashboard_Home_Care', rawData);
  };


  return (
    <>
    <div id="dashboard-hc-capture" className="space-y-8 animate-fade-in relative">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print gap-2 capture-exclude">
          <button onClick={() => downloadElementAsPNG('dashboard-hc-capture', 'Dashboard_HomeCare_Full')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm">
            <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
          </button>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="FKTP Memberikan Home Care" value={`${hcStats.fktpWithHomeCare} FKTP`} subtitle={`${hcStats.proporsiHc.toFixed(1)}% dari total FKTP`} icon={Home} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Rata-rata Kunjungan" value={`${hcStats.avgKunjungan}x`} subtitle="Kunjungan home care per bulan" icon={Clock} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Kolaborasi Nakes Lain" value={`${hcStats.proporsiKolaborasi.toFixed(1)}%`} subtitle="FKTP yang berkolaborasi" icon={Users} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        <StatCard title="Outcome (Perbaikan Kondisi)" value={`${hcStats.proporsiPerbaikan.toFixed(1)}%`} subtitle="FKTP melaporkan perbaikan" icon={CheckCircle2} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="hc-jenis-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-jenis-chart', 'Jenis_Layanan_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-teal-600" /> Jenis Layanan Home Care</h3>
            {!isPrinting && <ViewToggle value={jenisView} onChange={setJenisView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{jenisView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={jenisData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${jenisLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={jenisLabel} fill={jenisView === 'fktp' ? '#10b981' : '#14b8a6'} radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="hc-kondisi-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-kondisi-chart', 'Kondisi_Pasien_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Heart className="w-5 h-5 mr-2 text-teal-600" /> Kondisi Pasien Home Care</h3>
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

        <div id="hc-kepatuhan-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-kepatuhan-chart', 'Kepatuhan_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><CheckCircle className="w-5 h-5 mr-2 text-teal-600" /> Tingkat Kepatuhan Pasien</h3>
            {!isPrinting && <ViewToggle value={kepatuhanView} onChange={setKepatuhanView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{kepatuhanView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <BarChart data={kepatuhanData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${kepatuhanLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={kepatuhanLabel} fill={kepatuhanView === 'fktp' ? '#10b981' : '#0ea5e9'} radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* SDM Pelaksana */}
        <div id="hc-sdm-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-sdm-chart', 'SDM_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> SDM Pelaksana Home Care</h3>
            {!isPrinting && <ViewToggle value={tenagaView} onChange={setTenagaView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{tenagaView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <CustomWordCloud data={tenagaData} />
        </div>

        {/* Diagnosis */}
        <div id="hc-diagnosis-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-diagnosis-chart', 'Diagnosis_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
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

        {/* Distribusi Kunjungan */}
        <div id="hc-kunjungan-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('hc-kunjungan-chart', 'Distribusi_Kunjungan_HC')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-600" /> Distribusi Jumlah Kunjungan/Bulan</h3>
            {!isPrinting && <ViewToggle value={kunjunganView} onChange={setKunjunganView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{kunjunganView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <BarChart data={kunjunganData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${kunjunganLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={kunjunganLabel} fill={kunjunganView === 'fktp' ? '#10b981' : '#3b82f6'} radius={[6, 6, 0, 0]} barSize={40}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>

    <ReportGenerator
      dashboardId="home_care"
      dashboardName="Layanan Home Care"
      promptContext={`Total responden: ${filteredData?.length ?? 0}. Total FKTP unik: ${uniqueFktpData?.length ?? 0}. FKTP yang memberikan home care: ${hcStats?.fktpWithHomeCare ?? 0} (${hcStats?.proporsiHc?.toFixed(1) ?? 0}%). Rata-rata kunjungan per bulan: ${hcStats?.avgKunjungan ?? 0}x. Proporsi kolaborasi nakes lain: ${hcStats?.proporsiKolaborasi?.toFixed(1) ?? 0}%. Proporsi FKTP melaporkan perbaikan kondisi pasien: ${hcStats?.proporsiPerbaikan?.toFixed(1) ?? 0}%. Top jenis layanan: ${jenisDataR?.[0]?.name ?? '-'} (${jenisDataR?.[0]?.value ?? 0}). Top kondisi pasien: ${kondisiDataR?.[0]?.name ?? '-'} (${kondisiDataR?.[0]?.value ?? 0}). Top diagnosis: ${diagnosisDataR?.[0]?.name ?? '-'} (${diagnosisDataR?.[0]?.value ?? 0}).`}
    />
    </>
  );
}
