import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, Home, Activity, Download, Loader2 } from 'lucide-react';

const COLORS = ['#0f172a', '#3b82f6', '#0ea5e9', '#94a3b8'];

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pastikan URL script sesuai dengan yang diberikan oleh user
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwDiWEJm0LJwkjYmUDbrt5KLNx42uMERm7TtobhxoYs9ygRnz92cuT9Bwr_C-YJ9qTVwQ/exec';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch data dari Google Apps Script doGet()
      const response = await fetch(SCRIPT_URL);
      if (!response.ok) throw new Error("Gagal mengambil data");
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat memuat data dari Spreadsheet. Pastikan URL Apps Script sudah benar.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Memuat data dari Google Sheets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-semibold mb-2">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // --- MENGOLAH DATA NYATA ---
  
  // 1. Total Responden
  const totalResponden = data.length;

  // 2. Rata-rata Waktu Poli & Home Visit
  const avgPoli = totalResponden > 0 
    ? Math.round(data.reduce((acc, row) => acc + (Number(row['Waktu Poli (mnt)']) || 0), 0) / totalResponden)
    : 0;
    
  const avgHome = totalResponden > 0 
    ? Math.round(data.reduce((acc, row) => acc + (Number(row['Waktu Home Visit (mnt)']) || 0), 0) / totalResponden)
    : 0;

  // 3. Distribusi Jabatan
  const roleCount = {};
  data.forEach(row => {
    const role = row['Jabatan'] || 'Tidak Diketahui';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });
  const roleData = Object.keys(roleCount).map(key => ({
    name: key,
    value: roleCount[key]
  }));

  // 4. Kebutuhan Layanan Belum Optimal (Top 5)
  // Menghitung rata-rata skala untuk setiap layanan 'NonOpt'
  const nonOptSkalaSum = {};
  const nonOptCount = {};
  
  if (totalResponden > 0) {
    const headers = Object.keys(data[0]);
    const nonOptHeaders = headers.filter(h => h.startsWith('[NonOpt') && h.includes('- Skala'));
    
    data.forEach(row => {
      nonOptHeaders.forEach(header => {
        const val = Number(row[header]);
        if (val > 0) {
          // Ekstrak nama layanan dari string header (Contoh: "[NonOpt 1] Home care - Skala (1-4)")
          let namaLayanan = header.split('] ')[1];
          namaLayanan = namaLayanan.split(' - Skala')[0];
          
          nonOptSkalaSum[namaLayanan] = (nonOptSkalaSum[namaLayanan] || 0) + val;
          nonOptCount[namaLayanan] = (nonOptCount[namaLayanan] || 0) + 1;
        }
      });
    });
  }

  let jknNeedsData = Object.keys(nonOptSkalaSum).map(name => ({
    name: name.length > 20 ? name.substring(0, 20) + '...' : name,
    rating: Number((nonOptSkalaSum[name] / nonOptCount[name]).toFixed(1))
  }));
  
  // Sort descending and take top 5
  jknNeedsData.sort((a, b) => b.rating - a.rating);
  jknNeedsData = jknNeedsData.slice(0, 5);
  
  // 5. Avg Keseluruhan Skala JKN
  let totalJknSkala = 0;
  let totalJknCount = 0;
  if (totalResponden > 0) {
    const jknHeaders = Object.keys(data[0]).filter(h => h.startsWith('[JKN') && h.includes('- Skala'));
    data.forEach(row => {
      jknHeaders.forEach(header => {
        const val = Number(row[header]);
        if (val > 0) {
          totalJknSkala += val;
          totalJknCount++;
        }
      });
    });
  }
  const avgJknSkala = totalJknCount > 0 ? (totalJknSkala / totalJknCount).toFixed(1) : 0;

  const stats = [
    { label: 'Total Responden', value: totalResponden, icon: Users, trend: 'Dari Sheet' },
    { label: 'Avg Waktu Poli', value: `${avgPoli} Mnt`, icon: Clock, trend: 'Berdasarkan data' },
    { label: 'Avg Home Visit', value: `${avgHome} Mnt`, icon: Home, trend: 'Berdasarkan data' },
    { label: 'Skala JKN Umum', value: avgJknSkala, icon: Activity, trend: 'Skala 1-4' },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Real-time data terhubung dengan Google Sheets</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span>Refresh Data</span>
        </button>
      </div>

      {totalResponden === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <p className="text-slate-500">Belum ada data responden di Google Sheets. Silakan isi survey terlebih dahulu.</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <stat.icon className="w-5 h-5 text-slate-700" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
                  <p className="text-xs text-slate-400 mt-2">{stat.trend}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Distribution Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6">
                <h2 className="text-base font-bold text-slate-900">Demografi Responden</h2>
                <p className="text-xs text-slate-500 mt-1">Berdasarkan jabatan profesional</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Needs Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6">
                <h2 className="text-base font-bold text-slate-900">Prioritas Layanan Non-Optimal</h2>
                <p className="text-xs text-slate-500 mt-1">5 layanan dengan rata-rata skala tertinggi</p>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={jknNeedsData}
                    layout="vertical"
                    margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 4]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 11, fill: '#475569'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="rating" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
