import React, { useMemo } from 'react';
import { exportTablesToExcel } from '../../utils/exportExcelUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LabelList
} from 'recharts';
import { Activity, Users, Clock, AlertTriangle, FileText, Download } from 'lucide-react';

export default function DashboardPRB({ filteredData, COLORS, isPrinting }) {
  const { prbStats, diagnosisData, mekanismeData, kepatuhanRate } = useMemo(() => {
    let totalJumlah = 0;
    let totalRutin = 0;
    let totalTidakBerkunjung = 0;
    let totalRujukan = 0;
    let countRujukan = 0;

    const diagCounts = {
      'DM': 0, 'Hipertensi': 0, 'Jantung': 0, 'PPOK': 0, 
      'Asma': 0, 'Stroke': 0, 'Epilepsi': 0, 'Skizofrenia': 0, 'SLE': 0
    };

    const mekCounts = {
      'Pengingat kunjungan': 0, 'Telepon/WA': 0, 'Kunjungan rumah': 0, 
      'Tidak ada mekanisme khusus': 0, 'Lainnya': 0
    };

    filteredData.forEach(row => {
      const prb = row.prb || {};
      totalJumlah += Number(prb.jumlah) || 0;
      totalRutin += Number(prb.rutinKunjungan) || 0;
      totalTidakBerkunjung += Number(prb.tidakBerkunjung) || 0;
      
      if (prb.rataRujukan) {
        totalRujukan += Number(prb.rataRujukan);
        countRujukan++;
      }

      diagCounts['DM'] += Number(prb.peserta_dm) || 0;
      diagCounts['Hipertensi'] += Number(prb.peserta_ht) || 0;
      diagCounts['Jantung'] += Number(prb.peserta_jantung) || 0;
      diagCounts['PPOK'] += Number(prb.peserta_ppok) || 0;
      diagCounts['Asma'] += Number(prb.peserta_asma) || 0;
      diagCounts['Stroke'] += Number(prb.peserta_stroke) || 0;
      diagCounts['Epilepsi'] += Number(prb.peserta_epilepsi) || 0;
      diagCounts['Skizofrenia'] += Number(prb.peserta_skizofrenia) || 0;
      diagCounts['SLE'] += Number(prb.peserta_sle) || 0;

      Object.keys(mekCounts).forEach(mek => {
        if (prb[`mek_${mek}`]) mekCounts[mek]++;
      });
    });

    const kepatuhan = totalJumlah > 0 ? (totalRutin / totalJumlah) * 100 : 0;
    const ketidakpatuhan = totalJumlah > 0 ? (totalTidakBerkunjung / totalJumlah) * 100 : 0;

    return {
      prbStats: {
        totalJumlah: Math.round(totalJumlah),
        totalRutin: Math.round(totalRutin),
        totalTidakBerkunjung: Math.round(totalTidakBerkunjung),
        avgJumlah: filteredData.length > 0 ? Math.round(totalJumlah / filteredData.length) : 0,
        avgRutin: filteredData.length > 0 ? Math.round(totalRutin / filteredData.length) : 0,
        avgTidakBerkunjung: filteredData.length > 0 ? Math.round(totalTidakBerkunjung / filteredData.length) : 0,
        avgRujukan: countRujukan > 0 ? Math.round(totalRujukan / countRujukan) : 0
      },
      kepatuhanRate: kepatuhan,
      diagnosisData: Object.keys(diagCounts).map(k => ({ name: k, value: diagCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0),
      mekanismeData: Object.keys(mekCounts).map(k => ({ name: k, value: mekCounts[k] })).sort((a,b) => b.value - a.value).filter(d => d.value > 0)
    };
  }, [filteredData]);

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
    // Prevent negative values for 'Empty' part which breaks the chart visual
    const safeValue = Math.min(Math.max(value, 0), 100);
    const data = [
      { name: 'Value', value: safeValue },
      { name: 'Empty', value: 100 - safeValue }
    ];
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
          ['Total Peserta PRB Aktif', prbStats.totalJumlah],
          ['Peserta Rutin Berkunjung', prbStats.totalRutin],
          ['Peserta Tidak Berkunjung', prbStats.totalTidakBerkunjung],
          ['Rata-rata Rujukan FKRTL', prbStats.avgRujukan]
        ]
      },
      {
        title: 'Kepatuhan PRB',
        headers: ['Kategori', 'Persentase'],
        data: [
          ['Peserta Rutin Berkunjung', `${kepatuhanRate.toFixed(2)}%`],
          ['Peserta Tidak Berkunjung', `${(prbStats.totalJumlah > 0 ? (prbStats.totalTidakBerkunjung / prbStats.totalJumlah) * 100 : 0).toFixed(2)}%`]
        ]
      },
      {
        title: 'Distribusi Diagnosis PRB',
        headers: ['Diagnosis', 'Jumlah FKTP'],
        data: diagnosisData
      },
      {
        title: 'Mekanisme Pemantauan PRB',
        headers: ['Mekanisme', 'Jumlah FKTP'],
        data: mekanismeData
      }
    ];

    const rawData = {
      headers: [
        'No', 'Nama Faskes', 'Provinsi',
        'Total Peserta PRB', 'Rutin Berkunjung', 'Tidak Berkunjung', '% Kepatuhan', 'Rata² Rujukan FKRTL',
        'Peserta DM', 'Peserta Hipertensi', 'Peserta Jantung', 'Peserta PPOK',
        'Peserta Asma', 'Peserta Stroke', 'Peserta Epilepsi', 'Peserta Skizofrenia', 'Peserta SLE',
        'Mek: Pengingat Kunjungan', 'Mek: Telepon/WA', 'Mek: Kunjungan Rumah',
        'Mek: Tidak Ada', 'Mek: Lainnya', 'Kendala (Teks)'
      ],
      rows: filteredData.map((row, idx) => {
        const prb = row.prb || {};
        const jumlah = Number(prb.jumlah) || 0;
        const rutin = Number(prb.rutinKunjungan) || 0;
        return [
          idx + 1, row.fktp_name || '-', row.provinsi || '-',
          jumlah, rutin,
          Number(prb.tidakBerkunjung) || 0,
          jumlah > 0 ? Number(((rutin / jumlah) * 100).toFixed(1)) : 0,
          Number(prb.rataRujukan) || 0,
          Number(prb.peserta_dm) || 0,
          Number(prb.peserta_ht) || 0,
          Number(prb.peserta_jantung) || 0,
          Number(prb.peserta_ppok) || 0,
          Number(prb.peserta_asma) || 0,
          Number(prb.peserta_stroke) || 0,
          Number(prb.peserta_epilepsi) || 0,
          Number(prb.peserta_skizofrenia) || 0,
          Number(prb.peserta_sle) || 0,
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
    <div className="space-y-8 animate-fade-in">
      {!isPrinting && (
        <div className="flex justify-end mb-4 no-print">
          <button onClick={handleExport} className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-400 hover:to-teal-500 transition shadow-md active:scale-95 text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Excel Dashboard
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Peserta PRB Aktif" value={prbStats.totalJumlah} subtitle={`Rata-rata: ${prbStats.avgJumlah} per FKTP`} icon={Users} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Peserta Rutin Berkunjung" value={prbStats.totalRutin} subtitle={`Rata-rata: ${prbStats.avgRutin} per FKTP (dalam 3 bln)`} icon={Activity} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Peserta Tidak Berkunjung" value={prbStats.totalTidakBerkunjung} subtitle={`Rata-rata: ${prbStats.avgTidakBerkunjung} per FKTP (> 3 bln)`} icon={AlertTriangle} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Rata-rata Rujukan FKRTL" value={prbStats.avgRujukan} subtitle="Per bulan per FKTP" icon={FileText} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Kepatuhan PRB</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <GaugeChart value={kepatuhanRate} label="Proporsi Peserta Rutin (Kepatuhan)" color="#10b981" />
            <GaugeChart value={prbStats.totalJumlah > 0 ? (prbStats.totalTidakBerkunjung / prbStats.totalJumlah) * 100 : 0} label="Proporsi Peserta Tidak Berkunjung" color="#f43f5e" />
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><FileText className="w-5 h-5 mr-2 text-primary-600" /> Distribusi Diagnosis PRB</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <PieChart>
                <Pie data={diagnosisData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" labelLine={false} label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}>
                  {diagnosisData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Clock className="w-5 h-5 mr-2 text-primary-600" /> Mekanisme Pemantauan PRB di FKTP</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="99%" height="100%" minHeight={250} minWidth={0}>
              <BarChart data={mekanismeData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah FKTP" fill="#45B669" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
