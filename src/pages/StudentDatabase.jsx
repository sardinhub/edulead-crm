import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ClipboardEdit, CheckCircle2, Edit, Trash2, Save, XCircle, Search, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const KONVERSI_LIST = [
  { id: 'Pendaftaran',   label: 'Pendaftaran',   color: 'bg-indigo-500',  chip: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  { id: 'DP Pangkal',   label: 'DP Pangkal',    color: 'bg-amber-500',   chip: 'bg-amber-50 text-amber-700 ring-amber-200' },
  { id: 'Pangkal Lunas',label: 'Pangkal Lunas', color: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  { id: 'Biaya Seragam',label: 'Biaya Seragam', color: 'bg-violet-500',  chip: 'bg-violet-50 text-violet-700 ring-violet-200' },
  { id: 'Biaya Asrama', label: 'Biaya Asrama',  color: 'bg-sky-500',    chip: 'bg-sky-50 text-sky-700 ring-sky-200' },
];

function deriveStatus(checklist) {
  const has = (v) => checklist.includes(v);
  if (has('Pendaftaran') && has('Pangkal Lunas')) return 'Pendaftaran+Pangkal Full';
  if (has('Pendaftaran') && has('DP Pangkal'))    return 'Pendaftaran+DP Pangkal';
  if (has('Pangkal Lunas')) return 'Pangkal Full';
  if (has('DP Pangkal'))    return 'DP Pembayaran Pangkal';
  if (has('Pendaftaran'))   return 'Baru mendaftar';
  return checklist.join(' + ') || 'Baru mendaftar';
}

export default function StudentDatabase() {
  const { 
    students, addStudent, updateStudent, deleteStudent, syncMonevWithRecap,
    user, marketingStaff, fetchMarketingStaff,
    leadsRecap, fetchLeadsRecap
  } = useStore();
  
  useEffect(() => {
    fetchMarketingStaff();
    fetchLeadsRecap();
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

  // Checklist & Autocomplete state
  const [statusChecklist, setStatusChecklist] = useState(['Pendaftaran']);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Gabungkan sumber autocomplete: leadsRecap + students
  const allSources = useMemo(() => {
    const fromLeads = (leadsRecap || []).map(l => ({ nama: l.student_name, telepon: l.phone || '', asal_sekolah: l.school || '' }));
    const fromStudents = (students || []).map(s => ({ nama: s.nama, telepon: s.telepon || '', asal_sekolah: s.asal_sekolah || '' }));
    const merged = [...fromLeads, ...fromStudents];
    // Deduplicate by nama
    const seen = new Set();
    return merged.filter(s => { if (!s.nama || seen.has(s.nama)) return false; seen.add(s.nama); return true; });
  }, [leadsRecap, students]);

  const suggestions = useMemo(() => {
    if (!formData.nama || formData.nama.length < 2) return [];
    return allSources.filter(s => s.nama.toLowerCase().includes(formData.nama.toLowerCase())).slice(0, 7);
  }, [formData.nama, allSources]);

  const handleSelectStudent = (s) => {
    setFormData(f => ({ ...f, nama: s.nama, telepon: s.telepon, asal_sekolah: s.asal_sekolah }));
    setShowSuggestions(false);
  };

  const handleToggleKonversi = (id) => {
    setStatusChecklist(prev => {
      const next = prev.includes(id) ? prev.filter(k => k !== id) : [...prev, id];
      setFormData(f => ({ ...f, status_pembayaran: deriveStatus(next) }));
      return next;
    });
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Ambil data terbaru untuk riwayat
  const recentMonev = [...students].slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (editingId) {
      await updateStudent(editingId, formData);
      setEditingId(null);
    } else {
      await addStudent(formData);
    }

    // Jalankan Sinkronisasi Otomatis ke Rekap Leads Marketing
    await syncMonevWithRecap(formData);
    
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
                  <p className="text-lg">Berhasil!</p>
                  <p className="text-sm font-normal opacity-80">Data telah diperbarui di database utama.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Nama Siswa — Autocomplete */}
            <div className="space-y-3 relative">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Nama Lengkap Siswa</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  required
                  placeholder="cth: Ahmad Fauzi (ketik untuk cari)"
                  value={formData.nama}
                  onChange={e => { setFormData({...formData, nama: e.target.value}); setShowSuggestions(true); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-800 font-semibold"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button" onMouseDown={() => handleSelectStudent(s)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0">
                        <p className="font-bold text-slate-800 text-sm">{s.nama}</p>
                        <div className="flex gap-2 mt-0.5">
                          <span className="text-[10px] text-emerald-600 font-medium">{s.telepon}</span>
                          {s.telepon && s.asal_sekolah && <span className="text-[10px] text-slate-300">·</span>}
                          <span className="text-[10px] text-slate-400">{s.asal_sekolah}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">
                WhatsApp Aktif
                {formData.telepon && <span className="ml-2 text-emerald-500 font-normal normal-case text-[10px]">✓ terisi otomatis</span>}
              </label>
              <input
                required type="tel" placeholder="08... (otomatis terisi)"
                value={formData.telepon}
                onChange={e => setFormData({...formData, telepon: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none transition-all text-slate-800 font-semibold"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">
                Asal Sekolah
                {formData.asal_sekolah && <span className="ml-2 text-emerald-500 font-normal normal-case text-[10px]">✓ terisi otomatis</span>}
              </label>
              <input
                required placeholder="SMA/SMK Negeri... (otomatis terisi)"
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

            <div className="space-y-3 md:col-span-2">
              <label className="text-[xs] font-black text-slate-400 uppercase tracking-tighter ml-1">Status Konversi <span className="font-normal normal-case text-slate-300">(centang semua yang sesuai)</span></label>
              <div className="flex flex-wrap gap-3 pt-1">
                {KONVERSI_LIST.map(opt => {
                  const checked = statusChecklist.includes(opt.id);
                  return (
                    <button key={opt.id} type="button" onClick={() => handleToggleKonversi(opt.id)}
                      className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border-2 font-bold text-sm transition-all ${
                        checked
                          ? `${opt.chip} border-current ring-1 shadow-md`
                          : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                      }`}>
                      <span className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? `${opt.color} border-current` : 'border-slate-300'
                      }`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              {statusChecklist.length > 0 && (
                <p className="text-[10px] text-slate-400 ml-1">→ Akan disimpan sebagai: <span className="font-bold text-indigo-600">{formData.status_pembayaran}</span></p>
              )}
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
          <h3 className="font-bold text-slate-900 text-sm italic py-2">Daftar Monev Terbaru</h3>
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Live Sync Active</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50 bg-slate-50/10 text-center">
                <th className="px-8 py-5 text-left">Nama Siswa</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Nominal</th>
                <th className="px-8 py-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentMonev.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.nama}</p>
                    <p className="text-[10px] text-slate-400 font-semibold">{item.asal_sekolah}</p>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[9px] font-black shadow-sm uppercase tracking-tighter">
                      {item.status_pembayaran}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-indigo-600 text-base">
                    Rp {Number(item.nominal_pembayaran).toLocaleString()}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl transition-all hover:scale-110"
                        title="Edit Data Ini"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user?.role === 'Manager' && (
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                          title="Hapus Data Ini"
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
                  <td colSpan={4} className="px-8 py-16 text-center text-slate-300 italic font-medium">Bapak belum memiliki riwayat penginputan monev.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
