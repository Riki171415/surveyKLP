import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, Home, Activity, Download } from 'lucide-react';

const roleData = [
  { name: 'Kepala Puskesmas', value: 12 },
  { name: 'Dokter Umum', value: 45 },
  { name: 'Dokter Sp.KKLP', value: 8 },
  { name: 'Nakes Lainnya', value: 15 },
];

const COLORS = ['#0f172a', '#3b82f6', '#0ea5e9', '#94a3b8'];

const jknNeedsData = [
  { name: 'Telemonitoring', rating: 3.8 },
  { name: 'Lifestyle Medicine', rating: 3.5 },
  { name: 'Family Conference', rating: 3.4 },
  { name: 'Paliatif Komunitas', rating: 3.2 },
  { name: 'Konsultasi Genetik', rating: 2.8 },
];

const stats = [
  { label: 'Total Responden', value: '80', icon: Users, trend: '+12% minggu ini' },
  { label: 'Avg Waktu Poli', value: '12 Menit', icon: Clock, trend: 'Optimal' },
  { label: 'Avg Home Visit', value: '45 Menit', icon: Home, trend: 'Sesuai Standar' },
  { label: 'Skala Kompetensi', value: '3.4', icon: Activity, trend: '+0.2 dari target' },
];

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 mt-2 text-sm">Ringkasan analitik hasil survey JKN</p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Laporan</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <stat.icon className="w-5 h-5 text-slate-700" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
              <p className="text-xs text-emerald-600 mt-2 font-medium">{stat.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Demografi Responden</h2>
            <p className="text-xs text-slate-500 mt-1">Berdasarkan jabatan profesional</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Prioritas Layanan Non-Optimal</h2>
            <p className="text-xs text-slate-500 mt-1">Layanan yang paling dibutuhkan masuk JKN</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jknNeedsData}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 4]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" width={110} tick={{fontSize: 11, fill: '#475569'}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="rating" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
