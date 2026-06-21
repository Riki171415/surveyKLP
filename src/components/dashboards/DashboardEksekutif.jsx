import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import { 
  LayoutDashboard, Activity, CheckSquare, Stethoscope, AlertTriangle, 
  MessageSquare, FileText, ChevronRight
} from 'lucide-react';

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const jknBenefits = [
  "Terapi pasien AIDS, TB, dan Malaria",
  "Program Rujuk Balik (PRB)",
  "Pengelolaan Hipertensi tanpa komplikasi",
  "Deprescribing/pengurangan obat"
];

const nonOptimalServices = [
  "Lifestyle medicine",
  "Wellness dan healthy aging",
  "Konsultasi perjalanan",
  "Manajemen pasien geriatri frailty",
  "Precision medicine",
  "Layanan promotif berbasis keluarga"
];

const relevansiItems = [
  "Layanan promotif-preventif lebih komprehensif",
  "Penanganan multimorbiditas tanpa rujukan",
  "Manajemen PRB & kepatuhan pasien",
  "Penurunan angka rujukan ke RS",
  "Kunjungan rumah & family conference",
  "Mutu rekam medis & dokumentasi klinis",
  "Waktu konsultasi lebih lama & mendalam"
];


const ExecutiveInsight = ({ tab }) => {
  const insights = {
    overview: {
      title: "Executive Insight: Profil Kesiapan Fasilitas Primer",
      iconColor: "text-blue-500",
      bgLight: "bg-blue-50",
      points: [
        { title: "Dominasi Puskesmas", desc: "Sebagian besar data survei diisi oleh Puskesmas, yang merepresentasikan ujung tombak layanan primer pemerintah." },
        { title: "Kesenjangan Distribusi", desc: "Terdapat gap yang signifikan antara ketersediaan Sp.KKLP di kota besar dibandingkan daerah rural. Ini mengindikasikan perlunya intervensi penempatan secara khusus." },
        { title: "Potensi Skala Nasional", desc: "Jika 10% saja dari FKTP yang belum memiliki Sp.KKLP ini segera dipenuhi, kapasitas promotif-preventif JKN akan meningkat tajam." }
      ]
    },
    ketersediaan: {
      title: "Executive Insight: Optimalisasi & Perluasan JKN",
      iconColor: "text-amber-500",
      bgLight: "bg-amber-50",
      points: [
        { title: "Validasi Layanan Eksisting", desc: "Program PRB dan pemantauan penyakit kronis dinilai sebagai layanan JKN yang paling dirasakan manfaatnya saat ini." },
        { title: "Urgensi Pembiayaan Baru", desc: "Layanan Lifestyle Medicine dan Promotif Berbasis Keluarga menduduki peringkat teratas usulan layanan yang HARUS dibiayai JKN." },
        { title: "Transisi Paradigma", desc: "Sistem JKN perlu segera bertransisi dari 'Kuratif-Sentris' menjadi 'Preventif-Proaktif' dengan memberikan insentif khusus bagi FKTP yang aktif melakukan home care." }
      ]
    },
    perbandingan: {
      title: "Executive Insight: Dampak Nyata Sp.KKLP di Lapangan",
      iconColor: "text-emerald-500",
      bgLight: "bg-emerald-50",
      points: [
        { title: "Keunggulan Klinis", desc: "FKTP dengan Sp.KKLP terbukti memiliki skor penanganan multimorbiditas tanpa rujukan yang jauh lebih superior dibanding FKTP tanpa Sp.KKLP." },
        { title: "Waktu Konsultasi Efektif", desc: "Meskipun memiliki beban manajerial, dokter Sp.KKLP secara konsisten memberikan waktu konsultasi yang lebih mendalam dan komprehensif bagi pasien." },
        { title: "Efisiensi Sistem", desc: "Kemampuan menyelesaikan masalah kompleks di FKTP secara langsung berdampak pada penurunan angka rujukan yang tidak perlu ke rumah sakit." }
      ]
    },
    rujukan: {
      title: "Executive Insight: Menutup Kebocoran Rujukan Primer",
      iconColor: "text-rose-500",
      bgLight: "bg-rose-50",
      points: [
        { title: "Red Flag Rujukan PTM", desc: "Kasus Penyakit Tidak Menular (PTM) tanpa komplikasi masih mendominasi rujukan, mengindikasikan fungsi gatekeeper belum optimal di banyak daerah." },
        { title: "Tantangan Bedah Minor", desc: "Tingginya rujukan bedah minor menyoroti kurangnya ketersediaan alat medis dasar atau insentif tindakan bagi dokter di FKTP." },
        { title: "Rekomendasi Kebijakan", desc: "Wajibkan pendampingan klinis oleh Sp.KKLP di puskesmas dengan rasio rujukan PTM tertinggi untuk menekan beban klaim BPJS secara drastis." }
      ]
    },
    hambatan: {
      title: "Executive Insight: Hambatan Operasional & Finansial",
      iconColor: "text-orange-500",
      bgLight: "bg-orange-50",
      points: [
        { title: "Krisis SDM & Sarana", desc: "Kurangnya SDM pendukung dan sarana prasarana menjadi batu sandungan utama bagi dokter Sp.KKLP untuk mengimplementasikan keilmuannya secara utuh." },
        { title: "Regulasi Insentif", desc: "Tidak adanya skema kapitasi atau jasa medis spesifik untuk Sp.KKLP menurunkan motivasi dan menghambat distribusi spesialis ke daerah." },
        { title: "Solusi Cepat", desc: "Kemenkes perlu berkoordinasi dengan BPJS untuk menerbitkan regulasi insentif 'Top-Up' berbasis performa kualitas layanan preventif." }
      ]
    },
    kualitatif: {
      title: "Executive Insight: Aspirasi & Sentimen Akar Rumput",
      iconColor: "text-indigo-500",
      bgLight: "bg-indigo-50",
      points: [
        { title: "Kebingungan Kewenangan", desc: "Banyak nakes di puskesmas masih bingung membedakan kewenangan klinis antara dokter umum dan Sp.KKLP. Perlu pedoman klinis (PNPK) yang tegas." },
        { title: "Tuntutan Realistis", desc: "Permintaan terbanyak di lapangan bukanlah insentif mewah, melainkan kejelasan regulasi JKN dan ketersediaan obat kronis PRB yang sering kosong." },
        { title: "Moral Kerja", desc: "Dukungan moril dari Dinas Kesehatan sangat dibutuhkan agar program kedokteran keluarga tidak dilihat sebagai beban administratif tambahan semata." }
      ]
    }
  };

  const current = insights[tab];
  if (!current) return null;

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-lg">
      <div className={`absolute top-0 right-0 w-64 h-64 ${current.bgLight} rounded-full blur-3xl -z-10`}></div>
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide uppercase">{current.title}</h2>
      </div>
      
      <div className="space-y-6 text-slate-600 leading-relaxed text-sm md:text-base">
        {current.points.map((pt, i) => (
          <div key={i} className="flex items-start gap-4">
            <div className={`w-8 h-8 rounded-full ${current.bgLight} ${current.iconColor} flex items-center justify-center shrink-0 font-bold`}>{i+1}</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">{pt.title}</h4>
              <p>{pt.desc}</p>
            </div>
          </div>
        ))}
        <ExecutiveInsight tab={activeTab} />
      </div>
    </div>
  );
};

