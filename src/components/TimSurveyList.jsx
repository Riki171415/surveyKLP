import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ClipboardList, CheckCircle, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

export default function TimSurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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
      alert("Gagal memuat daftar Puskesmas dari Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = surveys.filter(s => 
    (s.fktp_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.provinsi || s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kab_kota || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat Daftar Puskesmas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Daftar Wawancara</h1>
        <p className="text-slate-500 mt-2 text-sm">Pilih Puskesmas yang telah mengisi survey untuk dilakukan wawancara.</p>
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
          <div className="p-10 text-center text-slate-500">
            Tidak ada data Puskesmas yang ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-700">Nama FKTP</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Kabupaten/Kota</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Waktu Submit</th>
                  <th className="px-6 py-4 font-semibold text-slate-700 text-center">Status Wawancara</th>
                  <th className="px-6 py-4 font-semibold text-slate-700">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSurveys.map((row, idx) => {
                  // Cek apakah pertanyaan wawancara 1 sudah diisi (asumsi: indeks 0)
                  const isWawancaraSelesai = row.wawancara && row.wawancara['0'] && row.wawancara['0'].trim() !== '';
                  
                  return (
                    <tr key={row.id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{row.fktp_name}</td>
                      <td className="px-6 py-4 text-slate-600">{row.provinsi || row.city}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(row.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        {isWawancaraSelesai ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Selesai</span>
                            </span>
                            {row.wawancara?.pewawancara && (
                              <span className="text-[10px] mt-1 text-slate-500 font-medium capitalize">
                                oleh: {row.wawancara.pewawancara}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              navigate('/wawancara/form', { state: { surveyData: row } });
                            }}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
                          >
                            <ClipboardList className="w-3.5 h-3.5" />
                            <span>{isWawancaraSelesai ? 'Edit Data' : 'Mulai Wawancara'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
