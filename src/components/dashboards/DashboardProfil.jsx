import React, { useMemo } from 'react';
import wilayahMapping from '../../data/wilayahMapping.json';
import ExportButton from '../ExportButton';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Users, Stethoscope, Building, Map } from 'lucide-react';

export default function DashboardProfil({ filteredData, uniqueFktpData, COLORS, isPrinting }) {
  const totalResponden = filteredData.length;
  const totalFktp = uniqueFktpData.length;

  const { roleChartData, spkklpCount, fktpTypeData, uniqueFktpTypeData, regionalData, partisipasiData } = useMemo(() => {
    const roleCount = {}; 
    const fktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
    const regionalCount = {};
    let spkklpCount = 0;

    filteredData.forEach((row, index) => {
      const role = row.role || 'Lainnya'; 
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      const fName = (row.fktp_name || '').toLowerCase();
      let type = row.jenis_faskes;
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
        if (role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }
      fktpTypeCount[type]++;

      const prov = row.provinsi || 'Lainnya';
      regionalCount[prov] = (regionalCount[prov] || 0) + 1;
    });

    const uniqueFktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'Dokter Praktik Mandiri': 0 };
    uniqueFktpData.forEach((row) => {
      const stKklp = row.doc_kklp || 'Tidak';
      if (stKklp === 'Ya') spkklpCount++;

      const fName = (row.fktp_name || '').toLowerCase();
      let type = row.jenis_faskes;
      if (type !== 'Puskesmas' && type !== 'Klinik' && type !== 'Dokter Praktik Mandiri') {
        if (row.role === 'Dokter Praktik Mandiri') type = 'Dokter Praktik Mandiri';
        else if (fName.includes('puskesmas') || fName.includes('pkm') || fName.includes('puseksmas') || fName.includes('puskes')) type = 'Puskesmas';
        else type = 'Klinik';
      }
      uniqueFktpTypeCount[type]++;
    });


    const regionalTarget = {};
    const combinedProvinces = new Set();
    
    if (wilayahMapping.fktp) {
      Object.keys(wilayahMapping.fktp).forEach(prov => {
        let count = 0;
        Object.values(wilayahMapping.fktp[prov]).forEach(arr => count += arr.length);
        regionalTarget[prov] = (regionalTarget[prov] || 0) + count;
        combinedProvinces.add(prov);
      });
    }
    if (wilayahMapping.dpm) {
      Object.keys(wilayahMapping.dpm).forEach(prov => {
        let count = 0;
        Object.values(wilayahMapping.dpm[prov]).forEach(arr => count += arr.length);
        regionalTarget[prov] = (regionalTarget[prov] || 0) + count;
        combinedProvinces.add(prov);
      });
    }

    const uniqueRegionalCount = {};
    uniqueFktpData.forEach(row => {
      const prov = row.provinsi || 'Lainnya';
      uniqueRegionalCount[prov] = (uniqueRegionalCount[prov] || 0) + 1;
      combinedProvinces.add(prov);
    });

    const partisipasiData = Array.from(combinedProvinces).map(prov => {
      const target = regionalTarget[prov] || 0;
      const capaian = uniqueRegionalCount[prov] || 0;
      const persentase = target > 0 ? (capaian / target) * 100 : (capaian > 0 ? 100 : 0);
      return { provinsi: prov, target, capaian, persentase };
    }).sort((a, b) => b.capaian - a.capaian); // sort by capaian descending

    return {
      roleChartData: Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] })).sort((a,b) => b.value - a.value),
      spkklpCount,
      fktpTypeData: Object.keys(fktpTypeCount).filter(k => fktpTypeCount[k] > 0).map(key => ({ name: key, value: fktpTypeCount[key] })),
      uniqueFktpTypeData: Object.keys(uniqueFktpTypeCount).filter(k => uniqueFktpTypeCount[k] > 0).map(key => ({ name: key, value: uniqueFktpTypeCount[key] })),
      regionalData: Object.keys(regionalCount).map(key => ({ name: key, value: regionalCount[key] })).sort((a,b) => b.value - a.value).slice(0, 10),
      partisipasiData
    };
  }, [filteredData, uniqueFktpData]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title="Total Responden" value={totalResponden} icon={Users} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Total Puskesmas" value={uniqueFktpTypeData.find(d => d.name === 'Puskesmas')?.value || 0} icon={Building} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Total Klinik" value={uniqueFktpTypeData.find(d => d.name === 'Klinik')?.value || 0} icon={Building} colorClass="bg-rose-500 text-rose-600 bg-rose-100" />
        <StatCard title="Dokter Praktik Mandiri" value={uniqueFktpTypeData.find(d => d.name === 'Dokter Praktik Mandiri')?.value || 0} icon={Stethoscope} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="FKTP dengan Sp.KKLP" value={spkklpCount || 0} subtitle={`${totalFktp > 0 ? Math.round((spkklpCount / totalFktp) * 100) : 0}% dari total FKTP`} icon={Stethoscope} colorClass="bg-primary-500 text-primary-600 bg-primary-100" />
      </div>

      <div className="mt-8 border-t border-slate-100 pt-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <Building className="w-6 h-6 mr-2 text-indigo-600" /> Institusi FKTP Berpartisipasi (Unik Berdasarkan Nama)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard title="Puskesmas Unik" value={uniqueFktpTypeData.find(d => d.name === 'Puskesmas')?.value || 0} icon={Building} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
          <StatCard title="Klinik Unik" value={uniqueFktpTypeData.find(d => d.name === 'Klinik')?.value || 0} icon={Building} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
          <StatCard title="DPM Unik" value={uniqueFktpTypeData.find(d => d.name === 'Dokter Praktik Mandiri')?.value || 0} icon={Stethoscope} colorClass="bg-indigo-500 text-indigo-600 bg-indigo-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Responden per FKTP</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Responden per FKTP" />}
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={fktpTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {fktpTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Responden`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-indigo-600" /> Proporsi FKTP Unik</h3>
            {!isPrinting && <ExportButton fileName="Proporsi FKTP Unik" />}
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={uniqueFktpTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {uniqueFktpTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Institusi`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Jabatan Responden</h3>
            {!isPrinting && <ExportButton fileName="Proporsi Jabatan Responden" />}
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {roleChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Responden`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', paddingTop: '15px', paddingBottom: '10px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-3 flex flex-col ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> 10 Provinsi Terbanyak</h3>
            {!isPrinting && <ExportButton fileName="10 Provinsi Terbanyak" />}
          </div>
          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah Responden" fill="#00857A" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  <LabelList dataKey="value" position="top" fill="#475569" fontSize={12} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Partisipasi Wilayah */}
      <div className={`mt-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> Target vs Capaian Partisipasi per Provinsi</h3>
          {!isPrinting && <ExportButton fileName="Target vs Capaian Provinsi" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Provinsi</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Estimasi Total FKTP</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Telah Mengisi Survey (Unik)</th>
                <th className="px-6 py-4 font-bold text-slate-700 text-center">Persentase Partisipasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {partisipasiData.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{row.provinsi}</td>
                  <td className="px-6 py-4 text-center text-slate-600">{row.target.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center font-bold text-primary-700">{row.capaian.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${row.persentase >= 80 ? 'bg-emerald-500' : row.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(row.persentase, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-xs font-bold ${row.persentase >= 80 ? 'text-emerald-700' : row.persentase >= 50 ? 'text-amber-700' : 'text-rose-700'}`}>
                        {row.persentase.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
