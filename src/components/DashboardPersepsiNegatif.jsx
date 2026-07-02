import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { AlertTriangle, TrendingDown, Clock, Frown, MessageSquare, Download, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';
import { downloadElementAsPNG } from '../utils/exportImageUtils';

const DashboardPersepsiNegatif = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
        let data = [];
        if (useSupabase) {
          const { data: sbData, error } = await supabase.from('surveys').select('*');
          if (error) throw error;
          data = sbData || [];
        } else {
          const res = await fetch('/api/surveys');
          const json = await res.json();
          data = json.data || [];
        }
        setSurveys(data);
      } catch (err) {
        console.error("Gagal mengambil data survei:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { persepsiUmum, trenKepuasan, pieData, dataSkeptisisme, skeptisismeQuotes, kpiData } = React.useMemo(() => {
    let bebanAdmin = 0, regulasi = 0, sdm = 0, dana = 0, waktu = 0;
    let skeptisismeTinggi = 0, skeptisismeSedang = 0, skeptisismeRendah = 0;
    let keluhanPerBulan = {};
    let quotes = [];

    surveys.forEach(row => {
      let allText = '';
      if (row.wawancara) {
         Object.values(row.wawancara).forEach(val => {
           if (val) allText += String(val).toLowerCase() + ' ';
         });
      }

      // 1. Persepsi Umum & Pie Data
      if (allText.match(/pcare|p-care|aplikasi|input|jaringan|klaim|beban|administrasi|ribet|kertas/)) bebanAdmin++;
      if (allText.match(/regulasi|aturan|berubah|sosialisasi|rujukan|wewenang|kompetensi/)) regulasi++;
      if (allText.match(/insentif|jasa|medis|kapitasi|sdm|perawat|tenaga|kurang/)) sdm++;
      if (allText.match(/dana|biaya|bayar|tunggak/)) dana++;
      if (allText.match(/waktu|lama|antre|tunggu/)) waktu++;

      // 2. Skeptisisme Sp.KKLP
      let level = null;
      if (allText.match(/tidak berpengaruh|sama saja|percuma|tidak ada bedanya|rujukan tetap/)) { skeptisismeTinggi++; level = 'Tinggi'; }
      else if (allText.match(/sia-sia|ragu|tidak ada perubahan/)) { skeptisismeSedang++; level = 'Sedang'; }
      else if (allText.match(/biasa|tidak signifikan|tidak perlu|belum terasa/)) { skeptisismeRendah++; level = 'Rendah'; }

      if (level && quotes.length < 20) {
        let matchedAns = '';
        if (row.wawancara) {
           Object.values(row.wawancara).forEach(val => {
               if (val && new RegExp(/tidak berpengaruh|sama saja|percuma|tidak ada bedanya|rujukan tetap|sia-sia|ragu|tidak ada perubahan|biasa|tidak signifikan|tidak perlu|belum terasa/, 'i').test(val)) {
                   matchedAns = val;
               }
           });
        }
        if (matchedAns) {
           quotes.push({ level, fktp: row.fktp_name || 'Tidak diketahui', text: matchedAns });
        }
      }

      // 3. Tren per bulan
      const date = row.created_at ? new Date(row.created_at) : new Date();
      const month = date.toLocaleString('default', { month: 'short' });
      if (!keluhanPerBulan[month]) keluhanPerBulan[month] = { total: 0, keluhan: 0 };
      keluhanPerBulan[month].total++;
      if (bebanAdmin || regulasi || sdm || dana) keluhanPerBulan[month].keluhan++;
    });

    const total = surveys.length || 1;
    
    const persepsi = [
      { name: 'Beban Administrasi Tinggi', value: Math.round((bebanAdmin / total) * 100) || 0, fill: '#ef4444', count: bebanAdmin },
      { name: 'Ketidakjelasan Regulasi', value: Math.round((regulasi / total) * 100) || 0, fill: '#f97316', count: regulasi },
      { name: 'Masalah SDM & Insentif', value: Math.round((sdm / total) * 100) || 0, fill: '#f59e0b', count: sdm },
      { name: 'Pendanaan/Klaim', value: Math.round((dana / total) * 100) || 0, fill: '#eab308', count: dana },
      { name: 'Waktu Pelayanan Tersita', value: Math.round((waktu / total) * 100) || 0, fill: '#84cc16', count: waktu }
    ].sort((a,b) => b.value - a.value);

    const pie = [
      { name: 'Masalah Sistem/IT', value: bebanAdmin },
      { name: 'Regulasi Berubah-ubah', value: regulasi },
      { name: 'Masalah SDM/Beban Kerja', value: sdm },
      { name: 'Pendanaan/Klaim', value: dana },
    ].filter(d => d.value > 0);
    if (pie.length === 0) pie.push({ name: 'Belum Ada Keluhan', value: 1 });

    const skeptisisme = [
      { name: 'Skeptisisme Tinggi (Regulasi/Rujukan)', value: skeptisismeTinggi, fill: '#ef4444' },
      { name: 'Skeptisisme Sedang (Beban Administrasi)', value: skeptisismeSedang, fill: '#f97316' },
      { name: 'Skeptisisme Rendah (Hanya Teknis)', value: skeptisismeRendah, fill: '#3b82f6' }
    ].filter(d => d.value > 0);
    if (skeptisisme.length === 0) skeptisisme.push({ name: 'Belum Ada Indikasi Skeptisisme', value: 1, fill: '#22c55e' });

    let tren = Object.keys(keluhanPerBulan).map(m => ({
      bulan: m,
      'Tingkat Keluhan': Math.round((keluhanPerBulan[m].keluhan / keluhanPerBulan[m].total) * 100) || 0
    }));
    if (tren.length === 0) {
      tren = [{ bulan: new Date().toLocaleString('default', { month: 'short' }), 'Tingkat Keluhan': 0 }];
    }

    let kpiData = {
      keluhanTertinggi: 'Belum Ada',
      trenBulanIni: '0%',
      keluhanSdm: 0,
      faskesMelapor: '0%'
    };

    if (persepsi.length > 0 && persepsi[0].value > 0) {
      const highest = persepsi[0].name;
      if (highest.includes('Administrasi')) kpiData.keluhanTertinggi = 'Beban Admin';
      else if (highest.includes('Regulasi')) kpiData.keluhanTertinggi = 'Regulasi';
      else if (highest.includes('SDM')) kpiData.keluhanTertinggi = 'Masalah SDM';
      else if (highest.includes('Pendanaan')) kpiData.keluhanTertinggi = 'Pendanaan';
      else if (highest.includes('Waktu')) kpiData.keluhanTertinggi = 'Waktu Pelayanan';
      else kpiData.keluhanTertinggi = highest;
    }

    if (tren.length > 1) {
      const currentMonth = tren[tren.length - 1]['Tingkat Keluhan'];
      const prevMonth = tren[tren.length - 2]['Tingkat Keluhan'];
      const diff = currentMonth - prevMonth;
      kpiData.trenBulanIni = diff > 0 ? `+${diff}%` : `${diff}%`;
    } else if (tren.length === 1) {
      kpiData.trenBulanIni = `${tren[0]['Tingkat Keluhan']}%`;
    }

    kpiData.keluhanSdm = sdm;

    let faskesDenganKendala = 0;
    surveys.forEach(row => {
      let allText = '';
      if (row.wawancara) {
         Object.values(row.wawancara).forEach(val => {
           if (val) allText += String(val).toLowerCase() + ' ';
         });
      }
      if (allText.match(/pcare|p-care|aplikasi|input|jaringan|klaim|beban|administrasi|ribet|kertas|regulasi|aturan|berubah|sosialisasi|rujukan|wewenang|kompetensi|insentif|jasa|medis|kapitasi|sdm|perawat|tenaga|kurang|dana|biaya|bayar|tunggak|waktu|lama|antre|tunggu/)) {
        faskesDenganKendala++;
      }
    });
    kpiData.faskesMelapor = total > 0 ? `${Math.round((faskesDenganKendala / total) * 100)}%` : '0%';

    return { persepsiUmum: persepsi, trenKepuasan: tren, pieData: pie, dataSkeptisisme: skeptisisme, skeptisismeQuotes: quotes, kpiData };
  }, [surveys]);

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6'];

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(persepsiUmum.map(d => ({ 'Kategori': d.name, 'Persentase (%)': d.value, 'Jumlah Responden': d.count })));
    XLSX.utils.book_append_sheet(wb, ws1, "Persepsi Umum");
    const ws2 = XLSX.utils.json_to_sheet(dataSkeptisisme);
    XLSX.utils.book_append_sheet(wb, ws2, "Tingkat Skeptisisme");
    XLSX.writeFile(wb, `Export_Persepsi_Negatif_${new Date().getTime()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin mb-4" />
        <p className="text-slate-600 font-medium animate-pulse">Memuat data persepsi negatif...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12" id="dashboard-persepsi-negatif-container">
      {/* Header */}
      <div className="bg-gradient-to-br from-red-50 to-white p-6 md:p-8 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 translate-y-1/2 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-red-100 text-red-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
            <AlertTriangle className="w-4 h-4" />
            <span>Analisis Risiko & Hambatan</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-3 tracking-tight">
            Persepsi Negatif <span className="text-red-600">& Tantangan Sp.KKLP</span>
          </h1>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed">
            Menyajikan analisis terhadap keluhan, persepsi negatif, dan tantangan yang dihadapi oleh tenaga medis dalam implementasi program di lapangan.
          </p>
        </div>

        <div className="flex gap-3 relative z-10 w-full md:w-auto">
          <button
            onClick={() => downloadElementAsPNG('dashboard-persepsi-negatif-container', 'Dashboard_Persepsi_Negatif')}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-red-600 rounded-xl transition-all shadow-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simpan PNG</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all shadow-md shadow-red-500/20 font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Tingkat Keluhan Tertinggi', value: kpiData.keluhanTertinggi, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
          { title: 'Tren Komplain (Bulan ini)', value: kpiData.trenBulanIni, icon: TrendingDown, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
          { title: 'Responden Mengeluh SDM', value: `${kpiData.keluhanSdm} Orang`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
          { title: 'Proporsi Melapor Kendala', value: kpiData.faskesMelapor, icon: Frown, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' }
        ].map((kpi, idx) => (
          <div key={idx} className={`p-6 rounded-2xl bg-white border ${kpi.border} shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}>
            <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full ${kpi.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-semibold text-slate-500 mb-1">{kpi.title}</p>
                <p className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Persepsi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 mb-6">
             <div className="p-2 bg-red-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Distribusi Isu & Tantangan Utama</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={persepsiUmum} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={150} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value}% Responden`, 'Proporsi']}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24} animationDuration={1500}>
                  {persepsiUmum.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart Tren */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[400px]">
          <div className="flex items-center space-x-2 mb-6">
             <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingDown className="w-5 h-5 text-orange-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Tren Intensitas Keluhan (2026)</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trenKepuasan} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorKeluhan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="bulan" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="Tingkat Keluhan" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorKeluhan)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Baris Chart Skeptisisme */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center h-[350px]">
          <div className="flex items-center space-x-2 mb-2 w-full">
             <div className="p-2 bg-slate-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-slate-700" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Tingkat Skeptisisme</h3>
          </div>
          <p className="text-sm text-slate-500 mb-4 w-full">Persentase responden yang meragukan efektivitas penurunan rujukan (dari total keluhan).</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataSkeptisisme}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                animationDuration={1500}
              >
                {dataSkeptisisme.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(value) => [`${value}%`, 'Persentase']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col justify-center">
          <h4 className="font-bold text-slate-700 mb-4 text-lg">Akar Masalah Keraguan Utama</h4>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-red-100 bg-red-50 flex gap-4 items-start">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0 mt-1"><AlertTriangle className="w-5 h-5"/></div>
              <div>
                <h5 className="font-bold text-red-800">1. Sistem Regulasi yang "Kaku"</h5>
                <p className="text-sm text-red-600/80 mt-1">Sp.KKLP tidak dapat mengeksekusi kewenangannya untuk menahan rujukan (misal: peresepan kronis spesifik) karena terkunci di aturan P-Care BPJS.</p>
              </div>
            </div>
            <div className="p-4 rounded-xl border border-orange-100 bg-orange-50 flex gap-4 items-start">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0 mt-1"><Clock className="w-5 h-5"/></div>
              <div>
                <h5 className="font-bold text-orange-800">2. "Sama Saja" / Beban Tambahan</h5>
                <p className="text-sm text-orange-600/80 mt-1">Dokter merasa tanpa insentif dan SDM tambahan (perawat/admin), implementasi preventif seperti Home Care hanya menambah lelah tanpa outcome jelas.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-bold text-slate-800">Suara dari Lapangan (Verbatim)</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { text: "Beban administratif untuk pengisian aplikasi PCare sangat menyita waktu layanan klinis pasien.", role: "Dokter Umum", puskesmas: "Puskesmas A", type: "Administrasi" },
              { text: "Insentif jasa medis tidak sebanding dengan beban kerja tambahan untuk program promosi kesehatan.", role: "Kepala Puskesmas", puskesmas: "Puskesmas B", type: "Insentif" },
              { text: "Kurangnya pelatihan untuk alat-alat diagnostik baru seperti USG Dasar membuat alat sering nganggur.", role: "Dokter Spesialis", puskesmas: "Klinik Pratama C", type: "Fasilitas" },
              { text: "Target indikator terlalu banyak dan sering berubah-ubah dari dinas kesehatan.", role: "Perawat", puskesmas: "Puskesmas D", type: "Regulasi" },
            ].map((quote, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                      {quote.type}
                    </span>
                  </div>
                  <p className="text-slate-700 italic text-sm mb-4">"{quote.text}"</p>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">{quote.role}</span>
                  <span>{quote.puskesmas}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel Verbatim Skeptisisme */}
      {skeptisismeQuotes.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
             <div className="p-2 bg-indigo-50 rounded-lg">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800">Suara Lapangan: Detail Keraguan (Verbatim)</h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">Berikut adalah kutipan langsung dari jawaban kualitatif tenaga medis yang mencerminkan skeptisisme terhadap efektivitas kebijakan saat ini.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {skeptisismeQuotes.map((quote, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${quote.level === 'Tinggi' ? 'bg-red-100 text-red-700' : quote.level === 'Sedang' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      Skeptis {quote.level}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 line-clamp-1 max-w-[150px] truncate" title={quote.fktp}>{quote.fktp}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">"{quote.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPersepsiNegatif;
