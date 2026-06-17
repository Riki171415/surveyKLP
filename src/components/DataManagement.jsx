import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, Edit, Trash2, Eye, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const interviewQuestions = [
  "Bagaimana pelaksanaan layanan penyakit kronik di FKTP saat ini dan bagaimana peran Sp.KKLP dalam mendukungnya? (adakah aspek yang masih perlu diperkuat?)",
  "Bagaimana pelaksanaan home visit dan home care saat ini, serta dukungan yang diperlukan untuk optimalisasi layanan tersebut?",
  "Bagaimana implementasi komunitas dan edukasi kelompok saat ini? apakah perlu menjadi manfaat non-kapitasi JKN? Atau ada opsi fund channeling lain? (bisa berikan contoh aktivitasnya apa saja yang biasanya dilakukan saat implementasi komunitas dan edukasi kelompok)",
  "Menurut anda apakah layanan paliatif primer perlu dimasukkan ke manfaat JKN FKTP?",
  "Bagaimana keterlibatan Sp.KKLP dalam PRB? Apakah perlu penambahan kewenangan atau perluasan PRB dengan adanya sp.KKLP?",
  "Bagaimana pengalaman atau perubahan yang dirasakan setelah adanya dokter Sp.KKLP di FKTP?",
  "Menurut Anda, bentuk dukungan apa yang diperlukan agar FKTP yang memiliki dokter Sp.KKLP dapat menjalankan perannya secara optimal?"
];

export default function DataManagement() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedData, setSelectedData] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchSurveys();
  }, []);

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
      console.error("Gagal memuat data:", error);
      alert("Gagal memuat data survey dari Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const deleteSurvey = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data survey dari Puskesmas "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      try {
        const { error } = await supabase.from('surveys').delete().eq('id', id);
        if (error) throw error;
        setSurveys(surveys.filter(s => s.id !== id));
      } catch (error) {
        console.error("Gagal menghapus data:", error);
        alert("Gagal menghapus data dari Supabase.");
      }
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
    <div className="max-w-7xl mx-auto animate-fade-in relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Data Survey</h1>
        <p className="text-slate-500 mt-2 text-sm">Lihat detail, edit, atau hapus hasil isian dari seluruh responden.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="relative w-full max-w-md">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama FKTP atau Kabupaten..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
            />
          </div>
          <div className="text-sm font-medium text-slate-500">
            Total: {surveys.length} Data
          </div>
        </div>

        {filteredSurveys.length === 0 ? (
          <div className="p-10 text-center text-slate-500">Tidak ada data yang ditemukan.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Waktu Submit</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Nama FKTP</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Kabupaten/Kota</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Jabatan</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{row.fktp_name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.city}</td>
                    <td className="px-6 py-4 text-slate-600">{row.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedData(row)}
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

      {/* ===== MODAL DETAIL ===== */}
      {selectedData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">

            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detail Isian Survey</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedData.fktp_name} — {selectedData.city}</p>
              </div>
              <button
                onClick={() => setSelectedData(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-7">

              {/* A. Identitas */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">A. Identitas</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-slate-400 block text-xs mb-0.5">Waktu Submit</span><span className="font-medium text-slate-900">{new Date(selectedData.created_at).toLocaleString('id-ID')}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Provinsi / Kota</span><span className="font-medium text-slate-900">{selectedData.city || '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Nama FKTP</span><span className="font-medium text-slate-900">{selectedData.fktp_name || '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Jabatan Pengisi</span><span className="font-medium text-slate-900">{selectedData.role || '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Dokter Umum</span><span className="font-medium text-slate-900">{selectedData.doc_umum ?? '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Dokter Gigi</span><span className="font-medium text-slate-900">{selectedData.doc_gigi ?? '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Dokter Sp.KKLP</span><span className="font-medium text-slate-900">{selectedData.doc_kklp ?? '-'}</span></div>
                </div>
              </div>

              {/* B. Beban Kerja */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">B. Beban Kerja Dokter</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div><span className="text-slate-400 block text-xs mb-0.5">Waktu Konsultasi Poli (mnt/pasien)</span><span className="font-medium text-slate-900">{selectedData.time_in_poli ?? '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Waktu Home Visit (mnt/pasien)</span><span className="font-medium text-slate-900">{selectedData.time_home_visit ?? '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Proporsi Dalam Gedung (%)</span><span className="font-medium text-slate-900">{selectedData.prop_in_fktp != null ? `${selectedData.prop_in_fktp}%` : '-'}</span></div>
                  <div><span className="text-slate-400 block text-xs mb-0.5">Proporsi Luar Gedung (%)</span><span className="font-medium text-slate-900">{selectedData.prop_out_fktp != null ? `${selectedData.prop_out_fktp}%` : '-'}</span></div>
                </div>
              </div>

              {/* C. Kompetensi Layanan */}
              {selectedData.kompetensi && selectedData.kompetensi.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">C. Kompetensi Layanan Sp.KKLP</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.kompetensi.map((item, i) => (
                      <span key={i} className="bg-violet-50 text-violet-800 border border-violet-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* D. Manfaat JKN */}
              {selectedData.jkn && selectedData.jkn.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">D. Layanan JKN yang Sudah Berjalan</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.jkn.map((item, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* E. Layanan Non-Optimal */}
              {selectedData.non_optimal && selectedData.non_optimal.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">E. Layanan Belum Optimal / Belum Tersedia</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedData.non_optimal.map((item, i) => (
                      <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium px-3 py-1 rounded-full">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* F. Hasil Wawancara */}
              {selectedData.wawancara && Object.keys(selectedData.wawancara).some(k => k !== 'pewawancara') && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-200 text-sm uppercase tracking-wide text-slate-500">F. Hasil Wawancara Tim Survey</h4>
                  {selectedData.wawancara.pewawancara && (
                    <div className="mb-4 text-sm bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-2">
                      <span className="font-semibold text-emerald-800">Diwawancarai oleh:</span>
                      <span className="text-emerald-700 capitalize">{selectedData.wawancara.pewawancara}</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {interviewQuestions.map((question, idx) => {
                      const jawaban = selectedData.wawancara[idx];
                      return (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm">
                          <p className="font-semibold text-slate-700 mb-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs rounded-full mr-2 flex-shrink-0">{idx + 1}</span>
                            {question}
                          </p>
                          <p className="text-slate-600 whitespace-pre-wrap leading-relaxed pl-7">
                            {jawaban || <span className="text-slate-400 italic">Belum diisi</span>}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex-shrink-0 flex justify-end gap-3">
              <button
                onClick={() => navigate('/wawancara/form', { state: { surveyData: selectedData } })}
                className="px-5 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors text-sm"
              >
                Edit Data
              </button>
              <button
                onClick={() => setSelectedData(null)}
                className="px-5 py-2 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 transition-colors text-sm"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
