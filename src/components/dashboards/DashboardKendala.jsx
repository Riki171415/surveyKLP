import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { AlertTriangle, Users, FileText, Database, Download } from 'lucide-react';

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardKendala({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [kendalaView, setKendalaView] = useState('responden');
  const [dukunganView, setDukunganView] = useState('responden');
  const { kendalaStats, kendalaDataR, kendalaDataF, dukunganDataR, dukunganDataF } = useMemo(() => {
    let fktpWithKendala = 0;
    
    // -- Per Responden --
    const kendalaCountsR = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
    filteredData.forEach(row => {
      const k = row.spkklp_kendala || {};
      if (k.hasKendala === 'Ya') {
        Object.keys(kendalaCountsR).forEach(key => { if (k[`kendala_${key}`]) kendalaCountsR[key]++; });
      }
    });

    // -- Per FKTP --
    const kendalaCountsF = { 'SDM': 0, 'Sarana prasarana': 0, 'Alat kesehatan': 0, 'Obat': 0, 'Pembiayaan': 0, 'Regulasi': 0, 'Lainnya': 0 };
    uniqueFktpData.forEach(row => {
      const k = row.spkklp_kendala || {};
      if (k.hasKendala === 'Ya') {
        fktpWithKendala++;
        Object.keys(kendalaCountsF).forEach(key => { if (k[`kendala_${key}`]) kendalaCountsF[key]++; });
      }
    });

    const kDataR = Object.keys(kendalaCountsR).map(k => ({ name: k, value: kendalaCountsR[k] })).sort((a,b) => b.value - a.value);
    const kDataF = Object.keys(kendalaCountsF).map(k => ({ name: k, value: kendalaCountsF[k] })).sort((a,b) => b.value - a.value);

    const getDukData = (counts) => [
      { name: 'Butuh Dukungan Pendanaan', value: counts['Pembiayaan'] },
      { name: 'Butuh Dukungan Regulasi', value: counts['Regulasi'] },
      { name: 'Butuh Dukungan SDM/Alkes', value: counts['SDM'] + counts['Alat kesehatan'] + counts['Sarana prasarana'] }
    ].filter(d => d.value > 0);

    return {
      kendalaStats: {
        totalFktpKendala: fktpWithKendala,
        proporsiKendala: uniqueFktpData.length > 0 ? (fktpWithKendala / uniqueFktpData.length) * 100 : 0,
        top3: kDataF.slice(0, 3)
      },
      kendalaDataR: kDataR.filter(d => d.value > 0),
      kendalaDataF: kDataF.filter(d => d.value > 0),
      dukunganDataR: getDukData(kendalaCountsR),
      dukunganDataF: getDukData(kendalaCountsF)
    };
  }, [filteredData, uniqueFktpData]);

  const kendalaData  = kendalaView  === 'fktp' ? kendalaDataF  : kendalaDataR;
  const dukunganData = dukunganView === 'fktp' ? dukunganDataF : dukunganDataR;
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
      { title: 'Distribusi Kendala Pelayanan (Per Responden)', headers: ['Kategori Kendala', 'Jumlah Responden'], data: kendalaDataR },
      { title: 'Distribusi Kendala Pelayanan (Per FKTP)', headers: ['Kategori Kendala', 'Jumlah FKTP'], data: kendalaDataF },
      { title: 'Proporsi Kebutuhan Dukungan (Per Responden)', headers: ['Kategori Dukungan', 'Frekuensi Jawaban'], data: dukunganDataR },
      { title: 'Proporsi Kebutuhan Dukungan (Per FKTP)', headers: ['Kategori Dukungan', 'Frekuensi Jawaban'], data: dukunganDataF }
    ];

    const rawData = {
      headers: ['No', 'Nama Faskes', 'Provinsi', 'Ada Kendala', 'Kendala: SDM', 'Kendala: Sarana Prasarana', 'Kendala: Alat Kesehatan', 'Kendala: Obat', 'Kendala: Pembiayaan', 'Kendala: Regulasi', 'Kendala: Lainnya'],
      rows: uniqueFktpData.map((row, idx) => {
        const k = row.spkklp_kendala || {};
        return [
          idx + 1, row.fktp_name || '-', row.provinsi || '-',
          k.hasKendala || 'Tidak',
          k['kendala_SDM'] ? 'Ya' : 'Tidak',
          k['kendala_Sarana prasarana'] ? 'Ya' : 'Tidak',
          k['kendala_Alat kesehatan'] ? 'Ya' : 'Tidak',
          k['kendala_Obat'] ? 'Ya' : 'Tidak',
          k['kendala_Pembiayaan'] ? 'Ya' : 'Tidak',
          k['kendala_Regulasi'] ? 'Ya' : 'Tidak',
          k['kendala_Lainnya'] ? 'Ya' : 'Tidak'
        ];
      })
    };

    exportTablesToExcel('KENDALA JKN', tables, 'Dashboard_Kendala', rawData);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-rose-600" /> Distribusi Kendala Pelayanan</h3>
            {!isPrinting && <ViewToggle value={kendalaView} onChange={setKendalaView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{kendalaView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kendalaData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={120} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${kendalaLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={kendalaLabel} fill={kendalaView === 'fktp' ? '#10b981' : '#f43f5e'} radius={[0, 6, 6, 0]} barSize={32}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
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
      </div>
    </div>
  );
}
