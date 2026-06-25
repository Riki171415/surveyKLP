import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Target, AlertTriangle, Activity, Map, Users, Stethoscope, Briefcase, ChevronRight, 
  Database, RefreshCw, Layers, MessageSquare, Zap, FileText
} from 'lucide-react';
import DashboardEksekutif from './dashboards/DashboardEksekutif';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

const relevansiItems = [
  "Pengelolaan pasien dengan kondisi kronis dan multimorbiditas.",
  "Pendampingan pasien kronis melalui home care.",
  "Pelayanan paliatif di tingkat primer.",
  "Edukasi kelompok pasien kronis.",
  "Pendampingan keluarga pasien kronis.",
  "Pemantauan berkelanjutan pasien kronis di komunitas.",
  "Monitoring komunitas risiko tinggi penyakit kronis.",
  "Penguatan Program Rujuk Balik (PRB).",
  "Koordinasi pelayanan lintas profesi dan kader kesehatan.",
  "Pembinaan Posbindu PTM.",
  "Pengelolaan pasien geriatri dengan kebutuhan pelayanan jangka panjang."
];

const layananDirujukItems = [
  "Kasus PTM tanpa komplikasi", "Penanganan luka diabetes", 
  "Tindakan bedah minor", "Pelayanan paliatif akhir hayat", 
  "Gangguan jiwa ringan-sedang", "Penanganan fraktur tertutup sederhana"
];

const jknBenefits = [
  "Pemantauan kepatuhan terapi pasien AIDS, TB, dan Malaria memberikan manfaat yang optimal bagi pasien.",
  "Pelaksanaan Program Rujuk Balik (PRB) memberikan manfaat yang optimal bagi pasien.",
  "Pengelolaan Hipertensi tanpa komplikasi memberikan manfaat yang optimal bagi pasien.",
  "Deprescribing/pengurangan obat pada pasien polifarmasi memberikan manfaat yang optimal bagi pasien."
];

const nonOptimalServices = [
  "Pelayanan lifestyle medicine penting untuk diakomodasi dalam layanan JKN.",
  "Pelayanan wellness dan healthy aging penting untuk diakomodasi dalam layanan JKN.",
  "Konsultasi perjalanan/travel medicine penting untuk diakomodasi dalam layanan JKN.",
  "Manajemen pasien geriatri frailty penting untuk diakomodasi dalam layanan JKN.",
  "Precision medicine/konseling genetik dasar penting untuk diakomodasi dalam layanan JKN.",
  "Layanan promotif berbasis keluarga penting untuk diakomodasi dalam layanan JKN."
];

const COLORS = {
  primary: '#0ea5e9',
  secondary: '#10b981',
  tertiary: '#f59e0b',
  danger: '#ef4444',
  dark: '#0f172a'
};

