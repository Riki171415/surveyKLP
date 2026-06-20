import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
} from 'recharts';
import { Users, Stethoscope, Building, Map } from 'lucide-react';

export default function DashboardProfil({ filteredData, COLORS, isPrinting }) {
  const totalResponden = filteredData.length;

  const { roleChartData, ketersediaanDokter, fktpTypeData, regionalData } = useMemo(() => {
    const roleCount = {}; 
    const fktpTypeCount = { 'Puskesmas': 0, 'Klinik': 0, 'DPM': 0, 'Lainnya': 0 };
    const regionalCount = {};
    let spkklpCount = 0;

    filteredData.forEach(row => {
      // Role
      const role = row.role || 'Lainnya'; 
      roleCount[role] = (roleCount[role] || 0) + 1;
      
      // SpKKLP
      const stKklp = row.doc_kklp || 'Tidak';
      if (stKklp === 'Ya') spkklpCount++;

      // FKTP Type (Puskesmas, Klinik, DPM)
      const fName = (row.fktp_name || '').toLowerCase();
      if (fName.includes('puskesmas')) fktpTypeCount['Puskesmas']++;
      else if (fName.includes('klinik')) fktpTypeCount['Klinik']++;
      else if (role === 'Dokter Praktik Mandiri') fktpTypeCount['DPM']++;
      else fktpTypeCount['Lainnya']++;

      // Regional (Provinsi)
      const prov = row.provinsi || 'Lainnya';
      regionalCount[prov] = (regionalCount[prov] || 0) + 1;
    });

    return {
      roleChartData: Object.keys(roleCount).map(key => ({ name: key, value: roleCount[key] })).sort((a,b) => b.value - a.value),
      spkklpCount,
      fktpTypeData: Object.keys(fktpTypeCount).filter(k => fktpTypeCount[k] > 0).map(key => ({ name: key, value: fktpTypeCount[key] })),
      regionalData: Object.keys(regionalCount).map(key => ({ name: key, value: regionalCount[key] })).sort((a,b) => b.value - a.value).slice(0, 10)
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

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Responden" value={totalResponden} icon={Users} colorClass="bg-blue-500 text-blue-600 bg-blue-100" />
        <StatCard title="Total Puskesmas" value={fktpTypeData.find(d => d.name === 'Puskesmas')?.value || 0} icon={Building} colorClass="bg-emerald-500 text-emerald-600 bg-emerald-100" />
        <StatCard title="Dokter Praktik Mandiri" value={fktpTypeData.find(d => d.name === 'DPM')?.value || 0} icon={Stethoscope} colorClass="bg-amber-500 text-amber-600 bg-amber-100" />
        <StatCard title="FKTP dengan Sp.KKLP" value={ketersediaanDokter?.spkklpCount || roleChartData.spkklpCount || spkklpCount || 0} subtitle={`${totalResponden > 0 ? Math.round((spkklpCount / totalResponden) * 100) : 0}% dari total`} icon={Stethoscope} colorClass="bg-primary-500 text-primary-600 bg-primary-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Building className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Jenis FKTP</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fktpTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {fktpTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} FKTP`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Users className="w-5 h-5 mr-2 text-primary-600" /> Proporsi Jabatan Responden</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                  {roleChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip formatter={(value) => [`${value} Responden`, 'Jumlah']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-2 ${isPrinting ? 'break-inside-avoid shadow-none border-slate-300' : ''}`}>
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center"><Map className="w-5 h-5 mr-2 text-primary-600" /> 10 Provinsi Terbanyak</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionalData} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} angle={-45} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="value" name="Jumlah Responden" fill="#00857A" radius={[6, 6, 0, 0]} maxBarSize={50}>
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
