import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Clock, Phone, CheckCircle2, Plane, XCircle, ChevronDown, X, MessageCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Target konversi bulanan per staff */
const MONTHLY_TARGETS = {
  'Fitri Alfani': 5,
  'Shera': 5,
  'Bella Sintia': 3,
  'Salma': 3,
  'Irfandi Nyondri': 3,
  'Kasmira': 3,
};

function getMonthlyTarget(staffName) {
  if (!staffName) return 3;
  if (MONTHLY_TARGETS[staffName] !== undefined) return MONTHLY_TARGETS[staffName];
  const key = Object.keys(MONTHLY_TARGETS).find(
    k => staffName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(staffName.toLowerCase())
  );
  return key ? MONTHLY_TARGETS[key] : 3;
}

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, colorClass }) => (
  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClass)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="mt-4 flex items-center gap-2 text-sm">
        <span className={trend >= 0 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
        <span className="text-slate-400">{trendLabel}</span>
      </div>
    )}
  </div>
);

const TargetWidget = ({ current, target, userName, monthlyCount, monthlyTarget, monthName }) => {
  // ── Tracker keseluruhan (all-time, target 15) ──
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const remaining = Math.max(target - current, 0);
  const isAchieved = current >= target;

  // ── Tracker bulan berjalan ──
  const monthlyPct = Math.min(Math.round((monthlyCount / monthlyTarget) * 100), 100);
  const monthlyRemaining = Math.max(monthlyTarget - monthlyCount, 0);
  const isMonthlyAchieved = monthlyCount >= monthlyTarget;

  return (
    <div className="bg-indigo-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden h-full">
      {/* Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-12 -mb-12 blur-xl" />

      <div className="relative z-10 flex flex-col h-full justify-between gap-5">
        {/* ── Header ── */}
        <div className="space-y-1.5">
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">Premium Incentive Tracker</p>
          <h2 className="text-2xl font-bold">Halo, {userName?.toUpperCase()}! 🚀</h2>
          <p className="text-indigo-100/70 text-sm">
            {isAchieved
              ? '🔥 Target keseluruhan tercapai! Ambil insentif premium Anda sekarang!'
              : `Tinggal ${remaining} "Pangkal Lunas" lagi untuk klaim bonus insentif premium Anda!`}
          </p>
        </div>

        {/* ── Tracker Keseluruhan (All-time · Target 15) ── */}
        <div>
          <div className="flex justify-between items-end mb-1.5">
            <div>
              <span className="text-3xl font-black">{percentage}%</span>
              <span className="text-indigo-300 text-xs font-semibold ml-2">Target Keseluruhan</span>
            </div>
            <span className="text-xs text-indigo-300 font-medium">{current} / {target} Lunas</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
            />
          </div>
          {isAchieved && (
            <p className="text-emerald-300 text-[10px] font-bold mt-1 text-right">✅ TARGET TERCAPAI</p>
          )}
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/10" />

        {/* ── Tracker Bulan Berjalan ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px]',
                isMonthlyAchieved ? 'bg-emerald-400/30' : 'bg-white/10'
              )}>
                {isMonthlyAchieved ? '🏆' : '📅'}
              </div>
              <span className="text-indigo-200 text-xs font-bold uppercase tracking-wider">Target Bulan {monthName}</span>
            </div>
            <span className={cn(
              'text-[10px] font-black px-2 py-0.5 rounded-full',
              isMonthlyAchieved ? 'bg-emerald-400/30 text-emerald-300' : 'bg-white/10 text-indigo-300'
            )}>
              {isMonthlyAchieved ? '✅ TERCAPAI' : `${monthlyPct}%`}
            </span>
          </div>
          <div className="flex justify-between items-end mb-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                'text-2xl font-black',
                isMonthlyAchieved ? 'text-emerald-300' : monthlyPct >= 66 ? 'text-amber-300' : 'text-white'
              )}>{monthlyCount}</span>
              <span className="text-indigo-300 text-sm font-bold">/ {monthlyTarget}</span>
              <span className="text-indigo-400 text-xs">pangkal bulan ini</span>
            </div>
            <span className="text-indigo-300 text-xs">
              {isMonthlyAchieved ? '🎉 Done!' : `${monthlyRemaining} lagi`}
            </span>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${monthlyPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              className={cn(
                'h-full rounded-full',
                isMonthlyAchieved
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                  : monthlyPct >= 66
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                    : 'bg-gradient-to-r from-violet-400 to-indigo-300'
              )}
            />
          </div>
        </div>

        {/* ── Quote ── */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-[11px] italic text-indigo-200 leading-relaxed">
            "Keberuntungan adalah titik temu antara persiapan dan kesempatan. Teruslah mengetuk pintu kesuksesan!"
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { 
    user, students, leadsRecap, fetchLeadsRecap, fetchStudents, logActivity,
  } = useStore();
  const hotLeads = students.filter(s => s.priority_level === 'High');
  const [arrivalPanel, setArrivalPanel] = useState(null); // null | 'AKTIF' | 'PROSES' | 'BATAL' | 'GELOMBANG_2'

  React.useEffect(() => {
    fetchLeadsRecap();
    fetchStudents();
  }, []);

  // Leads yang sudah PANGKAL LUNAS
  const lunasLeads = leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS'));

  const arrivalCategories = [
    { id: 'AKTIF', label: 'Sudah di Kampus', bg: 'bg-emerald-600', hoverBg: 'hover:bg-emerald-700', icon: CheckCircle2, textMuted: 'text-emerald-100', shadow: 'shadow-emerald-100', borderColor: 'border-emerald-400' },
    { id: 'PROSES', label: 'Dalam Perjalanan', bg: 'bg-sky-600', hoverBg: 'hover:bg-sky-700', icon: Plane, textMuted: 'text-sky-100', shadow: 'shadow-sky-100', borderColor: 'border-sky-400' },
    { id: 'BATAL', label: 'Batal Gabung', bg: 'bg-slate-800', hoverBg: 'hover:bg-slate-900', icon: XCircle, textMuted: 'text-slate-300', shadow: 'shadow-slate-100', borderColor: 'border-slate-500' },
    { id: 'GELOMBANG_2', label: 'Gelombang 2', bg: 'bg-violet-600', hoverBg: 'hover:bg-violet-700', icon: Clock, textMuted: 'text-violet-100', shadow: 'shadow-violet-100', borderColor: 'border-violet-400' },
  ];

  const getStudentsByArrival = (statusId) => {
    if (statusId === 'BATAL') {
      return lunasLeads.filter(l => l.arrival_status === 'BATAL');
    }
    return lunasLeads.filter(l => l.arrival_status === statusId);
  };

  const handleWhatsApp = (phone, name) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  // Kalkulasi Dinamis dari Students Database
  const totalStudents = students.length;
  
  // Kalkulasi Pipeline dari Rekap Leads (Marketing)
  const pipelineStats = {
    pendaftaran: leadsRecap.filter(l => l.note?.toUpperCase().includes('PENDAFTARAN')).length,
    dpPangkal: leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL 1')).length,
    pangkalLunas: leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS')).length,
  };

  const totalLeadsMarketing = pipelineStats.pendaftaran + pipelineStats.dpPangkal + pipelineStats.pangkalLunas;
  
  // Perhitungan Pencapaian (ACH) - Harus SAMA dengan di LeadsRecap.jsx
  const calculateACH = (leads) => leads.filter(l => 
    l.staff_name && l.referral && 
    l.staff_name.trim().toUpperCase() === l.referral.trim().toUpperCase() &&
    l.note?.toUpperCase().includes('PANGKAL LUNAS')
  ).length;

  const totalACH = calculateACH(leadsRecap);

  const conversionRateMarketing = totalLeadsMarketing > 0 
    ? ((pipelineStats.pangkalLunas / totalLeadsMarketing) * 100).toFixed(1) 
    : 0;

  const pendingFollowUps = leadsRecap.filter(l => l.status === 'Belum Dihubungi' || !l.status).length;

  // ── All-time ACH (target keseluruhan = 15) ──
  const myLunasCount = user?.role === 'Manager' ? 0 : calculateACH(leadsRecap);

  // ── Pencapaian bulan berjalan (filter berdasarkan students tanggal_daftar/created_at bulan & tahun sekarang) ──
  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth(); // 0-indexed

  const calcCurrentMonthConversions = (staffName) => {
    const uniqueNames = new Set();

    // 1. Ambil dari studentsList (Pangkal Full + bulan ini + staff cocok)
    students.filter(s => {
      const isLunas = s.status_pembayaran === 'Pangkal Full' || s.status_pembayaran === 'Pendaftaran+Pangkal Full';
      if (!isLunas) return false;

      const dateObj = s.tanggal_daftar ? new Date(s.tanggal_daftar) : (s.created_at ? new Date(s.created_at) : null);
      if (!dateObj) return false;
      if (dateObj.getFullYear() !== curYear || dateObj.getMonth() !== curMonth) return false;

      if (staffName && s.pic_staff?.trim().toUpperCase() !== staffName.trim().toUpperCase()) return false;
      return true;
    }).forEach(s => {
      if (s.nama) uniqueNames.add(s.nama.trim().toUpperCase());
    });

    // 2. Ambil dari leadsRecap (PANGKAL LUNAS + dibuat bulan ini + staff cocok)
    leadsRecap.filter(l => {
      const isLunas = l.note?.toUpperCase().includes('PANGKAL LUNAS');
      if (!isLunas) return false;

      const dateObj = l.created_at ? new Date(l.created_at) : null;
      if (!dateObj) return false;
      if (dateObj.getFullYear() !== curYear || dateObj.getMonth() !== curMonth) return false;

      if (staffName && l.staff_name?.trim().toUpperCase() !== staffName.trim().toUpperCase()) return false;
      return true;
    }).forEach(l => {
      if (l.student_name) uniqueNames.add(l.student_name.trim().toUpperCase());
    });

    return uniqueNames.size;
  };

  const myMonthlyTarget = getMonthlyTarget(user?.name);
  const myMonthlyCount  = user?.role === 'Manager' ? 0 : calcCurrentMonthConversions(user?.name);

  // ── Untuk Manager: Ringkasan Tim ──
  // all-time ACH
  const teamAchievements = user?.role === 'Manager' ? leadsRecap.reduce((acc, lead) => {
    if (lead.staff_name && lead.referral &&
        lead.staff_name.trim().toUpperCase() === lead.referral.trim().toUpperCase() &&
        lead.note?.toUpperCase().includes('PANGKAL LUNAS')) {
      acc[lead.staff_name] = (acc[lead.staff_name] || 0) + 1;
    }
    return acc;
  }, {}) : {};

  // monthly per staff
  const teamMonthlyAch = user?.role === 'Manager'
    ? Object.keys(MONTHLY_TARGETS).reduce((acc, name) => {
        acc[name] = calcCurrentMonthConversions(name);
        return acc;
      }, {})
    : {};

  const handlePhoneCall = (studentId, telepon) => {
    logActivity(studentId, 'Telepon', 'Melakukan panggilan darurat (Hot Lead)');
    // Format nomor untuk memastikan aman (opsional: validasi nomor)
    const formattedNum = telepon.replace(/^0/, '62');
    window.location.href = `tel:+${formattedNum}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 font-outfit">Welcome back, {user?.name}! 👋</h1>
          <p className="text-slate-500 mt-1">
            {user?.role === 'Manager' 
              ? 'Berikut adalah ringkasan performa marketing institusi hari ini.' 
              : 'Sistem siap membantu Anda mencapai target hari ini.'}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard 
              title="Total Leads" 
              value={totalLeadsMarketing} 
              icon={Users} 
              colorClass="bg-blue-50 text-blue-600"
            />
            <StatCard 
              title="Pencapaian (ACH)" 
              value={totalACH} 
              icon={TrendingUp} 
              colorClass="bg-violet-50 text-violet-600"
            />
            <StatCard 
              title="Conversion Rate" 
              value={`${conversionRateMarketing}%`} 
              icon={TrendingUp} 
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard 
              title="Leads Baru" 
              value={pendingFollowUps} 
              icon={Clock} 
              colorClass="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Arrival Statistics Row - Clickable Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {arrivalCategories.map(cat => {
              const Icon = cat.icon;
              const count = getStudentsByArrival(cat.id).length;
              const isActive = arrivalPanel === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setArrivalPanel(isActive ? null : cat.id)}
                  className={cn(
                    cat.bg, cat.hoverBg,
                    "rounded-2xl p-6 text-white shadow-lg", cat.shadow,
                    "flex items-center justify-between cursor-pointer transition-all text-left w-full",
                    isActive && "ring-4 ring-white/30 scale-[1.02]"
                  )}
                >
                  <div>
                    <p className={cn("text-xs font-bold uppercase tracking-wider", cat.textMuted)}>{cat.label}</p>
                    <h3 className="text-3xl font-black mt-1">{count}</h3>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform", isActive && "rotate-180")} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expandable Student List Panel */}
          <AnimatePresence>
            {arrivalPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden mt-4"
              >
                <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const cat = arrivalCategories.find(c => c.id === arrivalPanel);
                        const Icon = cat?.icon || Users;
                        return (
                          <>
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", cat?.bg)}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800 text-sm">Daftar Siswa — {cat?.label}</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">{getStudentsByArrival(arrivalPanel).length} siswa</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <button onClick={() => setArrivalPanel(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {getStudentsByArrival(arrivalPanel).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 italic text-sm">Belum ada siswa dalam kategori ini.</div>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">No</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Nama Siswa</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Sekolah</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Telepon</th>
                            <th className="px-5 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">PIC Staff</th>
                            <th className="px-5 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">WhatsApp</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {getStudentsByArrival(arrivalPanel).map((lead, idx) => (
                            <tr key={lead.id} className="hover:bg-indigo-50/40 transition-colors">
                              <td className="px-5 py-3 text-slate-400 font-bold text-xs">{idx + 1}</td>
                              <td className="px-5 py-3 font-bold text-slate-800 uppercase tracking-tight">{lead.student_name}</td>
                              <td className="px-5 py-3 text-slate-500 text-xs">{lead.school || '—'}</td>
                              <td className="px-5 py-3 text-indigo-500 font-bold text-xs">{lead.phone || '—'}</td>
                              <td className="px-5 py-3 text-slate-600 text-xs font-semibold">{lead.staff_name || '—'}</td>
                              <td className="px-5 py-3 text-center">
                                {lead.phone ? (
                                  <button
                                    onClick={() => handleWhatsApp(lead.phone, lead.student_name)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 hover:scale-105 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    Hubungi
                                  </button>
                                ) : (
                                  <span className="text-slate-300 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {user?.role !== 'Manager' ? (
          <div className="lg:w-96 flex-shrink-0">
            <TargetWidget
              current={myLunasCount}
              target={15}
              monthlyCount={myMonthlyCount}
              monthlyTarget={myMonthlyTarget}
              userName={user?.name}
              monthName={monthName}
            />
          </div>
        ) : (
          <div className="lg:w-96 flex-shrink-0 bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm overflow-hidden flex flex-col gap-5">
            {/* ── Header ── */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Team Achievement</p>
              <h3 className="text-lg font-bold text-slate-900">Progres Target Staff</h3>
            </div>

            {/* ── All-time ACH (Target 15) ── */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Keseluruhan (ACH · Target 15)</p>
              <div className="space-y-3">
                {Object.entries(teamAchievements).length > 0 ? Object.entries(teamAchievements).map(([name, count]) => {
                  const pct = Math.min(Math.round((count / 15) * 100), 100);
                  const done = count >= 15;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 uppercase truncate max-w-[60%]">{name}</span>
                        <span className={cn('font-black', done ? 'text-emerald-600' : 'text-indigo-600')}>
                          {done ? '✅ ' : ''}{count} / 15
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className={cn('h-full rounded-full', done ? 'bg-emerald-500' : 'bg-indigo-500')}
                        />
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-4 text-slate-400 italic text-xs">Belum ada pencapaian ACH.</div>
                )}
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-slate-100" />

            {/* ── Target Bulan Berjalan ── */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Target Bulan {monthName}</p>
              <div className="space-y-3">
                {Object.entries(MONTHLY_TARGETS).map(([name, staffTarget]) => {
                  const monthlyCount = teamMonthlyAch[name] ?? 0;
                  const pct = Math.min(Math.round((monthlyCount / staffTarget) * 100), 100);
                  const done = monthlyCount >= staffTarget;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 uppercase truncate max-w-[60%]">{name}</span>
                        <span className={cn('font-black', done ? 'text-emerald-600' : 'text-amber-600')}>
                          {done ? '✅ ' : ''}{monthlyCount} / {staffTarget}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                          className={cn(
                            'h-full rounded-full',
                            done ? 'bg-emerald-500' : pct >= 66 ? 'bg-amber-400' : 'bg-violet-500'
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                Target Juni: Bella Sintia, Salma, Irfandi Nyondri, Kasmira = 3 · Fitri Alfani, Shera = 5 pangkal lunas.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hot Leads Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Priority Follow-up</h2>
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">View All</button>
          </div>
          <div className="p-0 overflow-y-auto max-h-[400px]">
            {hotLeads.map((lead) => (
              <div key={lead.id} className="p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">{lead.nama}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>{lead.program_interest}</span>
                      <span>•</span>
                      <span>{lead.asal_sekolah}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                      Score: {lead.priority_score}
                    </span>
                    <button 
                      onClick={() => handlePhoneCall(lead.id, lead.telepon)}
                      className="text-slate-400 hover:text-indigo-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Call Lead"
                    >
                      <Phone className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {hotLeads.length === 0 && (
               <div className="p-8 text-center text-slate-500">No high priority leads today!</div>
            )}
          </div>
        </div>

        {/* Funnel Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Pipeline Overview</h2>
          <div className="space-y-4">
            {[
              { label: 'Pendaftaran', count: pipelineStats.pendaftaran },
              { label: 'DP Pangkal', count: pipelineStats.dpPangkal },
              { label: 'Pangkal Lunas', count: pipelineStats.pangkalLunas }
            ].map((stage, idx) => {
              const percentage = totalLeadsMarketing > 0 ? (stage.count / totalLeadsMarketing) * 100 : 0;
              
              return (
                <div key={stage.label}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700">{stage.label}</span>
                    <span className="font-bold text-slate-900">{stage.count} Siswa</span>
                  </div>
                  <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: idx * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-amber-400" : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
