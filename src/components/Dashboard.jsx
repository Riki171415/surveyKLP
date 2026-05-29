import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart
} from 'recharts';
import { Users, Clock, Home, Activity, Loader2, Filter, LayoutDashboard, Stethoscope, Briefcase, FileText, Database, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#6366f1'];

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks", "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)", "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif", "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi", "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)", "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria", "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi", "Deprescribing/pengurangan obat pada pasien polifarmasi",
  "Homecare pasien kronik stabil", "Home care pasien dengan keterbatasan mobilitas",
  "Discharge planning pasca rawat inap", "Koordinasi rujuk balik FKRTL-FKTP",
  "Pelayanan paliatif primer di rumah", "Intervensi keluarga pada pasien kronik",
  "Pembinaan Posbindu PTM", "Edukasi kelompok pasien DM dan hipertensi",
  "Monitoring komunitas risiko tinggi", "Koordinasi lintas profesi dan kader kesehatan"
];

const nonOptimalServices = [
  "Home care penyakit kronik terintegrasi", "Konsultasi keluarga dan family conference",
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Pelayanan paliatif komunitas",
  "Manajemen pasien geriatri frailty", "Precision medicine/konseling genetik dasar",
  "Monitoring pasien kronik berbasis komunitas", "Program edukasi kelompok kronik terstruktur",
  "Telemonitoring pasien kronik", "Pelayanan transisi FKRTL-FKTP",
  "Konseling kepatuhan pengobatan jangka panjang", "Deprescribing dan medication review",
  "Layanan promotif berbasis keluarga"
];

