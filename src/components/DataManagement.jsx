import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Edit, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { useAuth } from './AuthContext';
import { penyakitPasienBulanan, layananDirujukItems, layananBelumBerjalanItems, interviewQuestionsWithSpkklp, interviewQuestionsWithoutSpkklp, jknBenefits, nonOptimalServices } from './SurveyForm';
import SurveyDetailModal from './SurveyDetailModal';

// ─── Data referensi (sama dengan SurveyForm) ───────────────────────────────

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks", "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)", "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif", "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];


const relevansiItems = [
  "Pengelolaan pasien dengan kondisi kronis dan multimorbiditas.",
  "Pendampingan pasien kronis melalui home care.",
  "Pelayanan paliatif di tingkat primer.",
  "Edukasi kelompok pasien kronis.",
  "Pendampingan keluarga pasien kronis.",
  "Pemantauan berkelanjutan pasien kronis di komunitas.",
  "Monitoring komunitas risiko tinggi penyakit kronis.",
  "Penguatan Program Rujuk Balik (PRB).",
  "Koordinasi pelayanan lintas profesi dan kader kesehatan.",
  "Pembinaan Posbindu PTM.",
  "Pengelolaan pasien geriatri dengan kebutuhan pelayanan jangka panjang."
];

const peranSpkklpItems = [
  "Kehadiran Sp.KKLP meningkatkan kualitas layanan promotif-preventif di FKTP saya.",
  "Sp.KKLP mampu mengisi celah layanan yang selama ini tidak tertangani dokter umum (misal: konseling berhenti merokok, manajemen obesitas).",
  "Sp.KKLP membuat proses rujukan menjadi lebih tepat sasaran.",
  "Layanan yang sebelumnya tidak terakomodasi JKN dapat dioptimalkan dengan keterlibatan Sp.KKLP.",
  "Secara keseluruhan, implementasi PMK 19/2024 menjadikan paket manfaat JKN lebih efektif dan efisien."
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const scaleBadge = (s) => {
  const n = Number(s);
  if (n === 1) return 'bg-red-100 text-red-700';
  if (n === 2) return 'bg-orange-100 text-orange-700';
  if (n === 3) return 'bg-blue-100 text-blue-700';
  if (n === 4) return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-100 text-slate-500';
};

const jknBadge = (val) => {
  if (val === 'Ya') return 'bg-emerald-100 text-emerald-700';
  if (val === 'Tidak') return 'bg-rose-100 text-rose-700';
  return 'bg-slate-100 text-slate-500';
};

const statusBadge = (s) => {
  if (s === 'sudah') return 'bg-emerald-100 text-emerald-700';
  if (s === 'belum') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-500';
};

const roleBadge = (role = '') => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'bg-purple-100 text-purple-800';
  if (r.includes('survey')) return 'bg-blue-100 text-blue-800';
  return 'bg-emerald-100 text-emerald-800';
};

// ─── Komponen kecil ─────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="h-4 w-1.5 bg-primary-500 rounded-full"></div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</h4>
      <div className="flex-1 h-px bg-slate-100"></div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="bg-slate-50/50 border border-slate-100/80 p-3.5 rounded-xl hover:bg-white hover:border-primary-200 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition-all duration-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">{label}</span>
      <span className="text-sm font-semibold text-slate-800 leading-snug break-words">{value ?? '-'}</span>
    </div>
  );
}

