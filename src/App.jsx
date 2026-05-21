import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, FileText, Database } from 'lucide-react';

function NavItem({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive 
          ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
      <span>{children}</span>
    </Link>
  );
}

function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen hidden md:block">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Database className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-xl text-slate-800 tracking-tight">Survey<span className="text-primary-600">KKLP</span></span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-4 mt-2">Menu Utama</div>
        <NavItem to="/" icon={FileText}>Isi Survey</NavItem>
        <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard Laporan</NavItem>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          {/* Mobile Header */}
          <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-primary-600" />
              <span className="font-bold text-lg text-slate-800">Survey<span className="text-primary-600">KKLP</span></span>
            </div>
            <div className="flex space-x-2">
              <Link to="/" className="text-sm font-medium px-3 py-2 bg-slate-50 rounded-md">Survey</Link>
              <Link to="/dashboard" className="text-sm font-medium px-3 py-2 bg-slate-50 rounded-md">Dashboard</Link>
            </div>
          </div>
          
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Routes>
              <Route path="/" element={<SurveyForm />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/edit/:id" element={<SurveyForm isEdit={true} />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
