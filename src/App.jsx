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
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        isActive ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-slate-400'}`} />
      <span>{children}</span>
    </Link>
  );
}

function Sidebar() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="w-64 bg-white border-r border-slate-200 min-h-screen hidden md:flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Database className="w-7 h-7 text-primary-600" />
          <span className="font-bold text-xl text-slate-800 tracking-tight">Survey<span className="text-primary-600">KKLP</span></span>
        </div>
      </div>
      <div className="p-4 space-y-2 flex-1">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-4 mt-2">Menu Utama</div>
        
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
      <div className="p-4 border-t border-slate-200">
        <div className="mb-3 px-4">
          <p className="text-xs text-slate-500">Login sebagai:</p>
          <p className="text-sm font-bold text-slate-800 capitalize">{user.username} ({user.role})</p>
        </div>
        <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm">
          <LogOut className="w-4 h-4" />
          <span>Keluar</span>
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {user && (
          <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Database className="w-6 h-6 text-primary-600" />
              <span className="font-bold text-lg text-slate-800">Survey<span className="text-primary-600">KKLP</span></span>
            </div>
            <button onClick={logout} className="text-sm font-medium px-3 py-2 bg-red-50 text-red-600 rounded-md"><LogOut className="w-4 h-4" /></button>
          </div>
        )}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute allowedRoles={['puskesmas', 'admin']}><SurveyForm /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
            <Route path="/wawancara" element={<ProtectedRoute allowedRoles={['tim survey', 'admin']}><TimSurveyList /></ProtectedRoute>} />
            <Route path="/wawancara/form" element={<ProtectedRoute allowedRoles={['tim survey', 'admin']}><SurveyForm isEdit={true} isInterview={true} /></ProtectedRoute>} />
          </Routes>
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