// ─── Komponen utama ─────────────────────────────────────────────────────────
export default function DataManagement() {
  const { user } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      let surveysData = [];
      if (useSupabase) {
        const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        surveysData = data || [];
      } else {
        const response = await fetch('/api/surveys');
        const json = await response.json();
        if (json.error) throw json.error;
        surveysData = json.data || [];
      }
      setSurveys(surveysData);
    } catch { alert('Gagal memuat data.'); }
    finally { setLoading(false); }
  };

  const deleteSurvey = async (id, name) => {
    if (!window.confirm(`Hapus data survey dari "${name}"?`)) return;
    try {
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      
      if (useSupabase) {
        const { error } = await supabase.from('surveys').delete().eq('id', id);
        if (error) throw error;
      } else {
        const response = await fetch(`/api/surveys/${id}`, { method: 'DELETE' });
        const json = await response.json();
        if (json.error) throw json.error;
      }
      
      setSurveys(prev => prev.filter(item => item.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { alert('Gagal menghapus data.'); }
  };

  
  const filtered = surveys.filter(s =>
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provinsi || s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kab_kota || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);


  const handleDownloadExcel = () => {
    try {
      const flatData = surveys.map((row) => {
        // Flatten Identitas
        const base = {
          "Timestamp": new Date(row.created_at).toLocaleString('id-ID'),
          "Provinsi": row.provinsi || row.city || '-',
          "Kabupaten/Kota": row.kab_kota || '-',
          "Nama Faskes": row.fktp_name || '-',
          "Kode Faskes": row.kode_faskes || '-',
          "Nama Responden": row.nama_responden || '-',
          "Nomor WA": row.nomor_wa || '-',
          "Jabatan": row.role || '-',
          "Dokter Sp.KKLP": row.doc_kklp || '-'
        };

        // Flatten Survei DPM (A-E)
        if (row.role === 'Dokter Praktik Mandiri' && row.dpm) {
          const d = row.dpm;
          // A
          base["DPM_Lama Praktik"] = d.karakteristik?.lamaPraktik || '-';
          base["DPM_Rata-rata Kunjungan"] = d.karakteristik?.jumlahKunjungan || '-';
          base["DPM_Kelompok Umur"] = d.karakteristik?.kelompokUmur || '-';
          base["DPM_Status Kepesertaan"] = d.karakteristik?.statusPeserta || '-';

          // B
          base["DPM_Masalah Kesehatan"] = Array.isArray(d.kasus?.masalahKesehatan) ? d.kasus.masalahKesehatan.join(', ') : (d.kasus?.masalahKesehatan || '-');
          base["DPM_Masalah Lainnya"] = d.kasus?.masalahLainnya || '-';
          base["DPM_Persen Kasus Kronis"] = d.kasus?.persenKronis || '-';
          base["DPM_Persen Pasien Kontrol"] = d.kasus?.persenKontrol || '-';
          base["DPM_Alasan Rujukan"] = d.kasus?.alasanRujukan || '-';

          // C
          base["DPM_Tahu Keluarga Inti"] = d.pendekatan?.tahuKeluargaInti || '-';
          base["DPM_Menangani Keluarga Yg Sama"] = d.pendekatan?.menanganiKeluargaSama || '-';
          base["DPM_Tanya Kondisi Keluarga Lain"] = d.pendekatan?.tanyaKondisiKeluargaLain || '-';
          base["DPM_Aspek Digali"] = Array.isArray(d.pendekatan?.aspekDigali) ? d.pendekatan.aspekDigali.join(', ') : (d.pendekatan?.aspekDigali || '-');
          base["DPM_Pengaruh Keluarga pd Kasus"] = d.pendekatan?.pengaruhKeluargaKasus || '-';
          base["DPM_Contoh Masalah Keluarga"] = d.pendekatan?.contohMasalahKeluarga || '-';
          base["DPM_Contoh Masalah Lainnya"] = d.pendekatan?.contohMasalahLainnya || '-';

          // D
          base["DPM_Sistem Pencatatan"] = d.kontinuitas?.sistemPencatatan || '-';
          base["DPM_Jadwalkan Kunjungan Ulang"] = d.kontinuitas?.jadwalkanKunjunganUlang || '-';
          base["DPM_Tindak Lanjut Tdk Datang"] = d.kontinuitas?.tindakLanjutTidakDatang || '-';

          // E
          base["DPM_Kegiatan Dilakukan"] = Array.isArray(d.gambaran?.kegiatanDilakukan) ? d.gambaran.kegiatanDilakukan.join(', ') : (d.gambaran?.kegiatanDilakukan || '-');
          base["DPM_Bentuk Pelayanan Keluarga"] = d.gambaran?.bentukPelayananKeluarga || '-';
          base["DPM_Contoh Kasus Keluarga"] = d.gambaran?.contohKasusKeluarga || '-';
          base["DPM_Contoh Layanan Holistik"] = d.gambaran?.contohLayananHolistik || '-';

          // G. Data Pasien Bulanan
          penyakitPasienBulanan.forEach(p => {
            base[`DPM_Pasien_Bulanan_${p.label}`] = d.dataPasienBulanan?.[p.id] !== undefined ? d.dataPasienBulanan[p.id] : '-';
          });
        }

        // Khusus Dokter / SpKKLP
        if (row.role !== 'Dokter Praktik Mandiri' && (row.role === 'Dokter Umum' || row.role === 'Dokter Sp.KKLP')) {
          base["Waktu Rata-rata Poli (menit)"] = row.time_in_poli || '-';
          base["Waktu Rata-rata Home Visit (menit)"] = row.time_home_visit || '-';
          base["Proporsi Dalam Gedung (%)"] = row.prop_in_fktp || '-';
          base["Proporsi Luar Gedung (%)"] = row.prop_out_fktp || '-';

          kompetensiLayanan.forEach((komp, i) => {
            base[`Kompetensi_${i+1}`] = komp;
            base[`Kompetensi_Status_${i+1}`] = row.kompetensi?.[i]?.status || '-';
          });
        }

        if (row.role === 'Dokter Sp.KKLP') {
          base["SpKKLP Berpraktik"] = row.spkklp_berpraktik || '-';
          base["SpKKLP Poli_Sejak"] = row.spkklp_poli?.sejak || '-';
          base["SpKKLP Poli_Kunjungan/hari"] = row.spkklp_poli?.kunjungan || '-';
          base["SpKKLP Poli_Pembiayaan"] = row.spkklp_poli?.pembiayaan || '-';
          base["SpKKLP Poli_Diagnosis"] = row.spkklp_poli?.diagnosis || '-';
          base["SpKKLP Poli_Tindakan"] = row.spkklp_poli?.tindakan || '-';
        }

        if (row.role !== 'Dokter Praktik Mandiri') {
          // Data Pasien Bulanan
          penyakitPasienBulanan.forEach(p => {
            base[`Pasien_Bulanan_${p.label}`] = row.data_pasien_bulanan?.[p.id] !== undefined ? row.data_pasien_bulanan[p.id] : '-';
          });

          // Perspektif
          relevansiItems.forEach((rel, i) => {
            base[`Relevansi_Skala_${i+1}`] = row.relevansi_spkklp?.[i] || '-';
          });
          peranSpkklpItems.forEach((rel, i) => {
            base[`Peran_SpKKLP_Skala_${i+1}`] = row.peran_spkklp?.[i] || '-';
          });
          base["Pengaruh Penurunan Rujukan"] = row.layanan_dirujuk?.pengaruhPenurunanRujukan || '-';
          base["Layanan Sering Dirujuk"] = row.layanan_dirujuk ? Object.keys(row.layanan_dirujuk).filter(k => row.layanan_dirujuk[k] && k !== 'pengaruhPenurunanRujukan').map(k => layananDirujukItems[k] || k).join(', ') : '-';
          base["Alasan Dirujuk"] = row.alasan_dirujuk || '-';
          base["Layanan Belum Berjalan"] = row.layanan_belum_berjalan ? Object.keys(row.layanan_belum_berjalan).filter(k => row.layanan_belum_berjalan[k]).map(k => layananBelumBerjalanItems[k] || k).join(', ') : '-';

          // PRB
          const meks = [];
          if (row.prb) {
            Object.keys(row.prb).forEach(k => {
              if (k.startsWith('mek_') && row.prb[k]) meks.push(k.replace('mek_', ''));
            });
          }
          base["PRB_Mekanisme"] = meks.length > 0 ? meks.join(', ') : '-';
          base["PRB_Rata Rujukan ke FKRTL"] = row.prb?.rataRujukan || '-';
          base["PRB_Total Peserta"] = row.prb?.totalPeserta || '-';
          base["PRB_Kunjungan Rutin"] = row.prb?.kunjunganRutin || '-';
          base["PRB_Tidak Berkunjung"] = row.prb?.tidakBerkunjung || '-';
          base["PRB_Kasus_DM"] = row.prb?.kasus?.DM || '-';
          base["PRB_Kasus_Hipertensi"] = row.prb?.kasus?.Hipertensi || '-';
          base["PRB_Kasus_Jantung"] = row.prb?.kasus?.Jantung || '-';
          base["PRB_Kasus_PPOK"] = row.prb?.kasus?.PPOK || '-';
          base["PRB_Kasus_Asma"] = row.prb?.kasus?.Asma || '-';
          base["PRB_Kasus_Stroke"] = row.prb?.kasus?.Stroke || '-';
          base["PRB_Kasus_Epilepsi"] = row.prb?.kasus?.Epilepsi || '-';
          base["PRB_Kasus_Skizofrenia"] = row.prb?.kasus?.Skizofrenia || '-';
          base["PRB_Kasus_SLE"] = row.prb?.kasus?.SLE || '-';

          // JKN Benefits
          jknBenefits.forEach((jkn, i) => {
            base[`JKN_${i+1}_Skala`] = row.jkn?.[i]?.skala || '-';
            base[`JKN_${i+1}_Catatan`] = row.jkn?.[i]?.catatan || '-';
          });

          // Home Care
          base["HC_Melaksanakan"] = row.home_care?.screening || '-';
          if (row.home_care?.screening === 'Ya' || row.home_care?.screening === 'ya') {
            base["HC_Tenaga"] = row.home_care?.tenaga || '-';
            base["HC_Diagnosis"] = row.home_care?.diagnosis || '-';
            
            const hcKondisi = [];
            const hcJenis = [];
            if (row.home_care) {
               Object.keys(row.home_care).forEach(k => {
                 if (k.startsWith('kondisi_') && row.home_care[k]) hcKondisi.push(k.replace('kondisi_', ''));
                 if (k.startsWith('jenis_') && row.home_care[k]) hcJenis.push(k.replace('jenis_', ''));
               });
            }
            base["HC_Kondisi"] = hcKondisi.length > 0 ? hcKondisi.join(', ') : '-';
            base["HC_Jenis Layanan"] = hcJenis.length > 0 ? hcJenis.join(', ') : '-';

            base["HC_Jumlah Kunjungan"] = row.home_care?.jumlahKunjungan || '-';
            base["HC_Kolaborasi"] = row.home_care?.kolaborasi || '-';
            base["HC_Kepatuhan"] = row.home_care?.kepatuhan || '-';
            base["HC_Perbaikan"] = row.home_care?.perbaikan || '-';
          }

          // Paliatif
          base["Pal_Melaksanakan"] = row.paliatif?.screening || '-';
          if (row.paliatif?.screening === 'Ya' || row.paliatif?.screening === 'ya') {
            base["Pal_Tenaga"] = row.paliatif?.tenaga || '-';
            base["Pal_Diagnosis"] = row.paliatif?.diagnosis || '-';
            
            const palKondisi = [];
            const palTujuan = [];
            if (row.paliatif) {
               Object.keys(row.paliatif).forEach(k => {
                 if (k.startsWith('kondisi_') && row.paliatif[k]) palKondisi.push(k.replace('kondisi_', ''));
                 if (k.startsWith('tujuan_') && row.paliatif[k]) palTujuan.push(k.replace('tujuan_', ''));
               });
            }
            base["Pal_Kondisi"] = palKondisi.length > 0 ? palKondisi.join(', ') : '-';
            base["Pal_Tujuan"] = palTujuan.length > 0 ? palTujuan.join(', ') : '-';

            base["Pal_Terapi"] = row.paliatif?.terapi || '-';
            base["Pal_Kolaborasi"] = row.paliatif?.kolaborasi || '-';
            base["Pal_Kepatuhan"] = row.paliatif?.kepatuhan || '-';
            base["Pal_Perbaikan"] = row.paliatif?.perbaikan || '-';
          }

          // Non-Optimal
          nonOptimalServices.forEach((nonOpt, i) => {
            base[`NonOpt_${i+1}_MasukJKN`] = row.non_optimal?.[i]?.masukJkn || '-';
            base[`NonOpt_${i+1}_Skala`] = row.non_optimal?.[i]?.skala || '-';
            base[`NonOpt_${i+1}_Catatan`] = row.non_optimal?.[i]?.catatan || '-';
          });
        }

        // Wawancara / Pendalaman (8 Pertanyaan)
        [...Array(8)].forEach((_, i) => {
          base[`Wawancara_Q${i+1}`] = row.wawancara?.[i] || '-';
        });

        // Truncate to prevent Excel 32767 character limit crash
        Object.keys(base).forEach(key => {
          if (typeof base[key] === 'string' && base[key].length > 32700) {
            base[key] = base[key].substring(0, 32700) + '... [TRUNCATED]';
          }
        });

        return base;
      });

      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Survey");
      XLSX.writeFile(workbook, `Data_Survey_KKLP_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal membuat file Excel: ' + (err.message || err));
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Memuat Data Survey...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Data Survey</h1>
          <p className="text-slate-500 mt-1 text-sm">Klik baris data untuk melihat seluruh isian secara lengkap.</p>
        </div>
        <button
          onClick={handleDownloadExcel}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Excel All Data
        </button>
      </div>

      <div className="flex gap-5 items-start">

        {/* ══════════ TABEL KIRI ══════════ */}
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 transition-all duration-300 ${selected ? 'w-[42%]' : 'w-full'}`}>
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Puskesmas / Klinik atau Kota..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-xs"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">{surveys.length} data</span>
          </div>

          {filtered.length === 0
            ? <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data ditemukan.</div>
            : (
              <div className="overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {paginatedData.map(row => (
                  <div
                    key={row.id}
                    onClick={() => setSelected(selected?.id === row.id ? null : row)}
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200
                      ${selected?.id === row.id ? 'bg-primary-50/50 border-l-4 border-l-primary-500 shadow-sm' : 'border-l-4 border-l-transparent hover:bg-slate-50 hover:shadow-sm hover:border-l-slate-300'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate ${selected?.id === row.id ? 'text-primary-700' : 'text-slate-800'}`}>{row.fktp_name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{row.kab_kota || row.city || '-'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${roleBadge(row.role)}`}>{row.role}</span>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteSurvey(row.id, row.fktp_name)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Halaman {currentPage} dari {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded bg-white border border-slate-200 text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ══════════ MODAL DETAIL (sama dengan List Responden) ══════════ */}
        {selected && (
          <>
            <SurveyDetailModal selected={selected} onClose={() => setSelected(null)} />
            {/* Tombol aksi admin tampil di atas modal */}
            {user?.role === 'admin' && (
              <div className="fixed bottom-6 right-6 z-[200] flex gap-3">
                <button
                  onClick={() => { deleteSurvey(selected.id, selected.fktp_name); setSelected(null); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
                <button
                  onClick={() => navigate('/wawancara/form', { state: { surveyData: selected } })}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-xl transition-all hover:-translate-y-0.5"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
