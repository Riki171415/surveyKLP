import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Edit, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const interviewQuestions = [
  "Bagaimana pelaksanaan layanan penyakit kronik di FKTP saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya?",
  "Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN?",
  "Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB?",
  "Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di FKTP?",
  "Menurut Anda, bentuk dukungan apa yang diperlukan agar FKTP yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
];

const roleBadge = (role) => {
  if (!role) return 'bg-slate-100 text-slate-600';
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-purple-100 text-purple-800';
  if (r.includes('survey')) return 'bg-blue-100 text-blue-800';
  return 'bg-emerald-100 text-emerald-800';
};

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-[11px] text-slate-400 block mb-0.5">{label}</span>
      <span className="text-sm font-medium text-slate-800 break-words">{value ?? '-'}</span>
    </div>
  );
}

export default function DataManagement() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [expandedSection, setExpandedSection] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { fetchSurveys(); }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      alert('Gagal memuat data survey dari Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id, name) => {
    if (!window.confirm(`Hapus data survey dari "${name}"?`)) return;
    try {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;
      setSurveys(surveys.filter(s => s.id !== id));
      if (selectedData?.id === id) setSelectedData(null);
    } catch {
      alert('Gagal menghapus data.');
    }
  };

  const toggleSection = (key) => setExpandedSection(prev => ({ ...prev, [key]: !prev[key] }));

  const filteredSurveys = surveys.filter(s =>
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Data Survey...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Data Survey</h1>
        <p className="text-slate-500 mt-1 text-sm">Klik baris data untuk melihat detail isian secara lengkap.</p>
      </div>

      {/* LAYOUT: tabel kiri + detail kanan */}
      <div className={`flex gap-5 items-start transition-all duration-300 ${selectedData ? '' : ''}`}>

        {/* ===== TABEL ===== */}
        <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-shrink-0 transition-all duration-300 ${selectedData ? 'w-[45%]' : 'w-full'}`}>
          {/* Search */}
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari FKTP atau Kota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-xs"
              />
            </div>
            <span className="text-xs font-medium text-slate-400 shrink-0">{surveys.length} data</span>
          </div>

          {filteredSurveys.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Tidak ada data ditemukan.</div>
          ) : (
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              {filteredSurveys.map((row) => (
                <div
                  key={row.id}
                  onClick={() => setSelectedData(selectedData?.id === row.id ? null : row)}
                  className={`flex items-center justify-between px-4 py-3.5 border-b border-slate-100 cursor-pointer transition-all duration-150 hover:bg-slate-50 ${selectedData?.id === row.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className={`font-semibold text-sm truncate ${selectedData?.id === row.id ? 'text-primary-700' : 'text-slate-800'}`}>
                      {row.fktp_name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{row.city}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadge(row.role)}`}>{row.role}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate('/wawancara/form', { state: { surveyData: row } })}
                      className="p-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteSurvey(row.id, row.fktp_name)}
                      className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== PANEL DETAIL (kanan) ===== */}
        {selectedData && (
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">

            {/* Header detail */}
            <div className="px-5 py-4 bg-primary-600 text-white flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-primary-200 mb-0.5">Detail Isian Survey</p>
                <h3 className="font-bold text-base leading-tight">{selectedData.fktp_name}</h3>
                <p className="text-xs text-primary-200 mt-0.5">{selectedData.city}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/wawancara/form', { state: { surveyData: selectedData } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setSelectedData(null)}
                  className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body detail */}
            <div className="overflow-y-auto px-5 py-5 space-y-1" style={{ maxHeight: 'calc(100vh - 220px)' }}>

              {/* A. Identitas */}
              <Section title="A. Identitas">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Waktu Submit" value={new Date(selectedData.created_at).toLocaleString('id-ID')} />
                  <Field label="Provinsi / Kota" value={selectedData.city} />
                  <Field label="Nama FKTP" value={selectedData.fktp_name} />
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Jabatan Pengisi</span>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleBadge(selectedData.role)}`}>{selectedData.role || '-'}</span>
                  </div>
                  <Field label="Dokter Umum" value={selectedData.doc_umum} />
                  <Field label="Dokter Gigi" value={selectedData.doc_gigi} />
                  <Field label="Dokter Sp.KKLP" value={selectedData.doc_kklp} />
                </div>
              </Section>

              <hr className="border-slate-100" />

              {/* B. Beban Kerja */}
              <Section title="B. Beban Kerja Dokter">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <Field label="Waktu Poli (mnt/pasien)" value={selectedData.time_in_poli} />
                  <Field label="Waktu Home Visit (mnt/pasien)" value={selectedData.time_home_visit} />
                  <Field label="Proporsi Dalam Gedung" value={selectedData.prop_in_fktp != null ? `${selectedData.prop_in_fktp}%` : null} />
                  <Field label="Proporsi Luar Gedung" value={selectedData.prop_out_fktp != null ? `${selectedData.prop_out_fktp}%` : null} />
                </div>
              </Section>

              {/* C. Kompetensi */}
              {selectedData.kompetensi && selectedData.kompetensi.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <Section title="C. Kompetensi Layanan Sp.KKLP">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedData.kompetensi.map((item, i) => (
                        <span key={i} className="bg-violet-50 text-violet-800 border border-violet-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* D. JKN */}
              {selectedData.jkn && selectedData.jkn.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <Section title="D. Layanan JKN yang Sudah Berjalan">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedData.jkn.map((item, i) => (
                        <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* E. Non-Optimal */}
              {selectedData.non_optimal && selectedData.non_optimal.length > 0 && (
                <>
                  <hr className="border-slate-100" />
                  <Section title="E. Layanan Belum Optimal / Belum Tersedia">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedData.non_optimal.map((item, i) => (
                        <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* F. Wawancara */}
              {selectedData.wawancara && Object.keys(selectedData.wawancara).some(k => k !== 'pewawancara') && (
                <>
                  <hr className="border-slate-100" />
                  <Section title="F. Hasil Wawancara">
                    {selectedData.wawancara.pewawancara && (
                      <div className="mb-3 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg text-xs">
                        <span className="font-semibold text-emerald-800">Diwawancarai oleh: </span>
                        <span className="text-emerald-700 capitalize">{selectedData.wawancara.pewawancara}</span>
                      </div>
                    )}
                    <div className="space-y-3">
                      {interviewQuestions.map((question, idx) => {
                        const jawaban = selectedData.wawancara[idx];
                        const isOpen = expandedSection[`q${idx}`] !== false;
                        return (
                          <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleSection(`q${idx}`)}
                              className="w-full flex items-start gap-2 px-3 py-2.5 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                            >
                              <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full shrink-0 mt-0.5">{idx + 1}</span>
                              <span className="flex-1 text-xs font-semibold text-slate-700 leading-tight">{question}</span>
                              {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />}
                            </button>
                            {isOpen && (
                              <div className="px-3 py-2.5 bg-white">
                                <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                  {jawaban || <span className="text-slate-400 italic">Belum diisi</span>}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </>
              )}

              {/* Footer aksi */}
              <div className="pt-4 flex gap-2">
                <button
                  onClick={() => deleteSurvey(selectedData.id, selectedData.fktp_name)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-semibold rounded-lg transition-colors border border-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Data
                </button>
                <button
                  onClick={() => navigate('/wawancara/form', { state: { surveyData: selectedData } })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-amber-700 bg-amber-50 hover:bg-amber-100 text-xs font-semibold rounded-lg transition-colors border border-amber-100"
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
