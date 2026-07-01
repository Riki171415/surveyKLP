import React, { useState, useEffect, useMemo, useTransition } from 'react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import XlsxPopulate from 'xlsx-populate';
import { motion, AnimatePresence } from 'framer-motion';
import { penyakitPasienBulanan } from './SurveyForm';
import { id as localeID } from 'date-fns/locale';
import { format, parseISO } from 'date-fns';
import { 
  Users, Activity, HeartPulse, Stethoscope, AlertTriangle, 
  MessageSquare, Database, Printer, Download, Filter, Home, ShieldAlert,
  Search, ChevronLeft, ChevronRight, FileSearch, Copy
} from 'lucide-react';

import DashboardProfil from './dashboards/DashboardProfil';
import DashboardPRB from './dashboards/DashboardPRB';
import DashboardMonitoringPRB from './dashboards/DashboardMonitoringPRB';
import DashboardHomeCare from './dashboards/DashboardHomeCare';
import DashboardPaliatif from './dashboards/DashboardPaliatif';
import DashboardNonOptimal from './dashboards/DashboardNonOptimal';
import DashboardSpKKLP from './dashboards/DashboardSpKKLP';
import DashboardImpactSpKKLP from './dashboards/DashboardImpactSpKKLP';
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
  const [isExportingAll, setIsExportingAll] = useState(false);

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

    // Kolom indeks numerik (0-based, setelah header) yang bisa dihitung rata-ratanya
    // Indeks: 11=dok.umum, 12=dok.gigi, 13=waktuPoli, 14=waktuHV, 15=bebanDlm, 16=bebanLuar, + pasien bulanan (mulai indeks 20)
    const numericColIndices = [11, 12, 13, 14, 15, 16, ...penyakitPasienBulanan.map((_, i) => 20 + i)];

    const rows = filteredData.map((row, index) => {
      return [
        index + 1, new Date(row.created_at).toLocaleString('id-ID'), row.provinsi || '', row.kab_kota || '', row.fktp_name || '', row.kode_faskes || '', row.nama_responden || '', row.role || '', row.doc_kklp || 'Tidak', row.spkklp_status || '', row.spkklp_obat_khusus || '',
        row.doc_umum !== undefined && row.doc_umum !== '' ? Number(row.doc_umum) : '',
        row.doc_gigi !== undefined && row.doc_gigi !== '' ? Number(row.doc_gigi) : '',
        row.time_in_poli !== undefined && row.time_in_poli !== '' ? Number(row.time_in_poli) : '',
        row.time_home_visit !== undefined && row.time_home_visit !== '' ? Number(row.time_home_visit) : '',
        row.prop_in_fktp !== undefined && row.prop_in_fktp !== '' ? Number(row.prop_in_fktp) : '',
        row.prop_out_fktp !== undefined && row.prop_out_fktp !== '' ? Number(row.prop_out_fktp) : '',
        row.prb?.rutinKunjungan || '', row.home_care?.kolaborasi || '', row.paliatif?.kolaborasi || '',
        ...penyakitPasienBulanan.map(p => {
          const val = row.data_pasien_bulanan?.[p.id];
          return val !== undefined && val !== '' ? Number(val) : '';
        })
      ];
    });

    // Hitung baris rata-rata untuk kolom numerik
    const avgRow = headers.map((_, colIdx) => {
      if (colIdx === 0) return 'RATA-RATA';
      if (!numericColIndices.includes(colIdx)) return '';
      const vals = rows.map(r => r[colIdx]).filter(v => v !== '' && !isNaN(Number(v))).map(Number);
      if (vals.length === 0) return '';
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return Math.round(avg * 100) / 100;
    });

    // Tambahkan baris pemisah dan rata-rata
    const separatorRow = headers.map((_, i) => i === 0 ? '---' : '');
    const allRows = [...rows, separatorRow, avgRow];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...allRows]);

    // Style baris rata-rata (baris terakhir) - highlight kuning
    const avgRowIndex = allRows.length + 1; // +1 karena header di baris 1
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: avgRowIndex, c: colIdx });
      if (!worksheet[cellAddress]) worksheet[cellAddress] = { v: '', t: 's' };
      worksheet[cellAddress].s = {
        fill: { fgColor: { rgb: 'FFF9C4' }, patternType: 'solid' },
        font: { bold: true },
        border: { top: { style: 'thin' }, bottom: { style: 'thin' } }
      };
    });

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

    // Kolom numerik DPM: pasien bulanan mulai dari indeks 19
    const dpmNumericColIndices = [...penyakitPasienBulanan.map((_, i) => 19 + i)];

    const rows = dpmData.map((row, index) => {
      const d = row.dpm || {};
      return [
        index + 1, new Date(row.created_at).toLocaleString('id-ID'), row.provinsi || '', row.kab_kota || '', row.fktp_name || '', row.nama_responden || '',
        d.karakteristik?.lamaPraktik || '', d.karakteristik?.jumlahKunjungan || '', d.karakteristik?.kelompokUmur || '', d.karakteristik?.statusPeserta || '',
        Array.isArray(d.kasus?.masalahKesehatan) ? d.kasus.masalahKesehatan.join(', ') : (d.kasus?.masalahKesehatan || ''), 
        d.kasus?.persenKronis !== undefined && d.kasus?.persenKronis !== '' ? Number(d.kasus.persenKronis) : '',
        d.kasus?.persenKontrol !== undefined && d.kasus?.persenKontrol !== '' ? Number(d.kasus.persenKontrol) : '',
        d.kasus?.alasanRujukan || '',
        d.kontinuitas?.sistemPencatatan || '', d.kontinuitas?.jadwalkanKunjunganUlang || '', d.kontinuitas?.tindakLanjutTidakDatang || '',
        d.gambaran?.bentukPelayananKeluarga || '', Array.isArray(d.gambaran?.kegiatanDilakukan) ? d.gambaran.kegiatanDilakukan.join(', ') : (d.gambaran?.kegiatanDilakukan || ''),
        ...penyakitPasienBulanan.map(p => {
          const val = d.dataPasienBulanan?.[p.id];
          return val !== undefined && val !== '' ? Number(val) : '';
        })
      ];
    });

    // Hitung baris rata-rata untuk kolom numerik DPM
    const avgRow = headers.map((_, colIdx) => {
      if (colIdx === 0) return 'RATA-RATA';
      if (!dpmNumericColIndices.includes(colIdx)) return '';
      const vals = rows.map(r => r[colIdx]).filter(v => v !== '' && !isNaN(Number(v))).map(Number);
      if (vals.length === 0) return '';
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return Math.round(avg * 100) / 100;
    });

    const separatorRow = headers.map((_, i) => i === 0 ? '---' : '');
    const allRows = [...rows, separatorRow, avgRow];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...allRows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data DPM");
    XLSX.writeFile(workbook, `Data_DPM_KKLP_${new Date().getTime()}.xlsx`);
  };

  const exportAllNativeExcel = async () => {
    try {
      setIsExportingAll(true);
      
      const response = await fetch('/templates/dashboard_template_all.xlsx?v=' + new Date().getTime());
      if (!response.ok) throw new Error('File template gagal dimuat (HTTP ' + response.status + ')');
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = await XlsxPopulate.fromDataAsync(arrayBuffer);

      // --- CALCULATIONS FOR ALL SHEETS ---
      // 1. Profil
      let spkklpCount = 0;
      const roleCount = {}; 
      const fktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
      const regionalCount = {};

      filteredData.forEach(row => {
        const role = row.role || 'Lainnya'; 
        roleCount[role] = (roleCount[role] || 0) + 1;
        const fName = (row.fktp_name || '').toLowerCase();
        let type = row.jenis_faskes;
        if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
          if (role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
          else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
          else type = 'Klinik';
        }
        fktpTypeCount[type]++;
        const prov = row.provinsi || 'Lainnya';
        regionalCount[prov] = (regionalCount[prov] || 0) + 1;
      });

      const uniqueFktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
      uniqueFktpData.forEach(row => {
        if ((row.doc_kklp || 'Tidak') === 'Ya') spkklpCount++;
        const fName = (row.fktp_name || '').toLowerCase();
        let type = row.jenis_faskes;
        if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
          if (row.role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
          else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
          else type = 'Klinik';
        }
        uniqueFktpTypeCount[type]++;
      });

      const roleChartData = Object.keys(roleCount).map(k => ({ name: k, value: roleCount[k] })).sort((a,b) => b.value - a.value);
      const regionalData = Object.keys(regionalCount).map(k => ({ name: k, value: regionalCount[k] })).sort((a,b) => b.value - a.value).slice(0, 10);

      const sProf = workbook.sheet('Dashboard Profil');
      if (sProf) {
         sProf.cell('B4').value(filteredData.length);
         sProf.cell('B5').value(uniqueFktpData.length);
         sProf.cell('B6').value(Object.keys(regionalCount).length);
         sProf.cell('B7').value(spkklpCount);

         sProf.cell('B11').value(fktpTypeCount['Puskesmas']||0);
         sProf.cell('B12').value(fktpTypeCount['Klinik']||0);
         sProf.cell('B13').value(fktpTypeCount['Dokter Praktik Mandiri']||0);

         sProf.cell('B27').value(uniqueFktpTypeCount['Puskesmas']||0);
         sProf.cell('B28').value(uniqueFktpTypeCount['Klinik']||0);
         sProf.cell('B29').value(uniqueFktpTypeCount['Dokter Praktik Mandiri']||0);

         for(let i=0; i<15; i++) { sProf.cell(`A${43+i}`).value(''); sProf.cell(`B${43+i}`).value(''); }
         roleChartData.slice(0,15).forEach((item, i) => { sProf.cell(`A${43+i}`).value(item.name); sProf.cell(`B${43+i}`).value(item.value); });

         for(let i=0; i<10; i++) { sProf.cell(`A${61+i}`).value(''); sProf.cell(`B${61+i}`).value(''); }
         regionalData.forEach((item, i) => { sProf.cell(`A${61+i}`).value(item.name); sProf.cell(`B${61+i}`).value(item.value); });
      }

      // 2. PRB
      let totalJumlah = 0, totalRutin = 0, totalTidakBerkunjung = 0;
      const diagCounts = {'DM': 0, 'Hipertensi': 0, 'Jantung': 0, 'PPOK': 0, 'Asma': 0, 'Stroke': 0, 'Epilepsi': 0, 'Skizofrenia': 0, 'SLE': 0};
      filteredData.forEach(row => {
         const prb = row.prb || {};
         totalJumlah += Number(prb.jumlah) || 0;
         totalRutin += Number(prb.rutinKunjungan) || 0;
         totalTidakBerkunjung += Number(prb.tidakBerkunjung) || 0;
         diagCounts['DM'] += Number(prb.peserta_dm) || 0;
         diagCounts['Hipertensi'] += Number(prb.peserta_ht) || 0;
         diagCounts['Jantung'] += Number(prb.peserta_jantung) || 0;
         diagCounts['PPOK'] += Number(prb.peserta_ppok) || 0;
         diagCounts['Asma'] += Number(prb.peserta_asma) || 0;
         diagCounts['Stroke'] += Number(prb.peserta_stroke) || 0;
         diagCounts['Epilepsi'] += Number(prb.peserta_epilepsi) || 0;
         diagCounts['Skizofrenia'] += Number(prb.peserta_skizofrenia) || 0;
         diagCounts['SLE'] += Number(prb.peserta_sle) || 0;
      });
      const diagData = Object.keys(diagCounts).map(k => ({ name: k, value: diagCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);

      const sPrb = workbook.sheet('Dashboard PRB');
      if (sPrb) {
         sPrb.cell('B4').value(totalJumlah);
         sPrb.cell('B5').value(totalRutin);
         sPrb.cell('B6').value(totalTidakBerkunjung);
         
         const kepatuhan = totalJumlah > 0 ? (totalRutin / totalJumlah) * 100 : 0;
         sPrb.cell('B11').value(kepatuhan);
         sPrb.cell('B12').value(totalJumlah > 0 ? (totalTidakBerkunjung / totalJumlah) * 100 : 0);

         for(let i=0; i<10; i++) { sPrb.cell(`A${27+i}`).value(''); sPrb.cell(`B${27+i}`).value(''); }
         diagData.slice(0,10).forEach((item, i) => { sPrb.cell(`A${27+i}`).value(item.name); sPrb.cell(`B${27+i}`).value(item.value); });
      }

      // 3. Home Care
      let fktpWithHomeCare = 0;
      uniqueFktpData.forEach(row => { if ((row.home_care || {}).screening === 'Ya') fktpWithHomeCare++; });
      const kondisiCounts = {};
      filteredData.forEach(row => {
         const hc = row.home_care || {};
         if (hc.screening === 'Ya') {
            const kondisiObj = hc.kondisi || {};
            Object.keys(kondisiObj).forEach(k => { if(kondisiObj[k]) kondisiCounts[k] = (kondisiCounts[k]||0)+1; });
            ['Mandiri (independen)', 'Memerlukan bantuan sebagian', 'Memerlukan bantuan penuh', 'Tirah baring', 'Lainnya'].forEach(k => {
               if (hc[`kondisi_${k}`]) kondisiCounts[k] = (kondisiCounts[k]||0)+1;
            });
         }
      });
      const hcKondisiData = Object.keys(kondisiCounts).map(k => ({name:k, value:kondisiCounts[k]})).sort((a,b)=>b.value-a.value);
      
      const sHc = workbook.sheet('Dashboard Home Care');
      if (sHc) {
         sHc.cell('B4').value(uniqueFktpData.length > 0 ? (fktpWithHomeCare/uniqueFktpData.length)*100 : 0);
         for(let i=0; i<6; i++) { sHc.cell(`A${10+i}`).value(''); sHc.cell(`B${10+i}`).value(''); }
         hcKondisiData.slice(0,6).forEach((item, i) => { sHc.cell(`A${10+i}`).value(item.name); sHc.cell(`B${10+i}`).value(item.value); });
      }

      // 4. Paliatif
      let fktpWithPaliatif = 0;
      uniqueFktpData.forEach(row => { if ((row.paliatif || {}).screening === 'Ya') fktpWithPaliatif++; });
      const tujuanCounts = {};
      filteredData.forEach(row => {
         const pal = row.paliatif || {};
         if (pal.screening === 'Ya') {
            const tujuanObj = pal.tujuan || {};
            Object.keys(tujuanObj).forEach(k => { if(tujuanObj[k]) tujuanCounts[k] = (tujuanCounts[k]||0)+1; });
            ['Pengendalian nyeri', 'Pengendalian gejala', 'Dukungan psikososial', 'Edukasi keluarga/caregiver', 'Perawatan akhir kehidupan', 'Lainnya'].forEach(t => {
               if (pal[`tujuan_${t}`]) tujuanCounts[t] = (tujuanCounts[t]||0)+1;
            });
         }
      });
      const palTujuanData = Object.keys(tujuanCounts).map(k => ({name:k, value:tujuanCounts[k]})).sort((a,b)=>b.value-a.value);
      
      const sPal = workbook.sheet('Dashboard Paliatif');
      if (sPal) {
         sPal.cell('B4').value(uniqueFktpData.length > 0 ? (fktpWithPaliatif/uniqueFktpData.length)*100 : 0);
         for(let i=0; i<6; i++) { sPal.cell(`A${9+i}`).value(''); sPal.cell(`B${9+i}`).value(''); }
         palTujuanData.slice(0,6).forEach((item, i) => { sPal.cell(`A${9+i}`).value(item.name); sPal.cell(`B${9+i}`).value(item.value); });
      }

      // 5. Monitoring PRB
      let fktpWithMekanisme = 0;
      const mekCounts = { 'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 'Tidak ada mekanisme khusus': 0, 'Lainnya': 0 };
      uniqueFktpData.forEach(row => {
        const prb = row.prb || {};
        let hasMekanisme = false;
        Object.keys(mekCounts).forEach(mek => {
          if (prb[`mek_${mek}`]) { mekCounts[mek]++; if (mek !== 'Tidak ada mekanisme khusus') hasMekanisme = true; }
        });
        if (hasMekanisme) fktpWithMekanisme++;
      });
      const mekData = Object.keys(mekCounts).map(k => ({ name: k, value: mekCounts[k] })).sort((a,b) => b.value - a.value);
      
      const sMon = workbook.sheet('Dashboard Monitoring PRB');
      if (sMon) {
         sMon.cell('B4').value(uniqueFktpData.length > 0 ? (fktpWithMekanisme / uniqueFktpData.length) * 100 : 0);
         for(let i=0; i<5; i++) { sMon.cell(`A${9+i}`).value(''); sMon.cell(`B${9+i}`).value(''); }
         mekData.slice(0,5).forEach((item, i) => { sMon.cell(`A${9+i}`).value(item.name); sMon.cell(`B${9+i}`).value(item.value); });
      }

      // 6. Non-Optimal
      const nonOptimalServices = [ "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging", "Konsultasi perjalanan/travel medicine", "Manajemen pasien geriatri frailty", "Precision medicine/konseling genetik dasar", "Layanan promotif berbasis keluarga" ];
      let totalIdentified = 0;
      let totalJknYa = 0; let totalJknTidak = 0;
      filteredData.forEach(row => {
         const nonOpt = row.non_optimal || [];
         nonOptimalServices.forEach((service, idx) => {
            const item = nonOpt[idx] || {};
            if (item.masukJkn || item.skala) {
               totalIdentified++;
               if (item.masukJkn === 'Ya') totalJknYa++; else if (item.masukJkn === 'Tidak') totalJknTidak++;
            }
         });
      });
      const sNo = workbook.sheet('Dashboard Non-Optimal');
      if (sNo) {
         sNo.cell('B4').value(totalIdentified);
         sNo.cell('A9').value('Diusulkan Masuk JKN'); sNo.cell('B9').value(totalJknYa);
         sNo.cell('A10').value('Tidak Diusulkan'); sNo.cell('B10').value(totalJknTidak);
      }

      // 7. Sp.KKLP
      let spkklpYaFinal = 0;
      uniqueFktpData.forEach(row => { if (row.doc_kklp === 'Ya') spkklpYaFinal++; });
      const layananDirujukItems = [ "Kasus PTM tanpa komplikasi (DM, Hipertensi)", "Penanganan luka diabetes berat", "Tindakan bedah minor", "Pelayanan paliatif akhir hayat", "Gangguan jiwa ringan-sedang", "Penanganan fraktur tertutup sederhana" ];
      const dirujukCounts = {};
      const diagSpCounts = {};
      filteredData.forEach(row => {
         const rjk = row.layanan_dirujuk || {};
         Object.keys(rjk).forEach(k => {
            if (rjk[k] && k !== 'pengaruhPenurunanRujukan') {
               if (!isNaN(k) && k !== 'lainnya' && !layananDirujukItems[k]) return;
               const name = k === 'lainnya' ? rjk.lainnya : (isNaN(k) ? k : layananDirujukItems[k]);
               dirujukCounts[name] = (dirujukCounts[name] || 0) + 1;
            }
         });
      });
      uniqueFktpData.forEach(row => {
         const p = row.spkklp_poli || {};
         if (p.hasPoli === 'Ya' && p.diagnosis) {
            p.diagnosis.split(/[,;\n]+/).map(s => s.trim()).filter(s => s.length > 2).forEach(t => diagSpCounts[t] = (diagSpCounts[t] || 0) + 1);
         }
      });
      const dirujukData = Object.keys(dirujukCounts).map(k => ({ name: k, value: dirujukCounts[k] })).filter(d => isNaN(d.name) && d.name !== 'undefined').sort((a,b) => b.value - a.value);
      const diagSpData = Object.keys(diagSpCounts).map(k => ({ name: k, value: diagSpCounts[k] })).sort((a,b) => b.value - a.value);

      const sSp = workbook.sheet('Dashboard Sp.KKLP');
      if (sSp) {
         sSp.cell('B4').value(spkklpYaFinal);
         for(let i=0; i<5; i++) { sSp.cell(`A${9+i}`).value(''); sSp.cell(`B${9+i}`).value(''); }
         dirujukData.slice(0,5).forEach((item, i) => { sSp.cell(`A${9+i}`).value(item.name); sSp.cell(`B${9+i}`).value(item.value); });
         
         for(let i=0; i<10; i++) { sSp.cell(`A${27+i}`).value(''); sSp.cell(`B${27+i}`).value(''); }
         diagSpData.slice(0,10).forEach((item, i) => { sSp.cell(`A${27+i}`).value(item.name); sSp.cell(`B${27+i}`).value(item.value); });
      }

      // 8. Kendala
      let fktpWithKendala = 0;
      const kdCounts = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
      uniqueFktpData.forEach(row => {
         const k = row.spkklp_kendala || {};
         if (k.hasKendala === 'Ya') {
            fktpWithKendala++;
            Object.keys(kdCounts).forEach(key => { if (k[`kendala_${key}`]) kdCounts[key]++; });
         }
      });
      const kdData = Object.keys(kdCounts).map(k => ({ name: k, value: kdCounts[k] })).sort((a,b) => b.value - a.value);
      
      const sKd = workbook.sheet('Dashboard Kendala');
      if (sKd) {
         sKd.cell('B4').value(fktpWithKendala);
         for(let i=0; i<7; i++) { sKd.cell(`A${9+i}`).value(''); sKd.cell(`B${9+i}`).value(''); }
         kdData.slice(0,7).forEach((item, i) => { sKd.cell(`A${9+i}`).value(item.name); sKd.cell(`B${9+i}`).value(item.value); });
      }

      // 9. Kualitatif
      const sKual = workbook.sheet('Kualitatif');
      if (sKual) {
         filteredData.forEach((row, i) => {
            const w = row.wawancara || {};
            sKual.cell(`A${i+2}`).value(row.nama_responden || 'Anonim');
            sKual.cell(`B${i+2}`).value(row.fktp_name || 'Tidak diketahui');
            for(let j=0; j<8; j++) sKual.cell(i+2, j+3).value(w[j] || '');
         });
      }

      // 10. Keluhan
      const sKel = workbook.sheet('Keluhan');
      if (sKel) {
         filteredData.forEach((row, i) => {
            sKel.cell(`A${i+2}`).value(row.nama_responden || 'Anonim');
            sKel.cell(`B${i+2}`).value(row.fktp_name || 'Tidak diketahui');
            sKel.cell(`C${i+2}`).value(row.keluhan || '');
            sKel.cell(`D${i+2}`).value(row.solusi_keluhan || '');
         });
      }

      // 11. DPM
      const dpmRows = filteredData.filter(r => r.role === 'Dokter Praktik Mandiri' || (r.fktp_name||'').toLowerCase().includes('dpm'));
      const lamaCount = {}; const bebanCount = {};
      dpmRows.forEach(row => {
         const kar = (row.dpm || {}).karakteristik || {};
         if (kar.lamaPraktik) lamaCount[kar.lamaPraktik] = (lamaCount[kar.lamaPraktik] || 0) + 1;
         if (kar.jumlahKunjungan) bebanCount[kar.jumlahKunjungan] = (bebanCount[kar.jumlahKunjungan] || 0) + 1;
      });
      const sDpm = workbook.sheet('Dashboard DPM');
      if (sDpm) {
         const lamaKeys = Object.keys(lamaCount);
         for(let i=0; i<5; i++) {
             if (lamaKeys[i]) { sDpm.cell(`A${5+i}`).value(lamaKeys[i]); sDpm.cell(`B${5+i}`).value(lamaCount[lamaKeys[i]]); }
             else { sDpm.cell(`A${5+i}`).value(''); sDpm.cell(`B${5+i}`).value(0); }
         }
         const bebanKeys = Object.keys(bebanCount);
         for(let i=0; i<5; i++) {
             if (bebanKeys[i]) { sDpm.cell(`A${27+i}`).value(bebanKeys[i]); sDpm.cell(`B${27+i}`).value(bebanCount[bebanKeys[i]]); }
             else { sDpm.cell(`A${27+i}`).value(''); sDpm.cell(`B${27+i}`).value(0); }
         }
      }

      // 12. Pasien Bulanan
      const diseaseTotals = {};
      penyakitPasienBulanan.forEach(p => diseaseTotals[p.id] = 0);
      uniqueFktpData.forEach(row => {
         const isDpm = row.role === 'Dokter Praktik Mandiri';
         const sourceObj = isDpm ? row.dpm?.dataPasienBulanan : row.data_pasien_bulanan;
         if (sourceObj) {
            penyakitPasienBulanan.forEach(p => { diseaseTotals[p.id] += (Number(sourceObj[p.id]) || 0); });
         }
      });
      const sPb = workbook.sheet('Pasien Bulanan');
      if (sPb) {
         penyakitPasienBulanan.forEach((p, i) => {
             sPb.cell(`A${5+i}`).value(p.label);
             sPb.cell(`B${5+i}`).value(diseaseTotals[p.id] || 0);
         });
      }

      // 13. Raw Data — semua isian responden + baris rata-rata
      const sRaw = workbook.sheet('Raw Data');
      if (sRaw) {
         const rawHeaders = [
           'Waktu Submit', 'Nama Responden', 'Faskes', 'Provinsi', 'Kab/Kota', 'Jabatan',
           'Ada Sp.KKLP?', 'Status Sp.KKLP',
           'Total Dokter Umum', 'Total Dokter Gigi',
           'Waktu Poli (jam)', 'Waktu Home Visit (jam)',
           'Beban Dalam Gedung (%)', 'Beban Luar Gedung (%)',
           'Total Peserta PRB', 'Rutin Berkunjung PRB', 'Tidak Berkunjung PRB',
           'Kolaborasi Home Care', 'Kolaborasi Paliatif',
           ...penyakitPasienBulanan.map(p => `Pasien Bulanan - ${p.label}`)
         ];
         rawHeaders.forEach((h, i) => sRaw.cell(1, i+1).value(h));

         // Kolom numerik untuk rata-rata (indeks 0-based): 8=dok.umum, 9=dok.gigi, 10=wkt poli, 11=wkt hv, 12=beban dlm, 13=beban luar, 14=jml prb, 15=rutin, 16=tdk berkunjung, + pasien bulanan
         const rawNumericCols = [8, 9, 10, 11, 12, 13, 14, 15, 16, ...penyakitPasienBulanan.map((_, i) => 19 + i)];
         const rawDataMatrix = [];

         filteredData.forEach((row, i) => {
            const rowArr = [
              row.created_at ? new Date(row.created_at).toLocaleString('id-ID') : '',
              row.nama_responden || '',
              row.fktp_name || '',
              row.provinsi || '',
              row.kab_kota || '',
              row.role || '',
              row.doc_kklp || 'Tidak',
              row.spkklp_status || '',
              row.doc_umum !== undefined && row.doc_umum !== '' ? Number(row.doc_umum) : '',
              row.doc_gigi !== undefined && row.doc_gigi !== '' ? Number(row.doc_gigi) : '',
              row.time_in_poli !== undefined && row.time_in_poli !== '' ? Number(row.time_in_poli) : '',
              row.time_home_visit !== undefined && row.time_home_visit !== '' ? Number(row.time_home_visit) : '',
              row.prop_in_fktp !== undefined && row.prop_in_fktp !== '' ? Number(row.prop_in_fktp) : '',
              row.prop_out_fktp !== undefined && row.prop_out_fktp !== '' ? Number(row.prop_out_fktp) : '',
              row.prb?.jumlah !== undefined && row.prb?.jumlah !== '' ? Number(row.prb.jumlah) : '',
              row.prb?.rutinKunjungan !== undefined && row.prb?.rutinKunjungan !== '' ? Number(row.prb.rutinKunjungan) : '',
              row.prb?.tidakBerkunjung !== undefined && row.prb?.tidakBerkunjung !== '' ? Number(row.prb.tidakBerkunjung) : '',
              row.home_care?.kolaborasi || '',
              row.paliatif?.kolaborasi || '',
              ...penyakitPasienBulanan.map(p => {
                const val = row.data_pasien_bulanan?.[p.id];
                return val !== undefined && val !== '' ? Number(val) : '';
              })
            ];
            rawDataMatrix.push(rowArr);
            rawHeaders.forEach((_, j) => sRaw.cell(i+2, j+1).value(rowArr[j] !== undefined ? rowArr[j] : ''));
         });

         // Baris pemisah
         const sepRowIdx = filteredData.length + 2;
         sRaw.cell(sepRowIdx, 1).value('--- RATA-RATA ---');
         rawHeaders.forEach((_, j) => {
           if (j === 0) return;
           sRaw.cell(sepRowIdx, j+1).value('');
         });

         // Baris rata-rata
         const avgRowIdx = filteredData.length + 3;
         sRaw.cell(avgRowIdx, 1).value('RATA-RATA');
         rawHeaders.forEach((_, colIdx) => {
           if (colIdx === 0) return;
           if (!rawNumericCols.includes(colIdx)) {
             sRaw.cell(avgRowIdx, colIdx+1).value('');
             return;
           }
           const vals = rawDataMatrix.map(r => r[colIdx]).filter(v => v !== '' && !isNaN(Number(v))).map(Number);
           if (vals.length === 0) { sRaw.cell(avgRowIdx, colIdx+1).value(''); return; }
           const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
           sRaw.cell(avgRowIdx, colIdx+1).value(Math.round(avg * 100) / 100);
         });
      }

      const outBuffer = await workbook.outputAsync();
      const blob = new Blob([outBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Semua_Dashboard_Native_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export all native excel:', err);
      alert('Gagal mengekspor Excel Native: ' + err.message);
    } finally {
      setIsExportingAll(false);
    }
  };

  const copyPromptAllData = () => {
    try {
      const conciseData = filteredData.map(d => {
        const { id, created_at, updated_at, edit_history, ip_address, browser_info, ...importantData } = d;
        return importantData;
      });
      const prompt = `Anda adalah Ahli Analisis Data Kesehatan dan Kebijakan JKN. Berikut adalah data mentah (JSON) dari survei Kesiapan Fasilitas Kesehatan Tingkat Pertama (FKTP) terkait implementasi Spesialis Kedokteran Keluarga Layanan Primer (Sp.KKLP) di Indonesia.\nTotal data responden saat ini: ${totalResponden}.\n\nData JSON:\n${JSON.stringify(conciseData)}\n\nTugas Anda:\n1. Analisis demografi dan profil faskes.\n2. Evaluasi kesiapan dan implementasi Program Rujuk Balik (PRB).\n3. Evaluasi layanan Home Care dan Paliatif.\n4. Analisis masalah/kendala yang dihadapi faskes.\n5. Berikan kesimpulan strategis dan rekomendasi kebijakan untuk Kementerian Kesehatan.`;
      
      navigator.clipboard.writeText(prompt);
      alert('Prompt beserta seluruh data survei (format JSON) berhasil disalin!\\nSilakan Paste di ChatGPT (GPT-4o) atau Claude (Claude 3.5) untuk dianalisis.');
    } catch (err) {
      alert('Gagal menyalin data. Mungkin ukuran data terlalu besar untuk clipboard.');
    }
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
    { id: 'impact_spkklp', label: 'Impact Sp.KKLP', icon: Activity },
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
          <div className="flex flex-wrap justify-end gap-3">
            <button onClick={copyPromptAllData} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md active:scale-95 text-sm sm:text-base"><Copy className="w-5 h-5 mr-2" /> Copy Prompt AI (Semua Data)</button>
            <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-primary-600 transition shadow-sm hover:shadow-md hover:border-primary-200 active:scale-95 text-sm sm:text-base"><Printer className="w-5 h-5 mr-2" /> Cetak PDF (Semua Dashboard)</button>
            <button 
              onClick={exportAllNativeExcel} 
              disabled={isExportingAll}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white rounded-xl font-bold hover:from-purple-400 hover:to-fuchsia-500 transition shadow-md hover:shadow-lg hover:shadow-purple-500/30 active:scale-95 disabled:opacity-50 text-sm sm:text-base"
            >
              {isExportingAll ? (
                <span className="flex items-center"><svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Menyiapkan...</span>
              ) : (
                <span className="flex items-center"><Download className="w-5 h-5 mr-2" /> Unduh Semua Dashboard (Native Excel)</span>
              )}
            </button>
            <button onClick={exportToExcel} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 text-sm sm:text-base"><Download className="w-5 h-5 mr-2" /> Data Faskes</button>
            <button onClick={exportDpmToExcel} className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-400 hover:to-indigo-500 transition shadow-md hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 text-sm sm:text-base"><Download className="w-5 h-5 mr-2" /> Data DPM</button>
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
                <DashboardImpactSpKKLP filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={true} />
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
                  {activeTab === 'impact_spkklp' && <DashboardImpactSpKKLP filteredData={filteredData} uniqueFktpData={uniqueFktpData} COLORS={COLORS} isPrinting={false} />}
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
