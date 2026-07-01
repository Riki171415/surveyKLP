import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { Clock, AlertTriangle, CheckCircle2, TrendingDown, Target, Info, Loader2, ListChecks, Download } from 'lucide-react';
import { supabase } from '../supabaseClient';
import * as XLSX from 'xlsx';

const DashboardBebanKerjaDokter = () => {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
        let data = [];
        if (useSupabase) {
          const { data: sbData, error } = await supabase.from('surveys').select('fktp_name, kompetensi');
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

  // Data Waktu Layanan
  const workloadData = [
    { name: 'Dalam Gedung', Pasien: 80, Waktu: 47, fill: '#0ea5e9' },
    { name: 'Home Visit (Luar Gedung)', Pasien: 20, Waktu: 53, fill: '#f59e0b' },
  ];

  // Data Prioritas Kesenjangan Kompetensi
  const competencyData = [
    { nama: 'Deprescribing', effort: 2, impact: 9, kuadran: 'Quick Wins', color: '#10b981' },
    { nama: 'Family Conference', effort: 5, impact: 8, kuadran: 'Major Projects', color: '#3b82f6' },
    { nama: 'USG Dasar', effort: 8, impact: 8, kuadran: 'Major Projects', color: '#f59e0b' },
    { nama: 'Pemeriksaan X-ray', effort: 9, impact: 7, kuadran: 'Long Term', color: '#ef4444' }
  ];

  const kompetensiLayananList = [
    "Pemeriksaan USG Dasar untuk penegakan diagnosis",
    "Deprescribing (pengurangan/rasionalisasi obat pasien kronis)",
    "Family Conference (Konsultasi keluarga untuk penyelesaian masalah klinis/psikososial)",
    "Pemeriksaan Xray untuk penegakan diagnosis"
  ];

  const tableData = kompetensiLayananList.map((namaLayanan, idx) => {
    let sudah = 0;
    let belum = 0;
    const kendalaMap = new Map();
    const allKendalaList = [];

    surveys.forEach(survey => {
      if (survey.kompetensi && survey.kompetensi[idx]) {
        if (survey.kompetensi[idx].status === 'sudah') sudah++;
        if (survey.kompetensi[idx].status === 'belum') {
          belum++;
          const kendalaText = survey.kompetensi[idx].kendala;
          if (kendalaText && kendalaText.trim() !== '') {
             const key = kendalaText.trim().toLowerCase();
             kendalaMap.set(key, (kendalaMap.get(key) || 0) + 1);
             allKendalaList.push(kendalaText.trim());
          }
        }
      }
    });

    // Mengambil maksimal 3 kendala paling sering muncul
    const topKendala = Array.from(kendalaMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3)
      .join(', ');

    return {
      namaLayanan,
      sudah,
      belum,
      total: sudah + belum,
      kendala: topKendala ? topKendala : '-',
      allKendala: allKendalaList
    };
  });

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Semua Isian Responden (Detail per Faskes) ──
    // Nama pendek layanan untuk kolom header
    const shortNames = ['USG Dasar', 'Deprescribing', 'Family Conference', 'Pemeriksaan X-ray'];
    const detailHeadersFinal = [
      'No', 'Nama Faskes',
      ...shortNames.map(n => `Status: ${n}`),
      ...shortNames.map(n => `Kendala: ${n}`),
    ];

    const detailRows = surveys.map((survey, idx) => [
      idx + 1,
      survey.fktp_name || '-',
      ...kompetensiLayananList.map((_, i) => survey.kompetensi?.[i]?.status || '-'),
      ...kompetensiLayananList.map((_, i) => survey.kompetensi?.[i]?.kendala || '-'),
    ]);

    // Tambah baris rata-rata / rekap
    const rekapRow = [
      'REKAP', '',
      ...kompetensiLayananList.map((_, i) => {
        const sudah = surveys.filter(s => s.kompetensi?.[i]?.status === 'sudah').length;
        return `Sudah: ${sudah} | Belum: ${surveys.filter(s => s.kompetensi?.[i]?.status === 'belum').length}`;
      }),
      ...kompetensiLayananList.map(() => ''),
    ];

    const ws1 = XLSX.utils.aoa_to_sheet([detailHeadersFinal, ...detailRows, ['---'], rekapRow]);
    ws1['!cols'] = [{ wch: 5 }, { wch: 35 }, ...shortNames.map(() => ({ wch: 18 })), ...shortNames.map(() => ({ wch: 40 }))];
    XLSX.utils.book_append_sheet(wb, ws1, 'Detail Per Faskes');

    // ── Sheet 2: Ringkasan Kompetensi ──
    const summaryHeaders = ['Jenis Layanan', 'Sudah Berjalan', 'Belum Berjalan', 'Total Responden', 'Ringkasan Kendala Utama'];
    const summaryRows = tableData.map(row => [
      row.namaLayanan, row.sudah, row.belum, row.total, row.kendala
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
    ws2['!cols'] = [{ wch: 55 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan Kompetensi');

    // ── Sheet 3: Analitik Beban Kerja ──
    const analyticsData = [
      ['DASHBOARD BEBAN KERJA & KOMPETENSI DOKTER'],
      [],
      ['A. OPERASIONAL & EFISIENSI WAKTU (WACT)'],
      ['Metrik', 'Nilai', 'Keterangan'],
      ['Rata-rata Waktu per Pasien (WACT)', '17 menit', 'Gabungan dalam & luar gedung'],
      ['Kapasitas Maksimal Harian', '26 pasien', 'Total Waktu Produktif 450 menit ÷ WACT 17 menit'],
      ['Proporsi Pasien Dalam Gedung', '80%', 'Waktu rata-rata 10 menit/pasien'],
      ['Proporsi Pasien Luar Gedung (Home Visit)', '20%', 'Waktu rata-rata 45 menit/pasien'],
      [],
      ['B. PARADOKS VOLUME PASIEN VS WAKTU TERSITA'],
      ['Segmen', 'Proporsi Jumlah Pasien (%)', 'Proporsi Waktu Tersita (%)'],
      ['Dalam Gedung', '80%', '47%'],
      ['Home Visit (Luar Gedung)', '20%', '53%'],
      [],
      ['C. MATRIKS PRIORITAS KESENJANGAN KOMPETENSI'],
      ['Kompetensi', 'Effort (Upaya, 1-10)', 'Impact (Dampak, 1-10)', 'Kuadran Prioritas'],
      ...competencyData.map(c => [c.nama, c.effort, c.impact, c.kuadran]),
      [],
      ['D. POTENSI OPPORTUNITY COST'],
      ['Item', 'Nilai'],
      ['Rata-rata rujukan per hari', '5 Pasien'],
      ['Asumsi nilai hilang per pasien', 'Rp 100.000'],
      ['Potensi kebocoran harian', 'Rp 500.000'],
      ['Total 1 Bulan (20 Hari Kerja)', 'Rp 10.000.000'],
      ['Total 1 Tahun (12 Bulan)', 'Rp 120.000.000'],
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(analyticsData);
    ws3['!cols'] = [{ wch: 45 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, ws3, 'Analitik Beban Kerja');

    XLSX.writeFile(wb, `Dashboard_BebanKerja_Dokter_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard Analitik: Kompetensi & Beban Kerja Dokter</h1>
          <p className="text-slate-500 mt-1">Sistem Pemantauan Kapasitas, Kesenjangan Kompetensi, dan Analisis Beban Waktu Harian.</p>
        </div>
        <button
          onClick={exportToExcel}
          disabled={loading || surveys.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          Download Excel
        </button>
      </div>

      {/* EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Paradoks Waktu Layanan</h3>
              <p className="text-sm text-amber-700 mt-1">20% pasien Home Visit menyedot <strong>53%</strong> waktu produktif harian dokter. Terdapat inefisiensi alokasi.</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-rose-50 to-red-50 p-5 rounded-xl border border-rose-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-rose-100 p-3 rounded-lg text-rose-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900 text-lg">Risiko Kesenjangan Diagnostik</h3>
              <p className="text-sm text-rose-700 mt-1">Ketiadaan layanan USG & X-ray berpotensi menimbulkan <strong>opportunity cost</strong> sangat besar secara operasional.</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-lg">Prioritas Utama (Quick Win)</h3>
              <p className="text-sm text-emerald-700 mt-1">Segera implementasikan <strong>Deprescribing</strong>; effort nol, dampak klinis bagi pasien kronis tinggi.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 1: WORKLOAD ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-600" />
            Operasional & Efisiensi Waktu (WACT)
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
              <p className="text-sm font-medium text-slate-500 mb-1">Rata-rata Waktu / Pasien (WACT)</p>
              <p className="text-3xl font-black text-slate-800">17 <span className="text-lg font-medium text-slate-500">menit</span></p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-red-100 text-red-600 px-2 py-0.5 text-xs font-bold rounded-bl-lg">LIMIT</div>
              <p className="text-sm font-medium text-slate-500 mb-1">Kapasitas Maksimal Harian</p>
              <p className="text-3xl font-black text-rose-600">26 <span className="text-lg font-medium text-rose-400">pasien</span></p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-1"><Info className="w-4 h-4"/> Detail Rumus Perhitungan WACT:</h4>
            <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded border border-blue-200 overflow-x-auto whitespace-nowrap">
              WACT = (Proporsi Dalam Gedung × Waktu Dalam Gedung) + (Proporsi Luar Gedung × Waktu Luar Gedung)<br/>
              WACT = (80% × 10 menit) + (20% × 45 menit)<br/>
              WACT = 8 menit + 9 menit = <b>17 menit per pasien</b><br/><br/>
              Kapasitas Harian = Total Waktu Produktif (450 menit) ÷ WACT (17 menit) = <b>~26 pasien/hari</b>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mt-auto">
            Jika pasien harian melebihi angka 26, dokter berada di zona overload yang berisiko terjadinya <i>burnout</i> dan penurunan kualitas layanan klinis.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-primary-600" />
            Paradoks Volume Pasien vs Waktu Tersita (%)
          </h2>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workloadData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" unit="%" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Bar dataKey="Pasien" name="Proporsi Jumlah Pasien (%)" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Waktu" name="Proporsi Waktu Tersita (%)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 text-sm text-slate-600">
            <strong>Analisis:</strong> Terlihat jelas ketimpangan pada layanan Luar Gedung (Home Visit). Meski jumlah pasiennya hanya 20%, namun menghabiskan 53% total waktu karena memakan 45 menit per sesinya.
          </div>
        </div>
      </div>

      {/* ROW 1.5: TABEL HASIL ISIAN RESPONDEN */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-primary-600" />
              Tabel Kompetensi Layanan (Hasil Isian Responden)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Akumulasi status kompetensi layanan yang sudah/belum berjalan dari {surveys.length} faskes.</p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase w-[35%]">Jenis Layanan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-center">Sudah Berjalan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase text-center">Belum Berjalan</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-600 uppercase">Ringkasan Kendala Utama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && surveys.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center text-slate-400">
                    Memuat tabel data...
                  </td>
                </tr>
              ) : tableData.map((row, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800 text-sm">
                    {row.namaLayanan}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold text-sm border border-emerald-100">
                      {row.sudah}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 bg-rose-50 text-rose-700 rounded-md font-bold text-sm border border-rose-100">
                      {row.belum}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 italic">
                    {row.belum === 0 ? <span className="text-slate-400 not-italic">-</span> : <span className="capitalize">{row.kendala}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 2: COMPETENCY & FINANCIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Matriks Prioritas Kesenjangan Kompetensi</h2>
          <p className="text-sm text-slate-500 mb-6">Scatter plot mengukur besaran upaya (Effort) vs dampak klinis (Impact) dari kompetensi yang belum berjalan.</p>
          
          <div className="h-[250px] relative">
            {/* Quadrant Backgrounds */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 ml-[30px] mb-[30px] opacity-[0.03] pointer-events-none">
              <div className="bg-blue-500 border-r border-b border-slate-300"></div> {/* High Impact, Low Effort */}
              <div className="bg-green-500 border-b border-slate-300"></div> {/* High Impact, High Effort */}
              <div className="bg-yellow-500 border-r border-slate-300"></div> {/* Low Impact, Low Effort */}
              <div className="bg-red-500"></div> {/* Low Impact, High Effort */}
            </div>
            
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="effort" name="Effort (Upaya)" unit="" domain={[0, 10]} label={{ value: 'Effort (Makin tinggi makin sulit)', position: 'insideBottom', offset: -10, fontSize: 12 }} />
                <YAxis type="number" dataKey="impact" name="Impact (Dampak)" unit="" domain={[0, 10]} label={{ value: 'Impact (Dampak Klinis)', angle: -90, position: 'insideLeft', fontSize: 12 }} />
                <ZAxis type="number" range={[200, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                  content={({ payload }) => {
                    if (payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-slate-200 shadow-md rounded">
                          <p className="font-bold text-slate-800">{data.nama}</p>
                          <p className="text-sm">Impact: {data.impact}/10</p>
                          <p className="text-sm">Effort: {data.effort}/10</p>
                          <p className="text-xs mt-1 font-bold" style={{color: data.color}}>{data.kuadran}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Kompetensi" data={competencyData} fill="#8884d8">
                  {competencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm bg-emerald-50 p-2 rounded text-emerald-800 border border-emerald-100">
              <span className="w-3 h-3 rounded-full bg-[#10b981]"></span> <strong>Quick Win:</strong> Deprescribing (Bisa dilakukan langsung, nol biaya)
            </div>
            <div className="flex items-center gap-2 text-sm bg-amber-50 p-2 rounded text-amber-800 border border-amber-100">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> <strong>Major Project:</strong> USG Dasar & Family Conference (Butuh pelatihan/waktu)
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-4 text-rose-700">Potensi Kebocoran Finansial (Opportunity Cost)</h2>
          
          <div className="flex-1 flex flex-col justify-center items-center py-6">
            <p className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-sm">Proyeksi Nilai Hilang per Tahun</p>
            <h3 className="text-5xl font-black text-rose-600 mb-2">Rp 120<span className="text-2xl"> Juta</span></h3>
            <p className="text-sm text-slate-400">akibat absennya layanan Diagnostik Dasar (USG & X-Ray)</p>
          </div>

          <div className="bg-rose-50 rounded-xl p-5 border border-rose-100 mt-auto">
            <h4 className="font-bold text-rose-900 mb-3 border-b border-rose-200 pb-2 flex items-center gap-2"><Info className="w-5 h-5"/> Detail Asumsi & Rumus</h4>
            
            <p className="text-xs text-rose-700 mb-3">
              *Catatan: Angka Rp 100.000 digunakan sebagai <b>asumsi simulasi/proyeksi nilai ekonomi</b> (potensi kapitasi/klaim FFS) yang hilang per pasien karena tidak ada tarif riil yang diberikan pada data awal.
            </p>

            <ul className="text-sm text-rose-800 space-y-2 font-mono">
              <li className="flex justify-between">
                <span>Rata-rata rujukan per hari:</span>
                <span className="font-bold">5 Pasien</span>
              </li>
              <li className="flex justify-between">
                <span>Asumsi Nilai Hilang per pasien:</span>
                <span className="font-bold">Rp 100.000</span>
              </li>
              <li className="flex justify-between">
                <span>Potensi Kebocoran Harian:</span>
                <span className="font-bold text-rose-600">Rp 500.000</span>
              </li>
              <li className="flex justify-between pt-2 border-t border-rose-200">
                <span>Total 1 Bulan (20 Hari Kerja):</span>
                <span className="font-bold">Rp 10.000.000</span>
              </li>
              <li className="flex justify-between font-bold text-base text-rose-900 mt-1">
                <span>Total 1 Tahun (12 Bulan):</span>
                <span>Rp 120.000.000</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ROW 3: STRATEGI HOME VISIT */}
      <div className="bg-slate-900 rounded-xl shadow-lg border border-slate-800 p-8 text-white">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-400" />
          Rekomendasi Optimasi Home Visit
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-indigo-400 transition-colors">
            <h3 className="font-bold text-indigo-300 mb-2">1. Geographic Clustering</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Jadwalkan kunjungan rumah berdasarkan klaster wilayah (misal: Desa A pada hari Selasa, Desa B pada hari Kamis) untuk memangkas waktu perjalanan yang tidak produktif.
            </p>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-purple-400 transition-colors">
            <h3 className="font-bold text-purple-300 mb-2">2. Task Shifting (Delegasi)</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Untuk kasus kontrol rutin non-gawat, delegasikan kunjungan fisik kepada Perawat/Bidan Desa, dengan supervisi dokter via layanan telekonsultasi.
            </p>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 hover:border-pink-400 transition-colors">
            <h3 className="font-bold text-pink-300 mb-2">3. Tele-Monitoring Berjangka</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Pasien kronis yang kondisinya stabil di-<i>follow up</i> via WhatsApp/Video Call, mengurangi frekuensi kunjungan fisik bulanan tanpa mengorbankan kualitas pantauan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardBebanKerjaDokter;