const interviewQuestions = [
  "[W1] Pendapat terkait layanan penyakit kronik",
  "[W2] Implementasi home visit dan home care",
  "[W3] Implementasi komunitas dan edukasi kelompok",
  "[W4] Layanan paliatif primer masuk JKN?",
  "[W5] Keterlibatan Sp.KKLP dalam PRB",
  "[W6] Perubahan faskes dengan adanya Sp.KKLP",
  "[W7] Insentif tambahan untuk Sp.KKLP?"
];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab Navigation
  const [activeTab, setActiveTab] = useState('ringkasan');
  
  // Filters
  const [filterProvinsi, setFilterProvinsi] = useState('Semua');
  const [filterRole, setFilterRole] = useState('Semua');
  const [filterKklp, setFilterKklp] = useState('Semua');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: surveys, error: sbError } = await supabase
        .from('surveys')
        .select('*');
        
      if (sbError) throw sbError;
      setData(surveys || []);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data dari Supabase.");
    } finally {
      setLoading(false);
    }
  };

  // Extract unique filter options
  const uniqueProvinsi = useMemo(() => {
    const provs = new Set(data.map(d => d.city).filter(Boolean));
    return ['Semua', ...Array.from(provs).sort()];
  }, [data]);
  
  const uniqueRoles = useMemo(() => {
    const roles = new Set(data.map(d => d.role).filter(Boolean));
    return ['Semua', ...Array.from(roles).sort()];
  }, [data]);

  // Apply filters
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchProv = filterProvinsi === 'Semua' || item.city === filterProvinsi;
      const matchRole = filterRole === 'Semua' || item.role === filterRole;
      const matchKklp = filterKklp === 'Semua' || (filterKklp === 'Ada' ? item.doc_kklp : !item.doc_kklp);
      return matchProv && matchRole && matchKklp;
    });
  }, [data, filterProvinsi, filterRole, filterKklp]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat dan menganalisis data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const totalResponden = filteredData.length;

  const exportToExcel = () => {
    const headers = [
      "No", "Waktu Pengisian", "Provinsi/Kota", "Nama Faskes", "Jabatan",
      "Dokter Umum", "Dokter Gigi", "Sp.KKLP",
      "Waktu Poli (Mnt)", "Waktu Home Visit (Mnt)", "Beban Dalam Gedung (%)", "Beban Luar Gedung (%)"
    ];
    
    kompetensiLayanan.forEach((k, i) => { headers.push(`[K${i+1}] Status`, `[K${i+1}] Kendala`); });
    jknBenefits.forEach((j, i) => { headers.push(`[J${i+1}] Skala`, `[J${i+1}] Catatan`); });
    nonOptimalServices.forEach((no, i) => { headers.push(`[NO${i+1}] Masuk JKN`, `[NO${i+1}] Skala`, `[NO${i+1}] Catatan`); });
    interviewQuestions.forEach((w, i) => { headers.push(`[W${i+1}] Jawaban`); });

    const rows = filteredData.map((row, index) => {
      const rowData = [
        index + 1,
        new Date(row.created_at).toLocaleString('id-ID'),
        row.city || '',
        row.fktp_name || '',
        row.role || '',
        row.doc_umum ? 'Ada' : 'Tidak',
        row.doc_gigi ? 'Ada' : 'Tidak',
        row.doc_kklp ? 'Ada' : 'Tidak',
        row.time_in_poli || '',
        row.time_home_visit || '',
        row.prop_in_fktp || '',
        row.prop_out_fktp || ''
      ];

      kompetensiLayanan.forEach((_, i) => { rowData.push(row.kompetensi?.[i]?.status || '', row.kompetensi?.[i]?.kendala || ''); });
      jknBenefits.forEach((_, i) => { rowData.push(row.jkn?.[i]?.skala || '', row.jkn?.[i]?.catatan || ''); });
      nonOptimalServices.forEach((_, i) => { rowData.push(row.non_optimal?.[i]?.masukJkn || '', row.non_optimal?.[i]?.skala || '', row.non_optimal?.[i]?.catatan || ''); });
      interviewQuestions.forEach((_, i) => { rowData.push(row.wawancara?.[i] || ''); });

      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Survey");
    
    // Auto-adjust column widths based on headers
    const colWidths = headers.map(h => ({ wch: Math.max(15, h.length) }));
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Rekap_Survey_JKN_${new Date().getTime()}.xlsx`);
  };

  // --- DATA PROCESSING UNTUK MASING-MASING TAB ---

  // 1. DATA RINGKASAN
  const avgPoli = totalResponden > 0 ? Math.round(filteredData.reduce((acc, row) => acc + (Number(row.time_in_poli) || 0), 0) / totalResponden) : 0;
  const avgHome = totalResponden > 0 ? Math.round(filteredData.reduce((acc, row) => acc + (Number(row.time_home_visit) || 0), 0) / totalResponden) : 0;
  
  const roleCount = {};
  filteredData.forEach(row => {
    const role = row.role || 'Tidak Diketahui';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  const roleChartData = Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] }));

  let ketersediaanDokter = [
    { name: 'Dokter Umum', Ada: 0, Tidak: 0 },
    { name: 'Dokter Gigi', Ada: 0, Tidak: 0 },
    { name: 'Dokter Sp.KKLP', Ada: 0, Tidak: 0 }
  ];
  filteredData.forEach(row => {
    row.doc_umum ? ketersediaanDokter[0].Ada++ : ketersediaanDokter[0].Tidak++;
    row.doc_gigi ? ketersediaanDokter[1].Ada++ : ketersediaanDokter[1].Tidak++;
    row.doc_kklp ? ketersediaanDokter[2].Ada++ : ketersediaanDokter[2].Tidak++;
  });

  // 2. DATA KOMPETENSI
  const kompetensiChartData = kompetensiLayanan.map((nama, idx) => {
    let sudah = 0, belum = 0;
    filteredData.forEach(row => {
      const status = row.kompetensi?.[idx]?.status;
      if (status === 'sudah') sudah++;
      else if (status === 'belum') belum++;
    });
    return { name: `K${idx+1}`, fullName: nama, Sudah: sudah, Belum: belum };
  });

  // 3. DATA MANFAAT JKN
  const jknChartData = jknBenefits.map((nama, idx) => {
    let totalScore = 0, count = 0;
    filteredData.forEach(row => {
      const val = Number(row.jkn?.[idx]?.skala);
      if (val > 0) { totalScore += val; count++; }
    });
    return { name: `J${idx+1}`, fullName: nama, AvgSkala: count > 0 ? Number((totalScore / count).toFixed(1)) : 0 };
  }).sort((a, b) => b.AvgSkala - a.AvgSkala); // Sort descending

  // 4. DATA LAYANAN NON-OPTIMAL
  const nonOptChartData = nonOptimalServices.map((nama, idx) => {
    let masukJknYa = 0, masukJknTidak = 0, masukJknTdkTahu = 0, totalScore = 0, countScore = 0;
    filteredData.forEach(row => {
      const ans = row.non_optimal?.[idx];
      if (ans?.masukJkn === 'Ya') masukJknYa++;
      else if (ans?.masukJkn === 'Tidak') masukJknTidak++;
      else if (ans?.masukJkn === 'Tidak Tahu') masukJknTdkTahu++;
      
      const val = Number(ans?.skala);
      if (val > 0) { totalScore += val; countScore++; }
    });
    return { 
      name: `NO${idx+1}`, fullName: nama, 
      Ya: masukJknYa, Tidak: masukJknTidak, TdkTahu: masukJknTdkTahu,
      AvgSkala: countScore > 0 ? Number((totalScore / countScore).toFixed(1)) : 0 
    };
  }).sort((a, b) => b.Ya - a.Ya); // Sort by highest "Ya"

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header & Filter Bar */}
      <div className="mb-6 flex flex-col xl:flex-row xl:items-end justify-between space-y-4 xl:space-y-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg shadow-primary-500/30 mr-4">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Monitoring & Evaluasi Optimalisasi JKN dan Sp.KKLP</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-soft border border-white/60">
          <div className="flex items-center text-sm font-semibold text-slate-600 mr-2 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Filter className="w-4 h-4 mr-1.5 text-primary-500" /> Filter:
          </div>
          <select 
            value={filterProvinsi} 
            onChange={(e) => setFilterProvinsi(e.target.value)}
            className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm max-w-[200px] cursor-pointer"
          >
            {uniqueProvinsi.map(p => <option key={p} value={p}>{p === 'Semua' ? 'Semua Provinsi' : p}</option>)}
          </select>
          <select 
            value={filterRole} 
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm cursor-pointer"
          >
            {uniqueRoles.map(r => <option key={r} value={r}>{r === 'Semua' ? 'Semua Jabatan' : r}</option>)}
          </select>
          <select 
            value={filterKklp} 
            onChange={(e) => setFilterKklp(e.target.value)}
            className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm cursor-pointer"
          >
            <option value="Semua">Sp.KKLP (Semua)</option>
            <option value="Ada">Ada Sp.KKLP</option>
            <option value="Tidak">Tidak Ada Sp.KKLP</option>
          </select>
          
          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2"></div>
          
          <button 
            onClick={exportToExcel}
            className="flex items-center text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-2 px-5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5 ml-auto"
          >
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto bg-white/50 backdrop-blur p-2 rounded-2xl shadow-sm border border-white mb-6 hide-scrollbar gap-2">
        {[
          { id: 'ringkasan', label: 'Ringkasan Utama', icon: Activity },
          { id: 'kompetensi', label: 'Analisis Kompetensi', icon: Stethoscope },
          { id: 'jkn', label: 'Manfaat JKN', icon: Briefcase },
          { id: 'nonopt', label: 'Layanan Ekstra', icon: FileText },
          { id: 'data', label: 'Data & Wawancara', icon: Database },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-primary-600 shadow-sm border border-slate-100 scale-105' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-soft border border-white min-h-[500px]">
        {totalResponden === 0 ? (
          <div className="py-20 text-center text-slate-500">Tidak ada data yang cocok dengan filter.</div>
        ) : (
          <>
            {/* TAB 1: RINGKASAN */}
            {activeTab === 'ringkasan' && (
              <div className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Responden', value: totalResponden, icon: Users, sub: 'Faskes tersaring', color: 'from-blue-500 to-indigo-500' },
                    { label: 'Avg Waktu Poli', value: `${avgPoli} Mnt`, icon: Clock, sub: 'Per pasien', color: 'from-emerald-400 to-teal-500' },
                    { label: 'Avg Home Visit', value: `${avgHome} Mnt`, icon: Home, sub: 'Per kunjungan', color: 'from-amber-400 to-orange-500' },
                    { label: 'Ada Sp.KKLP', value: `${Math.round((ketersediaanDokter[2].Ada / totalResponden)*100)}%`, icon: Stethoscope, sub: `${ketersediaanDokter[2].Ada} dari ${totalResponden}`, color: 'from-pink-500 to-rose-500' }
                  ].map((s, i) => (
                    <div key={i} className="relative overflow-hidden p-6 bg-white rounded-3xl border border-slate-100 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${s.color} rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700`}></div>
                      <div className={`mb-4 p-3 bg-gradient-to-br ${s.color} rounded-2xl self-start shadow-lg text-white`}>
                        <s.icon className="w-6 h-6" />
                      </div>
                      <h3 className="text-3xl font-display font-bold text-slate-900 mb-1">{s.value}</h3>
                      <p className="text-sm font-bold text-slate-600">{s.label}</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">{s.sub}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow">
                    <h2 className="text-lg font-display font-bold text-slate-800 mb-6 text-center">Distribusi Jabatan Responden</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                            {roleChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow">
                    <h2 className="text-lg font-display font-bold text-slate-800 mb-6 text-center">Ketersediaan Dokter di FKTP</h2>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={ketersediaanDokter} layout="vertical" margin={{ left: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 500}} />
                          <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px' }} />
                          <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                          <Bar dataKey="Ada" stackId="a" fill="#10b981" barSize={24} />
                          <Bar dataKey="Tidak" stackId="a" fill="#f87171" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KOMPETENSI */}
            {activeTab === 'kompetensi' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Status Implementasi 7 Kompetensi Sp.KKLP</h2>
                  <p className="text-sm text-slate-500">Puskesmas yang sudah mengimplementasikan (Hijau) vs Belum (Kuning)</p>
                </div>
                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kompetensiChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg max-w-xs text-sm">
                                <p className="font-bold text-slate-800 mb-2 border-b pb-1">{data.name}: {data.fullName}</p>
                                <p className="text-emerald-600 font-medium">Sudah: {data.Sudah} Faskes</p>
                                <p className="text-amber-500 font-medium">Belum: {data.Belum} Faskes</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={40} iconType="circle" />
                      <Bar dataKey="Sudah" stackId="a" fill="#10b981" barSize={40} />
                      <Bar dataKey="Belum" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                  {kompetensiChartData.map(c => (
                    <div key={c.name} className="text-xs text-slate-600 flex items-start">
                      <span className="font-bold text-slate-900 mr-2">{c.name}:</span> {c.fullName}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: JKN */}
            {activeTab === 'jkn' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Rata-rata Skala (1-4) Manfaat JKN Saat Ini</h2>
                  <p className="text-sm text-slate-500">Nilai tertinggi menunjukkan layanan dinilai paling optimal/relevan (Diurutkan dari tertinggi)</p>
                </div>
                <div className="h-[600px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={jknChartData} layout="vertical" margin={{ left: 50, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" domain={[0, 4]} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 600}} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg max-w-sm text-sm">
                                <p className="font-bold text-slate-800 mb-1">{data.fullName}</p>
                                <p className="text-primary-600 font-bold text-lg">Skala: {data.AvgSkala}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="AvgSkala" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                        {jknChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.AvgSkala >= 3 ? '#3b82f6' : entry.AvgSkala >= 2 ? '#94a3b8' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pt-6 border-t border-slate-100">
                  {jknChartData.map(c => (
                    <div key={c.name} className="text-xs text-slate-600 flex items-start">
                      <span className="font-bold text-slate-900 mr-2 w-8 shrink-0">{c.name}:</span> 
                      <span className="truncate" title={c.fullName}>{c.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: LAYANAN NON-OPTIMAL */}
            {activeTab === 'nonopt' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Analisis Layanan Non-Optimal (Masuk JKN?)</h2>
                  <p className="text-sm text-slate-500">Berapa banyak Faskes yang menjawab "Ya" vs "Tidak", dan rata-rata skor Skala (Garis Merah)</p>
                </div>
                <div className="h-[500px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={nonOptChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 4]} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg max-w-sm text-sm">
                                <p className="font-bold text-slate-800 mb-2 border-b pb-1">{data.fullName}</p>
                                <p className="text-emerald-600 font-medium">Masuk JKN (Ya): {data.Ya}</p>
                                <p className="text-slate-400 font-medium">Tidak: {data.Tidak}</p>
                                <p className="text-amber-500 font-medium">Tidak Tahu: {data.TdkTahu || 0}</p>
                                <p className="text-blue-600 font-bold mt-2">Avg Skala: {data.AvgSkala}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar yAxisId="left" dataKey="Ya" fill="#10b981" barSize={25} stackId="a" />
                      <Bar yAxisId="left" dataKey="Tidak" fill="#cbd5e1" barSize={25} stackId="a" />
                      <Bar yAxisId="left" dataKey="TdkTahu" name="Tidak Tahu" fill="#f59e0b" barSize={25} stackId="a" />
                      <Line yAxisId="right" type="monotone" dataKey="AvgSkala" name="Rata-rata Skala (1-4)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 pt-6 border-t border-slate-100">
                  {nonOptChartData.map(c => (
                    <div key={c.name} className="text-xs text-slate-600 flex items-start">
                      <span className="font-bold text-slate-900 mr-2 w-10 shrink-0">{c.name}:</span> 
                      <span className="truncate" title={c.fullName}>{c.fullName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: DATA GRID */}
            {activeTab === 'data' && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-sm text-slate-500">Gulir ke kanan untuk melihat jawaban kualitatif (esai wawancara, kendala kompetensi, dan catatan).</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold min-w-[200px] sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Faskes</th>
                        <th className="px-4 py-3 font-semibold">Provinsi / Kota</th>
                        <th className="px-4 py-3 font-semibold">Jabatan</th>
                        <th className="px-4 py-3 font-semibold text-center border-r border-slate-200">Sp.KKLP</th>
                        {/* Wawancara Headers */}
                        {interviewQuestions.map((q, idx) => (
                          <th key={`w-${idx}`} className="px-4 py-3 font-semibold min-w-[300px] bg-emerald-50 border-r border-emerald-100">{q}</th>
                        ))}
                        {/* Kendala Kompetensi */}
                        {kompetensiLayanan.map((k, idx) => (
                          <th key={`k-${idx}`} className="px-4 py-3 font-semibold min-w-[250px] bg-blue-50 border-r border-blue-100">[Komp] Kendala: {k.substring(0,25)}...</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900 sticky left-0 bg-white z-10 border-r border-slate-200 group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{row.fktp_name}</td>
                          <td className="px-4 py-3">{row.city}</td>
                          <td className="px-4 py-3">{row.role}</td>
                          <td className="px-4 py-3 text-center border-r border-slate-200">
                            {row.doc_kklp ? <span className="text-emerald-600 font-bold">Ada</span> : <span className="text-slate-400">Tidak</span>}
                          </td>
                          
                          {/* Wawancara Data */}
                          {interviewQuestions.map((_, i) => {
                            const val = row.wawancara?.[i];
                            return (
                              <td key={`w-ans-${i}`} className="px-4 py-3 border-r border-slate-100">
                                <div className="truncate max-w-[300px] text-slate-700" title={val || '-'}>{val || '-'}</div>
                              </td>
                            );
                          })}

                          {/* Kendala Kompetensi Data */}
                          {kompetensiLayanan.map((_, i) => {
                            const val = row.kompetensi?.[i]?.kendala;
                            return (
                              <td key={`k-ans-${i}`} className="px-4 py-3 border-r border-slate-100">
                                <div className="truncate max-w-[250px] text-slate-600 italic" title={val || '-'}>{val || '-'}</div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
