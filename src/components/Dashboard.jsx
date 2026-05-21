import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, Home, Activity } from 'lucide-react';

const roleData = [
  { name: 'Kepala Puskesmas', value: 12 },
  { name: 'Dokter Umum', value: 45 },
  { name: 'Dokter Sp.KKLP', value: 8 },
  { name: 'Nakes Lainnya', value: 15 },
];

const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#10b981'];

const jknNeedsData = [
  { name: 'Telemonitoring', rating: 3.8 },
  { name: 'Lifestyle Medicine', rating: 3.5 },
  { name: 'Family Conference', rating: 3.4 },
  { name: 'Paliatif Komunitas', rating: 3.2 },
  { name: 'Konsultasi Genetik', rating: 2.8 },
];

const stats = [
  { label: 'Total Responden', value: '80', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Rata-rata Waktu Poli', value: '12 Menit', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { label: 'Rata-rata Home Visit', value: '45 Menit', icon: Home, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { label: 'Rata-rata Skala Kompetensi', value: '3.4', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50' },
];

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Laporan</h1>
          <p className="text-slate-500 mt-2">Ringkasan hasil survey optimalisasi JKN</p>
        </div>
        <button className="px-4 py-2 bg-white border shadow-sm rounded-lg text-sm font-medium hover:bg-slate-50 transition">
          Export ke Excel
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className={`p-4 rounded-xl ${stat.bg}`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Distribution Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Distribusi Jabatan Responden</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Top Kebutuhan Layanan (Belum Optimal)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={jknNeedsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 4]} />
                <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="rating" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
