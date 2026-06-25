import React, { useMemo } from 'react';
import ExportButton from '../ExportButton';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Legend, LabelList
} from 'recharts';
import { penyakitPasienBulanan } from '../SurveyForm';
import { Activity, Users, FileText, BarChart3 } from 'lucide-react';

export default function DashboardPasienBulanan({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const { totalPatientsByDisease, averagePatientsByFaskes, generalStats } = useMemo(() => {
    const diseaseTotals = {};
    const faskesData = {
      Puskesmas: {},
      Klinik: {},
      DPM: {}
    };
    const faskesCounts = {
      Puskesmas: 0,
      Klinik: 0,
      DPM: 0
    };

    // Initialize
    penyakitPasienBulanan.forEach(p => {
      diseaseTotals[p.id] = 0;
      faskesData.Puskesmas[p.id] = 0;
      faskesData.Klinik[p.id] = 0;
      faskesData.DPM[p.id] = 0;
    });

    let overallTotal = 0;

    uniqueFktpData.forEach(row => {
      const isDpm = row.role === 'Dokter Praktik Mandiri';
      const fType = isDpm ? 'DPM' : (row.jenis_faskes === 'Klinik' ? 'Klinik' : 'Puskesmas');
      
      faskesCounts[fType]++;

      const sourceObj = isDpm 
        ? row.dpm?.dataPasienBulanan 
        : row.data_pasien_bulanan;

      if (sourceObj) {
        penyakitPasienBulanan.forEach(p => {
          const val = Number(sourceObj[p.id]) || 0;
          diseaseTotals[p.id] += val;
          faskesData[fType][p.id] += val;
          overallTotal += val;
        });
      }
    });

    const diseaseData = penyakitPasienBulanan.map(p => ({
      id: p.id,
      name: p.label,
      value: diseaseTotals[p.id],
      required: p.required
    })).sort((a, b) => b.value - a.value);

    const faskesComparisonData = penyakitPasienBulanan.map(p => {
      const puskAvg = faskesCounts.Puskesmas > 0 ? Math.round(faskesData.Puskesmas[p.id] / faskesCounts.Puskesmas) : 0;
      const klinAvg = faskesCounts.Klinik > 0 ? Math.round(faskesData.Klinik[p.id] / faskesCounts.Klinik) : 0;
      const dpmAvg = faskesCounts.DPM > 0 ? Math.round(faskesData.DPM[p.id] / faskesCounts.DPM) : 0;

      return {
        name: p.label,
        Puskesmas: puskAvg,
        Klinik: klinAvg,
        'Praktik Mandiri (DPM)': dpmAvg
      };
    });

    return {
      totalPatientsByDisease: diseaseData,
      averagePatientsByFaskes: faskesComparisonData,
      generalStats: {
        totalPasien: overallTotal,
        rataRataTotal: uniqueFktpData.length > 0 ? (overallTotal / uniqueFktpData.length) : 0,
        totalFaskesIsi: uniqueFktpData.filter(r => (r.role === 'Dokter Praktik Mandiri' ? r.dpm?.dataPasienBulanan : r.data_pasien_bulanan)).length,
        proporsiIsi: uniqueFktpData.length > 0 ? (uniqueFktpData.filter(r => (r.role === 'Dokter Praktik Mandiri' ? r.dpm?.dataPasienBulanan : r.data_pasien_bulanan)).length / uniqueFktpData.length) * 100 : 0
      }
    };
  }, [uniqueFktpData]);

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Pasien Dilayani (1 Bln)" value={generalStats.totalPasien} icon={Users} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        <StatCard title="Rata-rata Pasien per Faskes" value={Math.round(generalStats.rataRataTotal)} subtitle="Beban kerja per responden" icon={Activity} colorClass="bg-teal-500 text-teal-600 bg-teal-100" />
        <StatCard title="Jumlah FKTP" value={uniqueFktpData.length} icon={FileText} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-primary-600" /> Total Akumulasi Kasus per Penyakit</h3>
            {!isPrinting && <ExportButton fileName="Total Akumulasi Kasus per Penyakit" />}
          </div>
          <div className="h-96">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={totalPatientsByDisease} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} width={120} />
                <RechartsTooltip formatter={(value) => [`${value} Pasien`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Total Pasien" fill="#6366f1" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  <LabelList dataKey="value" position="right" fill="#475569" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Activity className="w-5 h-5 mr-2 text-primary-600" /> Rata-rata Kunjungan per Jenis Faskes</h3>
            {!isPrinting && <ExportButton fileName="Rata-rata Kunjungan per Jenis Faskes" />}
          </div>
          <p className="text-xs text-slate-400 mb-4">Perbandingan rata-rata pasien yang dilayani di Puskesmas, Klinik, dan DPM dalam 1 bulan terakhir.</p>
          <div className="h-96">
            <ResponsiveContainer width="99%" height="100%">
              <BarChart data={averagePatientsByFaskes} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} angle={-35} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 12 }} />
                <RechartsTooltip formatter={(value) => [`${value} Pasien`, 'Rata-rata']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="Puskesmas" fill="#00857A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Klinik" fill="#00B4D5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Praktik Mandiri (DPM)" fill="#F28322" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
