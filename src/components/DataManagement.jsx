import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Edit, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient';

// ─── Data referensi (sama dengan SurveyForm) ───────────────────────────────
const jknBenefits = [
  "Pengelolaan Diabetes Melitus tanpa komplikasi", "Penyusunan care plan jangka panjang pasien kronik",
  "Manajemen pasien dengan multimorbiditas (DM + hipertensi + dislipidemia)", "Pemantauan kepatuhan terapi pasien kronik (penyakit tidak menular)",
  "Pemantauan kepatuhan terapi pasien AIDS, TB, Malaria", "Pelaksanaan Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi", "Deprescribing/pengurangan obat pada pasien polifarmasi"
];

const nonOptimalServices = [
  "Pelayanan lifestyle medicine", "Pelayanan wellness dan healthy aging",
  "Konsultasi perjalanan/travel medicine", "Manajemen pasien geriatri frailty", 
  "Precision medicine/konseling genetik dasar", "Layanan promotif berbasis keluarga"
];

const kompetensiLayanan = [
  "Manajemen pasien dengan multimorbiditas kompleks", "Pemeriksaan USG Dasar untuk penegakan diagnosis",
  "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)", "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
  "Home Care Klinis dengan intervensi medis komprehensif", "Pelayanan Paliatif Primer (manajemen nyeri/akhir hayat) di rumah",
  "Pemeriksaan Xray untuk penegakan diagnosis"
];

const interviewQuestions = [
  "Bagaimana pelaksanaan layanan penyakit kronik di Puskesmas / Klinik saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya?",
  "Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN?",
  "Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN Puskesmas / Klinik?",
  "Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB?",
  "Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di Puskesmas / Klinik?",
  "Menurut Anda, bentuk dukungan apa yang diperlukan agar Puskesmas / Klinik yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
];

