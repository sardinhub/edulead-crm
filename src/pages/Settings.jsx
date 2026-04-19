import React, { useState } from 'react';
import { User, Bell, MessageSquareText, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Settings() {
  const { user, changePassword } = useStore();

  // State untuk form Ubah Sandi Pribadi
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPersonalPassword, setNewPersonalPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    if (user?.password !== currentPassword) {
      setPasswordMsg({ text: 'Kata sandi lama Anda salah!', type: 'error' });
      return;
    }
    if (newPersonalPassword.length < 6) {
      setPasswordMsg({ text: 'Kata sandi baru minimal 6 karakter', type: 'error' });
      return;
    }
    changePassword(user.email, newPersonalPassword);
    setPasswordMsg({ text: 'Kata sandi berhasil diperbarui!', type: 'success' });
    setCurrentPassword('');
    setNewPersonalPassword('');
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Konfigurasi akun dan preferensi aplikasi Anda.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Profile Section */}
        <div className="p-6 md:p-8 border-b border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Profil Pribadi</h2>
              <p className="text-sm text-slate-500">Update detail personal Anda.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
              <input type="text" defaultValue={user?.name} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" disabled defaultValue={user?.email} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 focus:outline-none cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role/Jabatan</label>
              <input type="text" disabled defaultValue={user?.role} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 focus:outline-none cursor-not-allowed" />
            </div>
          </div>
          <button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2.5 text-sm font-medium transition-colors">
            Update Profil
          </button>
        </div>

        {/* Ubah Kata Sandi Pribadi (Muncul untuk semua orang, termasuk Staff) */}
        <div className="p-6 md:p-8 border-b border-slate-200">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Ubah Kata Sandi</h2>
              <p className="text-sm text-slate-500">Pastikan akun Anda aman dengan sandi yang kuat.</p>
            </div>
          </div>
          
          <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sandi Saat Ini</label>
              <input required type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sandi Baru</label>
              <input required type="password" value={newPersonalPassword} onChange={e => setNewPersonalPassword(e.target.value)} placeholder="SandiBaru2024" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20" />
            </div>
            {passwordMsg.text && (
              <p className={`text-sm font-medium ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                {passwordMsg.text}
              </p>
            )}
            <button type="submit" className="mt-2 text-sm font-bold border border-slate-200 hover:border-slate-300 bg-white text-slate-700 px-6 py-2.5 rounded-lg transition-colors">
              Simpan Sandi Baru
            </button>
          </form>
        </div>

        {/* WhatsApp Templates Section */}
        <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-6">
             <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Template Pesan WhatsApp</h2>
              <p className="text-sm text-slate-500">Kelola teks default untuk mempercepat follow-up.</p>
            </div>
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Follow-up Pendaftaran</label>
              <textarea rows={3} defaultValue="Halo Kak [Nama], terima kasih sudah mendaftar di program kami. Apakah ada pertanyaan mengenai pendaftarannya?" className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm text-slate-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Template Tagihan DP</label>
              <textarea rows={3} defaultValue="Halo Kak [Nama], sekadar konfirmasi untuk batas akhir pembayaran DP Pangkal di tanggal [Tanggal]." className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm text-slate-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
