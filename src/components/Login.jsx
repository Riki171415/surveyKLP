import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Database, Lock, User, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../supabaseClient';

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Dibuang huruf/angka membingungkan spt O, 0, 1, I
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setCaptchaText(generateCaptcha());
  }, []);

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptcha());
    setCaptchaInput('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (captchaInput.toUpperCase() !== captchaText) {
      setError('Kode Captcha salah. Silakan coba lagi.');
      refreshCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error: sbError } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (sbError || !data) {
        setError('Login gagal. Periksa kembali Username dan Password Anda.');
      } else {
        login({ username: data.username, role: data.role.toLowerCase() });
        if (data.role.toLowerCase() === 'admin') navigate('/dashboard');
        else if (data.role.toLowerCase() === 'tim survey') navigate('/wawancara');
        else navigate('/'); // Puskesmas
      }
    } catch (err) {
      setError('Terjadi kesalahan koneksi ke Supabase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Left Column: Form (Glassmorphism) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:flex-none lg:w-[480px] xl:w-[560px] relative z-10 bg-white shadow-2xl">
        <div className="mx-auto w-full max-w-sm lg:w-[360px] xl:w-[400px]">
          <div className="flex items-center space-x-3 mb-8 animate-fade-in">
            {/* Logo Kemenkes */}
            <div className="w-12 h-12 shrink-0 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-500/30 p-1.5 border border-slate-100">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Logo_of_the_Ministry_of_Health_of_the_Republic_of_Indonesia.png" alt="Logo Kemenkes" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-display font-bold text-2xl text-slate-800 tracking-tight block leading-tight">
                Kementerian Kesehatan
              </span>
              <span className="text-primary-600 font-semibold text-sm tracking-wide uppercase">Republik Indonesia</span>
            </div>
          </div>
          
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">Selamat Datang</h2>
            <p className="text-sm text-slate-500 mb-8">
              Silakan login menggunakan kredensial dari tim pusat untuk mengakses sistem.
            </p>

            {error && (
              <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-r-lg text-sm flex items-start animate-fade-in">
                <p>{error}</p>
              </div>
            )}
            
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-focus-within:text-primary-600 transition-colors">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="block w-full pl-11 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                    placeholder="Masukkan username Anda"
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 group-focus-within:text-primary-600 transition-colors">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-sm tracking-widest font-mono"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Verifikasi Keamanan</label>
                <div className="flex space-x-3 mb-3 items-center">
                  <div className="flex-1 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-xl flex items-center justify-center py-2.5 relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')]"></div>
                    <span className="font-mono text-2xl tracking-[0.3em] font-bold text-slate-800 relative z-10 select-none line-through decoration-rose-400/70 decoration-[3px]">{captchaText}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={refreshCaptcha}
                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-all active:scale-95 shadow-sm"
                    title="Ganti Kode Captcha"
                  >
                    <RefreshCw className="w-5 h-5 hover:rotate-180 transition-transform duration-500" />
                  </button>
                </div>
                <input
                  required
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 text-sm font-mono uppercase text-center tracking-[0.2em]"
                  placeholder="KETIK KODE DI ATAS"
                  maxLength={5}
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-300 transform ${isSubmitting ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-primary-600 to-primary-800 hover:from-primary-500 hover:to-primary-700 hover:-translate-y-0.5 hover:shadow-primary-500/30'}`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Memverifikasi...
                    </>
                  ) : 'Masuk ke Sistem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Decorative Background */}
      <div className="hidden lg:block relative flex-1 bg-primary-950 overflow-hidden">
        {/* Animated Gradient Mesh Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-green-900 to-primary-950"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-primary-500/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-primary-400/20 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-xl text-center z-10 glass-dark p-10 rounded-3xl animate-fade-in-up" style={{ animationDelay: '0.2s', background: 'rgba(0, 48, 25, 0.4)', borderColor: 'rgba(74, 184, 130, 0.2)' }}>
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white mb-6 shadow-lg shadow-white/10 p-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Logo_of_the_Ministry_of_Health_of_the_Republic_of_Indonesia.png" alt="Logo Kemenkes" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-4xl font-display font-bold text-white tracking-tight mb-4 leading-tight">
              Sistem Informasi Survei KKLP
            </h1>
            <p className="text-lg text-green-100/80 leading-relaxed">
              Platform pendataan dan evaluasi implementasi pelayanan dokter Sp.KKLP di Fasilitas Kesehatan Tingkat Pertama secara nasional.
            </p>
          </div>
        </div>
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] [mask-image:linear-gradient(to_bottom,white,transparent)] opacity-50"></div>
      </div>
    </div>
  );
}
