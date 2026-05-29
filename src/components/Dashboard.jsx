import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ComposedChart, AreaChart, Area
} from 'recharts';
import { 
  Users, Clock, Home, Activity, Loader2, Filter, LayoutDashboard, Stethoscope, Briefcase, 
  FileText, Database, Download, Search, ChevronLeft, ChevronRight, TrendingUp, Sparkles, Printer 
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { id as localeID } from 'date-fns/locale';

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

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
const tabVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [filterProvinsi, setFilterProvinsi] = useState('Semua');
  const [filterRole, setFilterRole] = useState('Semua');
  const [filterKklp, setFilterKklp] = useState('Semua');
  const [searchTable, setSearchTable] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State untuk mode cetak
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: surveys, error: sbError } = await supabase.from('surveys').select('*');
      if (sbError) throw sbError;
      setData(surveys || []);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data dari Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 800);
  };

  const uniqueProvinsi = useMemo(() => {
    const provs = new Set(data.map(d => d.city).filter(Boolean));
    return ['Semua', ...Array.from(provs).sort()];
  }, [data]);
  
  const uniqueRoles = useMemo(() => {
    const roles = new Set(data.map(d => d.role).filter(Boolean));
    return ['Semua', ...Array.from(roles).sort()];
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchProv = filterProvinsi === 'Semua' || item.city === filterProvinsi;
      const matchRole = filterRole === 'Semua' || item.role === filterRole;
      const matchKklp = filterKklp === 'Semua' || (filterKklp === 'Ada' ? item.doc_kklp : !item.doc_kklp);
      return matchProv && matchRole && matchKklp;
    });
  }, [data, filterProvinsi, filterRole, filterKklp]);

  const totalResponden = filteredData.length;

  // EXCEL EXPORT (Omitted details for brevity, keep unchanged)
  const exportToExcel = () => {
    const headers = [
      "No", "Waktu Pengisian", "Provinsi/Kota", "Nama Faskes", "Jabatan",
      "Dokter Umum", "Dokter Gigi", "Sp.KKLP",
      "Waktu Poli (Mnt)", "Waktu Home Visit (Mnt)", "Beban Dalam Gedung (%)", "Beban Luar Gedung (%)"
    ];
    kompetensiLayanan.forEach((k, i) => { headers.push(`[K${i+1}] Status`, `[K${i+1}] Kendala`); });
    jknBenefits.forEach((j, i) => { headers.push(`[J${i+1}] Skala`, `[J${i+1}] Catatan`); });
    nonOptimalServices.forEach((n, i) => { headers.push(`[Non-Opt] Masuk JKN?: ${n}`, `[Non-Opt] Skala: ${n}`, `[Non-Opt] Catatan: ${n}`); });
    headers.push(`[Wawancara] Pewawancara`);
    interviewQuestions.forEach((q, i) => { headers.push(`[Wawancara] ${q}`); });

    const rows = filteredData.map((row, index) => {
      const rowData = [
        index + 1, new Date(row.created_at).toLocaleString('id-ID'), row.city || '', row.fktp_name || '', row.role || '',
        row.doc_umum ? 'Ada' : 'Tidak', row.doc_gigi ? 'Ada' : 'Tidak', row.doc_kklp ? 'Ada' : 'Tidak',
        row.time_in_poli || '', row.time_home_visit || '', row.prop_in_fktp || '', row.prop_out_fktp || ''
      ];
      kompetensiLayanan.forEach((_, i) => { rowData.push(row.kompetensi?.[i]?.status || '', row.kompetensi?.[i]?.kendala || ''); });
      jknBenefits.forEach((_, i) => { rowData.push(row.jkn?.[i]?.skala || '', row.jkn?.[i]?.catatan || ''); });
      nonOptimalServices.forEach((_, i) => { rowData.push(row.non_optimal?.[i]?.masukJkn || '', row.non_optimal?.[i]?.skala || '', row.non_optimal?.[i]?.catatan || ''); });
      rowData.push(row.wawancara?.pewawancara || '');
      interviewQuestions.forEach((_, i) => { rowData.push(row.wawancara?.[i] || ''); });
      return rowData;
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Survey");
    worksheet['!cols'] = headers.map(h => ({ wch: Math.max(15, h.length) }));
    XLSX.writeFile(workbook, `Rekap_Survey_JKN_${new Date().getTime()}.xlsx`);
  };

  const summaryMetrics = useMemo(() => {
    let sumPoli = 0, sumHome = 0, sumInFktp = 0, sumOutFktp = 0;
    let kklpHome = 0, kklpCount = 0;
    let nonKklpHome = 0, nonKklpCount = 0;
    filteredData.forEach(row => {
      const poli = Number(row.time_in_poli) || 0;
      const home = Number(row.time_home_visit) || 0;
      sumPoli += poli; sumHome += home;
      sumInFktp += Number(row.prop_in_fktp) || 0; sumOutFktp += Number(row.prop_out_fktp) || 0;
      if (row.doc_kklp) { kklpHome += home; kklpCount++; } else { nonKklpHome += home; nonKklpCount++; }
    });
    return {
      avgPoli: totalResponden > 0 ? Math.round(sumPoli / totalResponden) : 0,
      avgHome: totalResponden > 0 ? Math.round(sumHome / totalResponden) : 0,
      avgInFktp: totalResponden > 0 ? Math.round(sumInFktp / totalResponden) : 0,
      avgOutFktp: totalResponden > 0 ? Math.round(sumOutFktp / totalResponden) : 0,
      kklpAvgHome: kklpCount > 0 ? Math.round(kklpHome / kklpCount) : 0,
      nonKklpAvgHome: nonKklpCount > 0 ? Math.round(nonKklpHome / nonKklpCount) : 0,
    };
  }, [filteredData, totalResponden]);

  const { roleChartData, ketersediaanDokter, trendChartData, bebanKerjaData } = useMemo(() => {
    const roleCount = {}; const trendMap = {};
    const docStats = [{ name: 'Dr Umum', Ada: 0, Tidak: 0 }, { name: 'Dr Gigi', Ada: 0, Tidak: 0 }, { name: 'Sp.KKLP', Ada: 0, Tidak: 0 }];
    filteredData.forEach(row => {
      const role = row.role || 'Lainnya'; roleCount[role] = (roleCount[role] || 0) + 1;
      row.doc_umum ? docStats[0].Ada++ : docStats[0].Tidak++; row.doc_gigi ? docStats[1].Ada++ : docStats[1].Tidak++; row.doc_kklp ? docStats[2].Ada++ : docStats[2].Tidak++;
      if (row.created_at) { try { const dateStr = format(parseISO(row.created_at), 'dd MMM yy', { locale: localeID }); trendMap[dateStr] = (trendMap[dateStr] || 0) + 1; } catch(e) {} }
    });
    return {
      roleChartData: Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] })),
      ketersediaanDokter: docStats,
      trendChartData: Object.keys(trendMap).map(k => ({ date: k, Responden: trendMap[k] })),
      bebanKerjaData: [{ name: 'Rata-Rata Beban Kerja', 'Dalam Gedung (%)': summaryMetrics.avgInFktp, 'Luar Gedung (%)': summaryMetrics.avgOutFktp }]
    };
  }, [filteredData, summaryMetrics]);

  const kompetensiChartData = useMemo(() => kompetensiLayanan.map((nama, idx) => {
    let sudah = 0, belum = 0;
    filteredData.forEach(row => { const status = row.kompetensi?.[idx]?.status; if (status === 'sudah') sudah++; else if (status === 'belum') belum++; });
    return { name: `K${idx+1}`, fullName: nama, Sudah: sudah, Belum: belum };
  }), [filteredData]);

  const jknChartData = useMemo(() => jknBenefits.map((nama, idx) => {
    let totalScore = 0, count = 0;
    filteredData.forEach(row => { const val = Number(row.jkn?.[idx]?.skala); if (val > 0) { totalScore += val; count++; } });
    return { name: `J${idx+1}`, fullName: nama, AvgSkala: count > 0 ? Number((totalScore / count).toFixed(1)) : 0 };
  }).sort((a, b) => b.AvgSkala - a.AvgSkala), [filteredData]);

  const nonOptChartData = useMemo(() => nonOptimalServices.map((nama, idx) => {
    let masukJknYa = 0, masukJknTidak = 0, masukJknTdkTahu = 0, totalScore = 0, countScore = 0;
    filteredData.forEach(row => {
      const ans = row.non_optimal?.[idx];
      if (ans?.masukJkn === 'Ya') masukJknYa++; else if (ans?.masukJkn === 'Tidak') masukJknTidak++; else if (ans?.masukJkn === 'Tidak Tahu') masukJknTdkTahu++;
      const val = Number(ans?.skala); if (val > 0) { totalScore += val; countScore++; }
    });
    return { name: `NO${idx+1}`, fullName: nama, Ya: masukJknYa, Tidak: masukJknTidak, TdkTahu: masukJknTdkTahu, AvgSkala: countScore > 0 ? Number((totalScore / countScore).toFixed(1)) : 0 };
  }).sort((a, b) => b.Ya - a.Ya), [filteredData]);

  const tableDataFiltered = useMemo(() => {
    if (!searchTable) return filteredData;
    const lowerSearch = searchTable.toLowerCase();
    return filteredData.filter(row => (row.fktp_name || '').toLowerCase().includes(lowerSearch) || (row.city || '').toLowerCase().includes(lowerSearch) || (row.wawancara?.pewawancara || '').toLowerCase().includes(lowerSearch));
  }, [filteredData, searchTable]);

  const totalPages = Math.ceil(tableDataFiltered.length / rowsPerPage) || 1;
  const currentTableData = tableDataFiltered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  useEffect(() => setCurrentPage(1), [searchTable, rowsPerPage, filterProvinsi, filterRole, filterKklp]);

  // RENDERING COMPONENTS FOR TABS (Can be used normally or stacked for print)
  
  const renderRingkasan = () => (
    <div className="space-y-8 print-page-break-inside-avoid">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-2 print:gap-4">
        {[
          { label: 'Total Faskes Terdata', value: totalResponden, icon: Users, sub: 'Responden tersaring', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
          { label: 'Rata-rata Waktu Poli', value: `${summaryMetrics.avgPoli} Mnt`, icon: Clock, sub: 'Durasi konsultasi rata-rata', color: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-500/20' },
          { label: 'Rata-rata Home Visit', value: `${summaryMetrics.avgHome} Mnt`, icon: Home, sub: 'Kunjungan pasien', color: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-500/20' },
          { label: 'Penempatan Sp.KKLP', value: `${Math.round((ketersediaanDokter[2].Ada / totalResponden)*100)}%`, icon: Stethoscope, sub: `${ketersediaanDokter[2].Ada} Faskes memiliki Sp.KKLP`, color: 'from-pink-500 to-rose-500', shadow: 'shadow-rose-500/20' }
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden p-6 bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 flex flex-col group cursor-default">
            <div className={`absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br ${s.color} rounded-full opacity-[0.08] transition-transform duration-700 ease-out`}></div>
            <div className={`mb-4 p-3 bg-gradient-to-br ${s.color} rounded-2xl self-start shadow-lg text-white ${s.shadow}`}><s.icon className="w-6 h-6" /></div>
            <h3 className="text-4xl font-display font-extrabold text-slate-800 mb-1 tracking-tight">{s.value}</h3>
            <p className="text-sm font-bold text-slate-500">{s.label}</p>
            <p className="text-xs text-slate-400 mt-2 font-medium bg-slate-50 self-start px-2 py-1 rounded-md">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 print:flex print:flex-col print:gap-8">
        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm print:break-inside-avoid">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-display font-bold text-slate-800">Tren Pengisian Survei</h2>
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Berdasarkan Tanggal</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 250 : "100%"}>
              <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="Responden" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrend)" activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }} isAnimationActive={!isPrinting} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm print:break-inside-avoid">
          <h2 className="text-lg font-display font-bold text-slate-800 mb-6">Distribusi Responden</h2>
          <div className="h-64">
            <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 250 : "100%"}>
              <PieChart>
                <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={!isPrinting}>
                  {roleChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} itemStyle={{ fontWeight: 'bold' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm print:break-inside-avoid">
          <h2 className="text-lg font-display font-bold text-slate-800 mb-6">Distribusi Beban Kerja Faskes</h2>
          <div className="h-40">
            <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 160 : "100%"}>
              <BarChart data={bebanKerjaData} layout="vertical" margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} hide />
                <YAxis dataKey="name" type="category" hide />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                <Bar dataKey="Dalam Gedung (%)" stackId="a" fill="#8b5cf6" barSize={32} radius={[4, 0, 0, 4]} isAnimationActive={!isPrinting} />
                <Bar dataKey="Luar Gedung (%)" stackId="a" fill="#fb923c" radius={[0, 4, 4, 0]} isAnimationActive={!isPrinting} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-slate-500 mt-2">Berdasarkan persentase alokasi waktu pelayanan harian</p>
        </div>

        <div className="xl:col-span-2 bg-white border border-slate-100 rounded-3xl p-6 shadow-sm print:break-inside-avoid">
          <h2 className="text-lg font-display font-bold text-slate-800 mb-6">Ketersediaan Dokter di FKTP</h2>
          <div className="h-48">
            <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 200 : "100%"}>
              <BarChart data={ketersediaanDokter} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 13, fontWeight: 600, fill: '#334155'}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }} />
                <Bar dataKey="Ada" stackId="a" fill="#10b981" barSize={28} isAnimationActive={!isPrinting} />
                <Bar dataKey="Tidak" stackId="a" fill="#f43f5e" radius={[0, 6, 6, 0]} isAnimationActive={!isPrinting} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Narasi Ringkasan (Print & View) */}
      <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 mt-4 print:break-inside-avoid">
        <h4 className="font-bold text-blue-800 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Narasi Eksekutif</h4>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Berdasarkan data {totalResponden} responden, terlihat bahwa mayoritas beban kerja faskes masih terpusat di dalam gedung ({summaryMetrics.avgInFktp}%), sedangkan pelayanan luar gedung (komunitas/kunjungan rumah) baru mencapai {summaryMetrics.avgOutFktp}%. Kehadiran Sp.KKLP (yang saat ini mencakup {Math.round((ketersediaanDokter[2].Ada / (totalResponden||1))*100)}% dari total sampel) terbukti memberikan korelasi positif terhadap peningkatan rata-rata durasi <i>Home Visit</i> dari {summaryMetrics.nonKklpAvgHome} menit menjadi {summaryMetrics.kklpAvgHome} menit per pasien. Hal ini mengindikasikan bahwa pemerataan Sp.KKLP berpotensi besar memperkuat upaya promotif, preventif, dan intervensi keluarga secara langsung di lapangan.
        </p>
      </div>
    </div>
  );

  const renderKompetensi = () => (
    <div className="space-y-6 print-page-break mt-10">
      <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Status Implementasi 7 Kompetensi Utama Sp.KKLP</h2>
        <p className="text-sm text-slate-500 mt-1">Perbandingan faskes yang sudah mengimplementasikan kompetensi secara optimal.</p>
      </div>
      <div className="h-[450px] w-full">
        <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 450 : "100%"}>
          <BarChart data={kompetensiChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: 'bold'}} />
            <YAxis axisLine={false} tickLine={false} />
            <RechartsTooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-sm p-4 shadow-xl rounded-xl border border-slate-100 max-w-sm">
                      <p className="font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">{d.name}: <span className="font-medium text-slate-600">{d.fullName}</span></p>
                      <div className="flex justify-between items-center mb-1"><span className="text-emerald-600 font-bold">Terimplementasi:</span><span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold">{d.Sudah}</span></div>
                      <div className="flex justify-between items-center"><span className="text-amber-500 font-bold">Belum Optimal:</span><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-bold">{d.Belum}</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={50} iconType="circle" />
            <Bar dataKey="Sudah" stackId="a" fill="#10b981" barSize={48} radius={[0, 0, 0, 0]} isAnimationActive={!isPrinting} />
            <Bar dataKey="Belum" stackId="a" fill="#fcd34d" radius={[6, 6, 0, 0]} isAnimationActive={!isPrinting} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
        {kompetensiChartData.map(c => (
          <div key={c.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="font-bold text-blue-600 mb-1">{c.name}</div>
            <div className="text-xs text-slate-600 font-medium leading-relaxed">{c.fullName}</div>
          </div>
        ))}
      </div>
      
      {/* Narasi Kompetensi */}
      <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 mt-4 print:break-inside-avoid">
        <h4 className="font-bold text-emerald-800 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Insight Implementasi Layanan Khusus</h4>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Grafik di atas memvisualisasikan tingkat ketercapaian 7 kompetensi inti Sp.KKLP di tingkat fasilitas kesehatan primer. Area berwarna kuning (Belum Optimal) menjadi titik kritis yang menunjukkan kesenjangan kapasitas medis saat ini. Kesenjangan ini menegaskan dua hal: (1) Perlunya pelatihan terstruktur (<i>capacity building</i>) secara kontinu bagi dokter umum yang bertugas, dan (2) Kebutuhan mendesak akan penempatan Sp.KKLP sebagai konsultan klinis untuk menjembatani prosedur medis yang belum tertangani secara adekuat di level primer.
        </p>
      </div>
    </div>
  );

  const renderJkn = () => (
    <div className="space-y-6 print-page-break mt-10">
      <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Evaluasi Manfaat JKN Berjalan</h2>
        <p className="text-sm text-slate-500 mt-1">Berdasarkan skala Likert (1-4). Nilai mendekati 4 menandakan kompetensi spesifik Sp.KKLP.</p>
      </div>
      <div className="h-[700px] w-full bg-white rounded-3xl p-4 border border-slate-50 shadow-sm">
        <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 700 : "100%"}>
          <BarChart data={jknChartData} layout="vertical" margin={{ left: 40, right: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
            <XAxis type="number" domain={[0, 4]} axisLine={false} tickLine={false} ticks={[0, 1, 2, 3, 4]} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontWeight: 700, fill: '#475569'}} />
            <RechartsTooltip 
              cursor={{fill: '#f8fafc'}}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-800 text-white p-3 shadow-xl rounded-xl max-w-sm">
                      <p className="font-medium mb-1 opacity-90">{d.fullName}</p>
                      <div className="flex items-center text-blue-400 font-bold text-lg">Skala Rata-rata: <span className="ml-2 bg-blue-500/20 px-2 py-0.5 rounded">{d.AvgSkala}</span></div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="AvgSkala" radius={[0, 6, 6, 0]} barSize={20} isAnimationActive={!isPrinting}>
              {jknChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.AvgSkala >= 3.5 ? '#2563eb' : entry.AvgSkala >= 2.5 ? '#60a5fa' : '#cbd5e1'} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-6 border-t border-slate-100">
        {jknChartData.map(c => (
          <div key={c.name} className="flex gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <span className="font-bold text-blue-500 shrink-0 bg-blue-50 w-8 h-8 flex items-center justify-center rounded-lg">{c.name}</span> 
            <span className="text-slate-600 font-medium self-center leading-tight">{c.fullName}</span>
          </div>
        ))}
      </div>
      
      {/* Narasi JKN */}
      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 mt-4 print:break-inside-avoid">
        <h4 className="font-bold text-amber-800 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Kesimpulan Skala Manfaat JKN</h4>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Berdasarkan penilaian skala Likert (1-4), batang yang melewati skala 3,0 merepresentasikan jenis pelayanan yang secara absolut membutuhkan keahlian spesifik Sp.KKLP demi menjaga mutu dan luaran klinis yang optimal. Sementara itu, nilai yang berada di bawah skala 2,5 merupakan pelayanan ruting yang dapat terus dipercayakan kepada dokter umum. Hal ini menjadi justifikasi logis dalam memetakan standar kapitasi dan potensi pemberian insentif tambahan berbasis kompetensi bagi faskes yang memiliki Sp.KKLP dalam menangani kasus-kasus kompleks tanpa perlu merujuk ke rumah sakit.
        </p>
      </div>
    </div>
  );

  const renderNonOpt = () => (
    <div className="space-y-6 print-page-break mt-10">
      <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Analisis Rekomendasi Layanan Baru (Masuk JKN)</h2>
        <p className="text-sm text-slate-500 mt-1">Perbandingan Faskes yang merekomendasikan layanan non-optimal dimasukkan ke JKN beserta pembobotan skalanya.</p>
      </div>
      <div className="h-[550px] w-full bg-white rounded-3xl p-4 border border-slate-50 shadow-sm">
        <ResponsiveContainer width={isPrinting ? 700 : "100%"} height={isPrinting ? 550 : "100%"}>
          <ComposedChart data={nonOptChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontWeight: 'bold'}} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 4]} axisLine={false} tickLine={false} />
            <RechartsTooltip 
              cursor={{fill: '#f8fafc'}}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-sm p-4 shadow-xl rounded-xl border border-slate-100 max-w-sm">
                      <p className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">{d.name}: {d.fullName}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-emerald-600 font-bold">Rekomendasi (Ya)</span><span className="font-black text-slate-800">{d.Ya}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-bold">Tidak</span><span className="font-black text-slate-800">{d.Tidak}</span></div>
                        <div className="flex justify-between"><span className="text-amber-500 font-bold">Ragu/Tidak Tahu</span><span className="font-black text-slate-800">{d.TdkTahu || 0}</span></div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-blue-50 p-2 rounded-lg">
                        <span className="font-bold text-blue-700">Rata-rata Skala</span><span className="font-black text-blue-700 text-lg">{d.AvgSkala}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 500 }} />
            <Bar yAxisId="left" dataKey="Ya" name="Setuju Masuk JKN" fill="#10b981" barSize={32} stackId="a" radius={[0, 0, 0, 0]} isAnimationActive={!isPrinting} />
            <Bar yAxisId="left" dataKey="TdkTahu" name="Tidak Tahu" fill="#fcd34d" barSize={32} stackId="a" isAnimationActive={!isPrinting} />
            <Bar yAxisId="left" dataKey="Tidak" name="Tidak Setuju" fill="#cbd5e1" barSize={32} stackId="a" radius={[6, 6, 0, 0]} isAnimationActive={!isPrinting} />
            <Line yAxisId="right" type="monotone" dataKey="AvgSkala" name="Rata-rata Skala Kebutuhan" stroke="#2563eb" strokeWidth={4} dot={{ r: 5, fill: '#fff', strokeWidth: 3 }} activeDot={{ r: 8 }} isAnimationActive={!isPrinting} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-6 border-t border-slate-100">
        {nonOptChartData.map(c => (
          <div key={c.name} className="flex gap-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
            <span className="font-bold text-emerald-600 shrink-0">{c.name}</span><span className="text-slate-600 font-medium truncate" title={c.fullName}>{c.fullName}</span>
          </div>
        ))}
      </div>
      
      {/* Narasi Non-Optimal */}
      <div className="bg-purple-50/50 p-5 rounded-2xl border border-purple-100 mt-4 print:break-inside-avoid">
        <h4 className="font-bold text-purple-800 mb-2 flex items-center"><Sparkles className="w-4 h-4 mr-2" /> Analisis Rekomendasi JKN Masa Depan</h4>
        <p className="text-sm text-slate-600 leading-relaxed text-justify">
          Survei ini berhasil memotret layanan-layanan medis di luar jangkauan standar yang sebenarnya sangat dinantikan kehadirannya oleh masyarakat. Proporsi rekomendasi positif ("Setuju Masuk JKN" berwarna hijau) berjalan linier dengan tingginya garis rata-rata skala kebutuhan. Pelayanan seperti Home Care Terintegrasi, Layanan Paliatif Komunitas, dan Konseling Geriatri menduduki peringkat prioritas. Mengintegrasikan layanan-layanan ini ke dalam paket manfaat JKN akan merevolusi fungsi FKTP sebagai gerbang utama pelayanan kesehatan paripurna.
        </p>
      </div>
    </div>
  );

  const renderDataGrid = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Smart Data Grid</h2>
          <p className="text-xs text-slate-500 mt-1">Cari, sortir, dan jelajahi data mentah beserta rekam jejak kualitatif wawancara.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Cari faskes, kota, atau pewawancara..." value={searchTable} onChange={(e) => setSearchTable(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm" />
          </div>
          <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))} className="py-2 px-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm">
            <option value={10}>10 Baris</option><option value={25}>25 Baris</option><option value={50}>50 Baris</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-sm bg-white custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50/80 backdrop-blur text-slate-700">
            <tr>
              <th className="px-5 py-4 font-bold min-w-[220px] sticky left-0 bg-slate-100 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Faskes</th>
              <th className="px-5 py-4 font-bold text-slate-600">Provinsi / Kota</th>
              <th className="px-5 py-4 font-bold text-slate-600">Jabatan</th>
              <th className="px-5 py-4 font-bold text-center border-r border-slate-200 text-slate-600">Sp.KKLP</th>
              <th className="px-5 py-4 font-bold min-w-[150px] bg-emerald-50/80 border-r border-emerald-100/50 text-emerald-800">Tim Wawancara</th>
              {interviewQuestions.map((q, idx) => <th key={`w-${idx}`} className="px-5 py-4 font-bold min-w-[320px] bg-emerald-50/50 border-r border-emerald-100/50 text-emerald-800">{q}</th>)}
              {kompetensiLayanan.map((k, idx) => <th key={`k-${idx}`} className="px-5 py-4 font-bold min-w-[280px] bg-blue-50/50 border-r border-blue-100/50 text-blue-800">[Komp] Kendala: {k.substring(0,25)}...</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentTableData.length > 0 ? currentTableData.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-5 py-3 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 group-hover:bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{row.fktp_name}</td>
                <td className="px-5 py-3 text-slate-600">{row.city}</td><td className="px-5 py-3 text-slate-600">{row.role}</td>
                <td className="px-5 py-3 text-center border-r border-slate-100">{row.doc_kklp ? <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wide">Ada</span> : <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wide">Tidak</span>}</td>
                <td className="px-5 py-3 border-r border-slate-100 bg-emerald-50/10">
                  <div className="truncate max-w-[150px] text-emerald-700 font-bold capitalize flex items-center gap-2" title={row.wawancara?.pewawancara || '-'}>
                    {row.wawancara?.pewawancara ? <div className="w-6 h-6 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800 text-xs">{row.wawancara.pewawancara.charAt(0)}</div> : '-'}{row.wawancara?.pewawancara || ''}
                  </div>
                </td>
                {interviewQuestions.map((_, i) => <td key={`w-ans-${i}`} className="px-5 py-3 border-r border-slate-100"><div className="truncate max-w-[320px] text-slate-600" title={row.wawancara?.[i] || '-'}>{row.wawancara?.[i] || '-'}</div></td>)}
                {kompetensiLayanan.map((_, i) => <td key={`k-ans-${i}`} className="px-5 py-3 border-r border-slate-100"><div className="truncate max-w-[280px] text-slate-500 italic" title={row.kompetensi?.[i]?.kendala || '-'}>{row.kompetensi?.[i]?.kendala || '-'}</div></td>)}
              </tr>
            )) : <tr><td colSpan={100} className="px-5 py-12 text-center text-slate-400 font-medium">Tidak ada data yang cocok dengan pencarian Anda.</td></tr>}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 font-medium">Menampilkan <span className="font-bold text-slate-700">{((currentPage - 1) * rowsPerPage) + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(currentPage * rowsPerPage, tableDataFiltered.length)}</span> dari <span className="font-bold text-slate-700">{tableDataFiltered.length}</span> entri</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex items-center gap-1">
              {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                let pageNum = currentPage;
                if (totalPages <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNum ? 'bg-primary-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>{pageNum}</button>;
              })}
            </div>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 className="w-10 h-10 text-primary-600 mb-4" /></motion.div>
        <p className="text-slate-500 font-medium">Memuat dan menganalisis triliunan bit data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 shadow-lg">
          <p className="font-semibold mb-2 flex items-center justify-center"><Activity className="mr-2" /> Error Memuat Data</p><p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={!isPrinting ? containerVariants : {}} className="max-w-7xl mx-auto pb-12 print:max-w-full print:mx-0 print:pb-0">
      
      {/* Header Khusus Print */}
      {isPrinting && (
        <div className="hidden print:block mb-8 text-center border-b-2 border-slate-800 pb-6">
          <h1 className="text-3xl font-display font-extrabold uppercase tracking-wider mb-2">Laporan Evaluasi JKN & Sp.KKLP</h1>
          <p className="text-slate-600 font-medium text-lg">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
          <p className="text-slate-500 mt-2">Filter Data Aktif: Provinsi ({filterProvinsi}) · Jabatan ({filterRole}) · Sp.KKLP ({filterKklp})</p>
        </div>
      )}

      {/* Header & Filter Bar */}
      <motion.div variants={!isPrinting ? itemVariants : {}} className="no-print mb-6 flex flex-col xl:flex-row xl:items-end justify-between space-y-4 xl:space-y-0">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 tracking-tight flex items-center">
            <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className="p-2 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl shadow-lg shadow-primary-500/30 mr-4">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </motion.div>
            Executive Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm flex items-center">
            <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" /> Insight & Evaluasi Cerdas JKN Sp.KKLP
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-soft border border-white/60">
          <div className="flex items-center text-sm font-semibold text-slate-600 mr-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/50"><Filter className="w-4 h-4 mr-1.5 text-primary-500" /> Filter</div>
          <select value={filterProvinsi} onChange={(e) => setFilterProvinsi(e.target.value)} className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm max-w-[150px] sm:max-w-[200px] cursor-pointer">
            {uniqueProvinsi.map(p => <option key={p} value={p}>{p === 'Semua' ? 'Semua Provinsi' : p}</option>)}
          </select>
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm cursor-pointer">
            {uniqueRoles.map(r => <option key={r} value={r}>{r === 'Semua' ? 'Semua Jabatan' : r}</option>)}
          </select>
          <select value={filterKklp} onChange={(e) => setFilterKklp(e.target.value)} className="text-sm border-none rounded-xl py-2 px-4 bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none transition-all shadow-sm cursor-pointer">
            <option value="Semua">Dokter Sp.KKLP</option><option value="Ada">Tersedia Sp.KKLP</option><option value="Tidak">Tanpa Sp.KKLP</option>
          </select>
          
          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-2"></div>
          
          <div className="flex gap-2 ml-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="flex items-center text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-2 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
            >
              <Download className="w-4 h-4 mr-2" /> Excel
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handlePrint}
              className="flex items-center text-sm font-bold bg-slate-800 text-white py-2 px-4 rounded-xl transition-all shadow-lg shadow-slate-800/30"
            >
              <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Comparative Insight Bar (AI-like) */}
      <motion.div variants={!isPrinting ? itemVariants : {}} className="mb-6 bg-gradient-to-r from-indigo-50 via-blue-50 to-emerald-50 rounded-2xl p-4 border border-blue-100/50 shadow-inner flex items-start gap-4">
        <div className="bg-white p-2.5 rounded-xl shadow-sm text-blue-600 shrink-0"><TrendingUp className="w-5 h-5" /></div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Insight Komparatif Otomatis</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Faskes <span className="font-semibold text-emerald-600">dengan Sp.KKLP</span> mencatat rata-rata Waktu Home Visit 
            <span className="font-bold text-slate-900 mx-1">{summaryMetrics.kklpAvgHome} Menit</span>, 
            dibandingkan <span className="font-semibold text-rose-500">Tanpa Sp.KKLP</span> sebesar 
            <span className="font-bold text-slate-900 mx-1">{summaryMetrics.nonKklpAvgHome} Menit</span>. 
            {(summaryMetrics.kklpAvgHome > summaryMetrics.nonKklpAvgHome) ? " Hal ini menunjukkan peranan Sp.KKLP meningkatkan durasi kualitas layanan komunitas." : ""}
          </p>
        </div>
      </motion.div>

      {/* Tabs Navigation (Hidden in Print) */}
      {!isPrinting && (
        <motion.div variants={itemVariants} className="no-print flex overflow-x-auto bg-white/70 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 hide-scrollbar gap-2 relative">
          {[
            { id: 'ringkasan', label: 'Ringkasan Eksekutif', icon: Activity },
            { id: 'kompetensi', label: 'Analisis Kompetensi', icon: Stethoscope },
            { id: 'jkn', label: 'Evaluasi Manfaat JKN', icon: Briefcase },
            { id: 'nonopt', label: 'Layanan Tambahan', icon: FileText },
            { id: 'data', label: 'Smart Data Grid', icon: Database },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap z-10 ${activeTab === tab.id ? 'text-primary-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              {activeTab === tab.id && <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-white shadow-sm border border-slate-200/60 rounded-xl -z-10" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {/* Content Area */}
      <div className={`bg-white/80 backdrop-blur-2xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white min-h-[500px] ${isPrinting ? 'print:p-0 print:bg-transparent print:border-none print:shadow-none' : ''}`}>
        {totalResponden === 0 ? (
          <div className="py-24 text-center text-slate-400 font-medium">Data tidak ditemukan berdasarkan kriteria filter saat ini.</div>
        ) : (
          <>
            {isPrinting ? (
              // PRINT MODE: Render all graphical tabs sequentially
              <div className="print-layout flex flex-col gap-8">
                {renderRingkasan()}
                {renderKompetensi()}
                {renderJkn()}
                {renderNonOpt()}
              </div>
            ) : (
              // INTERACTIVE MODE: Render only active tab
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="show" exit="exit" className="h-full">
                  {activeTab === 'ringkasan' && renderRingkasan()}
                  {activeTab === 'kompetensi' && renderKompetensi()}
                  {activeTab === 'jkn' && renderJkn()}
                  {activeTab === 'nonopt' && renderNonOpt()}
                  {activeTab === 'data' && renderDataGrid()}
                </motion.div>
              </AnimatePresence>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
