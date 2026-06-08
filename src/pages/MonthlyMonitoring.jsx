import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  UserCheck, 
  Sparkles,
  ArrowRight,
  Gift,
  X,
  ShieldAlert
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function MonthlyMonitoring() {
  const { user, referralLogs, fetchReferralLogs } = useStore();
  
  // Calendar View Month/Year
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Selected Date for detail panel (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Search and Tabs state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, potential, others

  const isManager = user?.role === 'Manager';

  useEffect(() => {
    fetchReferralLogs();
  }, [user]);

  // If user is not manager, restrict access immediately
  if (!isManager) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-100 shadow-2xl text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto ring-8 ring-red-50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Akses Terbatas</h2>
            <p className="text-slate-500 text-sm">
              Halaman ini hanya dapat diakses oleh pengguna dengan hak akses **Manager**. Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
            </p>
          </div>
          <button 
            onClick={() => window.history.back()}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all active:scale-95"
          >
            Kembali
          </button>
        </motion.div>
      </div>
    );
  }

  // Formatting date string helper (YYYY-MM-DD)
  const formatDateString = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Convert Date object to readable ID format (e.g. 9 Juni 2026)
  const formatReadableDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Filter logs for selected date
  const selectedDateStr = formatDateString(selectedDate);
  const logsForSelectedDate = referralLogs.filter(log => log.activity_date === selectedDateStr);

  // Filter logs by search term and tabs
  const filteredLogs = logsForSelectedDate.filter(log => {
    const matchesSearch = 
      log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.pic_staff?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.program?.toLowerCase().includes(searchTerm.toLowerCase());

    const isPotential = log.student_response === 'Tertarik' || log.student_response === 'Pikir-pikir dulu';
    
    if (activeTab === 'potential') {
      return matchesSearch && isPotential;
    } else if (activeTab === 'others') {
      return matchesSearch && !isPotential;
    }
    return matchesSearch;
  });

  // Calendar setup helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    let startDayOfWeek = firstDay.getDay(); // 0 = Sun, 1 = Mon, etc.
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Mon is 0, Sun is 6
    
    return { daysInMonth, startDayOfWeek };
  };

  const { daysInMonth, startDayOfWeek } = getDaysInMonth(currentMonth);
  const currentYear = currentMonth.getFullYear();
  const currentMonthIdx = currentMonth.getMonth();

  // Create calendar cells array
  const prevMonth = new Date(currentYear, currentMonthIdx, 0);
  const daysInPrevMonth = prevMonth.getDate();
  const prevMonthDays = [];
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: daysInPrevMonth - i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonthIdx - 1, daysInPrevMonth - i)
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push({
      day: i,
      isCurrentMonth: true,
      date: new Date(currentYear, currentMonthIdx, i)
    });
  }

  const totalCellsSoFar = prevMonthDays.length + currentMonthDays.length;
  const remainingCells = 42 - totalCellsSoFar;
  const nextMonthDays = [];
  for (let i = 1; i <= remainingCells; i++) {
    nextMonthDays.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(currentYear, currentMonthIdx + 1, i)
    });
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];

  // Helper to handle month switching
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIdx - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentYear, currentMonthIdx + 1, 1));
  };

  // Helper to check activity on a calendar cell
  const getCellStats = (date) => {
    const dateStr = formatDateString(date);
    const cellLogs = referralLogs.filter(log => log.activity_date === dateStr);
    const total = cellLogs.length;
    const potential = cellLogs.filter(l => l.student_response === 'Tertarik' || l.student_response === 'Pikir-pikir dulu').length;
    const others = total - potential;
    return { total, potential, others };
  };

  // Calculate statistics for the current month
  const getMonthStats = () => {
    const monthLogs = referralLogs.filter(log => {
      const logDate = new Date(log.activity_date);
      return logDate.getFullYear() === currentYear && logDate.getMonth() === currentMonthIdx;
    });

    const totalFollowUp = monthLogs.length;
    const potentialClosing = monthLogs.filter(l => l.student_response === 'Tertarik' || l.student_response === 'Pikir-pikir dulu').length;
    const uniquePicStaff = [...new Set(monthLogs.map(l => l.pic_staff))].filter(Boolean).length;

    return { totalFollowUp, potentialClosing, uniquePicStaff };
  };

  const monthStats = getMonthStats();

  const getResponseBadgeColor = (response) => {
    switch (response) {
      case 'Tertarik':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
      case 'Pikir-pikir dulu':
        return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 'Menolak':
        return 'bg-red-50 text-red-700 ring-red-200';
      case 'Tidak dapat dihubungi':
        return 'bg-slate-100 text-slate-700 ring-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 ring-slate-200';
    }
  };

  // Statistics for selected date
  const totalSelectedCount = logsForSelectedDate.length;
  const potentialSelectedCount = logsForSelectedDate.filter(l => l.student_response === 'Tertarik' || l.student_response === 'Pikir-pikir dulu').length;
  const othersSelectedCount = totalSelectedCount - potentialSelectedCount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 font-inter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-indigo-600" />
            Monitoring Bulanan Referral
          </h1>
          <p className="text-slate-500 text-sm">
            Kalender interaktif untuk menganalisis performa follow-up referal dan melacak leads potensial closing.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold ring-1 ring-indigo-100 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            Akses Manager
          </span>
        </div>
      </div>

      {/* MONTH SUMMARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Follow-up Bulan Ini</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900">{monthStats.totalFollowUp}</h3>
              <span className="text-xs text-slate-500 font-semibold">siswa</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Berpotensi Closing</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-emerald-600">{monthStats.potentialClosing}</h3>
              <span className="text-xs text-slate-500 font-semibold">kandidat</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between transition-all"
        >
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIC Staff Aktif</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-slate-900">{monthStats.uniquePicStaff}</h3>
              <span className="text-xs text-slate-500 font-semibold">karyawan</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* MAIN LAYOUT: CALENDAR + DETAIL SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT & CENTER PANEL: THE CALENDAR */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          {/* Calendar Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 text-white rounded-xl">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">
                  {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </h2>
                <p className="text-xs text-slate-400">Pilih tanggal untuk melihat log follow-up</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200 bg-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-1.5 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors border border-slate-200 bg-white"
              >
                Bulan Ini
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200 bg-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid Container */}
          <div className="p-6">
            {/* Days of Week label */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              <div>Sen</div>
              <div>Sel</div>
              <div>Rab</div>
              <div>Kam</div>
              <div>Jum</div>
              <div>Sab</div>
              <div>Min</div>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {allCalendarDays.map((cell, idx) => {
                const cellStats = getCellStats(cell.date);
                const isSelected = formatDateString(cell.date) === selectedDateStr;
                const isToday = formatDateString(cell.date) === formatDateString(new Date());

                return (
                  <motion.div
                    whileHover={{ scale: cell.isCurrentMonth ? 1.02 : 1 }}
                    onClick={() => {
                      if (cell.isCurrentMonth) {
                        setSelectedDate(cell.date);
                      } else {
                        // Switch to that month and select the date
                        setCurrentMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                        setSelectedDate(cell.date);
                      }
                      setSearchTerm('');
                    }}
                    key={idx}
                    className={cn(
                      "min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative",
                      cell.isCurrentMonth 
                        ? "bg-white border-slate-100 hover:shadow-md hover:border-indigo-100" 
                        : "bg-slate-50/50 border-slate-50 text-slate-300 cursor-not-allowed",
                      isSelected && "ring-2 ring-indigo-500 border-transparent shadow-lg bg-indigo-50/30",
                      isToday && !isSelected && "border-indigo-500 bg-slate-50"
                    )}
                  >
                    {/* Day number & Today indicator */}
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-sm font-bold",
                        cell.isCurrentMonth ? "text-slate-800" : "text-slate-300",
                        isSelected && "text-indigo-600",
                        isToday && "bg-indigo-600 text-white rounded-lg w-6 h-6 flex items-center justify-center"
                      )}>
                        {cell.day}
                      </span>
                      {isToday && !isSelected && (
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      )}
                    </div>

                    {/* Stats indicator inside cell */}
                    {cellStats.total > 0 && (
                      <div className="space-y-1">
                        {cellStats.potential > 0 && (
                          <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            {cellStats.potential} Closing
                          </div>
                        )}
                        {cellStats.total > 0 && (
                          <div className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[9px] font-medium px-1.5 py-0.5 rounded-md border border-slate-200">
                            {cellStats.total} F/Up
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: SELECTED DATE DETAIL PANEL */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col">
          {/* Detail Panel Header */}
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900 text-lg">Detail Aktivitas</h3>
            <p className="text-xs text-indigo-600 font-bold mt-0.5 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatReadableDate(selectedDate)}
            </p>
          </div>

          {/* Quick Selected Date Stats */}
          <div className="grid grid-cols-2 border-b border-slate-100 divide-x divide-slate-100 bg-slate-50/20">
            <div className="p-4 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total F/U</p>
              <h4 className="text-xl font-black text-slate-800">{totalSelectedCount}</h4>
            </div>
            <div className="p-4 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Berpotensi Closing</p>
              <h4 className="text-xl font-black text-emerald-600">{potentialSelectedCount}</h4>
            </div>
          </div>

          {/* Search bar */}
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari siswa, sekolah, PIC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none font-medium"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Tab Filter */}
          <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/20">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center",
                activeTab === 'all' 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              Semua ({totalSelectedCount})
            </button>
            <button
              onClick={() => setActiveTab('potential')}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center",
                activeTab === 'potential' 
                  ? "bg-emerald-600 text-white shadow-sm" 
                  : "text-emerald-600 hover:bg-emerald-50"
              )}
            >
              Potensi ({potentialSelectedCount})
            </button>
            <button
              onClick={() => setActiveTab('others')}
              className={cn(
                "flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all text-center",
                activeTab === 'others' 
                  ? "bg-slate-400 text-white shadow-sm" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              )}
            >
              Lainnya ({othersSelectedCount})
            </button>
          </div>

          {/* Detailed list area */}
          <div className="overflow-y-auto max-h-[420px] divide-y divide-slate-100 min-h-[300px]">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  key={log.id || idx}
                  className="p-5 hover:bg-slate-50/50 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{log.student_name}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.school} • {log.program || 'N/A'}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 whitespace-nowrap", getResponseBadgeColor(log.student_response))}>
                      {log.student_response}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl space-y-1.5 text-xs">
                    <p className="text-slate-700 font-semibold leading-relaxed">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Tindakan Staff:</span>
                      {log.staff_action}
                    </p>
                    {log.notes && (
                      <p className="text-slate-500 italic">
                        <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 not-italic">Catatan:</span>
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold">
                      <Users className="w-3 h-3 text-slate-400" />
                      PIC: {log.pic_staff}
                    </span>
                    <span className="text-slate-400 font-medium">
                      Log: {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                </motion.div>
              ))}

              {filteredLogs.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center flex flex-col items-center justify-center min-h-[300px] space-y-4"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-600 font-semibold text-sm">Tidak ada data logs referral</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {searchTerm ? 'Coba ganti kata kunci pencarian Anda.' : 'Pilih tanggal lain atau pastikan sudah ada progress referral yang di-input.'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
