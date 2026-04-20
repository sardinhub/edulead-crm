import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Phone, MessageSquare, Calendar, X, ChevronRight, DollarSign, ClipboardEdit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const columns = [
  { id: 'Pendaftaran', title: 'Pendaftaran', color: 'bg-blue-500' },
  { id: 'DP Pangkal', title: 'DP Pangkal', color: 'bg-amber-500' },
  { id: 'Pangkal Lunas', title: 'Pangkal Lunas', color: 'bg-emerald-500' },
];

export default function StudentDatabase() {
  const { students, addStudent, updateStudentStatus, logActivity, user, recordPayment, updateFollowUp, marketingStaff, fetchMarketingStaff } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMarketingStaff();
  }, [fetchMarketingStaff]);
  
  // Payment Modal State
  const [paymentStudent, setPaymentStudent] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('DP Pembayaran Pangkal');

  // Follow Up Modal State
  const [followUpStudent, setFollowUpStudent] = useState(null);
  const [followUpResult, setFollowUpResult] = useState('');
  const [followUpPromise, setFollowUpPromise] = useState('');
  
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
    // Nilai default lain agar sinkron
    program_interest: 'Reguler',
    priority_level: 'Medium',
    priority_score: 50,
    status_current: 'Pendaftaran'
  });

  const getStudentsByStatus = (status) => students.filter(s => s.status_current === status);

  const handleWhatsApp = (e, studentId, telepon) => {
    e.stopPropagation();
    logActivity(studentId, 'WhatsApp', 'Pengiriman pesan follow-up via WhatsApp Web');
    const formattedNum = telepon.replace(/^0/, '62');
    window.open(`https://wa.me/${formattedNum}`, '_blank');
  };

  const handlePhoneCall = (e, studentId, telepon) => {
    e.stopPropagation();
    logActivity(studentId, 'Telepon', 'Melakukan panggilan suara');
    const formattedNum = telepon.replace(/^0/, '62');
    window.location.href = `tel:+${formattedNum}`;
  };

  const handleMoveStatus = (e, studentId, currentStatus) => {
    e.stopPropagation();
    const currentIndex = columns.findIndex(c => c.id === currentStatus);
    if (currentIndex < columns.length - 1) {
      updateStudentStatus(studentId, columns[currentIndex + 1].id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addStudent(formData);
    setIsModalOpen(false);
    setFormData({ ...formData, nama: '', telepon: '', asal_sekolah: '' }); // reset some fields
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentStudent) return;
    
    // Tentukan kolom mana dia harus loncat
    let newColumn = 'Pendaftaran';
    if (paymentType.includes('DP')) newColumn = 'DP Pangkal';
    if (paymentType.includes('Full') || paymentType.includes('Lunas')) newColumn = 'Pangkal Lunas';

    // Hitung akumulasi
    const currentTotal = Number(paymentStudent.nominal_pembayaran) || 0;
    const newTotal = currentTotal + Number(paymentAmount);

    recordPayment(paymentStudent.id, newTotal, paymentType, newColumn);
    
    setPaymentStudent(null);
    setPaymentAmount('');
  };

  const handleFollowUpSubmit = (e) => {
    e.preventDefault();
    if (!followUpStudent) return;

    updateFollowUp(followUpStudent.id, followUpResult, followUpPromise);
    setFollowUpStudent(null);
    setFollowUpResult('');
    setFollowUpPromise('');
  };

  return (
    <div className="p-6 md:p-8 h-[calc(100vh-4rem)] flex flex-col relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progress Monev Leads</h1>
          <p className="text-slate-500 mt-1">Input data konversi leads menuju DP Pangkal atau Pangkal Lunas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Tambah Data Monev
        </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colStudents = getStudentsByStatus(col.id);
          
          return (
            <div key={col.id} className="kanban-column flex flex-col bg-slate-100/50 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className={cn("w-3 h-3 rounded-full", col.color)} />
                  <h3 className="font-bold text-slate-800">{col.title}</h3>
                  <span className="bg-slate-200 text-slate-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                    {colStudents.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-[150px]">
                <AnimatePresence>
                  {colStudents.map((student) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={student.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          {student.priority_level === 'High' && (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-100 text-red-700">Hot</span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700">
                            {student.program_interest}
                          </span>
                        </div>
                        {col.id !== 'Pangkal Lunas' && (
                          <button 
                            onClick={(e) => handleMoveStatus(e, student.id, student.status_current)}
                            className="text-slate-400 hover:bg-slate-100 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                            title="Move to Next Stage"
                          >
                            <ChevronRight className="w-4 h-4 text-indigo-500" />
                          </button>
                        )}
                      </div>
                      
                      <h4 className="font-semibold text-slate-900">{student.nama}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{student.asal_sekolah}</p>
                      
                      {student.catatan && (
                        <div className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block border border-amber-100">
                          {student.catatan}
                        </div>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => handleWhatsApp(e, student.id, student.telepon)}
                            className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => handlePhoneCall(e, student.id, student.telepon)}
                            className="w-8 h-8 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                            title="Call"
                          >
                            <Phone className="w-4 h-4" />
                          </button>
                          
                          <button 
                             onClick={(e) => { e.stopPropagation(); setFollowUpStudent(student); }}
                             className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                             title="Catat Hasil Follow-Up"
                          >
                             <ClipboardEdit className="w-4 h-4" />
                          </button>

                          {col.id !== 'Pangkal Lunas' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setPaymentStudent(student); }}
                              className="w-8 h-8 rounded-full bg-amber-50 hover:bg-amber-100 flex items-center justify-center text-amber-600 transition-colors"
                              title="Catat Pembayaran"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Today</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Input Data Monev Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-full border border-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto p-6 flex-1">
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nama Siswa</label>
                      <input required placeholder="Budi Santoso" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nomor WhatsApp / Telepon</label>
                      <input required type="tel" placeholder="081234..." value={formData.telepon} onChange={e => setFormData({...formData, telepon: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Asal Sekolah</label>
                      <input required placeholder="SMA Negeri 1" value={formData.asal_sekolah} onChange={e => setFormData({...formData, asal_sekolah: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Tanggal Daftar</label>
                      <input required type="date" value={formData.tanggal_daftar} onChange={e => setFormData({...formData, tanggal_daftar: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Status Pembayaran</label>
                    <select value={formData.status_pembayaran} onChange={e => setFormData({...formData, status_pembayaran: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="Baru mendaftar">Baru mendaftar</option>
                      <option value="DP Pembayaran Pangkal">DP Pembayaran Pangkal</option>
                      <option value="Pangkal Full">Pangkal Full</option>
                      <option value="Pendaftaran+DP Pangkal">Pendaftaran + DP Pangkal</option>
                      <option value="Pendaftaran+Pangkal Full">Pendaftaran + Pangkal Full</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">PIC Penanggung Jawab</label>
                      {user?.role === 'Manager' ? (
                        <select
                          required
                          value={formData.pic_staff}
                          onChange={e => setFormData({...formData, pic_staff: e.target.value})}
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value="">-- Gunakan Nama Staff Terdaftar --</option>
                          {marketingStaff.filter(s => s.is_active).map(staff => (
                            <option key={staff.id} value={staff.name}>{staff.name}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                           required 
                           value={formData.pic_staff} 
                           disabled
                           className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-100 text-slate-500 cursor-not-allowed" 
                        />
                      )}
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Nominal Pembayaran</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                        <input required type="number" placeholder="0" value={formData.nominal_pembayaran} onChange={e => setFormData({...formData, nominal_pembayaran: e.target.value})} className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Catatan</label>
                    <textarea placeholder="Catatan opsional..." rows={3} value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" />
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg py-2.5 font-medium transition-colors">
                      Batal
                    </button>
                    <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 font-medium transition-colors">
                      Simpan Data Monev
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Catat Pembayaran Modal */}
      <AnimatePresence>
        {paymentStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Catat Pembayaran</h3>
                <button onClick={() => setPaymentStudent(null)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-full border border-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-900 text-sm">
                  <p className="font-semibold">{paymentStudent.nama}</p>
                  <p className="text-indigo-700">Total terbayar saat ini: Rp {(Number(paymentStudent.nominal_pembayaran) || 0).toLocaleString()}</p>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Jenis Pembayaran Terkini</label>
                    <select value={paymentType} onChange={e => setPaymentType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20">
                      <option value="DP Pembayaran Pangkal">DP Pembayaran Pangkal</option>
                      <option value="Pelunasan Pangkal">Pelunasan Pangkal (Lunas)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Nominal yang Dibayarkan (Tambahan)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rp</span>
                      <input required type="number" placeholder="500000" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2.5 font-bold transition-colors shadow-lg shadow-amber-500/20">
                      Simpan Pembayaran & Geser Status
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Catat Follow-up Modal */}
      <AnimatePresence>
        {followUpStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                <h3 className="font-bold text-lg text-slate-900">Catat Hasil Follow-Up</h3>
                <button onClick={() => setFollowUpStudent(null)} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-1.5 rounded-full border border-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <p className="font-semibold text-slate-800">{followUpStudent.nama}</p>
                  <p className="text-slate-500 text-xs">Pembaruan Progres Prospek</p>
                </div>

                <form onSubmit={handleFollowUpSubmit} className="space-y-4 text-sm">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Hasil Telepon/Chat (Detail)</label>
                    <textarea 
                      required 
                      rows={3}
                      placeholder="Siswa merespon akan mentransfer uang muka besok pagi..." 
                      value={followUpResult} 
                      onChange={e => setFollowUpResult(e.target.value)} 
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none" 
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Label Janji Tindak Lanjut</label>
                    <select value={followUpPromise} onChange={e => setFollowUpPromise(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                      <option value="">-- Pilih Tindakan/Janji --</option>
                      <option value="Akan Bayar DP">Janji Bayar DP Pangkal</option>
                      <option value="Akan Pelunasan">Janji Bayar Lunas</option>
                      <option value="Belum Merespon">Telfon Tidak Diangkat</option>
                      <option value="Pikir-pikir">Minta Waktu Pikir-pikir</option>
                    </select>
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white rounded-lg py-2.5 font-bold transition-colors shadow-lg shadow-black/20">
                      Simpan Catatan Info
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