export default function KokpitKemenkes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterProv, setFilterProv] = useState('Semua');
  const [activeTab, setActiveTab] = useState('utama'); // 'utama', 'eksekutif'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      let surveysData = [];
      const useSupabase = import.meta.env.VITE_USE_LOCAL_API !== 'true';
      if (useSupabase) {
        const { data: surveys, error } = await supabase.from('surveys').select('*');
        if (error) throw error;
        surveysData = surveys || [];
      } else {
        const response = await fetch('/api/surveys');
        const json = await response.json();
        if (json.error) throw json.error;
        surveysData = json.data || [];
      }
      
      setData(surveysData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (filterProv === 'Semua') return data;
    return data.filter(d => (d.provinsi || d.city) === filterProv);
  }, [data, filterProv]);

  const uniqueProvinsi = useMemo(() => {
    const provs = new Set(data.map(d => d.provinsi || d.city).filter(Boolean));
    return Array.from(provs).sort();
  }, [data]);

  const metrics = useMemo(() => {
    if (filteredData.length === 0) return null;

    const acc = {
      spkklpCount: 0,
      totalRelevansiScore: 0,
      relevansiCount: 0,
      totalRujukan: 0
    };

    // Role-based Relevansi
    const roleScores = {
      'Kepala Puskesmas / klinik': Array(11).fill(0).map(() => ({ sum: 0, count: 0 })),
      'Dokter Umum': Array(11).fill(0).map(() => ({ sum: 0, count: 0 })),
      'Dokter Sp.KKLP': Array(11).fill(0).map(() => ({ sum: 0, count: 0 }))
    };

    // Rujukan
    const rujukanMap = {};
    
    // JKN vs Prioritas Baru
    const jknScores = Array(4).fill(0).map(() => ({ sum: 0, count: 0 }));
    const usulanScores = Array(6).fill(0).map(() => ({ sum: 0, count: 0 }));

    // Kualitatif Text
    let allText = "";

    // FKTP Unik untuk count dasar
    const uniqueFktpMap = new Map();
    filteredData.forEach(row => {
      const id = row.kode_faskes || row.fktp_name?.toLowerCase()?.trim() || row.id;
      if (!uniqueFktpMap.has(id)) {
        uniqueFktpMap.set(id, row);
      } else if (row.doc_kklp === 'Ya') {
        const existing = uniqueFktpMap.get(id);
        if (existing.doc_kklp !== 'Ya') {
          uniqueFktpMap.set(id, { ...existing, doc_kklp: 'Ya' });
        }
      }
    });
    const uniqueFktpList = Array.from(uniqueFktpMap.values());
    const totalFktp = uniqueFktpList.length;

    // Provinsi Map untuk Heatmap
    const provMap = {};

    uniqueFktpList.forEach(row => {
      const prov = row.provinsi || row.city || 'Unknown';
      if (!provMap[prov]) provMap[prov] = { count: 0, spkklp: 0, relSum: 0, relCount: 0 };
      provMap[prov].count++;

      if (row.doc_kklp === 'Ya') {
        acc.spkklpCount++;
        provMap[prov].spkklp++;
      }
    });

    filteredData.forEach(row => {
      const prov = row.provinsi || row.city || 'Unknown';
      if (!provMap[prov]) provMap[prov] = { count: 0, spkklp: 0, relSum: 0, relCount: 0 };

      // Relevansi
      const rel = row.relevansi_spkklp || {};
      const rawRole = row.role;
      const role = rawRole === 'Kepala Puskesmas' ? 'Kepala Puskesmas / klinik' : rawRole;
      let rowRelSum = 0;
      let rowRelCount = 0;

      for (let i = 0; i < 11; i++) {
        const valRaw = rel[i];
        if (valRaw) {
          const numStr = typeof valRaw === 'object' ? valRaw.skala : valRaw;
          const valNum = Number(numStr || 0);
          
          if (!isNaN(valNum) && valNum > 0) {
            acc.totalRelevansiScore += valNum;
            acc.relevansiCount++;
            rowRelSum += valNum;
            rowRelCount++;

            if (roleScores[role]) {
              roleScores[role][i].sum += valNum;
              roleScores[role][i].count++;
            }
          }
        }
      }

      if (rowRelCount > 0) {
        provMap[prov].relSum += (rowRelSum / rowRelCount);
        provMap[prov].relCount++;
      }

      // Rujukan
      const rjk = row.layanan_dirujuk || {};
      for (const k in rjk) {
        if (rjk[k] && k !== 'pengaruhPenurunanRujukan') {
          if (!isNaN(k) && k !== 'lainnya' && !layananDirujukItems[k]) continue;
          const name = k === 'lainnya' ? rjk.lainnya : (isNaN(k) ? k : layananDirujukItems[k]);
          rujukanMap[name] = (rujukanMap[name] || 0) + 1;
          acc.totalRujukan++;
        }
      }

      // Paket Manfaat
      const jkn = row.jkn || {};
      for (let i=0; i<4; i++) {
        const val = jkn[i];
        if (val) {
          const skala = typeof val === 'object' ? val.skala : val;
          if (skala && !isNaN(Number(skala))) {
            jknScores[i].sum += Number(skala);
            jknScores[i].count++;
          }
        }
      }
      const opt = row.non_optimal || {};
      for (let i=0; i<6; i++) {
        const val = opt[i];
        if (val) {
          const skala = typeof val === 'object' ? val.skala : val;
          if (skala && !isNaN(Number(skala))) {
            usulanScores[i].sum += Number(skala);
            usulanScores[i].count++;
          }
        }
      }

      // Kualitatif Text Extract
      const wawancara = row.wawancara || {};
      Object.values(wawancara).forEach(text => {
        if (typeof text === 'string') allText += " " + text.toLowerCase();
      });
    });

    // Kalkulasi Skor Akhir
    const spkklpRatio = Math.round((acc.spkklpCount / totalFktp) * 100) || 0;
    const avgRelevansi = acc.relevansiCount > 0 ? (acc.totalRelevansiScore / acc.relevansiCount) : 0;
    const relRatio = Math.max(0, (avgRelevansi - 1) / 3); 
    const rujukanRatio = Math.max(0, 1 - (acc.totalRujukan / (filteredData.length * 3))); // Asumsi max 3 rujukan rata2

    const indeksKesiapan = Math.round((spkklpRatio * 0.4) + (relRatio * 100 * 0.4) + (rujukanRatio * 100 * 0.2));

    // Radar Data
    const radarData = relevansiItems.map((item, i) => {
      const kapus = roleScores['Kepala Puskesmas / klinik'][i];
      const du = roleScores['Dokter Umum'][i];
      const sp = roleScores['Dokter Sp.KKLP'][i];
      return {
        subject: `Q${i+1}`,
        Kapus: kapus.count > 0 ? Number((kapus.sum / kapus.count).toFixed(1)) : 0,
        DUmum: du.count > 0 ? Number((du.sum / du.count).toFixed(1)) : 0,
        SpKKLP: sp.count > 0 ? Number((sp.sum / sp.count).toFixed(1)) : 0,
        fullMark: 4
      };
    });

    // Manfaat Data
    const manfaatData = [];
    jknBenefits.forEach((item, i) => {
      const s = jknScores[i];
      if (s.count > 0) manfaatData.push({ name: item.substring(0,15), JKN: Number((s.sum / s.count).toFixed(1)), Usulan: 0 });
    });
    nonOptimalServices.slice(0,4).forEach((item, i) => {
      const s = usulanScores[i];
      if (s.count > 0) manfaatData.push({ name: item.substring(0,15), JKN: 0, Usulan: Number((s.sum / s.count).toFixed(1)) });
    });

    // Top Rujukan
    const topRujukan = Object.keys(rujukanMap)
      .map(k => ({ name: k, value: Math.round((rujukanMap[k] / filteredData.length) * 100) }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 3);

    // Kualitatif
    const keywords = ['insentif', 'jasa', 'sarana', 'pelatihan', 'bpjs', 'kapitasi', 'alat'];
    const kwCounts = keywords.map(kw => ({
      word: kw,
      count: (allText.match(new RegExp(kw, 'g')) || []).length
    })).sort((a,b) => b.count - a.count);

    // Provinsi Map Array
    const provArray = Object.keys(provMap).map(k => {
      const p = provMap[k];
      const sRatio = p.spkklp / p.count;
      const rRatio = p.relCount > 0 ? Math.max(0, ((p.relSum / p.relCount) - 1) / 3) : 0;
      const idx = Math.round((sRatio * 50) + (rRatio * 50));
      return { nama: k, indeks: idx, fktp: p.count, spkklp: p.spkklp };
    }).sort((a,b) => b.indeks - a.indeks);

    return {
      indeksKesiapan,
      spkklpRatio: Math.round(spkklpRatio),
      topRujukan,
      radarData,
      manfaatData,
      kwCounts,
      provArray,
      totalCount: totalFktp
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-800">
        <RefreshCw className="w-12 h-12 animate-spin text-primary-500 mb-4" />
        <p className="text-xl font-bold tracking-widest">MENYIAPKAN KOKPIT...</p>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 font-sans p-4 md:p-8 selection:bg-primary-500/30 w-full overflow-y-auto">
      
      {/* HEADER KOKPIT */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2 text-primary-400">
            <Zap className="w-8 h-8" />
            <h1 className="text-3xl font-black tracking-tight text-slate-800">Kokpit Kemenkes</h1>
          </div>
          <p className="text-slate-500">Pusat kendali dan analisis optimalisasi Sp.KKLP & JKN secara nasional.</p>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button 
              onClick={() => setActiveTab('utama')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${activeTab === 'utama' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Overview Nasional
            </button>
            <button 
              onClick={() => setActiveTab('eksekutif')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center ${activeTab === 'eksekutif' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
            >
              <Target className="w-4 h-4 inline-block mr-2" />
              Dashboard Eksekutif
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-white/20 rounded text-white">NEW</span>
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <select 
            className="bg-white border border-slate-200 text-slate-800 px-4 py-2.5 rounded-xl outline-none focus:border-primary-500"
            value={filterProv}
            onChange={(e) => setFilterProv(e.target.value)}
          >
            <option value="Semua">Nasional (Semua Provinsi)</option>
            {uniqueProvinsi.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* TAB UTAMA: KOKPIT OVERVIEW */}
      {activeTab === 'utama' && (
        <>
          {/* TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-bl-full -z-10 group-hover:bg-primary-500/20 transition-colors"></div>
              <p className="text-slate-500 text-sm font-bold tracking-wider uppercase mb-2">Indeks Kesiapan Nasional</p>
              <div className="flex items-end gap-3">
                <h3 className="text-6xl font-black text-slate-800">{metrics.indeksKesiapan}</h3>
                <span className="text-xl text-slate-500 mb-1 font-bold">/ 100</span>
              </div>
              <div className="w-full bg-white rounded-full h-2 mt-4 overflow-hidden">
                <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-2 rounded-full" style={{ width: `${metrics.indeksKesiapan}%` }}></div>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-3xl flex flex-col justify-between">
              <div>
                <p className="text-slate-500 text-sm font-bold tracking-wider uppercase mb-2">Kekurangan Sp.KKLP</p>
                <h3 className="text-4xl font-black text-slate-800">{100 - metrics.spkklpRatio}%</h3>
                <p className="text-slate-500 mt-1">Dari {metrics.totalCount} FKTP disurvei belum memiliki Sp.KKLP</p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-amber-600 text-sm font-bold bg-amber-400/10 px-3 py-2 rounded-lg w-fit">
                <AlertTriangle className="w-4 h-4" /> Butuh Pemerataan
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-3xl">
              <p className="text-slate-500 text-sm font-bold tracking-wider uppercase mb-4">Top 3 Layanan Rujukan Primer</p>
              <div className="space-y-3">
                {metrics.topRujukan.map((r, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-slate-600 truncate pr-4">{i+1}. {r.name}</span>
                    <span className="text-rose-600 font-bold bg-rose-400/10 px-2 py-1 rounded text-xs whitespace-nowrap">{r.value}% FKTP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RECOMMENDATION ALERT */}
          <div className="bg-emerald-50 border border-primary-500/20 p-5 rounded-2xl mb-8 flex items-start gap-4 shadow-lg shadow-sm">
            <div className="p-3 bg-primary-500/20 text-primary-400 rounded-xl shrink-0"><Zap className="w-6 h-6" /></div>
            <div>
              <h4 className="text-slate-800 font-bold text-lg mb-1">Rekomendasi Kebijakan Hari Ini</h4>
              <p className="text-slate-600/80 leading-relaxed text-sm">
                Terdapat <strong className="text-slate-800">{100 - metrics.spkklpRatio}% FKTP</strong> tanpa Sp.KKLP, namun survei menunjukkan skor relevansi rata-rata tinggi. Di sisi lain, <strong className="text-rose-600">{metrics.topRujukan[0]?.name}</strong> masih terus dirujuk oleh {metrics.topRujukan[0]?.value}% FKTP. 
                <br/><span className="text-emerald-600 mt-2 block font-medium">→ Tindakan: Prioritaskan pengangkatan Sp.KKLP di Provinsi merah dan masukan layanan prioritas ke pembiayaan JKN (Non-Kapitasi).</span>
              </p>
            </div>
          </div>

          {/* MID SECTION: HEATMAP & RADAR */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            
            {/* Heatmap Provinsi */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <Map className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-800">Peta Kesiapan Wilayah</h3>
              </div>
              <div className="overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-white shadow-sm sticky top-0">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Provinsi</th>
                      <th className="px-4 py-3 text-center">Indeks</th>
                      <th className="px-4 py-3 text-center rounded-tr-lg">Rasio Sp.KKLP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.provArray.map((p, i) => (
                      <tr key={i} className="border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{p.nama}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-lg font-bold ${p.indeks >= 70 ? 'text-emerald-600 bg-emerald-400/10' : p.indeks >= 40 ? 'text-amber-600 bg-amber-400/10' : 'text-rose-600 bg-rose-400/10'}`}>
                            {p.indeks}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-500">{p.spkklp} / {p.fktp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar Gap Persepsi */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-800">Gap Persepsi Antar Profesi</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Mendeteksi perbedaan pandangan thd. peran Sp.KKLP (Skor 1-4)</p>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={metrics.radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#475569' }} />
                    <Radar name="Kepala Puskesmas / klinik" dataKey="Kapus" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                    <Radar name="Dokter Umum" dataKey="DUmum" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                    <Radar name="Sp.KKLP" dataKey="SpKKLP" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} 
                      labelFormatter={(label) => {
                        const qIndex = parseInt(label.replace('Q', '')) - 1;
                        if (qIndex >= 0 && qIndex < relevansiItems.length) {
                          return `${label} - ${relevansiItems[qIndex]}`;
                        }
                        return label;
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: JKN & KUALITATIF */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                  <h3 className="text-lg font-bold text-slate-800">Evaluasi Paket Manfaat JKN</h3>
                </div>
                <span className="text-xs text-slate-500">Skor Penting (1-4)</span>
              </div>
              <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
                  <BarChart data={metrics.manfaatData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 4]} tick={{ fill: '#64748b' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: 'none', borderRadius: '8px', color: '#334155' }} cursor={{ fill: '#334155', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="JKN" name="Existing JKN" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="Usulan" name="Usulan Prioritas Baru" fill="#f43f5e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="w-5 h-5 text-pink-400" />
                <h3 className="text-lg font-bold text-slate-800">Suara Lapangan (Kualitatif)</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {metrics.kwCounts.slice(0, 4).map((kw, i) => (
                  <div key={i} className="bg-white border border-slate-200 p-4 rounded-2xl flex justify-between items-center group hover:bg-slate-100 transition-colors">
                    <span className="text-slate-600 font-medium capitalize">{kw.word}</span>
                    <span className="bg-slate-50 text-primary-400 font-bold px-3 py-1 rounded-full text-sm shadow-inner">
                      {kw.count} sebut
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 bg-indigo-50 border border-indigo-500/20 rounded-xl">
                <p className="text-indigo-700 text-sm italic">
                  "Banyak FKTP menyinggung perlunya <span className="text-indigo-600 font-bold uppercase">{metrics.kwCounts[0]?.word}</span> dan perbaikan <span className="text-indigo-600 font-bold uppercase">{metrics.kwCounts[1]?.word}</span> agar peran Sp.KKLP bisa dioptimalkan secara nyata di lapangan."
                </p>
              </div>
            </div>
          </div>

      {/* EXECUTIVE INSIGHT PANEL */}
      <div className="mt-8 bg-white/90 border border-primary-500/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10"></div>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
          <Layers className="w-6 h-6 text-primary-400" />
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide uppercase">Executive Insight: Peta Jalan Kebijakan Sp.KKLP</h2>
        </div>
        
        <div className="space-y-6 text-slate-600 leading-relaxed text-sm md:text-base">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-500/20 text-primary-400 flex items-center justify-center shrink-0 font-bold">1</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">Paradoks Ketersediaan vs Kebutuhan</h4>
              <p>Meskipun sebagian besar FKTP belum memiliki Sp.KKLP, data <span className="text-primary-600 font-semibold">Gap Persepsi</span> menunjukkan bahwa institusi primer (Kepala PKM & Dokter Umum) memberikan skor relevansi yang sangat tinggi. Pasar layanan primer sudah siap; urgensi saat ini bergeser pada percepatan distribusi tenaga medis.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-600 flex items-center justify-center shrink-0 font-bold">2</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">Kebocoran Gatekeeper pada Kasus Sederhana</h4>
              <p>Top rujukan primer masih didominasi oleh kasus PTM tanpa komplikasi dan bedah minor. Ini membuktikan bahwa <span className="text-rose-600 font-semibold">fungsi gatekeeper JKN belum optimal</span>. Kehadiran Sp.KKLP di titik-titik lemah (provinsi merah) dapat mencegah triliunan rupiah bocor ke FKRTL.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-bold">3</div>
            <div>
              <h4 className="text-slate-800 font-bold mb-1">"Blind Spot" Pembiayaan Non-Kapitasi</h4>
              <p>Suara lapangan dan usulan prioritas secara masif menuntut diakomodasinya layanan <span className="text-amber-600 font-semibold">Home Care dan Paliatif</span>. Penempatan Sp.KKLP wajib dibarengi perombakan skema insentif JKN yang mengapresiasi upaya preventif & proaktif, bukan sekadar kuratif reaktif.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h4 className="text-emerald-600 font-bold mb-3 flex items-center gap-2"><Target className="w-4 h-4" /> REKOMENDASI TINDAKAN (30 HARI KEDEPAN)</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-slate-600 marker:text-emerald-500">
            <li>Gunakan data usulan prioritas untuk advokasi revisi PMK (Paket Manfaat JKN).</li>
            <li>Fokuskan beasiswa afirmasi Sp.KKLP pada 5 Provinsi terbawah di Peta Kesiapan yang rujukannya masih tinggi.</li>
            <li>Lakukan sosialisasi ke Kepala FKTP agar Sp.KKLP dimanfaatkan sebagai <em className="text-slate-800">Manager of Care</em> komunitas.</li>
          </ul>
        </div>
      </div>
        </>
      )}

      {/* TAB EKSEKUTIF: KOMPREHENSIF */}
      {activeTab === 'eksekutif' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DashboardEksekutif data={filteredData} />
                 </div>
      )}
      

    </div>
  );
}
