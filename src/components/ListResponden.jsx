import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Calendar, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ListResponden() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    async function fetchData() {
      try {
        let data = [];
        if (import.meta.env.VITE_USE_LOCAL_API === 'true') {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
          const res = await fetch(`${baseUrl}/api/surveys`);
          const json = await res.json();
          data = json.data || [];
        } else {
          const { data: sbData, error } = await supabase.from('surveys').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          data = sbData || [];
        }
        setSurveys(data);
      } catch (err) {
        console.error('Error fetching surveys:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter surveys
  const filtered = surveys.filter(s => {
    const term = searchTerm.toLowerCase();
    const faskesName = (s.nama_faskes || '').toLowerCase();
    const city = (s.city || '').toLowerCase();
    const prov = (s.provinsi || '').toLowerCase();
    return faskesName.includes(term) || city.includes(term) || prov.includes(term);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          <p className="text-slate-500 font-medium">Memuat data responden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">List Responden</h1>
          <p className="text-slate-500 mt-2">Daftar FKTP yang sudah mengisi survei ({surveys.length} total)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari faskes, kota, atau provinsi..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Faskes / Peran</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl. Pengisian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((row, i) => (
                <tr key={row.id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                    {(currentPage - 1) * itemsPerPage + i + 1}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-primary-50 p-2 rounded-lg text-primary-600 mt-1">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm uppercase">{row.nama_faskes || 'Tanpa Nama'}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{row.role || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{row.city || '-'}, {row.provinsi || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {row.created_at ? new Date(row.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        }) : '-'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p>Tidak ada data ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Halaman <strong className="text-slate-800">{currentPage}</strong> dari <strong className="text-slate-800">{totalPages}</strong>
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnnya
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
