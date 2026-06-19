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
  "Bagaimana pelaksanaan layanan penyakit kronik di FKTP saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya?",
  "Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN?",
  "Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB?",
  "Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di FKTP?",
  "Menurut Anda, bentuk dukungan apa yang diperlukan agar FKTP yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
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

const roleBadge = (role = '') => {
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-purple-100 text-purple-800';
  if (r.includes('survey')) return 'bg-blue-100 text-blue-800';
  return 'bg-emerald-100 text-emerald-800';
};

// ─── Komponen kecil ─────────────────────────────────────────────────────────
function SectionHeader({ label }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 pb-1.5 border-b border-slate-100">{label}</p>;
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-[11px] text-slate-400 block mb-0.5">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value ?? '-'}</span>
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
                placeholder="Cari FKTP atau Kota..."
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
                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all hover:bg-slate-50
                      ${selected?.id === row.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${selected?.id === row.id ? 'text-primary-700' : 'text-slate-800'}`}>{row.fktp_name}</p>
                      <p className="text-xs text-slate-400 truncate">{row.kab_kota || row.city || '-'}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge(row.role)}`}>{row.role}</span>
                        <span className="text-[10px] text-slate-400">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button onClick={() => deleteSurvey(row.id, row.fktp_name)} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
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
            <div className="px-5 py-4 bg-primary-600 text-white flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <p className="text-xs text-primary-200 mb-0.5">Detail Isian Survey</p>
                <h3 className="font-bold text-base leading-tight">{selected.fktp_name}</h3>
                <p className="text-xs text-primary-200 mt-0.5">{selected.provinsi || selected.city} {selected.kab_kota ? `· ${selected.kab_kota}` : ''}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full shrink-0">
                <X className="w-4 h-4" />
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
                  <Field label="Dokter Umum" value={selected.doc_umum} />
                  <Field label="Dokter Gigi" value={selected.doc_gigi} />
                  <Field label="Dokter Sp.KKLP" value={selected.doc_kklp} />
                </div>
              </div>

              {/* ── B. Beban Kerja ── */}
              <div>
                <SectionHeader label="B. Beban Kerja Dokter" />
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
                  <SectionHeader label="C. Penilaian Kompetensi Sp.KKLP" />
                  <div className="space-y-2">
                    {kompetensiLayanan.map((nama, idx) => {
                      const item = selected.kompetensi[idx];
                      if (!item) return null;
                      return (
                        <div key={idx} className="flex items-center justify-between gap-3 py-2 border-b border-slate-50 last:border-0">
                          <span className="text-xs text-slate-700 flex-1">{nama}</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0 ${scaleBadge(item.status)}`}>
                            Skala {item.status}
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
                  <SectionHeader label="D. Penilaian Layanan JKN yang Sudah Berjalan" />
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
                  <SectionHeader label="Pelayanan Home Care" />
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
                  <SectionHeader label="Pelayanan Paliatif" />
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
                  <SectionHeader label="E. Layanan Belum Optimal / Belum Tersedia" />
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
                  <SectionHeader label="F. Hasil Wawancara" />
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
