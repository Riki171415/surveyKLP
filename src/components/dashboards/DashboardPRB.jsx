import React, { useMemo, useState } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, Users, Clock, AlertTriangle, FileText, Download, Image as ImageIcon } from 'lucide-react';
import { downloadElementAsPNG } from '../../utils/exportImageUtils';
import ReportGenerator from '../ui/ReportGenerator';

// ── Komponen Toggle Pill ──────────────────────────────────────────────────────
const ViewToggle = ({ value, onChange }) => (
  <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-semibold shrink-0">
    <button
      onClick={() => onChange('responden')}
      className={`px-3 py-1 rounded-md transition-all ${value === 'responden' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
    >
      Per Responden
    </button>
    <button
      onClick={() => onChange('fktp')}
      className={`px-3 py-1 rounded-md transition-all ${value === 'fktp' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
    >
      Per FKTP
    </button>
  </div>
);

export default function DashboardPRB({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const [diagView, setDiagView] = useState('responden');
  const [mekView, setMekView] = useState('responden');

  const { prbStats, diagnosisDataResponden, diagnosisDataFktp, mekanismeDataResponden, mekanismeDataFktp, kepatuhanRate } = useMemo(() => {
    let totalJumlah = 0, totalRutin = 0, totalTidakBerkunjung = 0, totalRujukan = 0, countRujukan = 0;

    const diagCountsR = { 'DM': 0, 'Hipertensi': 0, 'Jantung': 0, 'PPOK': 0, 'Asma': 0, 'Stroke': 0, 'Epilepsi': 0, 'Skizofrenia': 0, 'SLE': 0 };
    const mekCountsR  = { 'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 'Tidak ada mekanisme khusus': 0, 'Lainnya': 0 };

    filteredData.forEach(row => {
      const prb = row.prb || {};
      totalJumlah += Number(prb.jumlah) || Number(prb.totalPeserta) || 0;
      totalRutin  += Number(prb.rutinKunjungan) || Number(prb.kunjunganRutin) || 0;
      totalTidakBerkunjung += Number(prb.tidakBerkunjung) || 0;
      if (prb.rataRujukan) { totalRujukan += Number(prb.rataRujukan); countRujukan++; }

      diagCountsR['DM']          += Number(prb.peserta_dm) || Number(prb.kasus?.DM) || 0;
      diagCountsR['Hipertensi']  += Number(prb.peserta_ht) || Number(prb.kasus?.Hipertensi) || 0;
      diagCountsR['Jantung']     += Number(prb.peserta_jantung) || Number(prb.kasus?.Jantung) || 0;
      diagCountsR['PPOK']        += Number(prb.peserta_ppok) || Number(prb.kasus?.PPOK) || 0;
      diagCountsR['Asma']        += Number(prb.peserta_asma) || Number(prb.kasus?.Asma) || 0;
      diagCountsR['Stroke']      += Number(prb.peserta_stroke) || Number(prb.kasus?.Stroke) || 0;
      diagCountsR['Epilepsi']    += Number(prb.peserta_epilepsi) || Number(prb.kasus?.Epilepsi) || 0;
      diagCountsR['Skizofrenia'] += Number(prb.peserta_skizofrenia) || Number(prb.kasus?.Skizofrenia) || 0;
      diagCountsR['SLE']         += Number(prb.peserta_sle) || Number(prb.kasus?.SLE) || 0;
      Object.keys(mekCountsR).forEach(mek => { if (prb[`mek_${mek}`]) mekCountsR[mek]++; });
    });

    // ── Per FKTP (Rata-rata per Faskes) ──
    const totalFktp = uniqueFktpData.length || 1;
    const diagCountsF = {
      'DM': Number((diagCountsR['DM'] / totalFktp).toFixed(1)),
      'Hipertensi': Number((diagCountsR['Hipertensi'] / totalFktp).toFixed(1)),
      'Jantung': Number((diagCountsR['Jantung'] / totalFktp).toFixed(1)),
      'PPOK': Number((diagCountsR['PPOK'] / totalFktp).toFixed(1)),
      'Asma': Number((diagCountsR['Asma'] / totalFktp).toFixed(1)),
      'Stroke': Number((diagCountsR['Stroke'] / totalFktp).toFixed(1)),
      'Epilepsi': Number((diagCountsR['Epilepsi'] / totalFktp).toFixed(1)),
      'Skizofrenia': Number((diagCountsR['Skizofrenia'] / totalFktp).toFixed(1)),
      'SLE': Number((diagCountsR['SLE'] / totalFktp).toFixed(1))
    };

    const mekCountsF  = { 'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 'Tidak ada mekanisme khusus': 0, 'Lainnya': 0 };
    uniqueFktpData.forEach(row => {
      const prb = row.prb || {};
      Object.keys(mekCountsF).forEach(mek => { if (prb[`mek_${mek}`]) mekCountsF[mek]++; });
    });

    const kepatuhan = totalJumlah > 0 ? (totalRutin / totalJumlah) * 100 : 0;

    const toArr = (obj) => Object.keys(obj).map(k => ({ name: k, value: obj[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0);

    return {
      prbStats: {
        totalJumlah: Math.round(totalJumlah), totalRutin: Math.round(totalRutin),
        totalTidakBerkunjung: Math.round(totalTidakBerkunjung),
        avgJumlah: filteredData.length > 0 ? Math.round(totalJumlah / filteredData.length) : 0,
        avgJumlahFktp: uniqueFktpData.length > 0 ? Math.round(totalJumlah / uniqueFktpData.length) : 0,
        avgRutin: filteredData.length > 0 ? Math.round(totalRutin / filteredData.length) : 0,
        avgTidakBerkunjung: filteredData.length > 0 ? Math.round(totalTidakBerkunjung / filteredData.length) : 0,
        avgRutinFktp: uniqueFktpData.length > 0 ? Math.round(totalRutin / uniqueFktpData.length) : 0,
        avgTidakBerkunjungFktp: uniqueFktpData.length > 0 ? Math.round(totalTidakBerkunjung / uniqueFktpData.length) : 0,
        avgRujukan: countRujukan > 0 ? Math.round(totalRujukan / countRujukan) : 0
      },
      kepatuhanRate: kepatuhan,
      diagnosisDataResponden: toArr(diagCountsR),
      diagnosisDataFktp: toArr(diagCountsF),
      mekanismeDataResponden: toArr(mekCountsR),
      mekanismeDataFktp: toArr(mekCountsF),
    };
  }, [filteredData, uniqueFktpData]);

  // Data aktif berdasarkan toggle
  const diagnosisData  = diagView  === 'fktp' ? diagnosisDataFktp  : diagnosisDataResponden;
  const mekanismeData  = mekView   === 'fktp' ? mekanismeDataFktp  : mekanismeDataResponden;
  const diagLabel      = diagView  === 'fktp' ? 'Rata-rata Pasien / Faskes' : 'Total Pasien';
  const mekLabel       = mekView   === 'fktp' ? 'Jumlah FKTP'      : 'Jumlah Responden';

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

  const GaugeChart = ({ value, label, color }) => {
    const safeValue = Math.min(Math.max(value, 0), 100);
    const data = [{ name: 'Value', value: safeValue }, { name: 'Empty', value: 100 - safeValue }];
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="h-32 sm:h-40 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={80} paddingAngle={0} dataKey="value" stroke="none">
                <Cell fill={color} />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-3xl font-bold" style={{ color }}>{value.toFixed(1)}%</span>
          </div>
        </div>
        <p className="text-sm font-semibold text-slate-600 mt-2 px-2 text-center">{label}</p>
      </div>
    );
  };

  const handleExport = () => {
    const tables = [
      {
        title: 'Statistik Program Rujuk Balik (PRB)',
        headers: ['Metrik', 'Nilai'],
        data: [
          ['Total Responden', filteredData.length],
          ['Total FKTP (Unik)', uniqueFktpData.length],
          ['Total Peserta PRB Aktif', prbStats.totalJumlah],
          ['Rata-rata Peserta PRB per Faskes', prbStats.avgJumlahFktp],
          ['Peserta Rutin Berkunjung', prbStats.totalRutin],
          ['Rata-rata Peserta Rutin per Faskes', prbStats.avgRutinFktp],
          ['Peserta Tidak Berkunjung', prbStats.totalTidakBerkunjung],
          ['Rata-rata Peserta Tidak Berkunjung per Faskes', prbStats.avgTidakBerkunjungFktp],
          ['Rata-rata Rujukan FKRTL per Faskes/Bulan', prbStats.avgRujukan]
        ]
      },
      {
        title: 'Kepatuhan PRB',
        headers: ['Kategori', 'Nilai', 'Persentase'],
        data: [
          ['Peserta Rutin Berkunjung', prbStats.totalRutin, `${kepatuhanRate.toFixed(2)}%`],
          ['Peserta Tidak Berkunjung', prbStats.totalTidakBerkunjung, `${(prbStats.totalJumlah > 0 ? (prbStats.totalTidakBerkunjung / prbStats.totalJumlah) * 100 : 0).toFixed(2)}%`]
        ]
      },
      {
        title: 'Distribusi Diagnosis PRB (Per Responden — akumulasi peserta)',
        headers: ['Diagnosis', 'Jumlah (Nilai)', 'Persentase (%)'],
        data: diagnosisDataResponden.map(d => [d.name, d.value, `${prbStats.totalJumlah > 0 ? ((d.value / prbStats.totalJumlah) * 100).toFixed(1) : 0}%`])
      },
      {
        title: 'Distribusi Diagnosis PRB (Rata-rata per FKTP)',
        headers: ['Diagnosis', 'Rata-rata Pasien / Faskes'],
        data: diagnosisDataFktp.map(d => [d.name, d.value])
      },
      {
        title: 'Mekanisme Pemantauan PRB (Per Responden)',
        headers: ['Mekanisme', 'Jumlah Responden', 'Persentase (%)'],
        data: mekanismeDataResponden.map(d => [d.name, d.value, `${filteredData.length > 0 ? ((d.value / filteredData.length) * 100).toFixed(1) : 0}%`])
      },
      {
        title: 'Mekanisme Pemantauan PRB (Per FKTP)',
        headers: ['Mekanisme', 'Jumlah FKTP', 'Persentase (%)'],
        data: mekanismeDataFktp.map(d => [d.name, d.value, `${uniqueFktpData.length > 0 ? ((d.value / uniqueFktpData.length) * 100).toFixed(1) : 0}%`])
      }
    ];

    const rawData = {
      headers: [
        'No', 'Nama Responden', 'Peran', 'Nama Faskes', 'Provinsi',
        'Total Peserta PRB', 'Rutin Berkunjung', 'Tidak Berkunjung', '% Kepatuhan', 'Rata² Rujukan FKRTL',
        'Peserta DM', 'Peserta Hipertensi', 'Peserta Jantung', 'Peserta PPOK',
        'Peserta Asma', 'Peserta Stroke', 'Peserta Epilepsi', 'Peserta Skizofrenia', 'Peserta SLE',
        'Mek: Pengingat Kunjungan', 'Mek: Telepon/WA', 'Mek: Kunjungan Rumah',
        'Mek: Tidak Ada', 'Mek: Lainnya', 'Kendala (Teks)'
      ],
      rows: filteredData.map((row, idx) => {
        const prb = row.prb || {};
        const jumlah = Number(prb.jumlah) || Number(prb.totalPeserta) || 0;
        const rutin = Number(prb.rutinKunjungan) || Number(prb.kunjunganRutin) || 0;
        return [
          idx + 1, row.nama_responden || '-', row.role || '-', row.fktp_name || '-', row.provinsi || '-',
          jumlah, rutin,
          Number(prb.tidakBerkunjung) || 0,
          jumlah > 0 ? Number(((rutin / jumlah) * 100).toFixed(1)) : 0,
          Number(prb.rataRujukan) || 0,
          Number(prb.peserta_dm) || Number(prb.kasus?.DM) || 0,
          Number(prb.peserta_ht) || Number(prb.kasus?.Hipertensi) || 0,
          Number(prb.peserta_jantung) || Number(prb.kasus?.Jantung) || 0,
          Number(prb.peserta_ppok) || Number(prb.kasus?.PPOK) || 0,
          Number(prb.peserta_asma) || Number(prb.kasus?.Asma) || 0,
          Number(prb.peserta_stroke) || Number(prb.kasus?.Stroke) || 0,
          Number(prb.peserta_epilepsi) || Number(prb.kasus?.Epilepsi) || 0,
          Number(prb.peserta_skizofrenia) || Number(prb.kasus?.Skizofrenia) || 0,
          Number(prb.peserta_sle) || Number(prb.kasus?.SLE) || 0,
          prb['mek_Pengingat kunjungan'] ? 'Ya' : 'Tidak',
          prb['mek_Telepon/WA'] ? 'Ya' : 'Tidak',
          prb['mek_Kunjungan rumah'] ? 'Ya' : 'Tidak',
          prb['mek_Tidak ada mekanisme khusus'] ? 'Ya' : 'Tidak',
          prb['mek_Lainnya'] ? 'Ya' : 'Tidak',
          prb.kendala || '-'
        ];
      })
    };

    exportTablesToExcel('PROGRAM RUJUK BALIK (PRB)', tables, 'Dashboard_PRB', rawData);
  };

  return (
    <div id="dashboard-prb-capture" className="space-y-8 animate-fade-in relative">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print gap-2 capture-exclude">
          <button onClick={() => downloadElementAsPNG('dashboard-prb-capture', 'Dashboard_PRB_Full')} className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-bold hover:from-indigo-400 hover:to-indigo-500 transition shadow-md active:scale-95 text-sm">
            <ImageIcon className="w-4 h-4 mr-2" /> Download PNG
          </button>
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total & Rata² Peserta PRB" value={prbStats.totalJumlah} subtitle={`Rata-rata: ${prbStats.avgJumlahFktp} pasien / faskes`} icon={Users} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Peserta Rutin Berkunjung" value={prbStats.totalRutin} subtitle={`Rata-rata: ${prbStats.avgRutinFktp} pasien / faskes`} icon={Activity} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Peserta Tidak Berkunjung" value={prbStats.totalTidakBerkunjung} subtitle={`Rata-rata: ${prbStats.avgTidakBerkunjungFktp} pasien / faskes`} icon={AlertTriangle} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Rata-rata Rujukan FKRTL" value={prbStats.avgRujukan} subtitle="Per faskes / bulan" icon={FileText} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div id="prb-kepatuhan-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('prb-kepatuhan-chart', 'Kepatuhan_PRB')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-start mb-6 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Kepatuhan PRB</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <GaugeChart value={kepatuhanRate} label="Proporsi Peserta Rutin (Kepatuhan)" color="#10b981" />
            <GaugeChart value={prbStats.totalJumlah > 0 ? (prbStats.totalTidakBerkunjung / prbStats.totalJumlah) * 100 : 0} label="Proporsi Peserta Tidak Berkunjung" color="#f43f5e" />
          </div>
        </div>

        <div id="prb-diagnosis-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('prb-diagnosis-chart', 'Distribusi_Diagnosis')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-4 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary-600" /> Distribusi Diagnosis PRB</h3>
            {!isPrinting && <ViewToggle value={diagView} onChange={setDiagView} />}
          </div>
          <p className="text-xs text-slate-400 mb-3 italic">
            {diagView === 'responden' ? `Akumulasi peserta dari ${filteredData.length} responden` : `Rata-rata peserta per faskes (dari ${uniqueFktpData.length} FKTP)`}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="99%" height="100%" minHeight={200} minWidth={0}>
              <PieChart>
                <Pie data={diagnosisData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {diagnosisData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} ${diagLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="prb-mekanisme-chart" className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          {!isPrinting && (
            <button onClick={() => downloadElementAsPNG('prb-mekanisme-chart', 'Mekanisme_PRB')} className="capture-exclude absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition" title="Download Chart PNG">
              <ImageIcon className="w-4 h-4" />
            </button>
          )}
          <div className="flex justify-between items-center mb-4 pr-10">
            <h3 className="text-base font-bold text-slate-800 flex items-center"><Clock className="w-5 h-5 mr-2 text-primary-600" /> Mekanisme Pemantauan PRB</h3>
            {!isPrinting && <ViewToggle value={mekView} onChange={setMekView} />}
          </div>
          <p className="text-xs text-slate-400 mb-3 italic">
            {mekView === 'responden' ? `Dari ${filteredData.length} responden` : `Dari ${uniqueFktpData.length} FKTP unik`}
          </p>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={mekanismeData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} ${mekLabel}`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name={mekLabel} fill={mekView === 'fktp' ? '#10b981' : '#45B669'} radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>

    <ReportGenerator
      dashboardId="prb"
      dashboardName="Monitoring PRB (Program Rujuk Balik)"
      promptContext={`Total responden: ${filteredData?.length ?? 0}. Total FKTP unik: ${uniqueFktpData?.length ?? 0}. Total peserta PRB aktif: ${prbStats?.totalJumlah ?? 0}. Peserta rutin berkunjung: ${prbStats?.totalRutin ?? 0}. Peserta tidak berkunjung: ${prbStats?.totalTidakBerkunjung ?? 0}. Tingkat kepatuhan (proporsi rutin): ${kepatuhanRate?.toFixed(1) ?? 0}%. Rata-rata peserta PRB per faskes: ${prbStats?.avgJumlahFktp ?? 0}. Rata-rata peserta rutin per faskes: ${prbStats?.avgRutinFktp ?? 0}. Rata-rata peserta tidak berkunjung per faskes: ${prbStats?.avgTidakBerkunjungFktp ?? 0}. Rata-rata rujukan FKRTL per faskes/bulan: ${prbStats?.avgRujukan ?? 0}. Diagnosis terbanyak (responden): ${diagnosisDataResponden?.[0]?.name ?? '-'} (${diagnosisDataResponden?.[0]?.value ?? 0} peserta). Mekanisme pemantauan terbanyak (responden): ${mekanismeDataResponden?.[0]?.name ?? '-'} (${mekanismeDataResponden?.[0]?.value ?? 0} faskes).`}
    />
  );
}
