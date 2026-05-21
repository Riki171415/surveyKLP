import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Search, ClipboardList, CheckCircle } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDiWEJm0LJwkjYmUDbrt5KLNx42uMERm7TtobhxoYs9ygRnz92cuT9Bwr_C-YJ9qTVwQ/exec';

export default function TimSurveyList() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${SCRIPT_URL}?action=getSurveys`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSurveys(data);
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
      alert("Gagal memuat daftar Puskesmas.");
    } finally {
      setLoading(false);
    }
  };

  const filteredSurveys = surveys.filter(s => 
    (s['Nama FKTP'] || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s['Kabupaten/Kota'] || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                  // Cek apakah pertanyaan wawancara 1 sudah diisi (asumsi: jika satu terisi, wawancara sudah dilakukan)
                  const isWawancaraSelesai = !!row['[W1] Pendapat terkait layanan penyakit kronik (kapitasi)'];
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">{row['Nama FKTP']}</td>
                      <td className="px-6 py-4 text-slate-600">{row['Kabupaten/Kota']}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(row['Timestamp']).toLocaleDateString('id-ID')}</td>
                      <td className="px-6 py-4 text-center">
                        {isWawancaraSelesai ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Selesai
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                            Belum
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            // Navigasi ke halaman form wawancara dengan state data
                            navigate('/wawancara/form', { state: { surveyData: row } });
                          }}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-md text-xs font-medium transition-colors"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>{isWawancaraSelesai ? 'Edit Wawancara' : 'Mulai Wawancara'}</span>
                        </button>
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
