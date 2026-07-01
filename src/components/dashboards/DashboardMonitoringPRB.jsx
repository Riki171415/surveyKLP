import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, AlertCircle, FileSearch, ShieldAlert, Download } from 'lucide-react';

const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button onClick={() => onChange('responden')} className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per Responden</button>
    <button onClick={() => onChange('fktp')} className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Per FKTP</button>
  </div>
);

export default function DashboardMonitoringPRB({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [mekanismeView, setMekanismeView] = useState('responden');
  const [kendalaView, setKendalaView] = useState('responden');
  const { monStats, mekanismeDataR, mekanismeDataF, kendalaDataR, kendalaDataF } = useMemo(() => {
    let fktpWithMekanisme = 0;
    
    // -- Per Responden --
    const mekCountsR = { 'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 'Tidak ada mekanisme khusus': 0, 'Lainnya': 0 };
    const kendalaMapR = {};
    filteredData.forEach(row => {
      const prb = row.prb || {};
      Object.keys(mekCountsR).forEach(mek => { if (prb[`mek_${mek}`]) mekCountsR[mek]++; });
      if (prb.kendala && prb.kendala.trim().length > 3) {
        const text = (prb.kendala || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        const words = text.split(/\s+/).filter(w => w.length > 3 && !['yang', 'dari', 'pada', 'untuk', 'dengan', 'dan', 'atau', 'ini', 'itu', 'karena', 'tidak', 'belum', 'kurang'].includes(w));
        words.forEach(w => { kendalaMapR[w] = (kendalaMapR[w] || 0) + 1; });
      }
    });

    // -- Per FKTP --
    const mekCountsF = { 'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 'Tidak ada mekanisme khusus': 0, 'Lainnya': 0 };
    const kendalaMapF = {};
    
    // Data arrays for Cross-tabulations
    const crossSpkklp = { 'Pengingat kunjungan': { 'Ada Sp.KKLP': 0, 'Tidak Ada': 0 }, 'Telepon/WA': { 'Ada Sp.KKLP': 0, 'Tidak Ada': 0 }, 'Kunjungan rumah': { 'Ada Sp.KKLP': 0, 'Tidak Ada': 0 }, 'Tidak ada mekanisme khusus': { 'Ada Sp.KKLP': 0, 'Tidak Ada': 0 }, 'Lainnya': { 'Ada Sp.KKLP': 0, 'Tidak Ada': 0 } };
    const crossType = { 'Pengingat kunjungan': { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0 }, 'Telepon/WA': { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0 }, 'Kunjungan rumah': { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0 }, 'Tidak ada mekanisme khusus': { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0 }, 'Lainnya': { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0 } };

    uniqueFktpData.forEach(row => {
      const prb = row.prb || {};
      let hasMekanisme = false;
      
      const stKklp = row.doc_kklp === 'Ya' ? 'Ada Sp.KKLP' : 'Tidak Ada';
      
      const fName = (row.fktp_name || '').toLowerCase();
      let type = row.jenis_faskes;
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
        if (row.role === 'Dokter Praktik Mandiri') type = 'DPM';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }
      if (type === 'Dokter Praktik Mandiri') type = 'DPM';

      Object.keys(mekCountsF).forEach(mek => {
        if (prb[`mek_${mek}`]) {
          mekCountsF[mek]++;
          if (mek !== 'Tidak ada mekanisme khusus') hasMekanisme = true;
          crossSpkklp[mek][stKklp]++;
          if (crossType[mek][type] !== undefined) crossType[mek][type]++;
        }
      });
      if (hasMekanisme) fktpWithMekanisme++;

      if (prb.kendala && prb.kendala.trim().length > 3) {
        const text = (prb.kendala || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g,"");
        const words = text.split(/\s+/).filter(w => w.length > 3 && !['yang', 'dari', 'pada', 'untuk', 'dengan', 'dan', 'atau', 'ini', 'itu', 'karena', 'tidak', 'belum', 'kurang'].includes(w));
        words.forEach(w => { kendalaMapF[w] = (kendalaMapF[w] || 0) + 1; });
      }
    });

    const topKendalaR = Object.keys(kendalaMapR).map(k => ({ name: k, value: kendalaMapR[k] })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topKendalaF = Object.keys(kendalaMapF).map(k => ({ name: k, value: kendalaMapF[k] })).sort((a,b) => b.value - a.value).slice(0, 10);
    const proporsiMekanisme = uniqueFktpData.length > 0 ? (fktpWithMekanisme / uniqueFktpData.length) * 100 : 0;

    const crossSpkklpData = Object.keys(crossSpkklp).map(k => ({ name: k, ...crossSpkklp[k] }));
    const crossTypeData = Object.keys(crossType).map(k => ({ name: k, ...crossType[k] }));

    return {
      monStats: { fktpWithMekanisme, proporsiMekanisme },
      mekanismeDataR: Object.keys(mekCountsR).map(k => ({ name: k, value: mekCountsR[k] })).filter(d => d.value > 0),
      mekanismeDataF: Object.keys(mekCountsF).map(k => ({ name: k, value: mekCountsF[k] })).filter(d => d.value > 0),
      kendalaDataR: topKendalaR,
      kendalaDataF: topKendalaF,
      crossSpkklpData,
      crossTypeData
    };
  }, [filteredData, uniqueFktpData]);

  const mekanismeData = mekanismeView === 'fktp' ? mekanismeDataF : mekanismeDataR;
  const kendalaData = kendalaView === 'fktp' ? kendalaDataF : kendalaDataR;
  const mekanismeLabel = mekanismeView === 'fktp' ? 'Jumlah FKTP' : 'Jumlah Responden';
  const kendalaLabel = kendalaView === 'fktp' ? 'FKTP (Frekuensi Kata)' : 'Responden (Frekuensi Kata)';

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
        title: 'Statistik Monitoring PRB (Per FKTP)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden', filteredData.length],
          ['Total FKTP (Unik)', uniqueFktpData.length],
          ['Total FKTP dengan Mekanisme', monStats.fktpWithMekanisme],
          ['Proporsi FKTP dengan Mekanisme', `${monStats.proporsiMekanisme.toFixed(2)}%`]
        ]
      },
      { title: 'Proporsi Mekanisme Utama PRB (Per Responden)', headers: ['Mekanisme', 'Jumlah Responden'], data: mekanismeDataR },
      { title: 'Proporsi Mekanisme Utama PRB (Per FKTP)', headers: ['Mekanisme', 'Jumlah FKTP'], data: mekanismeDataF },
      { title: 'Top 10 Kata Kunci Kendala Pelaksanaan (Per Responden)', headers: ['Kata Kunci', 'Frekuensi Penyebutan'], data: kendalaDataR },
      { title: 'Top 10 Kata Kunci Kendala Pelaksanaan (Per FKTP)', headers: ['Kata Kunci', 'Frekuensi Penyebutan'], data: kendalaDataF }
    ];

    const rawData = {
      headers: ['No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi', 'Pengingat Kunjungan', 'Telepon/WA', 'Kunjungan Rumah', 'Tidak Ada Mekanisme', 'Lainnya', 'Teks Kendala'],
      rows: filteredData.map((row, idx) => {
        const prb = row.prb || {};
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          prb['mek_Pengingat kunjungan'] ? 'Ya' : 'Tidak',
          prb['mek_Telepon/WA'] ? 'Ya' : 'Tidak',
          prb['mek_Kunjungan rumah'] ? 'Ya' : 'Tidak',
          prb['mek_Tidak ada mekanisme khusus'] ? 'Ya' : 'Tidak',
          prb['mek_Lainnya'] ? 'Ya' : 'Tidak',
          prb.kendala || '-'
        ];
      })
    };

    exportTablesToExcel('MONITORING PROGRAM RUJUK BALIK', tables, 'Dashboard_Monitoring_PRB', rawData);
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
        <StatCard title="Total FKTP dengan Mekanisme" value={monStats.fktpWithMekanisme} subtitle={`${monStats.proporsiMekanisme.toFixed(1)}% dari total FKTP`} icon={Activity} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Top Mekanisme" value={mekanismeData.sort((a,b)=>b.value-a.value)[0]?.name || '-'} subtitle="Paling banyak digunakan" icon={FileSearch} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Top Kendala Pelaksanaan" value={kendalaData[0]?.name || '-'} subtitle={`${kendalaData[0]?.value || 0} penyebutan`} icon={AlertCircle} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="Kata Kunci Kendala #2" value={kendalaData[1]?.name || '-'} subtitle={`${kendalaData[1]?.value || 0} penyebutan`} icon={ShieldAlert} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-blue-600" /> Proporsi Mekanisme Utama PRB</h3>
            {!isPrinting && <ViewToggle value={mekanismeView} onChange={setMekanismeView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{mekanismeView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={mekanismeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {mekanismeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} ${mekanismeLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-amber-600" /> Top 10 Kata Kunci Kendala Pelaksanaan</h3>
            {!isPrinting && <ViewToggle value={kendalaView} onChange={setKendalaView} />}
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">{kendalaView === 'responden' ? `${filteredData.length} responden` : `${uniqueFktpData.length} FKTP unik`}</p>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={kendalaData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 12, fontWeight: 500 }} width={80} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} sebutan`, 'Frekuensi']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Frekuensi Kata" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={20}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : 'lg:col-span-2'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-emerald-600" /> Komparasi Mekanisme: Ada vs Tidak Ada Sp.KKLP</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">Berdasarkan {uniqueFktpData.length} FKTP Unik</p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={monStats.crossSpkklpData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Ada Sp.KKLP" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Tidak Ada" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300 lg:col-span-2' : 'lg:col-span-2'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-indigo-600" /> Komparasi Mekanisme: Berdasarkan Jenis FKTP</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4 italic">Berdasarkan {uniqueFktpData.length} FKTP Unik</p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={monStats.crossTypeData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Puskesmas" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Klinik" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="DPM" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
