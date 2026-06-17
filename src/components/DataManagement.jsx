import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Edit, Trash2, Eye, X, ChevronRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const interviewQuestions = [
  "Bagaimana pelaksanaan layanan penyakit kronik di FKTP saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya? (adakah aspek yang masih perlu diperkuat?)",
  "Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain?",
  "Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP?",
  "Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di FKTP?",
  "Menurut Anda, bentuk dukungan apa yang diperlukan agar FKTP yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
];

const roleColor = (role) => {
  if (!role) return 'bg-slate-100 text-slate-600';
  const r = role.toLowerCase();
  if (r === 'admin') return 'bg-purple-100 text-purple-800';
  if (r.includes('survey')) return 'bg-blue-100 text-blue-800';
  return 'bg-emerald-100 text-emerald-800';
};

export default function DataManagement() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
      console.error('Gagal memuat data:', error);
      alert('Gagal memuat data survey dari Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (row) => {
    setSelectedData(row);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedData(null), 300);
  };

  const deleteSurvey = async (id, name) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data survey dari Puskesmas "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const { error } = await supabase.from('surveys').delete().eq('id', id);
      if (error) throw error;
      setSurveys(surveys.filter(s => s.id !== id));
      if (selectedData?.id === id) closeDrawer();
    } catch (error) {
      console.error('Gagal menghapus data:', error);
      alert('Gagal menghapus data dari Supabase.');
    }
  };

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
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Data Survey</h1>
        <p className="text-slate-500 mt-2 text-sm">Lihat detail, edit, atau hapus hasil isian dari seluruh responden.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama FKTP atau Kabupaten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <div className="text-sm font-medium text-slate-500 shrink-0">Total: {surveys.length} Data</div>
        </div>

        {/* Table */}
        {filteredSurveys.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Tidak ada data yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-5 py-4 font-semibold text-slate-700">Waktu Submit</th>
                  <th className="px-5 py-4 font-semibold text-slate-700">Nama FKTP</th>
                  <th className="px-5 py-4 font-semibold text-slate-700">Kabupaten/Kota</th>
                  <th className="px-5 py-4 font-semibold text-slate-700">Jabatan</th>
                  <th className="px-5 py-4 font-semibold text-slate-700 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedData?.id === row.id && drawerOpen ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''}`}
                    onClick={() => openDrawer(row)}
                  >
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{row.fktp_name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{row.city}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roleColor(row.role)}`}>{row.role}</span>
                    </td>
                    <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openDrawer(row)}
                          className="flex items-center justify-center p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate('/wawancara/form', { state: { surveyData: row } })}
                          className="flex items-center justify-center p-2 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors"
                          title="Edit Data"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSurvey(row.id, row.fktp_name)}
                          className="flex items-center justify-center p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== SLIDE-IN DRAWER (kanan layar) ===== */}
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {selectedData && (
          <>
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Detail Isian Survey</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">{selectedData.fktp_name}</h3>
                <p className="text-sm text-slate-500">{selectedData.city}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/wawancara/form', { state: { surveyData: selectedData } })}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={closeDrawer}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

              {/* A. Identitas */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">A. Identitas</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Waktu Submit</span>
                    <span className="font-medium text-slate-800">{new Date(selectedData.created_at).toLocaleString('id-ID')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Provinsi / Kota</span>
                    <span className="font-medium text-slate-800">{selectedData.city || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Nama FKTP</span>
                    <span className="font-medium text-slate-800">{selectedData.fktp_name || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Jabatan Pengisi</span>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleColor(selectedData.role)}`}>{selectedData.role || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Dokter Umum</span>
                    <span className="font-medium text-slate-800">{selectedData.doc_umum ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Dokter Gigi</span>
                    <span className="font-medium text-slate-800">{selectedData.doc_gigi ?? '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400 text-xs block mb-0.5">Dokter Sp.KKLP</span>
                    <span className="font-medium text-slate-800">{selectedData.doc_kklp ?? '-'}</span>
                  </div>
                </div>
              </section>

              {/* B. Beban Kerja */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">B. Beban Kerja Dokter</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Waktu Konsultasi Poli (mnt/pasien)</span>
                    <span className="font-medium text-slate-800">{selectedData.time_in_poli ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Waktu Home Visit (mnt/pasien)</span>
                    <span className="font-medium text-slate-800">{selectedData.time_home_visit ?? '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Proporsi Dalam Gedung</span>
                    <span className="font-medium text-slate-800">{selectedData.prop_in_fktp != null ? `${selectedData.prop_in_fktp}%` : '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block mb-0.5">Proporsi Luar Gedung</span>
                    <span className="font-medium text-slate-800">{selectedData.prop_out_fktp != null ? `${selectedData.prop_out_fktp}%` : '-'}</span>
                  </div>
                </div>
              </section>

              {/* C. Kompetensi */}
              {selectedData.kompetensi && selectedData.kompetensi.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">C. Kompetensi Layanan Sp.KKLP</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.kompetensi.map((item, i) => (
                      <span key={i} className="bg-violet-50 text-violet-800 border border-violet-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* D. Manfaat JKN */}
              {selectedData.jkn && selectedData.jkn.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">D. Layanan JKN yang Sudah Berjalan</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.jkn.map((item, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* E. Non-Optimal */}
              {selectedData.non_optimal && selectedData.non_optimal.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">E. Layanan Belum Optimal / Belum Tersedia</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.non_optimal.map((item, i) => (
                      <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* F. Wawancara */}
              {selectedData.wawancara && Object.keys(selectedData.wawancara).some(k => k !== 'pewawancara') && (
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">F. Hasil Wawancara</h4>
                  {selectedData.wawancara.pewawancara && (
                    <div className="mb-4 text-sm bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-lg flex items-center gap-2">
                      <span className="font-semibold text-emerald-800 text-xs">Diwawancarai oleh:</span>
                      <span className="text-emerald-700 capitalize text-xs">{selectedData.wawancara.pewawancara}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {interviewQuestions.map((question, idx) => {
                      const jawaban = selectedData.wawancara[idx];
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                          <p className="font-semibold text-slate-700 text-xs mb-2 flex gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full shrink-0 mt-0.5">{idx + 1}</span>
                            <span>{question}</span>
                          </p>
                          <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed pl-7">
                            {jawaban || <span className="text-slate-400 italic">Belum diisi</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="shrink-0 px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                onClick={() => deleteSurvey(selectedData.id, selectedData.fktp_name)}
                className="flex items-center gap-1.5 px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 text-sm font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Hapus Data
              </button>
              <button
                onClick={closeDrawer}
                className="px-5 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors text-sm"
              >
                Tutup
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
