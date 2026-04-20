import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ClipboardEdit, CheckCircle2, Edit, Trash2, Save, XCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function StudentDatabase() {
  const { students, addStudent, updateStudent, deleteStudent, user, marketingStaff, fetchMarketingStaff } = useStore();
  
  useEffect(() => {
    fetchMarketingStaff();
  }, [fetchMarketingStaff]);

  // Form State
  const [formData, setFormData] = useState({
    nama: '',
    telepon: '',
    asal_sekolah: '',
    tanggal_daftar: new Date().toISOString().split('T')[0],
    status_pembayaran: 'Baru mendaftar',
    pic_staff: user?.name || '',
    nominal_pembayaran: '',
    catatan: '',
    program_interest: 'Reguler',
    priority_level: 'Medium',
    priority_score: 50,
    status_current: 'Pendaftaran'
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Ambil 5 data terbaru untuk riwayat (berdasarkan urutan input terakhir)
  const recentMonev = [...students].slice(0, 7);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await updateStudent(editingId, formData);
      setEditingId(null);
    } else {
      await addStudent(formData);
    }
    
    // Reset form after submit
    setFormData({ 
      ...formData, 
      nama: '', 
      telepon: '', 
      asal_sekolah: '', 
      nominal_pembayaran: '', 
      catatan: '' 
    });
    
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleEdit = (item) => {
    setFormData({
      nama: item.nama,
      telepon: item.telepon,
      asal_sekolah: item.asal_sekolah,
      tanggal_daftar: item.tanggal_daftar,
      status_pembayaran: item.status_pembayaran,
      pic_staff: item.pic_staff,
      nominal_pembayaran: item.nominal_pembayaran,
      catatan: item.catatan || '',
      program_interest: item.program_interest || 'Reguler',
      priority_level: item.priority_level || 'Medium',
      priority_score: item.priority_score || 50,
      status_current: item.status_current || 'Pendaftaran'
    });
    setEditingId(item.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data monev ini selamanya?')) {
      await deleteStudent(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      ...formData, 
      nama: '', 
      telepon: '', 
      asal_sekolah: '', 
      nominal_pembayaran: '', 
      catatan: '' 
    });
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <ClipboardEdit className="w-7 h-7 text-indigo-600" />
            Input Progress Monev Leads
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">Fokus Konversi: DP Pangkal & Pangkal Lunas</p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100/40 border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-12">
          <AnimatePresence>
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-8 p-5 bg-emerald-50 border border-emerald-100 rounded-3xl text-emerald-700 flex items-center gap-4 font-bold shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                   <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg">Transaksi Berhasil Disimpan!</p>
                  <p className="text-sm font-normal opacity-80">Data otomatis sinkron ke Dashboard Utama.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Nama Lengkap Siswa</label>
              <input 
                required 
                placeholder="cth: Ahmad Fauzi" 
                value={formData.nama} 
                onChange={e => setFormData({...formData, nama: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">WhatsApp Aktif</label>
              <input 
                required 
                type="tel" 
                placeholder="08..." 
                value={formData.telepon} 
                onChange={e => setFormData({...formData, telepon: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Asal Sekolah</label>
              <input 
                required 
                placeholder="SMA/SMK Negeri..." 
                value={formData.asal_sekolah} 
                onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Tanggal Transaksi</label>
              <input 
                required 
                type="date" 
                value={formData.tanggal_daftar} 
                onChange={e => setFormData({...formData, tanggal_daftar: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600"
              />
            </div>

            <div className="space-y-3 md:col-span-1">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Status Konversi</label>
              <select 
                value={formData.status_pembayaran} 
                onChange={e => setFormData({...formData, status_pembayaran: e.target.value})} 
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 cursor-pointer"
              >
                <option value="Baru mendaftar">Pendaftaran Baru (Cold)</option>
                <option value="DP Pembayaran Pangkal">DP Pangkal (Convert to DP)</option>
                <option value="Pangkal Full">Pangkal Lunas (WON)</option>
                <option value="Pendaftaran+DP Pangkal">Daftar + Langsung DP</option>
                <option value="Pendaftaran+Pangkal Full">Daftar + Langsung Lunas</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Nominal Setoran (Rp)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black">Rp</span>
                <input 
                  required 
                  type="number" 
                  placeholder="0" 
                  value={formData.nominal_pembayaran} 
                  onChange={e => setFormData({...formData, nominal_pembayaran: e.target.value})} 
                  className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-black text-xl text-indigo-600" 
                />
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">PIC Marketing</label>
              {user?.role === 'Manager' ? (
                <select
                  required
                  value={formData.pic_staff}
                  onChange={e => setFormData({...formData, pic_staff: e.target.value})}
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600"
                >
                  <option value="">-- Pilih Nama Staff Penanggung Jawab --</option>
                  {marketingStaff.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full px-5 py-4 bg-slate-100 border-2 border-slate-100 rounded-2xl text-slate-400 font-bold flex items-center">
                   {user?.name} (Verified)
                </div>
              )}
            </div>

            <div className="space-y-3 md:col-span-2">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Kronologi / Catatan Monev</label>
              <textarea 
                rows={4}
                placeholder="Berikan detail progres, misal: Akan lunas minggu depan..." 
                value={formData.catatan} 
                onChange={e => setFormData({...formData, catatan: e.target.value})} 
                className="w-full px-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all resize-none font-medium" 
              />
            </div>

            <div className="md:col-span-2 pt-6 flex flex-col sm:flex-row gap-4">
              <button 
                type="submit" 
                className={cn(
                  "flex-1 py-5 rounded-[1.5rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-[0.97]",
                  editingId 
                    ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200 text-white" 
                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 text-white"
                )}
              >
                {editingId ? <Save className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
                {editingId ? 'PERBARUI DATA MONEV' : 'SIMPAN DATA MONEV'}
              </button>

              {editingId && (
                <button 
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.5rem] font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle className="w-6 h-6" />
                  BATAL
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Recent History Table */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-sm italic">5 Laporan Monev Terbaru</h3>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Real-time Sync</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/10">
                <th className="px-8 py-5">Nama Siswa / Almamater</th>
                <th className="px-8 py-5 text-center">Status</th>
                <th className="px-8 py-5 text-right">Nominal Tunai</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentMonev.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.nama}</p>
                    <p className="text-[11px] text-slate-400 font-medium italic">{item.asal_sekolah}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[10px] font-black shadow-sm uppercase">
                      {item.status_pembayaran}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="font-black text-indigo-600 text-base">
                      Rp {Number(item.nominal_pembayaran).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-300 font-bold uppercase">{item.pic_staff}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'Manager' && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Hapus Data"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {recentMonev.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-12 text-center text-slate-300 italic font-medium">Bapak belum menginput data monev hari ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
