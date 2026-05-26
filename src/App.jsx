import React, { lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import SurveyForm from './components/SurveyForm';
import { LayoutDashboard, FileText, Database, Users, LogOut, ClipboardList, Loader2 } from 'lucide-react';
import logoKemenkes from './assets/logo-kemenkes.png';

// Lazy load komponen berat — hanya di-download saat dibutuhkan
const Dashboard     = lazy(() => import('./components/Dashboard'));
const TimSurveyList = lazy(() => import('./components/TimSurveyList'));
const UserManagement = lazy(() => import('./components/UserManagement'));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px]">
    <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
    <p className="text-slate-500 text-sm font-medium">Memuat halaman...</p>
  </div>
);

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
    <div className="w-72 glass-dark min-h-screen hidden md:flex flex-col shadow-2xl relative z-10">
      {/* Strip Merah-Putih Kemenkes */}
      <div className="flex h-1.5 shrink-0">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-white" />
      </div>

      {/* Logo Kemenkes */}
      <div className="px-5 py-5 border-b border-green-900/60">
        <div className="flex flex-col items-center justify-center bg-white rounded-xl py-3.5 px-4 shadow-inner border border-slate-100">
          <img src={logoKemenkes} alt="Logo Kemenkes" className="h-10 w-auto object-contain" />
        </div>
        <div className="mt-3 pt-3 border-t border-green-900/40">
          <p className="text-xs text-green-200/60 font-medium uppercase tracking-widest">Sistem Survey</p>
          <p className="font-display font-bold text-primary-300 text-base tracking-tight">Optimalisasi JKN · Sp.KKLP</p>
        </div>
      </div>

      {/* Menu */}
      <div className="p-4 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
        <div className="text-xs font-bold text-green-600/70 uppercase tracking-widest mb-3 px-4 mt-1">Menu Utama</div>

        {['puskesmas', 'admin'].includes(user.role) && (
          <NavItem to="/" icon={FileText}>Isi Survey</NavItem>
        )}

        {['tim survey', 'admin'].includes(user.role) && (
          <NavItem to="/wawancara" icon={ClipboardList}>Form Wawancara</NavItem>
        )}

        {user.role === 'admin' && (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard}>Dashboard Laporan</NavItem>
            <NavItem to="/users" icon={Users}>Kelola Akun</NavItem>
          </>
        )}
      </div>

      {/* Footer user */}
      <div className="p-4 border-t border-green-900/50" style={{background:'rgba(0,26,13,0.6)'}}>
        <div className="mb-3 px-2 py-2 rounded-lg bg-green-900/30">
          <p className="text-xs text-green-400/70 font-medium">Login sebagai:</p>
          <p className="text-sm font-bold text-white capitalize mt-0.5">{user.username}</p>
          <p className="text-xs text-primary-400 font-medium capitalize">{user.role}</p>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-300 font-medium text-sm group border border-red-900/30 hover:border-red-600">
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
          <div className="md:hidden border-b border-white/20 p-3 flex justify-between items-center sticky top-0 z-20 bg-primary-700 shadow-md">
            {/* Strip merah-putih mobile */}
            <div className="absolute top-0 left-0 right-0 h-1 flex">
              <div className="flex-1 bg-red-600" />
              <div className="flex-1 bg-white" />
            </div>
            <div className="flex items-center space-x-2 mt-0.5">
              <div className="bg-white rounded-lg px-2.5 py-1 flex items-center justify-center">
                <img src={logoKemenkes} alt="Logo Kemenkes" className="h-6 w-auto object-contain" />
              </div>
              <span className="font-display font-bold text-sm text-white">Survey <span className="text-primary-200">Sp.KKLP</span></span>
            </div>
            <button onClick={logout} className="text-sm font-medium px-3 py-1.5 bg-red-600/80 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto scroll-smooth">
          <div className="animate-fade-in-up h-full">
            <Suspense fallback={<PageLoader />}>
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
            </Suspense>
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
