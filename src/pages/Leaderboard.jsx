import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Users, Calendar, Map, PieChart, Star, Medal, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function Leaderboard() {
  const { students, leadsRecap, marketingStaff } = useStore();

  // 1. Leaderboard Data (Berdasarkan ACH - Pangkal Lunas)
  const leaderboardData = useMemo(() => {
    const stats = {};
    leadsRecap.forEach(l => {
      const isACH = l.staff_name && l.referral && 
                    l.staff_name.trim().toUpperCase() === l.referral.trim().toUpperCase() &&
                    l.note?.toUpperCase().includes('PANGKAL LUNAS');
      
      if (isACH) {
        stats[l.staff_name] = (stats[l.staff_name] || 0) + 1;
      }
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [leadsRecap]);

  // 2. Tren Pendaftaran Bulanan (6 Bulan Terakhir)
  const monthlyTrends = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({
        name: d.toLocaleString('id-ID', { month: 'short' }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        count: 0
      });
    }

    students.forEach(s => {
      const date = s.created_at || s.tanggal_daftar;
      if (!date) return;
      const key = date.substring(0, 7); // YYYY-MM
      const monthObj = months.find(m => m.key === key);
      if (monthObj) monthObj.count++;
    });

    return months;
  }, [students]);

  // 3. Distribusi Asal Sekolah (Top 5)
  const schoolStats = useMemo(() => {
    const stats = {};
    students.forEach(s => {
      if (s.asal_sekolah) {
        const school = s.asal_sekolah.toUpperCase().trim();
        stats[school] = (stats[school] || 0) + 1;
      }
    });

    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [students]);

  // 4. Statistik Konversi Global
  const conversionStats = useMemo(() => {
    const totalLeads = leadsRecap.length;
    const totalLunas = leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS')).length;
    const rate = totalLeads > 0 ? ((totalLunas / totalLeads) * 100).toFixed(1) : 0;
    return { totalLeads, totalLunas, rate };
  }, [leadsRecap]);

  const maxMonthly = Math.max(...monthlyTrends.map(m => m.count), 1);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <Award className="w-7 h-7 text-amber-500" />
            Analitik & Leaderboard Staff
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            Performa Konversi & Tren Pendaftaran Marketing
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Card */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Papan Peringkat ACH
            </h2>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">Target: 15 / Staff</span>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {leaderboardData.map((staff, idx) => {
                const percentage = Math.min(Math.round((staff.count / 15) * 100), 100);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={staff.name} 
                    className="relative"
                  >
                    <div className="flex justify-between items-end mb-2">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-sm",
                          idx === 0 ? "bg-amber-100 text-amber-600" : 
                          idx === 1 ? "bg-slate-100 text-slate-600" :
                          idx === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                        )}>
                          {idx === 0 ? <Medal className="w-4 h-4" /> : idx + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 uppercase tracking-tight">{staff.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{percentage}% dari target</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-slate-900">{staff.count}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Lunas</p>
                      </div>
                    </div>
                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={cn(
                          "h-full rounded-full transition-all",
                          idx === 0 ? "bg-gradient-to-r from-amber-400 to-orange-400" : 
                          idx === 1 ? "bg-gradient-to-r from-slate-400 to-slate-500" :
                          idx === 2 ? "bg-gradient-to-r from-orange-400 to-red-400" : "bg-indigo-500"
                        )}
                      />
                    </div>
                  </motion.div>
                );
              })}
              {leaderboardData.length === 0 && (
                <div className="text-center py-12 text-slate-400 italic">Belum ada pencapaian yang tercatat.</div>
              )}
            </div>
          </div>
        </div>

        {/* Global Conversion Card */}
        <div className="space-y-8">
          <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
             <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Global Conversion Rate</p>
             <h3 className="text-5xl font-black">{conversionStats.rate}%</h3>
             <p className="text-indigo-200 text-sm mt-2 font-medium">Dari total {conversionStats.totalLeads} leads yang masuk.</p>
             <div className="mt-8 flex gap-4">
                <div className="flex-1 bg-white/10 rounded-2xl p-4">
                   <p className="text-[10px] font-bold text-indigo-200 uppercase">Total Lunas</p>
                   <p className="text-xl font-black">{conversionStats.totalLunas}</p>
                </div>
                <div className="flex-1 bg-white/10 rounded-2xl p-4">
                   <p className="text-[10px] font-bold text-indigo-200 uppercase">Total Leads</p>
                   <p className="text-xl font-black">{conversionStats.totalLeads}</p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50">
             <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                <Map className="w-5 h-5 text-emerald-500" />
                Asal Sekolah Terbanyak
             </h3>
             <div className="space-y-4">
                {schoolStats.map((school, idx) => (
                  <div key={school.name} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm truncate">{school.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full" 
                            style={{ width: `${(school.count / schoolStats[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-600">{school.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              Tren Pendaftaran (6 Bulan Terakhir)
           </h3>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-xs font-bold text-slate-500 uppercase">Siswa Terdaftar</span>
              </div>
           </div>
        </div>
        
        <div className="h-64 flex items-end gap-4 md:gap-8 px-4">
           {monthlyTrends.map((month, idx) => {
             const height = (month.count / maxMonthly) * 100;
             return (
               <div key={month.key} className="flex-1 flex flex-col items-center gap-4 group">
                 <div className="relative w-full flex flex-col items-center">
                    <AnimatePresence>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        whileHover={{ opacity: 1, y: -5 }}
                        className="absolute -top-10 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 transition-opacity pointer-events-none"
                      >
                        {month.count} Siswa
                      </motion.div>
                    </AnimatePresence>
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn(
                        "w-full max-w-[60px] rounded-t-xl transition-all group-hover:brightness-110 shadow-lg",
                        idx === 5 ? "bg-gradient-to-t from-indigo-600 to-indigo-400" : "bg-gradient-to-t from-slate-200 to-slate-100 group-hover:from-indigo-200 group-hover:to-indigo-100"
                      )}
                    />
                 </div>
                 <p className={cn(
                   "text-xs font-black uppercase tracking-tighter",
                   idx === 5 ? "text-indigo-600" : "text-slate-400"
                 )}>{month.name}</p>
               </div>
             );
           })}
        </div>
      </div>
    </div>
  );
}
