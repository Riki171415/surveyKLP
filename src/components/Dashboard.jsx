import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { penyakitPasienBulanan } from './SurveyForm';
import { id as localeID } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { 
  Users, Activity, HeartPulse, Stethoscope, AlertTriangle, 
  MessageSquare, Database, Printer, Download, Filter, Home, ShieldAlert,
  Search, ChevronLeft, ChevronRight, FileSearch
} from 'lucide-react';

import DashboardProfil from './dashboards/DashboardProfil';
import DashboardPRB from './dashboards/DashboardPRB';
import DashboardMonitoringPRB from './dashboards/DashboardMonitoringPRB';
import DashboardHomeCare from './dashboards/DashboardHomeCare';
import DashboardPaliatif from './dashboards/DashboardPaliatif';
import DashboardNonOptimal from './dashboards/DashboardNonOptimal';
import DashboardSpKKLP from './dashboards/DashboardSpKKLP';
import DashboardKendala from './dashboards/DashboardKendala';
import DashboardKualitatif from './dashboards/DashboardKualitatif';
import DashboardDPM from './dashboards/DashboardDPM';
import DashboardPasienBulanan from './dashboards/DashboardPasienBulanan';
import DashboardKeluhanSentences from './dashboards/DashboardKeluhanSentences';

const COLORS = ['#00857A', '#00A68A', '#45B669', '#00B4D5', '#F28322', '#D8C700', '#D5DF00', '#f43f5e', '#a855f7', '#3b82f6'];

