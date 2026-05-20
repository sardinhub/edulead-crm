import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Calendar, Users, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function ReferralMonitoring() {
  const { user, referralLogs, fetchReferralLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReferralLogs();
  }, [user]);

  const filteredLogs = referralLogs.filter(log => {
    const term = searchTerm.toLowerCase();
    return log.student_name?.toLowerCase().includes(term) || 
           log.pic_staff?.toLowerCase().includes(term) ||
           log.school?.toLowerCase().includes(term);
  });

  const getStatusColor = (response) => {
    switch(response) {
      case 'Tertarik': return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 'Pikir-pikir dulu': return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 'Menolak': return 'bg-red-50 text-red-700 ring-red-200';
      case 'Tidak dapat dihubungi': return 'bg-slate-100 text-slate-700 ring-slate-200';
      default: return 'bg-slate-50 text-slate-700 ring-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Monitoring Referral
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Riwayat follow-up dan aktivitas program referral kepada siswa.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama siswa, sekolah, atau PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Tanggal</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Nama Siswa</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Respon</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Tindakan Staff</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">PIC Staff</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={log.id} 
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-2 text-slate-600 font-medium">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {new Date(log.activity_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{log.student_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{log.school || log.program}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold ring-1", getStatusColor(log.student_response))}>
                      {log.student_response}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-700 font-medium text-xs">
                      {log.staff_action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
                      <Users className="w-3.5 h-3.5" />
                      {log.pic_staff}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Belum ada riwayat monitoring referral.</p>
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