export default function DashboardEksekutif({ data = [] }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Kalkulasi metrics umum
  const metrics = useMemo(() => {
    // 1. Overview
    const fktpType = { Puskesmas: 0, Klinik: 0, 'Dokter Praktik Mandiri': 0 };
    let spkklpCount = 0;
    const cityMap = {};
    
    // 2. Ketersediaan & JKN
    const jknScores = { Puskesmas: Array(4).fill(0).map(()=>({sum:0, count:0})), Klinik: Array(4).fill(0).map(()=>({sum:0, count:0})), 'Dokter Praktik Mandiri': Array(4).fill(0).map(()=>({sum:0, count:0})) };
    const usulanScores = Array(6).fill(0).map(()=>({sum:0, count:0}));
    
    // 3. Perbandingan
    const relevansiScores = {
      withSpkklp: Array(7).fill(0).map(()=>({sum:0, count:0})),
      withoutSpkklp: Array(7).fill(0).map(()=>({sum:0, count:0}))
    };
    const scatterData = [];
    
    // 4. Rujukan & PRB
    const rujukanMap = {};
    let prbStats = { jumlah: 0, rutin: 0, rujukan: 0, rujukanCount: 0 };

    // 5. Hambatan
    const spkklpKendalaCount = {
      'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 
      'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0
    };
    const textHambatan = [];

    // Iterasi data
    data.forEach(row => {
      // Jenis FKTP
      if (row.jenis_faskes) {
        if (fktpType[row.jenis_faskes] !== undefined) fktpType[row.jenis_faskes]++;
      } else {
        const fname = (row.fktp_name || '').toLowerCase();
        if (row.role === 'Dokter Praktik Mandiri') fktpType['Dokter Praktik Mandiri']++;
        else if (fname.includes('puskesmas') || fname.includes('pkm') || fname.includes('puseksmas') || fname.includes('puskes')) fktpType.Puskesmas++;
        else fktpType.Klinik++;
      }

      // SpKKLP
      if (row.doc_kklp === 'Ya') spkklpCount++;

      let jnsFktp = row.jenis_faskes;
      if (!jnsFktp) {
        const fname = (row.fktp_name || '').toLowerCase();
        if (row.role === 'Dokter Praktik Mandiri') jnsFktp = 'Dokter Praktik Mandiri';
        else if (fname.includes('puskesmas') || fname.includes('pkm') || fname.includes('puseksmas') || fname.includes('puskes')) jnsFktp = 'Puskesmas';
        else jnsFktp = 'Klinik';
      }

      // JKN
      if (row.jkn && jnsFktp) {
        for (let i = 0; i < 4; i++) {
          const val = row.jkn[i];
          if (val) {
            const skala = typeof val === 'object' ? val.skala : val;
            if (skala) {
              jknScores[jnsFktp][i].sum += Number(skala);
              jknScores[jnsFktp][i].count++;
            }
          }
        }
      }

      // Non-Optimal
      if (row.non_optimal) {
        for (let i = 0; i < 6; i++) {
          const val = row.non_optimal[i];
          if (val) {
            const skala = typeof val === 'object' ? val.skala : val;
            if (skala === '3' || skala === '4' || skala === 'Setuju' || skala === 'Sangat Setuju') {
              usulanScores[i].sum += 1;
            }
            usulanScores[i].count++;
          }
        }
      }

      // City Map
      const city = row.kab_kota || row.city || 'Unknown';
      if (!cityMap[city]) cityMap[city] = { name: city, withSpKKLP: 0, withoutSpKKLP: 0, total: 0 };
      cityMap[city].total++;
      if (row.doc_kklp === 'Ya') cityMap[city].withSpKKLP++;
      else cityMap[city].withoutSpKKLP++;
      // Perbandingan Relevansi
      if (row.relevansi_spkklp) {
        const group = row.doc_kklp === 'Ya' ? 'withSpkklp' : 'withoutSpkklp';
        for (let i = 0; i < 7; i++) {
          const val = row.relevansi_spkklp[i];
          if (val) {
            const num = typeof val === 'object' ? Number(val.skala || 0) : Number(val);
            if (!isNaN(num) && num > 0) {
              relevansiScores[group][i].sum += num;
              relevansiScores[group][i].count++;
            }
          }
        }
      }

      // Scatter Waktu Poli vs Proporsi Dalam Gedung (Hanya untuk Dokter/Sp.KKLP yang mengisi waktu)
      if (row.time_in_poli && row.prop_in_fktp && Number(row.prop_in_fktp) > 0) {
        scatterData.push({
          x: Number(row.time_in_poli),
          y: Number(row.prop_in_fktp),
          role: row.role,
          name: row.fktp_name || 'Faskes'
        });
      }

      // Rujukan
      if (row.layanan_dirujuk) {
        Object.keys(row.layanan_dirujuk).forEach(k => {
          if (row.layanan_dirujuk[k]) rujukanMap[k] = (rujukanMap[k] || 0) + 1;
        });
      }

      // PRB
      if (row.prb) {
        prbStats.jumlah += Number(row.prb.jumlah) || 0;
        prbStats.rutin += Number(row.prb.rutinKunjungan) || 0;
        if (row.prb.rataRujukan) {
          prbStats.rujukan += Number(row.prb.rataRujukan);
          prbStats.rujukanCount++;
        }
      }
      // Kendala SpKKLP
      if (row.spkklp_kendala && row.spkklp_kendala.hasKendala === 'Ya') {
        Object.keys(spkklpKendalaCount).forEach(k => {
          if (row.spkklp_kendala[`kendala_${k}`]) spkklpKendalaCount[k]++;
        });
        if (row.spkklp_kendala.diagnosis) {
          textHambatan.push({ type: 'Klinis SpKKLP', text: row.spkklp_kendala.diagnosis, faskes: row.fktp_name || 'Anonim' });
        }
      }

      // Kendala PRB text
      if (row.prb && row.prb.kendala) {
        textHambatan.push({ type: 'PRB', text: row.prb.kendala, faskes: row.fktp_name || 'Anonim' });
      }
    });

    const pieData = Object.keys(fktpType).map(k => ({ name: k, value: fktpType[k] })).filter(d => d.value > 0);
    const cityData = Object.values(cityMap).sort((a, b) => b.total - a.total).slice(0, 15); // Top 15 cities

    const radarJkn = jknBenefits.map((label, i) => {
      const p = jknScores.Puskesmas[i];
      const k = jknScores.Klinik[i];
      const d = jknScores['Dokter Praktik Mandiri'][i];
      return {
        subject: label,
        Puskesmas: p.count > 0 ? Number((p.sum / p.count).toFixed(1)) : 0,
        Klinik: k.count > 0 ? Number((k.sum / k.count).toFixed(1)) : 0,
        DPM: d.count > 0 ? Number((d.sum / d.count).toFixed(1)) : 0,
        fullMark: 4
      };
    });

    const barUsulan = nonOptimalServices.map((label, i) => {
      const u = usulanScores[i];
      return {
        name: label,
        value: u.count > 0 ? Math.round((u.sum / u.count) * 100) : 0
      };
    }).sort((a,b) => b.value - a.value);

    const barRelevansi = relevansiItems.map((label, i) => {
      const w = relevansiScores.withSpkklp[i];
      const wo = relevansiScores.withoutSpkklp[i];
      return {
        name: label,
        withSpkklp: w.count > 0 ? Number((w.sum / w.count).toFixed(1)) : 0,
        withoutSpkklp: wo.count > 0 ? Number((wo.sum / wo.count).toFixed(1)) : 0
      };
    });

    const topRujukan = Object.keys(rujukanMap)
      .map(k => ({ name: k, value: Math.round((rujukanMap[k] / data.length) * 100) }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 10);

    const prbKepatuhan = prbStats.jumlah > 0 ? Math.round((prbStats.rutin / prbStats.jumlah) * 100) : 0;
    const avgRujukanPrb = prbStats.rujukanCount > 0 ? Math.round(prbStats.rujukan / prbStats.rujukanCount) : 0;

    const barKendala = Object.keys(spkklpKendalaCount)
      .map(k => ({ name: k, value: spkklpKendalaCount[k] }))
      .sort((a,b) => b.value - a.value);

    return {
      pieData,
      cityData,
      radarJkn,
      barUsulan,
      barRelevansi,
      scatterData,
      topRujukan,
      prbKepatuhan,
      avgRujukanPrb,
      barKendala,
      textHambatan,
      spkklpCount,
      total: data.length
    };
  }, [data]);

  const tabs = [
    { id: 'overview', label: 'Overview & Profil', icon: LayoutDashboard },
    { id: 'ketersediaan', label: 'Ketersediaan & JKN', icon: Activity },
    { id: 'perbandingan', label: 'Sp.KKLP vs Umum', icon: Stethoscope },
    { id: 'rujukan', label: 'Rujukan & PRB', icon: CheckSquare },
    { id: 'hambatan', label: 'Hambatan Operasional', icon: AlertTriangle },
    { id: 'kualitatif', label: 'Suara Lapangan', icon: MessageSquare }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation Internal */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' 
                  : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-500">
        
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Proporsi Jenis FKTP</h3>
                <div className="h-64 min-h-[250px]">
                  <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                    <PieChart>
                      <Pie data={metrics.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {metrics.pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-slate-700 mb-4">Ketersediaan Sp.KKLP</h3>
                <div className="flex items-end gap-4 mb-2">
                  <span className="text-5xl font-black text-emerald-400">{metrics.spkklpCount}</span>
                  <span className="text-xl text-slate-500 pb-1">/ {metrics.total} FKTP</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden mt-4">
                  <div className="bg-emerald-500 h-4 rounded-full" style={{ width: `${metrics.total ? (metrics.spkklpCount / metrics.total) * 100 : 0}%` }}></div>
                </div>
                <p className="text-slate-500 mt-4 text-sm">Masih terdapat {metrics.total - metrics.spkklpCount} fasilitas kesehatan tingkat pertama yang belum memiliki Spesialis Kedokteran Keluarga Layanan Primer.</p>
              </div>
            </div>

            {/* Peta Sebaran (City Map Bar Chart) */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 mb-4">Sebaran FKTP per Kabupaten/Kota (Top 15)</h3>
              <p className="text-sm text-slate-500 mb-4">Distribusi fasilitas kesehatan dan status kepemilikan Sp.KKLP di wilayah terbanyak.</p>
              <div className="h-80 min-h-[300px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <BarChart data={metrics.cityData} layout="vertical" margin={{ top: 0, right: 30, left: 50, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="withSpKKLP" name="Sudah Ada Sp.KKLP" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="withoutSpKKLP" name="Belum Ada Sp.KKLP" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ketersediaan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Radar Gap Layanan */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-800">Gap Layanan JKN Eksisting</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Persepsi optimalisasi manfaat JKN berdasarkan Jenis FKTP (Skala 1-4)</p>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metrics.radarJkn}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#475569' }} />
                    <Radar name="Puskesmas" dataKey="Puskesmas" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                    <Radar name="Klinik" dataKey="Klinik" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Radar name="DPM" dataKey="DPM" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Usulan Prioritas Baru */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold text-slate-800">Usulan Layanan Baru JKN</h3>
                </div>
                <span className="text-xs text-slate-500">% Persetujuan Tinggi</span>
              </div>
              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <BarChart data={metrics.barUsulan} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                    <RechartsTooltip formatter={(val) => [`${val}%`, 'Setuju / Sangat Setuju']} contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Bar dataKey="value" name="% Persetujuan" fill="#f43f5e" radius={[0, 4, 4, 0]}>
                      {metrics.barUsulan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 80 ? '#ef4444' : entry.value > 60 ? '#f59e0b' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'perbandingan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Grouped Bar Relevansi */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-800">Persepsi Relevansi Sp.KKLP</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Membandingkan FKTP yang sudah ada Sp.KKLP vs Belum Ada (Skala 1-4)</p>
              <div className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <BarChart data={metrics.barRelevansi} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 4]} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 10 }} width={160} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="withSpkklp" name="Ada Sp.KKLP" fill="#10b981" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="withoutSpkklp" name="Belum Ada" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scatter Waktu vs Proporsi */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-800">Waktu Poli vs Proporsi Layanan</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Melihat korelasi antara waktu layanan di poli dengan proporsi pelayanan dalam gedung.</p>
              <div className="flex-1 min-h-[400px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="x" name="Waktu Poli" unit=" mnt" stroke="#cbd5e1" tick={{ fill: '#64748b' }} label={{ value: 'Rata-rata Waktu Poli (Menit)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }} />
                    <YAxis type="number" dataKey="y" name="Proporsi" unit="%" stroke="#cbd5e1" tick={{ fill: '#64748b' }} label={{ value: 'Proporsi Layanan Dalam Gedung (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }} />
                    <ZAxis type="category" dataKey="role" name="Profesi" />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} formatter={(val, name, props) => [`${val}`, name]} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Scatter name="Dokter Umum" data={metrics.scatterData.filter(d => d.role === 'Dokter Umum')} fill="#3b82f6" />
                    <Scatter name="Dokter Sp.KKLP" data={metrics.scatterData.filter(d => d.role === 'Dokter Sp.KKLP')} fill="#f59e0b" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'rujukan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Pareto Top Rujukan */}
            <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-slate-800">Layanan Paling Sering Dirujuk</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Persentase FKTP yang rutin merujuk kasus-kasus primer ke Rumah Sakit.</p>
              <div className="flex-1 min-h-[350px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <BarChart data={metrics.topRujukan} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 10 }} width={140} />
                    <RechartsTooltip formatter={(val) => [`${val}% FKTP`, 'Merujuk']} contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Bar dataKey="value" name="% FKTP" fill="#ef4444" radius={[0, 4, 4, 0]}>
                      {metrics.topRujukan.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#f59e0b'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Kinerja PRB */}
            <div className="flex flex-col gap-6">
              <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-slate-800">Kinerja Program Rujuk Balik (PRB)</h3>
                </div>
                <p className="text-xs text-slate-500 mb-6">Tingkat kepatuhan kunjungan pasien PRB secara nasional.</p>
                
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-48 h-48 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-700"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={`${metrics.prbKepatuhan > 70 ? 'text-emerald-500' : metrics.prbKepatuhan > 50 ? 'text-amber-500' : 'text-rose-500'}`}
                        strokeDasharray={`${metrics.prbKepatuhan}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-slate-800">{metrics.prbKepatuhan}%</span>
                      <span className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">Kepatuhan</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex items-center gap-4">
                <div className="bg-amber-500/20 p-4 rounded-xl text-amber-500">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{metrics.avgRujukanPrb} Kasus/Bulan</h4>
                  <p className="text-sm text-slate-500">Rata-rata rujukan balik per FKTP</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'hambatan' && (
          <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-slate-800">Kendala Utama Implementasi Sp.KKLP</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Peringkat kendala berdasarkan jumlah keluhan dari FKTP.</p>
            <div className="flex-1 min-h-[400px]">
              <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                <BarChart data={metrics.barKendala} layout="vertical" margin={{ top: 0, right: 30, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fill: '#64748b' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={120} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                  <Bar dataKey="value" name="Jumlah Keluhan" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                    {metrics.barKendala.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index < 2 ? '#ef4444' : index < 4 ? '#f59e0b' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'kualitatif' && (
          <div className="bg-white shadow-sm p-6 rounded-2xl border border-slate-200 flex flex-col h-[500px]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-bold text-slate-800">Suara dari Lapangan</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6">Feedback kualitatif langsung dari perwakilan puskesmas dan klinik mengenai kendala PRB maupun implementasi medis spesifik.</p>
            
            <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
              {metrics.textHambatan.length === 0 ? (
                <div className="text-center py-10 text-slate-500">Belum ada feedback kualitatif yang terkumpul.</div>
              ) : (
                metrics.textHambatan.map((item, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex gap-4 items-start">
                    <div className="bg-white p-2 rounded-lg mt-1">
                      <FileText className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-700">{item.faskes}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.type === 'PRB' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {item.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">"{item.text}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