const relevansiItems = [
  "Peran sebagai dokter di poli umum", "Poli / Layanan khusus penyakit tidak menular (PTM)",
  "Poli / layanan khusus Geriatri", "Poli / Layanan khusus Anak/MTBS",
  "Kegiatan Home Visit / Home Care", "Kepala Puskesmas / Klinik", "Penanggung Jawab Mutu / UKP"
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
  const r = role.toLowerCase();
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
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setSurveys(data || []);
    } catch { alert('Gagal memuat data.'); }
    finally { setLoading(false); }
  };

  const deleteSurvey = async (id, name) => {
    if (!window.confirm(`Hapus data survey dari "${name}"?`)) return;
    try {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;
      setSurveys(s => s.filter(x => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch { alert('Gagal menghapus data.'); }
  };

  const filtered = surveys.filter(s =>
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provinsi || s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kab_kota || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
      <p className="text-slate-500 font-medium">Memuat Data Survey...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Data Survey</h1>
        <p className="text-slate-500 mt-1 text-sm">Klik baris data untuk melihat seluruh isian secara lengkap.</p>
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
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-xs"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">{surveys.length} data</span>
          </div>

          {filtered.length === 0
            ? <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data ditemukan.</div>
            : (
              <div className="overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {filtered.map(row => (
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
                    <div className="flex gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteSurvey(row.id, row.fktp_name)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors shadow-sm" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* ══════════ PANEL DETAIL KANAN ══════════ */}
        {selected && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>

            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-start justify-between gap-4 shrink-0 shadow-inner">
              <div className="min-w-0">
                <p className="text-[11px] font-bold tracking-wider text-primary-200 uppercase mb-1">Detail Isian Survey</p>
                <h3 className="font-extrabold text-lg leading-tight tracking-tight">{selected.fktp_name}</h3>
                <p className="text-xs font-medium text-primary-100 mt-1 opacity-90">{selected.provinsi || selected.city} {selected.kab_kota ? `· ${selected.kab_kota}` : ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 text-white/70 hover:text-white hover:bg-white/20 rounded-xl shrink-0 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

              {/* ── A. Identitas ── */}
              <div>
                <SectionHeader label="A. Identitas" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Waktu Submit" value={new Date(selected.created_at).toLocaleString('id-ID')} />
                  <Field label="Provinsi" value={selected.provinsi || selected.city} />
                  <Field label="Kabupaten/Kota" value={selected.kab_kota || '-'} />
                  <Field label="Nama Puskesmas / Klinik" value={selected.fktp_name} />
                  <Field label="Kode Faskes BPJS" value={selected.kode_faskes || '-'} />
                  <Field label="Nama Responden" value={selected.nama_responden || '-'} />
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Jabatan Pengisi</span>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadge(selected.role)}`}>{selected.role || '-'}</span>
                  </div>
                  <Field label="Dokter Sp.KKLP" value={selected.doc_kklp || 'Tidak'} />
                </div>
              </div>

              {/* ── B. Detail Khusus Sp.KKLP & Perspektif ── */}
              {selected.role === 'Dokter Sp.KKLP' && (
                <div>
                  <SectionHeader label="B. Detail Khusus Sp.KKLP & Perspektif" />
                  <div className="space-y-4">
                    <Field label="Berpraktik sbg Sp.KKLP?" value={selected.spkklp_berpraktik} />
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <p className="font-semibold text-slate-700 text-xs">Poli Tempat Praktik</p>
                      {selected.spkklp_poli?.hasPoli === 'Ya' ? (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <p><span className="text-slate-500">Sejak:</span> {selected.spkklp_poli.sejak || '-'}</p>
                          <p><span className="text-slate-500">Kunjungan/hari:</span> {selected.spkklp_poli.kunjungan || '-'}</p>
                          <p><span className="text-slate-500">Pembiayaan:</span> {selected.spkklp_poli.pembiayaan || '-'}</p>
                          <div className="col-span-2">
                             <p><span className="text-slate-500">Diagnosis:</span> {selected.spkklp_poli.diagnosis || '-'}</p>
                             <p><span className="text-slate-500 mt-1">Tindakan:</span> {selected.spkklp_poli.tindakan || '-'}</p>
                          </div>
                          <div className="col-span-2 mt-1">
                             <p><span className="text-slate-500">Luaran:</span> {Object.keys(selected.spkklp_poli).filter(k => k.startsWith('luaran_') && selected.spkklp_poli[k]).map(k => k.replace('luaran_', '')).join(', ') || '-'}</p>
                             {selected.spkklp_poli.alasanRujukan && <p><span className="text-slate-500 mt-1 block">Alasan Rujukan:</span> {selected.spkklp_poli.alasanRujukan}</p>}
                          </div>
                        </div>
                      ) : selected.spkklp_poli?.hasPoli === 'Tidak' ? (
                        <div className="text-xs">
                          <p>Tidak ada poli tersendiri.</p>
                          <p><span className="text-slate-500 mt-2 block">Diagnosis yang dilayani:</span> {selected.spkklp_poli.diagnosis || '-'}</p>
                          <p><span className="text-slate-500 mt-1 block">Tindakan/Prosedur:</span> {selected.spkklp_poli.tindakan || '-'}</p>
                          <p><span className="text-slate-500 mt-1 block">Luaran:</span> {Object.keys(selected.spkklp_poli).filter(k => k.startsWith('luaran_') && selected.spkklp_poli[k]).map(k => k.replace('luaran_', '')).join(', ') || '-'}</p>
                          {selected.spkklp_poli.alasanRujukan && <p><span className="text-slate-500 mt-1 block">Alasan Rujukan:</span> {selected.spkklp_poli.alasanRujukan}</p>}
                        </div>
                      ) : <p className="text-xs text-slate-400">-</p>}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                      <p className="font-semibold text-slate-700 text-xs">Kendala Praktik (Tanpa Poli)</p>
                      {selected.spkklp_kendala?.hasKendala === 'Ya' ? (
                        <div className="text-xs">
                           <p>Terdapat kendala.</p>
                           <p><span className="text-slate-500 mt-2 block">Diagnosis yang sering dirujuk:</span> {selected.spkklp_kendala.diagnosis || '-'}</p>
                           <p><span className="text-slate-500 mt-1 block">Tindakan/Prosedur yang terkendala:</span> {selected.spkklp_kendala.tindakan || '-'}</p>
                        </div>
                      ) : <p className="text-xs">{selected.spkklp_kendala?.hasKendala || '-'}</p>}
                    </div>

                    {selected.relevansi_spkklp && Object.keys(selected.relevansi_spkklp).length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Skala Relevansi Sp.KKLP (1-4):</p>
                        {Object.entries(selected.relevansi_spkklp).map(([idx, val]) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 text-xs border-b border-slate-200/50 last:border-0">
                            <span className="text-slate-600 mr-2">{relevansiItems[idx]}</span>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">{val}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── B. Detail Dokter Praktik Mandiri (DPM) ── */}
              {selected.role === 'Dokter Praktik Mandiri' && selected.dpm && (
                <div>
                  <SectionHeader label="B. Detail Dokter Praktik Mandiri (DPM)" />
                  <div className="space-y-4 text-xs">
                    {/* Usia */}
                    {selected.dpm.usia && (
                      <div className="grid grid-cols-4 gap-2 border p-3 rounded-lg bg-slate-50 border-slate-100">
                        <div className="col-span-4 font-semibold text-slate-600 mb-1">Proporsi Usia Pasien</div>
                        <div><span className="text-slate-400 block">&lt; 15 th</span>{selected.dpm.usia['<15'] || '-'}</div>
                        <div><span className="text-slate-400 block">15-44 th</span>{selected.dpm.usia['15-44'] || '-'}</div>
                        <div><span className="text-slate-400 block">45-59 th</span>{selected.dpm.usia['45-59'] || '-'}</div>
                        <div><span className="text-slate-400 block">&gt; 60 th</span>{selected.dpm.usia['>60'] || '-'}</div>
                      </div>
                    )}
                    {/* Kasus */}
                    {selected.dpm.kasus && (
                      <div className="p-3 border rounded-lg bg-slate-50 border-slate-100 space-y-2">
                        <div className="font-semibold text-slate-600 mb-1">Gambaran Kasus</div>
                        <p><span className="text-slate-500 font-medium w-32 inline-block">10 Terbanyak:</span> {Array.isArray(selected.dpm.kasus.masalahKesehatan) ? selected.dpm.kasus.masalahKesehatan.join(', ') : '-'} {selected.dpm.kasus.masalahLainnya ? `(${selected.dpm.kasus.masalahLainnya})` : ''}</p>
                        <p><span className="text-slate-500 font-medium w-32 inline-block">% Kasus Kronis:</span> {selected.dpm.kasus.persenKronis || '-'}</p>
                        <p><span className="text-slate-500 font-medium w-32 inline-block">% Pasien Kontrol:</span> {selected.dpm.kasus.persenKontrol || '-'}</p>
                        {selected.dpm.kasus.alasanRujukan && <p><span className="text-slate-500 font-medium w-32 inline-block">Indikasi Rujukan:</span> {selected.dpm.kasus.alasanRujukan}</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── C. Program Rujuk Balik (PRB) ── */}
              {selected.prb && Object.keys(selected.prb).length > 0 && (
                <div>
                  <SectionHeader label="C. Program Rujuk Balik (PRB)" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <Field label="Jumlah Peserta PRB" value={selected.prb.jumlah || '-'} />
                    <Field label="Rutin Kunjungan (≥1x/bln)" value={selected.prb.rutinKunjungan || '-'} />
                    <Field label="Tidak Berkunjung (3 bln)" value={selected.prb.tidakBerkunjung || '-'} />
                    <Field label="Rata-rata Rujukan per Bulan" value={selected.prb.rataRujukan || '-'} />
                    
                    <div className="md:col-span-2">
                      <span className="font-semibold block text-xs text-slate-500 uppercase tracking-wider mb-1 mt-2">Jumlah Diagnosis PRB</span>
                      <div className="grid grid-cols-3 gap-2">
                        <Field label="DM" value={selected.prb.peserta_dm || '-'} />
                        <Field label="Hipertensi" value={selected.prb.peserta_ht || '-'} />
                        <Field label="Jantung" value={selected.prb.peserta_jantung || '-'} />
                        <Field label="PPOK" value={selected.prb.peserta_ppok || '-'} />
                        <Field label="Asma" value={selected.prb.peserta_asma || '-'} />
                        <Field label="Stroke" value={selected.prb.peserta_stroke || '-'} />
                        <Field label="Epilepsi" value={selected.prb.peserta_epilepsi || '-'} />
                        <Field label="Skizofrenia" value={selected.prb.peserta_skizofrenia || '-'} />
                        <Field label="SLE" value={selected.prb.peserta_sle || '-'} />
                      </div>
                    </div>
                    
                    <Field label="Mekanisme Pemantauan" value={Object.keys(selected.prb).filter(k => k.startsWith('mek_') && selected.prb[k]).map(k => k.replace('mek_', '')).join(', ') || '-'} />
                    <Field label="Kendala Pelaksanaan" value={selected.prb.kendala || '-'} />
                  </div>
                </div>
              )}

              {/* ── D. Layanan Dirujuk / Belum Optimal ── */}
              {(selected.layanan_dirujuk || selected.layanan_belum_berjalan) && (
                <div>
                  <SectionHeader label="D. Layanan yang Dirujuk / Belum Optimal" />
                  <div className="grid grid-cols-1 gap-y-3 text-sm">
                    <Field label="Layanan yang Masih Sering Dirujuk" value={selected.layanan_dirujuk ? Object.keys(selected.layanan_dirujuk).filter(k => selected.layanan_dirujuk[k]).join(', ') : '-'} />
                    <Field label="Layanan yang Belum Berjalan Optimal" value={selected.layanan_belum_berjalan ? Object.keys(selected.layanan_belum_berjalan).filter(k => selected.layanan_belum_berjalan[k]).join(', ') : '-'} />
                  </div>
                </div>
              )}

              {/* ── E. Beban Kerja ── */}
              <div>
                <SectionHeader label="E. Beban Kerja Dokter" />
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <Field label="Waktu Konsultasi Poli (mnt/pasien)" value={selected.time_in_poli} />
                  <Field label="Waktu Home Visit (mnt/pasien)" value={selected.time_home_visit} />
                  <Field label="Proporsi Dalam Gedung" value={selected.prop_in_fktp != null ? `${selected.prop_in_fktp}%` : null} />
                  <Field label="Proporsi Luar Gedung" value={selected.prop_out_fktp != null ? `${selected.prop_out_fktp}%` : null} />
                </div>
              </div>

              {/* ── C. Kompetensi Layanan ── */}
              {selected.kompetensi && Object.keys(selected.kompetensi).length > 0 && (
                <div>
                  <SectionHeader label="F. Penilaian Kompetensi Sp.KKLP" />
                  <div className="space-y-2">
                    {kompetensiLayanan.map((nama, idx) => {
                      const item = selected.kompetensi[idx];
                      if (!item) return null;
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${statusBadge(item.status)}`}>
                            Status {item.status === 'sudah' ? 'Sudah' : item.status === 'belum' ? 'Belum' : '-'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── D. Manfaat JKN ── */}
              {selected.jkn && Object.keys(selected.jkn).length > 0 && (
                <div>
                  <SectionHeader label="G. Penilaian Layanan JKN yang Sudah Berjalan" />
                  <div className="space-y-2">
                    {jknBenefits.map((nama, idx) => {
                      const item = selected.jkn[idx];
                      if (!item) return null;
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${scaleBadge(item.skala)}`}>
                            Skala {item.skala}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}


              {/* ── Home Care ── */}
              {selected.home_care && selected.home_care.screening === 'ya' && (
                <div>
                  <SectionHeader label="H. Pelayanan Home Care" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.home_care.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.home_care.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {selected.home_care.kondisi ? Object.keys(selected.home_care.kondisi).filter(k => selected.home_care.kondisi[k]).join(', ') : ''} {selected.home_care.kondisiLainnya ? `(${selected.home_care.kondisiLainnya})` : ''}</p>
                    <p><span className="font-semibold">Jenis Layanan:</span> {selected.home_care.jenisLayanan ? Object.keys(selected.home_care.jenisLayanan).filter(k => selected.home_care.jenisLayanan[k]).join(', ') : ''} {selected.home_care.jenisLayananLainnya ? `(${selected.home_care.jenisLayananLainnya})` : ''}</p>
                    <p><span className="font-semibold">Jumlah Kunjungan:</span> {selected.home_care.jumlahKunjungan}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {selected.home_care.kolaborasi === 'ya' ? selected.home_care.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.home_care.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {selected.home_care.perbaikan === 'ya' ? selected.home_care.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}

              {/* ── Paliatif ── */}
              {selected.paliatif && selected.paliatif.screening === 'ya' && (
                <div>
                  <SectionHeader label="I. Pelayanan Paliatif" />
                  <div className="space-y-2 text-xs">
                    <p><span className="font-semibold">Tenaga:</span> {selected.paliatif.tenaga}</p>
                    <p><span className="font-semibold">Diagnosis:</span> {selected.paliatif.diagnosis}</p>
                    <p><span className="font-semibold">Kondisi:</span> {selected.paliatif.kondisi ? Object.keys(selected.paliatif.kondisi).filter(k => selected.paliatif.kondisi[k]).join(', ') : ''} {selected.paliatif.kondisiLainnya ? `(${selected.paliatif.kondisiLainnya})` : ''}</p>
                    <p><span className="font-semibold">Tujuan:</span> {selected.paliatif.tujuan ? Object.keys(selected.paliatif.tujuan).filter(k => selected.paliatif.tujuan[k]).join(', ') : ''} {selected.paliatif.tujuanLainnya ? `(${selected.paliatif.tujuanLainnya})` : ''}</p>
                    <p><span className="font-semibold">Terapi:</span> {selected.paliatif.terapi}</p>
                    <p><span className="font-semibold">Kolaborasi:</span> {selected.paliatif.kolaborasi === 'ya' ? selected.paliatif.bentukKolaborasi : 'Tidak'}</p>
                    <p><span className="font-semibold">Kepatuhan:</span> {selected.paliatif.kepatuhan}</p>
                    <p><span className="font-semibold">Perbaikan:</span> {selected.paliatif.perbaikan === 'ya' ? selected.paliatif.bentukPerbaikan : 'Tidak'}</p>
                  </div>
                </div>
              )}
\n              {/* ── E. Layanan Non-Optimal ── */}
              {selected.non_optimal && Object.keys(selected.non_optimal).length > 0 && (
                <div>
                  <SectionHeader label="J. Layanan Belum Optimal / Belum Tersedia" />
                  <div className="space-y-2">
                    {nonOptimalServices.map((nama, idx) => {
                      const item = selected.non_optimal[idx];
                      if (!item) return null;
                      return (
                        <div key={idx} className="flex items-start justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${jknBadge(item.masukJkn)}`}>
                              {item.masukJkn || '-'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${scaleBadge(item.skala)}`}>
                              Skala {item.skala}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── F. Wawancara ── */}
              {selected.wawancara && Object.keys(selected.wawancara).some(k => k !== 'pewawancara') && (
                <div>
                  <SectionHeader label="K. Hasil Wawancara" />
                  {selected.wawancara.pewawancara && (
                    <div className="mb-3 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg text-xs flex gap-2">
                      <span className="font-semibold text-emerald-800">Diwawancarai oleh:</span>
                      <span className="text-emerald-700 capitalize">{selected.wawancara.pewawancara}</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {interviewQuestions.map((q, idx) => {
                      const jawaban = selected.wawancara[idx];
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <p className="font-semibold text-slate-700 text-xs mb-2 flex gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full shrink-0 mt-0.5">{idx + 1}</span>
                            <span>{q}</span>
                          </p>
                          <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed pl-7">
                            {jawaban || <span className="text-slate-400 italic">Belum diisi</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer aksi */}
              <div className="pt-2 pb-2 flex gap-2">
                <button
                  onClick={() => deleteSurvey(selected.id, selected.fktp_name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors border border-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Data
                </button>
                <button
                  onClick={() => navigate('/wawancara/form', { state: { surveyData: selected } })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-semibold rounded-lg transition-colors border border-amber-100"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Data
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
