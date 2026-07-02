import React, { useMemo } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import DeepDiveAIReport from './DeepDiveAIReport';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList, ScatterChart, Scatter, ZAxis 
} from 'recharts';
import { Stethoscope, Users, Clock, FileText, CheckCircle, Map, Target, AlertTriangle, TrendingUp, Zap, Download , Image as ImageIcon } from 'lucide-react';
import { normalizeStr, faskesToKabMap } from './DashboardProfil';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';
import ReportGenerator from '../ui/ReportGenerator';

export default function DashboardDPM({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const dpmDataFiltered = useMemo(() => {
    const dataSource = uniqueFktpData || filteredData;
    return dataSource.filter(row => {
      const fName = normalizeStr(row.fktp_name || '');
      let type = faskesToKabMap[fName]?.type;
      
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri' && type !== 'DPM') {
        if (row.role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }

      return type === 'Dokter Praktik Mandiri' || type === 'DPM';
    });
  }, [uniqueFktpData, filteredData]);

  const { 
    dpmStats, lamaPraktikData, bebanPasienData, rekamMedisData, keluargaSamaData, aspekData, luaranPelayananData,
    provinsiData, crossTabKronis, crossTabKunjungan, skorHistogram, skorRendah,
    gapData, wawancaraTexts
  } = useMemo(() => {
    const lamaCount = {};
    const bebanCount = {};
    const luaranCount = {};
    const rekamMedisCount = { 'Ya': 0, 'Tidak': 0 };
    const keluargaSamaCount = {};
    const aspekCount = {};
    const provCount = {};
    
    const crossKronis = {};
    const crossKunjungan = {};
    
    const skorDist = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
    const skorRendahList = [];
    
    const penyakitCount = {};
    const tindakanCount = {};
    const wawancaraList = [];

    let totalLayanan = 0;

    dpmDataFiltered.forEach(row => {
      const dpm = row.dpm || {};
      const kar = dpm.karakteristik || {};
      const pen = dpm.pendekatan || {};
      const kon = dpm.kontinuitas || {};
      const gam = dpm.gambaran || {};
      const poli = dpm.poliKklp || {};
      const kas = dpm.kasus || {};

      const prov = row.provinsi || 'Lainnya';
      provCount[prov] = (provCount[prov] || 0) + 1;

      const lp = kar.lamaPraktik || 'Tidak Diisi';
      const jk = kar.jumlahKunjungan || 'Tidak Diisi';
      if (kar.lamaPraktik) lamaCount[kar.lamaPraktik] = (lamaCount[kar.lamaPraktik] || 0) + 1;
      if (kar.jumlahKunjungan) bebanCount[kar.jumlahKunjungan] = (bebanCount[kar.jumlahKunjungan] || 0) + 1;

      const pk = kas.persenKronis || 'Tidak Diisi';
      if (!crossKronis[lp]) crossKronis[lp] = {};
      crossKronis[lp][pk] = (crossKronis[lp][pk] || 0) + 1;

      if (!crossKunjungan[lp]) crossKunjungan[lp] = {};
      crossKunjungan[lp][jk] = (crossKunjungan[lp][jk] || 0) + 1;

      if (row.dpm && Object.keys(row.dpm).length > 0) {
        let skor = 0;
        if (pen.tahuKeluargaInti === 'Selalu' || pen.tahuKeluargaInti === 'Sering') skor += 25;
        else if (pen.tahuKeluargaInti === 'Kadang-kadang') skor += 10;
        if (pen.menanganiKeluargaSama && pen.menanganiKeluargaSama !== 'Tidak pernah') skor += 25;
        if (pen.tanyaKondisiKeluargaLain === 'Selalu' || pen.tanyaKondisiKeluargaLain === 'Sering') skor += 25;
        else if (pen.tanyaKondisiKeluargaLain === 'Kadang-kadang') skor += 10;
        if (Array.isArray(pen.aspekDigali) && pen.aspekDigali.length > 1 && !pen.aspekDigali.includes('Tidak ada')) skor += 25;

        if (skor <= 20) skorDist['0-20']++;
        else if (skor <= 40) skorDist['21-40']++;
        else if (skor <= 60) skorDist['41-60']++;
        else if (skor <= 80) skorDist['61-80']++;
        else skorDist['81-100']++;

        if (skor < 40) {
          skorRendahList.push({ faskes: row.fktp_name || 'DPM', skor, provinsi: row.provinsi });
        }
      }

      if (Array.isArray(kas.masalahKesehatan)) {
        kas.masalahKesehatan.forEach(m => penyakitCount[m] = (penyakitCount[m] || 0) + 1);
      }
      if (Array.isArray(gam.kegiatanDilakukan)) {
        gam.kegiatanDilakukan.forEach(t => tindakanCount[t] = (tindakanCount[t] || 0) + 1);
      }

      if (row.wawancara) {
        for (let idx = 1; idx <= 8; idx++) {
          const key = `w${idx}`;
          if (row.wawancara[key]) {
            wawancaraList.push({
              faskes: row.fktp_name || 'DPM',
              role: row.role || 'DPM',
              provinsi: row.provinsi || 'Lainnya',
              question: `Pertanyaan G${idx}`,
              answer: row.wawancara[key]
            });
          }
        }
      }

      if (kon.sistemPencatatan) rekamMedisCount[kon.sistemPencatatan] = (rekamMedisCount[kon.sistemPencatatan] || 0) + 1;
      if (pen.menanganiKeluargaSama) keluargaSamaCount[pen.menanganiKeluargaSama] = (keluargaSamaCount[pen.menanganiKeluargaSama] || 0) + 1;

      if (Array.isArray(pen.aspekDigali)) {
        pen.aspekDigali.forEach(a => {
          if (a !== 'Tidak ada') { aspekCount[a] = (aspekCount[a] || 0) + 1; totalLayanan++; }
        });
      }
      if (Array.isArray(gam.kegiatanDilakukan)) {
        gam.kegiatanDilakukan.forEach(k => {
          if (!k.includes('Tidak pernah')) { aspekCount[k] = (aspekCount[k] || 0) + 1; totalLayanan++; }
        });
      }
      if (Array.isArray(poli.luaranPelayanan)) {
        poli.luaranPelayanan.forEach(l => luaranCount[l] = (luaranCount[l] || 0) + 1);
      }
    });

    const crossKronisData = Object.keys(crossKronis).map(lp => ({
      name: lp,
      '< 25%': crossKronis[lp]['< 25%'] || 0,
      '25–50%': crossKronis[lp]['25–50%'] || 0,
      '51–75%': crossKronis[lp]['51–75%'] || 0,
      '> 75%': crossKronis[lp]['> 75%'] || 0,
    }));
    
    const crossKunjunganData = Object.keys(crossKunjungan).map(lp => ({
      name: lp,
      '< 10 pasien': crossKunjungan[lp]['< 10 pasien'] || 0,
      '10–20 pasien': crossKunjungan[lp]['10–20 pasien'] || 0,
      '21–30 pasien': crossKunjungan[lp]['21–30 pasien'] || 0,
      '> 30 pasien': crossKunjungan[lp]['> 30 pasien'] || 0,
    }));

    const gapDataArr = Object.keys(penyakitCount).map(p => ({
      name: p,
      Penyakit: penyakitCount[p],
      Edukasi: tindakanCount['Edukasi keluarga pasien'] || 0,
      HomeVisit: tindakanCount['Home visit/kunjungan rumah'] || 0
    })).sort((a,b) => b.Penyakit - a.Penyakit).slice(0, 5);

    return {
      dpmStats: { totalDpm: dpmDataFiltered.length, top3Layanan: Object.keys(aspekCount).map(k => ({ name: k, value: aspekCount[k] })).sort((a,b) => b.value - a.value).slice(0, 3) },
      lamaPraktikData: Object.keys(lamaCount).map(k => ({ name: k, value: lamaCount[k] })).sort((a,b) => b.value - a.value),
      bebanPasienData: Object.keys(bebanCount).map(k => ({ name: k, value: bebanCount[k] })).sort((a,b) => b.value - a.value),
      rekamMedisData: (rekamMedisCount['Ya'] || rekamMedisCount['Tidak']) ? [{ name: 'Sistem Terintegrasi', value: rekamMedisCount['Ya'] || 0 }, { name: 'Belum Ada Sistem', value: rekamMedisCount['Tidak'] || 0 }].filter(d => d.value > 0) : [{ name: 'Belum Ada Data', value: 1 }],
      keluargaSamaData: Object.keys(keluargaSamaCount).length > 0 ? Object.keys(keluargaSamaCount).map(k => ({ name: k, value: keluargaSamaCount[k] })).sort((a,b) => b.value - a.value) : [{ name: 'Belum Ada Data', value: 1 }],
      aspekData: Object.keys(aspekCount).map(k => ({ name: k, value: aspekCount[k] })).sort((a,b) => b.value - a.value).slice(0, 7),
      luaranPelayananData: Object.keys(luaranCount).map(k => ({ name: k, value: luaranCount[k] })).sort((a,b) => b.value - a.value),
      provinsiData: Object.keys(provCount).map(k => ({ name: k, value: provCount[k] })).sort((a,b) => b.value - a.value).slice(0, 10),
      crossTabKronis: crossKronisData,
      crossTabKunjungan: crossKunjunganData,
      skorHistogram: Object.keys(skorDist).map(k => ({ name: k, value: skorDist[k] })),
      skorRendah: skorRendahList,
      gapData: gapDataArr,
      wawancaraTexts: wawancaraList
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
    <div id="dashboard-dashboarddpm-capture" className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
        <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-700">Belum Ada Data DPM</h3>
        <p className="text-slate-500 mt-2">Dashboard ini khusus menampilkan data dari Dokter Praktik Mandiri.</p>
      </div>
    );
  }

  const handleExport = () => {
    const tables = [
      {
        title: 'Statistik DPM',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden DPM', dpmStats.totalDpm],
          ...dpmStats.top3Layanan.map((d, i) => [`Kegiatan Terbanyak ${i+1}`, `${d.name} (${d.value})`])
        ]
      },
      {
        title: 'Distribusi Provinsi DPM (Top 10)',
        headers: ['Provinsi', 'Jumlah DPM'],
        data: provinsiData.map(d => [d.name, d.value])
      },
      {
        title: 'Menangani Keluarga yang Sama',
        headers: ['Kategori', 'Jumlah DPM'],
        data: keluargaSamaData.filter(d => d.name !== 'Belum Ada Data')
      },
      {
        title: 'Penerapan RM / Family Folder',
        headers: ['Status', 'Jumlah DPM'],
        data: rekamMedisData.filter(d => d.name !== 'Belum Ada Data')
      },
      {
        title: 'Lama Praktik DPM',
        headers: ['Lama Praktik', 'Jumlah DPM'],
        data: lamaPraktikData
      },
      {
        title: 'Beban Pasien',
        headers: ['Jumlah Pasien/Hari', 'Jumlah DPM'],
        data: bebanPasienData
      },
      {
        title: 'Top Kegiatan Holistik & Aspek yang Digali',
        headers: ['Kegiatan / Aspek', 'Jumlah DPM'],
        data: aspekData.map(d => [d.name, d.value])
      },
      {
        title: 'Luaran Pelayanan yang Diukur',
        headers: ['Luaran', 'Jumlah DPM'],
        data: luaranPelayananData
      },
      {
        title: 'Cross-Tab: Lama Praktik vs % Kasus Kronis',
        headers: ['Lama Praktik', '< 25%', '25–50%', '51–75%', '> 75%'],
        data: crossTabKronis.map(d => [d.name, d['< 25%'] || 0, d['25–50%'] || 0, d['51–75%'] || 0, d['> 75%'] || 0])
      },
      {
        title: 'Cross-Tab: Lama Praktik vs Jumlah Kunjungan',
        headers: ['Lama Praktik', '< 10 pasien', '10–20 pasien', '21–30 pasien', '> 30 pasien'],
        data: crossTabKunjungan.map(d => [d.name, d['< 10 pasien'] || 0, d['10–20 pasien'] || 0, d['21–30 pasien'] || 0, d['> 30 pasien'] || 0])
      },
      {
        title: 'Distribusi Skor Indeks Pelayanan KKLP',
        headers: ['Rentang Skor', 'Jumlah DPM'],
        data: skorHistogram.map(d => [d.name, d.value])
      },
      {
        title: 'DPM Need Improvement (Skor < 40)',
        headers: ['Nama Faskes', 'Skor', 'Provinsi'],
        data: skorRendah.length > 0 ? skorRendah.map(d => [d.faskes, d.skor, d.provinsi || '-']) : [['Tidak ada DPM dengan skor rendah', '-', '-']]
      },
      {
        title: 'Gap Analysis: Penyakit vs Tindakan (Top 5)',
        headers: ['Penyakit / Masalah', 'Jumlah Kasus', 'Edukasi Keluarga', 'Home Visit'],
        data: gapData.map(d => [d.name, d.Penyakit, d.Edukasi, d.HomeVisit])
      }
    ];

    const rawData = {
      headers: [
        'No', 'Nama Faskes', 'Provinsi',
        'Lama Praktik', 'Kunjungan/Hari', '% Kasus Kronis',
        'Menangani Keluarga Sama', 'Sistem Pencatatan',
        'Ada Poli Sp.KKLP', 'Luaran yang Diukur'
      ],
      rows: dpmDataFiltered.map((row, idx) => {
        const dpm = row.dpm || {};
        const kar = dpm.karakteristik || {};
        const pen = dpm.pendekatan || {};
        const kon = dpm.kontinuitas || {};
        const kas = dpm.kasus || {};
        const poli = dpm.poliKklp || {};
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          kar.lamaPraktik || '-',
          kar.jumlahKunjungan || '-',
          kas.persenKronis || '-',
          pen.menanganiKeluargaSama || '-',
          kon.sistemPencatatan || '-',
          poli.hasPoli || '-',
          Array.isArray(poli.luaranPelayanan) ? poli.luaranPelayanan.join(', ') : '-'
        ];
      })
    };

    exportTablesToExcel('DOKTER PRAKTIK MANDIRI', tables, 'Dashboard_DPM', rawData);
  };


  return (
    <>
    <div className="space-y-8 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          {!isPrinting && (
        <button onClick={() => downloadElementAsPNG('dashboard-dashboarddpm-capture', 'DashboardDPM')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm capture-exclude mb-4 mr-2">
          <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
        </button>
      )}
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Responden DPM" value={dpmStats.totalDpm} icon={Stethoscope} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Kegiatan Terbanyak 1" value={dpmStats.top3Layanan[0]?.value || 0} subtitle={dpmStats.top3Layanan[0]?.name || '-'} icon={CheckCircle} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Kegiatan Terbanyak 2" value={dpmStats.top3Layanan[1]?.value || 0} subtitle={dpmStats.top3Layanan[1]?.name || '-'} icon={FileText} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Kegiatan Terbanyak 3" value={dpmStats.top3Layanan[2]?.value || 0} subtitle={dpmStats.top3Layanan[2]?.name || '-'} icon={Users} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Menangani Keluarga yang Sama</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={keluargaSamaData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => name !== 'Belum Ada Data' && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {keluargaSamaData.map((entry, index) => (
                    <Cell key={index} fill={entry.name === 'Belum Ada Data' ? '#e2e8f0' : ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'][index % 5]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => name === 'Belum Ada Data' ? ['-', 'Data Kosong'] : [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Penerapan RM / Family Folder</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={rekamMedisData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" label={({ name, percent }) => name !== 'Belum Ada Data' && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {rekamMedisData.map((entry, index) => (
                    <Cell key={index} fill={entry.name === 'Belum Ada Data' ? '#e2e8f0' : ['#6366f1', '#94a3b8'][index % 2]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value, name) => name === 'Belum Ada Data' ? ['-', 'Data Kosong'] : [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-amber-600" /> Distribusi Lama Praktik</h3>
            
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
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
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Stethoscope className="w-5 h-5 mr-2 text-emerald-600" /> Top Kegiatan Holistik & Aspek yang Digali</h3>
            
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
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

        {luaranPelayananData.length > 0 && (
          <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
            <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-indigo-600" /> Luaran Pelayanan Sp.KKLP</h3>
            
          </div>
            <div className="h-80">
              <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                <BarChart data={luaranPelayananData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }} width={180} />
                  <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Jumlah DPM" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={32}>
                    <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* NEW CHARTS */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> Distribusi Provinsi</h3>
            
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={provinsiData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah DPM" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-indigo-600" /> Cross-Tab: Lama Praktik vs % Kasus Kronis</h3>
            
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={crossTabKronis} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Bar dataKey="< 25%" stackId="a" fill="#94a3b8" />
                <Bar dataKey="25–50%" stackId="a" fill="#3b82f6" />
                <Bar dataKey="51–75%" stackId="a" fill="#f59e0b" />
                <Bar dataKey="> 75%" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Target className="w-5 h-5 mr-2 text-emerald-600" /> Skor Indeks Pelayanan KKLP</h3>
            
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={skorHistogram} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} DPM`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah DPM" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="bg-slate-50 rounded-xl p-4 overflow-y-auto border border-slate-100 h-full">
              <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500"/> Need Improvement (Skor &lt; 40)</h4>
              {skorRendah.length > 0 ? (
                <ul className="space-y-3">
                  {skorRendah.map((s, i) => (
                    <li key={i} className="flex justify-between items-center p-3 bg-white rounded-lg border border-slate-200">
                      <div>
                        <p className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">{s.faskes}</p>
                        <p className="text-xs text-slate-500">{s.provinsi}</p>
                      </div>
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded text-sm">{s.skor}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 italic">Semua DPM memiliki skor di atas 40. Sangat baik!</p>
              )}
            </div>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Zap className="w-5 h-5 mr-2 text-amber-500" /> Gap Analysis (Penyakit vs Tindakan)</h3>
            
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={gapData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} iconType="circle" />
                <Bar dataKey="Penyakit" fill="#ef4444" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Edukasi" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="HomeVisit" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Qualitative Deep Dive Khusus DPM */}
      {wawancaraTexts.length > 0 && (
        <div className="mt-12">
          <DeepDiveAIReport rawData={wawancaraTexts} isPrinting={isPrinting} />
        </div>
      )}
    </div>

    <ReportGenerator
      dashboardId="dpm"
      dashboardName="Dashboard Pelayanan Medis (DPM)"
      promptContext={`Total responden DPM: ${dpmStats?.totalDpm ?? 0}. Kegiatan terbanyak 1: ${dpmStats?.top3Layanan?.[0]?.name ?? '-'} (${dpmStats?.top3Layanan?.[0]?.value ?? 0}). Kegiatan terbanyak 2: ${dpmStats?.top3Layanan?.[1]?.name ?? '-'} (${dpmStats?.top3Layanan?.[1]?.value ?? 0}). Kegiatan terbanyak 3: ${dpmStats?.top3Layanan?.[2]?.name ?? '-'} (${dpmStats?.top3Layanan?.[2]?.value ?? 0}). DPM perlu perbaikan (skor < 40): ${skorRendah?.length ?? 0}. Provinsi terwakili (top): ${provinsiData?.[0]?.name ?? '-'} (${provinsiData?.[0]?.value ?? 0} DPM). Total provinsi dalam data: ${provinsiData?.length ?? 0}. Luaran pelayanan tercatat: ${luaranPelayananData?.length ?? 0} jenis.`}
    />
    </>
  );
}