const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };
const tabVariants = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1, transition: { duration: 0.3 } }, exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } } };

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profil');
  const [isPending, startTransition] = useTransition();
  const [filterProvinsi, setFilterProvinsi] = useState('Semua');
  const [filterRole, setFilterRole] = useState('Semua');
  const [filterKklp, setFilterKklp] = useState('Semua');
  const [searchTable, setSearchTable] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleTabChange = (tabId) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      let surveysData = [];
      
      if (useSupabase) {
        const { data: surveys, error: sbError } = await supabase.from('surveys').select('*');
        if (sbError) throw sbError;
        surveysData = surveys || [];
      } else {
        const response = await fetch('/api/surveys');
        const json = await response.json();
        if (json.error) throw json.error;
        surveysData = json.data || [];
      }
      
      setData(surveysData);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data dari server lokal.");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchProv = filterProvinsi === 'Semua' || item.provinsi === filterProvinsi;
      const matchRole = filterRole === 'Semua' || item.role === filterRole;
      const matchKklp = filterKklp === 'Semua' || item.doc_kklp === filterKklp;
      return matchProv && matchRole && matchKklp;
    });
  }, [data, filterProvinsi, filterRole, filterKklp]);

  const uniqueProvinsi = useMemo(() => [...new Set(data.map(item => item.provinsi).filter(Boolean))].sort(), [data]);
  const uniqueRoles = useMemo(() => [...new Set(data.map(item => item.role).filter(Boolean))].sort(), [data]);
  
  const uniqueFktpData = useMemo(() => {
    const map = new Map();
    filteredData.forEach(row => {
      const prov = row.provinsi || row.city || '';
      const city = row.kab_kota || row.city || '';
      const name = row.fktp_name?.toLowerCase()?.trim() || '';
      const id = row.kode_faskes || (name ? `${prov}-${city}-${name}` : row.id);
      if (!map.has(id)) {
        map.set(id, row);
      } else if (row.doc_kklp === 'Ya') {
        const existing = map.get(id);
        if (existing.doc_kklp !== 'Ya') {
          map.set(id, { ...existing, doc_kklp: 'Ya' });
        }
      }
    });
    return Array.from(map.values());
  }, [filteredData]);

  const totalResponden = filteredData.length;

  const exportToExcel = () => {
    const headers = [
      "No", "Tanggal Pengisian", "Provinsi", "Kabupaten/Kota", "Nama Puskesmas / Klinik", "Kode Faskes", "Nama Responden", "Jabatan", "Ada Sp.KKLP?", "Status Sp.KKLP", "Obat Khusus Sp.KKLP",
      "Total Dokter Umum", "Total Dokter Gigi", "Waktu Poli (jam)", "Waktu Home Visit (jam)", "Beban Dalam Gedung (%)", "Beban Luar Gedung (%)",
      "Kepatuhan PRB", "Kolaborasi Homecare", "Kolaborasi Paliatif",
      ...penyakitPasienBulanan.map(p => `Pasien_Bulanan_${p.label}`)
    ];
    const rows = filteredData.map((row, index) => {
      return [
        index + 1, new Date(row.created_at).toLocaleString('id-ID'), row.provinsi || '', row.kab_kota || '', row.fktp_name || '', row.kode_faskes || '', row.nama_responden || '', row.role || '', row.doc_kklp || 'Tidak', row.spkklp_status || '', row.spkklp_obat_khusus || '',
        row.doc_umum || '', row.doc_gigi || '', row.time_in_poli || '', row.time_home_visit || '', row.prop_in_fktp || '', row.prop_out_fktp || '',
        row.prb?.rutinKunjungan || '', row.home_care?.kolaborasi || '', row.paliatif?.kolaborasi || '',
        ...penyakitPasienBulanan.map(p => row.data_pasien_bulanan?.[p.id] || '')
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Terfilter");
    XLSX.writeFile(workbook, `Data_Dashboard_KKLP_${new Date().getTime()}.xlsx`);
  };

  const exportDpmToExcel = () => {
    const dpmData = filteredData.filter(row => row.role === 'Dokter Praktik Mandiri' || row.dpm);
    if (dpmData.length === 0) {
      alert("Tidak ada data DPM untuk diekspor pada filter ini.");
      return;
    }
    const headers = [
      "No", "Tanggal Pengisian", "Provinsi", "Kabupaten/Kota", "Nama Praktik", "Nama Dokter", 
      "Lama Praktik", "Kunjungan/Hari", "Kelompok Umur", "Status Kepesertaan",
      "Masalah Kesehatan Terbanyak", "Proporsi Kronis", "Proporsi Kontrol", "Alasan Rujukan",
      "Sistem Pencatatan", "Jadwal Kunjungan Ulang", "Tindak Lanjut Tdk Datang",
      "Bentuk Pelayanan Keluarga", "Kegiatan Dilakukan",
      ...penyakitPasienBulanan.map(p => `DPM_Pasien_Bulanan_${p.label}`)
    ];
    const rows = dpmData.map((row, index) => {
      const d = row.dpm || {};
      return [
        index + 1, new Date(row.created_at).toLocaleString('id-ID'), row.provinsi || '', row.kab_kota || '', row.fktp_name || '', row.nama_responden || '',
        d.karakteristik?.lamaPraktik || '', d.karakteristik?.jumlahKunjungan || '', d.karakteristik?.kelompokUmur || '', d.karakteristik?.statusPeserta || '',
        Array.isArray(d.kasus?.masalahKesehatan) ? d.kasus.masalahKesehatan.join(', ') : (d.kasus?.masalahKesehatan || ''), 
        d.kasus?.persenKronis || '', d.kasus?.persenKontrol || '', d.kasus?.alasanRujukan || '',
        d.kontinuitas?.sistemPencatatan || '', d.kontinuitas?.jadwalkanKunjunganUlang || '', d.kontinuitas?.tindakLanjutTidakDatang || '',
        d.gambaran?.bentukPelayananKeluarga || '', Array.isArray(d.gambaran?.kegiatanDilakukan) ? d.gambaran.kegiatanDilakukan.join(', ') : (d.gambaran?.kegiatanDilakukan || ''),
        ...penyakitPasienBulanan.map(p => d.dataPasienBulanan?.[p.id] || '')
      ];
    });
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data DPM");
    XLSX.writeFile(workbook, `Data_DPM_KKLP_${new Date().getTime()}.xlsx`);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => { window.print(); setIsPrinting(false); }, 500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4 shadow-lg shadow-primary-500/20"></div>
        <p className="text-slate-600 font-medium animate-pulse text-lg">Memuat data dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-rose-50 border border-rose-200 p-8 rounded-3xl max-w-md text-center shadow-lg shadow-rose-500/10">
          <AlertTriangle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <p className="text-rose-700 font-bold text-lg mb-2">Gagal Memuat Data</p>
          <p className="text-rose-600 mb-6">{error}</p>
          <button onClick={fetchData} className="px-6 py-2.5 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition shadow-md hover:shadow-lg hover:shadow-rose-500/30">Coba Lagi</button>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: 'profil', label: 'Profil', icon: Users },
    { id: 'prb', label: 'PRB', icon: Activity },
    { id: 'mon_prb', label: 'Monitoring PRB', icon: FileSearch },
    { id: 'homecare', label: 'Home Care', icon: Home },
    { id: 'paliatif', label: 'Paliatif', icon: HeartPulse },
    { id: 'nonopt', label: 'Non-Optimal', icon: ShieldAlert },
    { id: 'spkklp', label: 'Peran Sp.KKLP', icon: Stethoscope },
    { id: 'kendala', label: 'Kendala JKN', icon: AlertTriangle },
    { id: 'kualitatif', label: 'Kualitatif (NVIVO)', icon: MessageSquare },
    { id: 'keluhan_kalimat', label: 'Analisis Keluhan', icon: Filter },
    { id: 'dpm', label: 'DPM', icon: Printer },
    { id: 'pasien_bulanan', label: 'Pasien Bulanan', icon: Users },
    { id: 'data', label: 'Raw Data', icon: Database },
  ];

  const renderDataGrid = () => {
    const filterBySearch = (item) => {
      if (!searchTable) return true;
      const term = searchTable.toLowerCase();
      return (item.provinsi || '').toLowerCase().includes(term) || (item.fktp_name || '').toLowerCase().includes(term) || (item.kode_faskes || '').toLowerCase().includes(term);
    };
    const tableData = filteredData.filter(filterBySearch);
    const totalPages = Math.ceil(tableData.length / rowsPerPage);
    const displayedData = tableData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-800 flex items-center"><Database className="w-6 h-6 mr-2 text-primary-600" /> Data Grid</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" />
            <input type="text" placeholder="Cari Puskesmas / Klinik/Provinsi..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" value={searchTable} onChange={(e) => setSearchTable(e.target.value)} />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-700">Puskesmas / Klinik</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Provinsi</th>
                  <th className="px-6 py-4 font-bold text-slate-700">Jabatan</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Sp.KKLP</th>
                  <th className="px-6 py-4 font-bold text-slate-700 text-center">Waktu Submit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedData.length > 0 ? displayedData.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4"><p className="font-semibold text-slate-800">{row.fktp_name}</p><p className="text-xs text-slate-400">{row.kode_faskes}</p></td>
                    <td className="px-6 py-4 text-slate-600">{row.provinsi || row.city}</td>
                    <td className="px-6 py-4"><span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200">{row.role}</span></td>
                    <td className="px-6 py-4 text-center">{row.doc_kklp === 'Ya' ? <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">Ya</span> : <span className="inline-block px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">Tidak</span>}</td>
                    <td className="px-6 py-4 text-center text-slate-500 text-xs">
                      <div className="flex flex-col items-center gap-1">
                        <span title={`Waktu Submit: ${new Date(row.created_at).toLocaleString('id-ID')}`}>
                          {new Date(row.updated_at || row.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                        </span>
                        {(row.updated_at || (row.edit_history && row.edit_history.length > 0)) && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            Diedit
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (<tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 font-medium">Tidak ada data ditemukan</td></tr>)}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-500">Menampilkan <span className="font-semibold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, tableData.length)}</span> dari <span className="font-semibold text-slate-700">{tableData.length}</span> data</div>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-[1400px] mx-auto min-h-screen pb-12 print:p-0 print:m-0 print:max-w-none print:bg-white">
      {/* Header section */}
      <div className="mb-8 no-print pt-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-bold tracking-wide mb-3 border border-primary-100 shadow-sm"><Activity className="w-4 h-4" /><span>DASHBOARD ANALITIK</span></div>
            <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">Analisis Data <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">Kesiapan Puskesmas / Klinik</span></h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">Monitoring capaian dan evaluasi implementasi Sp.KKLP</p>
          </div>
          <div className="flex gap-3">
            <button onClick={handlePrint} className="flex items-center px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-primary-600 transition shadow-sm hover:shadow-md hover:border-primary-200 active:scale-95"><Printer className="w-5 h-5 mr-2" /> Cetak</button>
            <button onClick={exportToExcel} className="flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95"><Download className="w-5 h-5 mr-2" /> Data Puskesmas / Klinik</button>
            <button onClick={exportDpmToExcel} className="flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-400 hover:to-indigo-500 transition shadow-md hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"><Download className="w-5 h-5 mr-2" /> Data DPM</button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white/70 backdrop-blur-xl p-5 md:p-6 rounded-3xl shadow-soft-lg border border-white mb-8 no-print relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100/40 to-transparent rounded-bl-full -z-10 pointer-events-none"></div>
        <div className="flex items-center space-x-3 mb-5">
          <div className="p-2 bg-primary-100 text-primary-600 rounded-xl shadow-inner"><Filter className="w-5 h-5" /></div>
          <h2 className="text-lg font-bold text-slate-800">Filter Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">Regional / Provinsi</label><select className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none shadow-sm hover:border-primary-300 transition-colors" value={filterProvinsi} onChange={(e) => setFilterProvinsi(e.target.value)}><option value="Semua">Nasional (Semua Provinsi)</option>{uniqueProvinsi.map(prov => <option key={prov} value={prov}>{prov}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">Jabatan Responden</label><select className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none shadow-sm hover:border-primary-300 transition-colors" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}><option value="Semua">Semua Jabatan</option>{uniqueRoles.map(role => <option key={role} value={role}>{role}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">Ketersediaan Sp.KKLP</label><select className="w-full px-4 py-3 border border-slate-200 bg-white rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none shadow-sm hover:border-primary-300 transition-colors" value={filterKklp} onChange={(e) => setFilterKklp(e.target.value)}><option value="Semua">Semua Status</option><option value="Ya">Ada Sp.KKLP</option><option value="Tidak">Tidak Ada Sp.KKLP</option></select></div>
        </div>
      </div>

      {/* Tabs Navigation */}
      {!isPrinting && (
        <motion.div variants={itemVariants} className="no-print flex flex-wrap bg-white/70 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 gap-2 relative">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => handleTabChange(tab.id)} disabled={isPending} className={`relative flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all z-10 ${activeTab === tab.id ? 'text-primary-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'} ${isPending ? 'opacity-70 cursor-wait' : ''}`}>
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
              <div className="print-layout flex flex-col gap-12">
                <DashboardProfil filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardPRB filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardMonitoringPRB filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardHomeCare filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardPaliatif filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardNonOptimal filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardSpKKLP filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardKendala filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardKualitatif filteredData={filteredData} uniqueFktpData={uniqueFktpData} isPrinting={true} />
                <DashboardKeluhanSentences filteredData={filteredData} isPrinting={true} />
                <DashboardDPM filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
                <DashboardPasienBulanan filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
              </div>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="show" exit="exit" className={`h-full transition-opacity duration-300 ${isPending ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                  {activeTab === 'profil' && <DashboardProfil filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'prb' && <DashboardPRB filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'mon_prb' && <DashboardMonitoringPRB filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'homecare' && <DashboardHomeCare filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'paliatif' && <DashboardPaliatif filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'nonopt' && <DashboardNonOptimal filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'spkklp' && <DashboardSpKKLP filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'kendala' && <DashboardKendala filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'kualitatif' && <DashboardKualitatif filteredData={filteredData} uniqueFktpData={uniqueFktpData} isPrinting={false} />}
                  {activeTab === 'keluhan_kalimat' && <DashboardKeluhanSentences filteredData={filteredData} isPrinting={false} />}
                  {activeTab === 'dpm' && <DashboardDPM filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
                  {activeTab === 'pasien_bulanan' && <DashboardPasienBulanan filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
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
