import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList, ComposedChart, Line
} from 'recharts';
import { AlertTriangle, Users, Database, FileText, Download, MessageSquare, Map, Image as ImageIcon } from 'lucide-react';
import CustomWordCloud from '../ui/CustomWordCloud';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardKendala({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [kendalaView, setKendalaView] = useState('responden');
  const [dukunganView, setDukunganView] = useState('responden');
  const [teksView, setTeksView] = useState('responden');
  const { kendalaStats, kendalaDataR, kendalaDataF, dukunganDataR, dukunganDataF, teksDataR, teksDataF, heatmapData } = useMemo(() => {
    let fktpWithKendala = 0;
    
    // Stopwords for Word Cloud
    const stopWords = ['dan', 'di', 'ke', 'dari', 'yang', 'untuk', 'dengan', 'tidak', 'belum', 'ada', 'kurang', 'karena', 'ini', 'itu', 'atau', 'dalam'];
    const extractWords = (text) => {
      if (!text) return [];
      return text.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 3 && !stopWords.includes(w));
    };

    // -- Per Responden --
    const kendalaCountsR = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
    const teksCountsR = {};
    const regionalKendalaCounts = {}; // For heatmap

    filteredData.forEach(row => {
      const k = row.spkklp_kendala || {};
      const regional = row.provinsi || 'Tidak Diketahui';
      if (!regionalKendalaCounts[regional]) {
        regionalKendalaCounts[regional] = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
      }

      if (k.hasKendala === 'Ya') {
        Object.keys(kendalaCountsR).forEach(key => { 
          if (k[`kendala_${key}`]) {
            kendalaCountsR[key]++; 
            regionalKendalaCounts[regional][key]++;
          }
        });
        
        const combinedText = [k.diagnosis, k.tindakan].filter(Boolean).join(' ');
        if (combinedText) {
          const words = extractWords(combinedText);
          words.forEach(w => teksCountsR[w] = (teksCountsR[w] || 0) + 1);
        }
      }
    });

    // -- Per FKTP --
    const kendalaCountsF = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
    const teksCountsF = {};
    
    uniqueFktpData.forEach(row => {
      const k = row.spkklp_kendala || {};
      if (k.hasKendala === 'Ya') {
        fktpWithKendala++;
        Object.keys(kendalaCountsF).forEach(key => { if (k[`kendala_${key}`]) kendalaCountsF[key]++; });
        
        const combinedText = [k.diagnosis, k.tindakan].filter(Boolean).join(' ');
        if (combinedText) {
          const words = extractWords(combinedText);
          words.forEach(w => teksCountsF[w] = (teksCountsF[w] || 0) + 1);
        }
      }
    });

    // Compute cumulative percentage for Pareto
    const computePareto = (counts) => {
      const arr = Object.keys(counts).map(k => ({ name: k, value: counts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);
      let total = arr.reduce((acc, curr) => acc + curr.value, 0);
      let cumulative = 0;
      return arr.map(d => {
        cumulative += d.value;
        return { ...d, cumulativePerc: total > 0 ? (cumulative / total) * 100 : 0 };
      });
    };

    const kDataR = computePareto(kendalaCountsR);
    const kDataF = computePareto(kendalaCountsF);

    const getDukData = (counts) => [
      { name: 'Butuh Dukungan Pendanaan', value: counts['Pembiayaan'] },
      { name: 'Butuh Dukungan Regulasi', value: counts['Regulasi'] },
      { name: 'Butuh Dukungan SDM/Alkes', value: counts['SDM'] + counts['Alat kesehatan'] + counts['Sarana prasarana'] }
    ].filter(d => d.value > 0);

    const toArrText = (obj) => Object.keys(obj).map(k => ({ text: k, value: obj[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0).slice(0, 30);

    // Format heatmap data
    const heatmapDataArr = Object.keys(regionalKendalaCounts).map(reg => {
      return {
        regional: reg,
        ...regionalKendalaCounts[reg],
        total: Object.values(regionalKendalaCounts[reg]).reduce((a,b) => a+b, 0)
      };
    }).sort((a,b) => b.total - a.total);

    return {
      kendalaStats: {
        totalFktpKendala: fktpWithKendala,
        proporsiKendala: uniqueFktpData.length > 0 ? (fktpWithKendala / uniqueFktpData.length) * 100 : 0,
        top3: kDataF.slice(0, 3)
      },
      kendalaDataR: kDataR,
      kendalaDataF: kDataF,
      dukunganDataR: getDukData(kendalaCountsR),
      dukunganDataF: getDukData(kendalaCountsF),
      teksDataR: toArrText(teksCountsR),
      teksDataF: toArrText(teksCountsF),
      heatmapData: heatmapDataArr
    };
  }, [filteredData, uniqueFktpData]);

  const kendalaData  = kendalaView  === 'fktp' ? kendalaDataF  : kendalaDataR;
  const dukunganData = dukunganView === 'fktp' ? dukunganDataF : dukunganDataR;
  const teksData     = teksView     === 'fktp' ? teksDataF     : teksDataR;
  const kendalaLabel = kendalaView  === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const dukunganLabel = dukunganView === 'fktp' ? 'Frekuensi FKTP' : 'Frekuensi Responden';

  const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${colorClass} opacity-10`}></div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass.replace('bg-', 'bg-opacity-20 text-').replace('-500', '-600')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  const handleExport = () => {
    const tables = [
      {
        title: 'Statistik Kendala Utama (Per FKTP)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden', filteredData.length],
          ['Total FKTP (Unik)', uniqueFktpData.length],
          ['Total FKTP Melaporkan Kendala', kendalaStats.totalFktpKendala],
          ['Proporsi FKTP Mengalami Kendala', `${kendalaStats.proporsiKendala.toFixed(2)}%`]
        ]
      },
      { title: 'Distribusi Kendala Pelayanan (Per Responden)', headers: ['Kategori Kendala', 'Jumlah (Nilai)', 'Persentase (%)'], data: kendalaDataR.map(d => [d.name, d.value, `${filteredData.length > 0 ? ((d.value / filteredData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Distribusi Kendala Pelayanan (Per FKTP)', headers: ['Kategori Kendala', 'Jumlah FKTP (Nilai)', 'Persentase (%)'], data: kendalaDataF.map(d => [d.name, d.value, `${uniqueFktpData.length > 0 ? ((d.value / uniqueFktpData.length) * 100).toFixed(1) : 0}%`]) },
      { title: 'Proporsi Kebutuhan Dukungan (Per Responden)', headers: ['Kategori Dukungan', 'Frekuensi Jawaban'], data: dukunganDataR.map(d => [d.name, d.value]) },
      { title: 'Proporsi Kebutuhan Dukungan (Per FKTP)', headers: ['Kategori Dukungan', 'Frekuensi Jawaban'], data: dukunganDataF.map(d => [d.name, d.value]) },
      { title: 'Kata Kunci Kendala Spesifik (Per Responden)', headers: ['Kata Kunci', 'Frekuensi'], data: teksDataR.map(d => ({ text: d.text, value: d.value })) },
      { title: 'Kata Kunci Kendala Spesifik (Per FKTP)', headers: ['Kata Kunci', 'Frekuensi'], data: teksDataF.map(d => ({ text: d.text, value: d.value })) },
      { title: 'Heatmap Kendala per Provinsi', headers: ['Provinsi', 'SDM', 'Sarana Prasarana', 'Alat Kesehatan', 'Obat', 'Pembiayaan', 'Regulasi', 'Total'], data: heatmapData.map(d => ({ reg: d.regional, sdm: d['SDM'] || 0, sarpras: d['Sarana prasarana'] || 0, alkes: d['Alat kesehatan'] || 0, obat: d['Obat'] || 0, dana: d['Pembiayaan'] || 0, regu: d['Regulasi'] || 0, tot: d.total })) }
    ];

    const rawData = {
      headers: ['No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi', 'Ada Kendala', 'Kendala: SDM', 'Kendala: Sarana Prasarana', 'Kendala: Alat Kesehatan', 'Kendala: Obat', 'Kendala: Pembiayaan', 'Kendala: Regulasi', 'Kendala: Lainnya', 'Teks Kendala Spesifik'],
      rows: filteredData.map((row, idx) => {
        const k = row.spkklp_kendala || {};
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          k.hasKendala || 'Tidak',
          k['kendala_SDM'] ? 'Ya' : 'Tidak',
          k['kendala_Sarana prasarana'] ? 'Ya' : 'Tidak',
          k['kendala_Alat kesehatan'] ? 'Ya' : 'Tidak',
          k['kendala_Obat'] ? 'Ya' : 'Tidak',
          k['kendala_Pembiayaan'] ? 'Ya' : 'Tidak',
          k['kendala_Regulasi'] ? 'Ya' : 'Tidak',
          k['kendala_Lainnya'] ? 'Ya' : 'Tidak',
          k.teks_kendala || '-'
        ];
      })
    };

    exportTablesToExcel('KENDALA JKN', tables, 'Dashboard_Kendala', rawData);
  };

  return (
    <div id="dashboard-kendala-capture" className="space-y-8 animate-fade-in relative">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print gap-2 capture-exclude">
          <button onClick={() => downloadElementAsPNG('dashboard-kendala-capture', 'Dashboard_Kendala_Full')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm">
            <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
          </button>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="FKTP Melaporkan Kendala" value={kendalaStats.totalFktpKendala} subtitle={`${kendalaStats.proporsiKendala.toFixed(1)}% dari total FKTP`} icon={AlertTriangle} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Top 1 Kendala Utama" value={kendalaStats.top3[0]?.value || 0} subtitle={kendalaStats.top3[0]?.name || '-'} icon={Users} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Top 2 Kendala Utama" value={kendalaStats.top3[1]?.value || 0} subtitle={kendalaStats.top3[1]?.name || '-'} icon={Database} colorClass="bg-orange-500 text-orange-600 bg-orange-100" />
        <StatCard title="Top 3 Kendala Utama" value={kendalaStats.top3[2]?.value || 0} subtitle={kendalaStats.top3[2]?.name || '-'} icon={FileText} colorClass="bg-red-500 text-red-600 bg-red-100" />
      </div>

      <div className="flex flex-col gap-6">
        <div id="kendala-distribusi-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('kendala-distribusi-chart', 'Distribusi_Kendala')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-rose-600" /> Distribusi Kendala Pelayanan (Pareto)</h3>
            {!isPrinting && <ViewToggle value={kendalaView} onChange={setKendalaView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{kendalaView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <ComposedChart data={kendalaData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-15} textAnchor="end" />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} tickFormatter={val => `${val}%`} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar yAxisId="left" dataKey="value" name={kendalaLabel} fill={kendalaView === 'fktp' ? '#10b981' : '#f43f5e'} radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
                <Line yAxisId="right" type="monotone" dataKey="cumulativePerc" name="Kumulatif %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="kendala-dukungan-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('kendala-dukungan-chart', 'Kebutuhan_Dukungan')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Database className="w-5 h-5 mr-2 text-rose-600" /> Proporsi Kebutuhan Dukungan</h3>
            {!isPrinting && <ViewToggle value={dukunganView} onChange={setDukunganView} />}
          </div>
          <p className="text-xs text-slate-400 mb-2 italic">{dukunganView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={dukunganData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {dukunganData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Jawaban`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Word Cloud */}
        <div id="kendala-teks-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('kendala-teks-chart', 'Kata_Kunci_Kendala')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-2 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><MessageSquare className="w-5 h-5 mr-2 text-blue-600" /> Kata Kunci Kendala Spesifik</h3>
            {!isPrinting && <ViewToggle value={teksView} onChange={setTeksView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{teksView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <CustomWordCloud data={teksData} />
        </div>

        {/* Heatmap Regional */}
        <div id="kendala-heatmap-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-3' : 'lg:col-span-3'}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('kendala-heatmap-chart', 'Heatmap_Kendala')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition z-10" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-4 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Map className="w-5 h-5 mr-2 text-indigo-600" /> Heatmap Kendala per Provinsi</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b">Provinsi</th>
                  {['SDM', 'Sarana prasarana', 'Alat kesehatan', 'Obat', 'Pembiayaan', 'Regulasi', 'Lainnya'].map(k => (
                    <th key={k} className="px-2 py-3 bg-slate-50 font-semibold text-slate-700 border-b text-center">{k}</th>
                  ))}
                  <th className="px-4 py-3 bg-slate-50 font-semibold text-slate-700 border-b text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{row.regional}</td>
                    {['SDM', 'Sarana prasarana', 'Alat kesehatan', 'Obat', 'Pembiayaan', 'Regulasi', 'Lainnya'].map(k => {
                      const val = row[k];
                      const maxVal = heatmapData[0] ? Math.max(...heatmapData.map(r => r[k])) : 1;
                      const opacity = maxVal > 0 ? (val / maxVal) : 0;
                      return (
                        <td key={k} className="px-2 py-3 text-center font-medium" style={{ backgroundColor: val > 0 ? `rgba(244, 63, 94, ${opacity * 0.7 + 0.1})` : 'transparent', color: val > 0 && opacity > 0.6 ? '#fff' : '#334155' }}>
                          {val > 0 ? val : '-'}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-bold text-slate-700">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
