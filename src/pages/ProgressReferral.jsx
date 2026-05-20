import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Search, Users, Phone, MessageCircle, MapPin, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function ProgressReferral() {
  const { user, leadsRecap, fetchLeadsRecap } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const msg = `Halo ${name}, selamat datang di kampus! Kami memiliki program referral menarik untuk Anda...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
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
              {filteredCandidates.map((lead, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={lead.id} 
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{lead.student_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Didaftarkan: {lead.created_at ? new Date(lead.created_at).toLocaleDateString('id-ID') : '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => handleWhatsApp(lead.phone, lead.student_name)}
                        className="flex items-center gap-2 font-bold text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {lead.phone || '—'}
                      </button>
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
                      onClick={() => handleWhatsApp(lead.phone, lead.student_name)}
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
              ))}
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
    </div>
  );
}
