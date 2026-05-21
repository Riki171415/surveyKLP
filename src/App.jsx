import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import SurveyForm from './components/SurveyForm';
import Dashboard from './components/Dashboard';
import TimSurveyList from './components/TimSurveyList';
import UserManagement from './components/UserManagement';
import { LayoutDashboard, FileText, Database, Users, LogOut, ClipboardList } from 'lucide-react';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
}

function NavItem({ to, icon: Icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 group ${
        isActive 
          ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/30' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary-400'}`} />
      <span>{children}</span>
    </Link>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="w-72 glass-dark min-h-screen hidden md:flex flex-col border-r border-slate-800/50 shadow-2xl relative z-10">
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-lg shadow-lg shadow-primary-500/30">
            <Database className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-2xl text-white tracking-tight">
            Survey<span className="text-primary-400">KKLP</span>
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2 flex-1 overflow-y-auto hide-scrollbar">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-4 mt-2">Menu Utama</div>
        
        {/* Menu Puskesmas */}
        {['puskesmas', 'admin'].includes(user.role) && (
          <NavItem to="/" icon={FileText}>Isi Survey</NavItem>
        )}
        
        {/* Menu Tim Survey */}
        {['tim survey', 'admin'].includes(user.role) && (
          <NavItem to="/wawancara" icon={ClipboardList}>Form Wawancara</NavItem>
        )}

        {/* Menu Admin */}
        {user.role === 'admin' && (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard Laporan</NavItem>
            <NavItem to="/users" icon={Users}>Kelola Akun</NavItem>
          </>
        )}
      </div>
      <div className="p-4 border-t border-slate-800/50 bg-slate-900/50">
        <div className="mb-4 px-4">
          <p className="text-xs text-slate-500 font-medium">Login sebagai:</p>
          <p className="text-sm font-bold text-white capitalize mt-0.5">{user.username}</p>
          <p className="text-xs text-primary-400 font-medium capitalize">{user.role}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all duration-300 font-medium text-sm group">
          <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary-50/50 to-transparent pointer-events-none -z-10"></div>
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none -z-10 animate-float"></div>

      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {user && (
          <div className="md:hidden glass border-b border-white/20 p-4 flex justify-between items-center sticky top-0 z-20">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-primary-600" />
              <span className="font-display font-bold text-lg text-slate-800">Survey<span className="text-primary-600">KKLP</span></span>
            </div>
            <button onClick={logout} className="text-sm font-medium px-3 py-2 bg-rose-50 text-rose-600 rounded-md hover:bg-rose-100 transition-colors"><LogOut className="w-4 h-4" /></button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth">
          <div className="animate-fade-in-up h-full">
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Form Terbuka untuk Publik */}
              <Route path="/" element={<SurveyForm />} />
              {/* Halaman Admin / Tim Survey (Dilindungi) */}
              <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
              <Route path="/wawancara" element={<ProtectedRoute allowedRoles={['tim survey', 'admin']}><TimSurveyList /></ProtectedRoute>} />
              <Route path="/wawancara/form" element={<ProtectedRoute allowedRoles={['tim survey', 'admin']}><SurveyForm isEdit={true} isInterview={true} /></ProtectedRoute>} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
