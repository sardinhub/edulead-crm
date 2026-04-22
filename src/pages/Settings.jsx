import React, { useState } from 'react';
import { User, MessageSquareText, Shield, Loader2, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Settings() {
  const { user, changePassword } = useStore();

  // State untuk form Ubah Sandi Pribadi
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPersonalPassword, setNewPersonalPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ text: '', type: '' });

    if (user?.password !== currentPassword) {
      setPasswordMsg({ text: '❌ Kata sandi lama Anda salah!', type: 'error' });
      return;
    }
    if (newPersonalPassword.length < 6) {
      setPasswordMsg({ text: '❌ Kata sandi baru minimal 6 karakter.', type: 'error' });
      return;
    }
    if (newPersonalPassword !== confirmPassword) {
      setPasswordMsg({ text: '❌ Konfirmasi kata sandi tidak cocok.', type: 'error' });
      return;
    }
    if (newPersonalPassword === currentPassword) {
      setPasswordMsg({ text: '❌ Kata sandi baru tidak boleh sama dengan yang lama.', type: 'error' });
      return;
    }

    setIsSaving(true);
    const result = await changePassword(user.id, newPersonalPassword);
    setIsSaving(false);

    if (result?.success) {
      setPasswordMsg({ text: '✅ Kata sandi berhasil diperbarui!', type: 'success' });
      setCurrentPassword('');
      setNewPersonalPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMsg({ text: '❌ Gagal memperbarui: ' + (result?.error || 'Coba lagi.'), type: 'error' });
    }
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
            {/* Sandi Saat Ini */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sandi Saat Ini</label>
              <div className="relative">
                <input
                  required
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-500/20"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Sandi Baru */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sandi Baru <span className="text-slate-400 text-xs font-normal">(min. 6 karakter)</span></label>
              <div className="relative">
                <input
                  required
                  type={showNew ? 'text' : 'password'}
                  value={newPersonalPassword}
                  onChange={e => setNewPersonalPassword(e.target.value)}
                  placeholder="Masukkan sandi baru"
                  className="w-full pr-10 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {/* Konfirmasi Sandi */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Konfirmasi Sandi Baru</label>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi baru"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            {passwordMsg.text && (
              <p className={`text-sm font-medium ${passwordMsg.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="mt-2 flex items-center gap-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
            >
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : <><Shield className="w-4 h-4" /> Simpan Sandi Baru</>}
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

      {/* Zona Bahaya / Pembersihan Data (Manager Only) */}
      {user?.role === 'Manager' && (
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden mt-8">
          <div className="p-6 md:p-8 bg-red-50/50">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-red-900">Manajemen Data Base Utama</h2>
                <p className="text-sm text-red-700">Bersihkan data dashboard, scheduler, dan student database.</p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-xl border border-red-100 mb-4 max-w-2xl">
              <p className="text-sm text-slate-700 leading-relaxed font-medium mb-3">
                <span className="font-bold text-red-600">Perhatian:</span> Tombol di bawah ini akan menghapus <strong>seluruh data siswa (Leads), progress follow-up, penjadwalan, dan riwayat aktivitas yang ada di Dashboard & Scheduler.</strong>
              </p>
              <p className="text-xs text-slate-500">Tindakan ini tidak bisa dibatalkan. Gunakan ini hanya untuk mereset aplikasi dari data ujicoba menjadi kosong sebelum memberikan akses ke tim Anda.</p>
            </div>
            
            <button
              onClick={async () => {
                if (!window.confirm('⚠️ PERINGATAN KERAS: Semua data Leads, Scheduler, dan Dashboard akan hangus. Anda yakin?')) return;
                if (!window.confirm('KONFIRMASI TERAKHIR: Hapus sekarang?')) return;
                
                const { deleteAllStudents } = useStore.getState();
                const result = await deleteAllStudents();
                if (result.success) {
                  alert("✅ Berhasil: Database utama telah dibersihkan.");
                } else {
                  alert("❌ Gagal membersihkan data: " + result.error);
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-6 py-3 text-sm font-bold shadow-md shadow-red-200 transition-colors"
            >
              Kosongkan Database Master (Reset)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
