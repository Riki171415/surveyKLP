import React, { lazy, Suspense, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import SurveyForm from './components/SurveyForm';
import { LayoutDashboard, FileText, Database, Users, LogOut, ClipboardList, Loader2, ChevronRight, Target, Printer } from 'lucide-react';
import logoKemenkes from './assets/logo-kemenkes.png';

// Lazy load komponen berat — hanya di-download saat dibutuhkan
const Dashboard     = lazy(() => import('./components/Dashboard'));
const TimSurveyList = lazy(() => import('./components/TimSurveyList'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const DataManagement = lazy(() => import('./components/DataManagement'));
const KokpitKemenkes = lazy(() => import('./components/KokpitKemenkes'));

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

function NavItem({ to, icon: Icon, children, collapsed }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 group ${
        isActive 
          ? 'bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-md' 
          : 'text-primary-100 hover:bg-primary-700 hover:text-white'
      } ${collapsed ? 'justify-center space-x-0' : 'space-x-3'}`}
      title={collapsed ? children : ''}
    >
      <Icon className={`shrink-0 w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-primary-200 group-hover:text-white'}`} />
      {!collapsed && <span className="whitespace-nowrap">{children}</span>}
    </Link>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  return (
    <div className={`no-print ${isCollapsed ? 'w-20' : 'w-72'} bg-primary-600 min-h-screen hidden md:flex flex-col shadow-2xl relative z-20 transition-all duration-300`}>
      {/* Strip Merah-Putih Kemenkes */}
      <div className="flex h-1.5 shrink-0">
        <div className="flex-1 bg-red-600" />
        <div className="flex-1 bg-white" />
      </div>

      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-6 bg-white border border-slate-200 rounded-full p-1.5 shadow-md text-primary-600 hover:bg-slate-50 transition-colors z-30"
      >
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Logo Kemenkes */}
      <div className={`px-4 py-5 border-b border-primary-500/50 flex flex-col items-center justify-center transition-all duration-300 ${isCollapsed ? 'min-h-[90px]' : ''}`}>
        <div className={`bg-white rounded-xl flex items-center shadow-inner border border-slate-100 transition-all duration-300 overflow-hidden ${isCollapsed ? 'w-12 h-12 p-2 justify-start' : 'py-3.5 px-4 w-full h-auto justify-center'}`}>
          <img src={logoKemenkes} alt="Logo Kemenkes" className={`${isCollapsed ? 'h-8 w-auto max-w-none shrink-0' : 'h-10 w-auto object-contain'}`} />
        </div>
        {!isCollapsed && (
          <div className="mt-3 pt-3 border-t border-primary-500/50 w-full text-center animate-fade-in">
            <p className="text-xs text-primary-200 font-medium uppercase tracking-widest">Sistem Survey</p>
            <p className="font-display font-bold text-white text-base tracking-tight">Optimalisasi JKN · Sp.KKLP</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="p-4 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
        {!isCollapsed && <div className="text-xs font-bold text-primary-200 uppercase tracking-widest mb-3 px-4 mt-1">Menu Utama</div>}

        {['puskesmas', 'admin', 'tim survey'].includes(user.role) && (
          <NavItem to="/" icon={FileText} collapsed={isCollapsed}>Isi Survey</NavItem>
        )}

        {['tim survey', 'admin'].includes(user.role) && (
          <NavItem to="/wawancara" icon={ClipboardList} collapsed={isCollapsed}>Form Wawancara</NavItem>
        )}

        {['tim survey', 'admin'].includes(user.role) && (
          <>
            <NavItem to="/kokpit" icon={Target} collapsed={isCollapsed}>Kokpit Kemenkes</NavItem>
            <NavItem to="/dashboard" icon={LayoutDashboard} collapsed={isCollapsed}>Dashboard Laporan</NavItem>
            <NavItem to="/data" icon={Database} collapsed={isCollapsed}>Manajemen Data</NavItem>
          </>
        )}

        {user.role === 'admin' && (
          <>
            <NavItem to="/users" icon={Users} collapsed={isCollapsed}>Kelola Akun</NavItem>
            <NavItem to="/cetak-form" icon={Printer} collapsed={isCollapsed}>Cetak Form</NavItem>
          </>
        )}
      </div>

      {/* Footer user */}
      <div className="p-4 border-t border-primary-700/50 bg-primary-800/30">
        {!isCollapsed ? (
          <div className="mb-3 px-2 py-2 rounded-lg bg-primary-700/50 animate-fade-in">
            <p className="text-xs text-primary-200 font-medium">Login sebagai:</p>
            <p className="text-sm font-bold text-white capitalize mt-0.5">{user.username}</p>
            <p className="text-xs text-primary-300 font-medium capitalize">{user.role}</p>
          </div>
        ) : (
          <div className="mb-3 w-10 h-10 mx-auto rounded-lg bg-primary-700/50 flex items-center justify-center animate-fade-in text-white font-bold uppercase" title={user.username}>
            {user.username.charAt(0)}
          </div>
        )}
        <button onClick={logout} title={isCollapsed ? "Keluar" : ""} className={`flex items-center justify-center px-4 py-2.5 bg-red-500/10 text-red-100 hover:bg-red-500 hover:text-white rounded-xl transition-all duration-300 font-medium text-sm group border border-red-500/20 hover:border-red-500 w-full ${isCollapsed ? 'px-0' : 'space-x-2'}`}>
          <LogOut className={`shrink-0 w-4 h-4 transition-transform ${isCollapsed ? '' : 'group-hover:-translate-x-1'}`} />
          {!isCollapsed && <span>Keluar</span>}
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
          <div className="no-print md:hidden border-b border-white/20 p-3 flex justify-between items-center sticky top-0 z-20 bg-primary-700 shadow-md">
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
                <Route path="/kokpit" element={<ProtectedRoute allowedRoles={['admin', 'tim survey']}><KokpitKemenkes /></ProtectedRoute>} />
                <Route path="/data" element={<ProtectedRoute allowedRoles={['admin', 'tim survey']}><DataManagement /></ProtectedRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'tim survey']}><Dashboard /></ProtectedRoute>} />
                <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="/cetak-form" element={<ProtectedRoute allowedRoles={['admin']}><SurveyForm isPrintMode={true} /></ProtectedRoute>} />
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
