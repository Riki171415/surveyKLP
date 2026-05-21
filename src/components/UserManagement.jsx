import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('puskesmas');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error(err);
      alert('Gagal mengambil data pengguna.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username || !password || !role) {
      alert('Semua kolom harus diisi!');
      return;
    }
    
    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('app_users')
        .insert([{ username, password, role }]);
        
      if (error) {
        if (error.code === '23505') alert('Username sudah digunakan! Silakan pilih yang lain.');
        else throw error;
      } else {
        setUsername('');
        setPassword('');
        setRole('puskesmas');
        fetchUsers(); // Refresh table
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menambahkan pengguna.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteUser = async (id, usernameToDelete) => {
    if (!window.confirm(`Yakin ingin menghapus pengguna "${usernameToDelete}"?`)) return;
    
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pengguna.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center mt-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Akun</h1>
        <p className="text-slate-500 mt-2 text-sm">Kelola akses login untuk Puskesmas, Tim Survey, dan Admin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Tambah User */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-lg text-slate-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary-600" />
              Tambah Akun Baru
            </h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Misal: pkm_melati"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="Password rahasia"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role / Peran</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                >
                  <option value="puskesmas">Puskesmas (Hanya Isi Form)</option>
                  <option value="tim survey">Tim Survey (Wawancara)</option>
                  <option value="admin">Admin (Akses Penuh)</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={isAdding}
                className="w-full mt-2 bg-primary-600 text-white font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors flex justify-center items-center"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan Akun'}
              </button>
            </form>
          </div>
        </div>

        {/* Tabel Daftar User */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800 flex items-center">
                <Users className="w-5 h-5 mr-2 text-slate-500" />
                Daftar Pengguna ({users.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-700">Username</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Password</th>
                    <th className="px-6 py-3 font-semibold text-slate-700">Role</th>
                    <th className="px-6 py-3 font-semibold text-slate-700 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-medium text-slate-900">{u.username}</td>
                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">{u.password}</td>
                      <td className="px-6 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'tim survey' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button 
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
