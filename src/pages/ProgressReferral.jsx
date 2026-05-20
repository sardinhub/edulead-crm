import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Search, Users, Phone, MessageCircle, MapPin, CheckCircle2, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function ProgressReferral() {
  const { user, leadsRecap, fetchLeadsRecap, addReferralLog } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Form State
  const [studentResponse, setStudentResponse] = useState('');
  const [staffAction, setStaffAction] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeadsRecap();
  }, [user]);

  // Filter students who are 'PANGKAL LUNAS' and arrival_status === 'AKTIF'
  const referralCandidates = leadsRecap.filter(l => 
    l.note?.toUpperCase().includes('PANGKAL LUNAS') && 
    l.arrival_status === 'AKTIF'
  );

  const filteredCandidates = referralCandidates.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.student_name?.toLowerCase().includes(term) || 
           c.school?.toLowerCase().includes(term) ||
           c.staff_name?.toLowerCase().includes(term);
  });

  const getReferralCount = (studentName) => {
    return leadsRecap.filter(l => 
      l.referred_by === studentName && 
      l.note?.toUpperCase().includes('PANGKAL LUNAS')
    ).length;
  };

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setStudentResponse('');
    setStaffAction('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleActionChange = async (e) => {
    const val = e.target.value;
    if (val === 'Join') {
      if (window.confirm('Arahkan ke form Daftar Manual untuk menginput data teman yang direferensikan?')) {
        // Jika sudah ada respon siswa yang diisi, simpan log nya sekalian
        if (studentResponse) {
          await addReferralLog({
            lead_id: selectedLead.id,
            student_name: selectedLead.student_name,
            school: selectedLead.school,
            program: selectedLead.program,
            activity_date: new Date().toISOString().split('T')[0],
            student_response: studentResponse,
            staff_action: 'Join (Daftar Manual)',
            notes: notes,
            pic_staff: user?.name || selectedLead.staff_name
          });
        }
        setIsModalOpen(false);
        navigate(`/recap?action=manual&referrer=${encodeURIComponent(selectedLead.student_name)}`);
      } else {
        setStaffAction('');
      }
    } else {
      setStaffAction(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentResponse || !staffAction) return;

    setIsSubmitting(true);
    
    // Simpan ke DB
    await addReferralLog({
      lead_id: selectedLead.id,
      student_name: selectedLead.student_name,
      school: selectedLead.school,
      program: selectedLead.program,
      activity_date: new Date().toISOString().split('T')[0],
      student_response: studentResponse,
      staff_action: staffAction,
      notes: notes,
      pic_staff: user?.name || selectedLead.staff_name
    });

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-pink-500" />
            Progress Referral
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar siswa yang sudah Lunas Pangkal & Sudah di Kampus. Follow-up untuk program Referral.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Kandidat Referral</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-slate-900">{referralCandidates.length}</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-100">
              Siap dihubungi
            </span>
          </div>
        </div>
        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center">
          <Gift className="w-8 h-8 text-pink-500" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama, sekolah, atau PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Nama Siswa</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Telepon & Sekolah</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Program</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Status Kampus</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">PIC Marketing</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((lead, idx) => {
                const refCount = getReferralCount(lead.student_name);
                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={lead.id} 
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{lead.student_name}</p>
                      {refCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md ring-1 ring-amber-200">
                          [{refCount} Referensi]
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Didaftarkan: {lead.created_at ? new Date(lead.created_at).toLocaleDateString('id-ID') : '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-2 font-bold text-xs text-emerald-600">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {lead.phone || '—'}
                      </span>
                      <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {lead.school || '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 ring-1 ring-violet-100 italic">
                      {lead.program || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SUDAH DI KAMPUS
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {lead.staff_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenModal(lead)}
                      disabled={!lead.phone}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                        lead.phone 
                          ? "bg-pink-500 text-white hover:bg-pink-600 hover:scale-105 active:scale-95 shadow-pink-200" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Gift className="w-4 h-4" />
                      Tawarkan Referral
                    </button>
                  </td>
                </motion.tr>
              )})}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Gift className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Belum ada kandidat referral yang sesuai.</p>
                      <p className="text-sm text-slate-400 mt-1">Siswa harus berstatus PANGKAL LUNAS dan SUDAH DI KAMPUS.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INPUT PROGRESS REFERRAL */}
      <AnimatePresence>
        {isModalOpen && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl">Progress Referral</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Siswa</label>
                    <input type="text" disabled value={selectedLead.student_name} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Program</label>
                    <input type="text" disabled value={selectedLead.program} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Asal Sekolah</label>
                    <input type="text" disabled value={selectedLead.school} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                </div>

                <hr className="border-slate-100 my-4" />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Respon Siswa</label>
                    <select 
                      required
                      value={studentResponse}
                      onChange={(e) => setStudentResponse(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Pilih Respon...</option>
                      <option value="Tertarik">Tertarik</option>
                      <option value="Pikir-pikir dulu">Pikir-pikir dulu</option>
                      <option value="Menolak">Menolak</option>
                      <option value="Tidak dapat dihubungi">Tidak dapat dihubungi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tindakan Staff</label>
                    <select 
                      required
                      value={staffAction}
                      onChange={handleActionChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Pilih Tindakan...</option>
                      <option value="Kirim Brosur via WA">Kirim Brosur via WA</option>
                      <option value="Jadwalkan Telepon">Jadwalkan Telepon</option>
                      <option value="Tawarkan Bonus/Insentif">Tawarkan Bonus/Insentif</option>
                      <option value="Join">Join (Daftar Manual)</option>
                      <option value="Selesai">Selesai / Skip</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Catatan</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan detail jika perlu..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-all disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
