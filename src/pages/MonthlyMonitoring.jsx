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
  ShieldAlert,
  ArrowRightCircle,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function MonthlyMonitoring() {
  const { 
    user, 
    referralLogs, 
    fetchReferralLogs,
    leadsRecap,
    fetchLeadsRecap,
    marketingStaff,
    fetchMarketingStaff,
    updateLeadRecapStatus,
    addReferralLog,
    deleteReferralLog
  } = useStore();
  
  // Calendar View Month/Year
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Selected Date for detail panel (defaults to today)
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Search and Tabs state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all, potential, others

  // Staf/PIC tracking states
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [targetStaffId, setTargetStaffId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Admin Input Form state
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminActivityDate, setAdminActivityDate] = useState(null);
  const [adminActivityForm, setAdminActivityForm] = useState({ student_response: 'Dalam Konfirmasi', notes: '' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  const isManager = user?.role === 'Manager';

  useEffect(() => {
    fetchReferralLogs();
    fetchLeadsRecap();
    fetchMarketingStaff();
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
    let cellLogs = referralLogs.filter(log => log.activity_date === dateStr);

    if (selectedLeadId) {
      cellLogs = cellLogs.filter(log => log.lead_id === selectedLeadId);
    }

    const total = cellLogs.length;
    const potential = cellLogs.filter(l => l.student_response === 'Tertarik' || l.student_response === 'Pikir-pikir dulu').length;
    const others = total - potential;
    
    const specificLog = selectedLeadId && cellLogs.length > 0 ? cellLogs[cellLogs.length - 1] : null;

    return { total, potential, others, specificLog };
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

  // Filter Active Referral candidates for selected staff
  // Criteria: Note contains 'PANGKAL LUNAS' and arrival_status is 'AKTIF'
  const activeReferralLeadsForStaff = selectedStaff
    ? leadsRecap.filter(l => 
        l.staff_name === selectedStaff &&
        l.note?.toUpperCase().includes('PANGKAL LUNAS') && 
        l.arrival_status === 'AKTIF'
      )
    : [];

  const selectedLead = leadsRecap.find(l => l.id === selectedLeadId);

  // Calculate days since last progress
  const getDaysSinceLastProgress = (lead) => {
    if (!lead) return null;
    
    // Find logs in referral_monitoring for this lead
    const leadLogs = referralLogs.filter(log => log.lead_id === lead.id);
    
    // Find arrival log ('Masuk Kampus')
    const arrivalLog = leadLogs.find(log => log.student_response === 'Masuk Kampus');
    
    let arrivalDate = null;
    if (arrivalLog) {
      arrivalDate = new Date(arrivalLog.activity_date);
    } else {
      // Fallback to lead created_at for older data
      arrivalDate = lead.created_at ? new Date(lead.created_at) : new Date();
    }
    
    let latestDate = null;
    let hasFollowUp = false;
    
    if (leadLogs.length > 0) {
      // Filter out 'Masuk Kampus' logs to see if there are actual follow-up logs
      const followUpLogs = leadLogs.filter(log => log.student_response !== 'Masuk Kampus');
      if (followUpLogs.length > 0) {
        const dates = followUpLogs.map(log => new Date(log.activity_date).getTime());
        const maxTime = Math.max(...dates);
        latestDate = new Date(maxTime);
        hasFollowUp = true;
      } else {
        // Only arrival log exists
        latestDate = new Date(arrivalLog ? arrivalLog.activity_date : lead.created_at);
        hasFollowUp = false;
      }
    } else {
      // No logs at all
      latestDate = lead.created_at ? new Date(lead.created_at) : new Date();
      hasFollowUp = false;
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const latestProgressDate = new Date(latestDate);
    latestProgressDate.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - latestProgressDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return {
      days: diffDays >= 0 ? diffDays : 0,
      arrivalDate,
      latestDate,
      hasLogs: leadLogs.length > 0,
      hasFollowUp
    };
  };

  const leadProgressInfo = getDaysSinceLastProgress(selectedLead);

  // Handle reassigning leads
  const handleTransferOwnership = async () => {
    if (!selectedLead || !targetStaffId) return;
    const target = marketingStaff.find(s => s.id === targetStaffId);
    if (!target) return;
    
    if (window.confirm(`Apakah Anda yakin ingin memindahkan kepemilikan data Leads "${selectedLead.student_name}" ke Staff PIC "${target.name}"?\n\nData leads dan status monitoring referral selanjutnya akan berpindah ke staff tujuan.`)) {
      setIsTransferring(true);
      const res = await updateLeadRecapStatus(selectedLead.id, {
        staff_id: target.id,
        staff_name: target.name
      });
      setIsTransferring(false);
      
      if (res.success) {
        alert(`✅ Kepemilikan Leads "${selectedLead.student_name}" berhasil dipindahkan ke "${target.name}"!`);
        setSelectedLeadId('');
        setTargetStaffId('');
        // Refresh local store data
        fetchLeadsRecap();
      } else {
        alert(`❌ Gagal memindahkan leads: ${res.error}`);
      }
    }
  };

  // Handle save admin note
  const handleSaveAdminActivity = async () => {
    if (!selectedLead || !adminActivityDate) return;
    if (!adminActivityForm.notes) {
      alert("Catatan wajib diisi.");
      return;
    }

    setIsSubmittingAdmin(true);
    const res = await addReferralLog({
      lead_id: selectedLead.id,
      student_name: selectedLead.student_name,
      school: selectedLead.school || '',
      program: selectedLead.program || '',
      activity_date: formatDateString(adminActivityDate),
      student_response: adminActivityForm.student_response,
      staff_action: 'Pembaruan Catatan',
      notes: adminActivityForm.notes,
      pic_staff: selectedLead.staff_name || 'System'
    });
    setIsSubmittingAdmin(false);

    if (res.success) {
      alert("Catatan aktivitas berhasil disimpan!");
      setShowAdminModal(false);
      setAdminActivityForm({ student_response: 'Dalam Konfirmasi', notes: '' });
      fetchReferralLogs(); // refresh logs
    } else {
      alert("Gagal menyimpan aktivitas: " + res.error);
    }
  };

  const handleResetAdminActivity = async () => {
    if (!selectedLead || !adminActivityDate) return;
    
    if (window.confirm('Apakah Anda yakin ingin mereset aktivitas pada tanggal ini? Kotak tanggal akan kembali normal.')) {
      setIsSubmittingAdmin(true);
      const res = await deleteReferralLog(selectedLead.id, formatDateString(adminActivityDate));
      setIsSubmittingAdmin(false);

      if (res.success) {
        alert("Aktivitas berhasil di-reset!");
        setShowAdminModal(false);
        setAdminActivityForm({ student_response: 'Dalam Konfirmasi', notes: '' });
      } else {
        alert("Gagal mereset aktivitas: " + res.error);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 font-inter flex flex-col">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 order-1">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 order-2">
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
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PIC Staff Staf Aktif</p>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start order-4">
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
                const hasSelectedLeadLog = selectedLeadId && cellStats.total > 0;
                
                const isClosing = hasSelectedLeadLog && cellStats.specificLog.student_response === 'Closing Referal';
                const cellBgClass = isClosing 
                  ? "bg-emerald-500 border-emerald-600 text-white shadow-md" 
                  : (hasSelectedLeadLog ? "bg-amber-400 border-amber-500 text-white shadow-md" : (isSelected ? "bg-indigo-50/30" : ""));
                const cellTextClass = isClosing 
                  ? "text-white bg-emerald-600/50 border-emerald-400" 
                  : "text-white bg-amber-500/50 border-amber-400";

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

                      if (selectedLeadId) {
                        setAdminActivityDate(cell.date);
                        setShowAdminModal(true);
                      }
                    }}
                    key={idx}
                    className={cn(
                      "min-h-[90px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative",
                      cell.isCurrentMonth 
                        ? "bg-white border-slate-100 hover:shadow-md hover:border-indigo-100" 
                        : "bg-slate-50/50 border-slate-50 text-slate-300 cursor-not-allowed",
                      isSelected && "ring-2 ring-indigo-500 border-transparent shadow-lg",
                      cellBgClass,
                      isToday && !isSelected && !hasSelectedLeadLog && "border-indigo-500 bg-slate-50"
                    )}
                  >
                    {/* Day number & Today indicator */}
                    <div className="flex justify-between items-center">
                      <span className={cn(
                        "text-sm font-bold",
                        cell.isCurrentMonth ? (hasSelectedLeadLog ? "text-white" : "text-slate-800") : "text-slate-300",
                        isSelected && !hasSelectedLeadLog && "text-indigo-600",
                        isToday && "rounded-lg w-6 h-6 flex items-center justify-center",
                        isToday && !hasSelectedLeadLog ? "bg-indigo-600 text-white" : (isToday && hasSelectedLeadLog ? "ring-2 ring-white" : "")
                      )}>
                        {cell.day}
                      </span>
                      {isToday && !isSelected && !hasSelectedLeadLog && (
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                      )}
                    </div>

                    {/* Stats indicator inside cell */}
                    {hasSelectedLeadLog ? (
                      <div className={cn("text-[9px] font-medium leading-tight overflow-hidden line-clamp-3 p-1.5 rounded-md border", cellTextClass)}>
                        {cellStats.specificLog.notes || 'Ada Aktivitas'}
                      </div>
                    ) : cellStats.total > 0 && (
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

      {/* NEW SECTION: REFERRAL PROGRESS MONITOR & RE-ASSIGNMENT PANEL */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden order-3">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <div className="p-2.5 bg-pink-100 text-pink-600 rounded-xl">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Pemantauan Progress & Re-Assignment Prospek Referal</h3>
            <p className="text-xs text-slate-400">Pantau aktivitas leads aktif dan pindahkan kepemilikan jika tidak ada progress selama 5+ hari.</p>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT SUB-CARD: SELECTORS */}
          <div className="space-y-5">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  1. Pilih Staff / PIC Awal
                </label>
                <select
                  value={selectedStaff}
                  onChange={(e) => {
                    setSelectedStaff(e.target.value);
                    setSelectedLeadId('');
                    setTargetStaffId('');
                  }}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer"
                >
                  <option value="">-- Pilih PIC Awal --</option>
                  {marketingStaff.map(staff => (
                    <option key={staff.id} value={staff.name}>{staff.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                  2. Pilih Leads Referral Aktif
                </label>
                <select
                  disabled={!selectedStaff}
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    setTargetStaffId('');
                  }}
                  className={cn(
                    "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-pink-500/20 cursor-pointer",
                    !selectedStaff && "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200"
                  )}
                >
                  <option value="">
                    {!selectedStaff 
                      ? "-- Pilih PIC awal terlebih dahulu --" 
                      : activeReferralLeadsForStaff.length === 0 
                        ? "-- Tidak ada leads referral aktif --" 
                        : `-- Pilih Leads (${activeReferralLeadsForStaff.length}) --`
                    }
                  </option>
                  {activeReferralLeadsForStaff.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.student_name} ({lead.school || 'Sekolah N/A'})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* QUICK LEGEND INFO */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex items-start gap-3 text-xs text-slate-500">
              <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-700">Ketentuan Re-Assignment:</p>
                <ul className="list-disc pl-4 space-y-1 text-[11px]">
                  <li>Prospek terdaftar adalah leads yang memiliki program referral, lunas pangkal, dan berstatus <strong>Aktif di Kampus</strong>.</li>
                  <li>Sistem mendeteksi selisih hari dari log aktivitas referral terakhir. Jika belum ada aktivitas, tanggal daftar digunakan sebagai titik awal.</li>
                  <li>Jika prospek menganggur (idle) selama <strong>5 hari atau lebih</strong>, Admin/Manager berhak memindahkan data prospek ke PIC baru.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* RIGHT SUB-CARD: PROGRESS INFO & REASSIGN ACTION */}
          <div className="min-h-[220px]">
            <AnimatePresence mode="wait">
              {selectedLead && leadProgressInfo ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Lead Info & Idle Days Stat */}
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm bg-slate-50/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">{selectedLead.student_name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{selectedLead.school} • {selectedLead.program || 'N/A'}</p>
                      </div>

                      {/* Idle Badge Warning */}
                      {leadProgressInfo.days >= 5 ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            KRITIS: {leadProgressInfo.days} Hari
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tanpa Progress</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-end gap-1">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Aman: {leadProgressInfo.days} Hari
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Tanpa Progress</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-0.5">PIC Staf Saat Ini</p>
                        <p className="font-bold text-slate-700">{selectedLead.staff_name}</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-0.5">Tanggal Masuk Kampus</p>
                        <p className="font-bold text-slate-700">
                          {leadProgressInfo.arrivalDate 
                            ? leadProgressInfo.arrivalDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '—'
                          }
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-bold text-slate-400 uppercase text-[9px] tracking-wider mb-0.5">Aktivitas Terakhir</p>
                        <p className="font-bold text-slate-700">
                          {leadProgressInfo.hasFollowUp
                            ? leadProgressInfo.latestDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Belum ada follow-up (Mulai terhitung sejak masuk kampus)'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Reassign action block (shows if idle >= 5 days) */}
                  {leadProgressInfo.days >= 5 ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-red-50/40 border border-red-100 rounded-2xl p-5 space-y-4"
                    >
                      <div className="space-y-1">
                        <h5 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Reassign Leads (Pindahkan Kepemilikan)
                        </h5>
                        <p className="text-[11px] text-slate-500">
                          Data prospek referral ini menganggur selama 5 hari lebih. Silakan pilih staff tujuan baru untuk memindahkan datanya.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <select
                          value={targetStaffId}
                          onChange={(e) => setTargetStaffId(e.target.value)}
                          className="w-full sm:flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          <option value="">-- Pilih PIC Baru --</option>
                          {marketingStaff
                            .filter(s => s.name !== selectedLead.staff_name) // hide current staff
                            .map(staff => (
                              <option key={staff.id} value={staff.id}>{staff.name}</option>
                            ))
                          }
                        </select>

                        <button
                          disabled={!targetStaffId || isTransferring}
                          onClick={handleTransferOwnership}
                          className={cn(
                            "w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap",
                            targetStaffId && !isTransferring
                              ? "bg-red-600 text-white hover:bg-red-700 shadow-red-100 hover:scale-105"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                          )}
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                          {isTransferring ? 'Memproses...' : 'Pindahkan Leads'}
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="bg-emerald-50/20 border border-emerald-100 rounded-2xl p-5 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                      <h5 className="text-sm font-bold text-emerald-800">Progress Prospek Terjaga</h5>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Lead referral ini masih aktif di-follow up dalam rentang 5 hari terakhir oleh <strong>{selectedLead.staff_name}</strong>. Tombol pemindahan kepemilikan terkunci demi keadilan performa staff.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3"
                >
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-600 font-bold text-sm">Pilih Leads Untuk Memulai Pemantauan</p>
                    <p className="text-slate-400 text-[11px] max-w-xs mx-auto mt-0.5">
                      Pilih PIC awal di sebelah kiri, kemudian tentukan lead aktif untuk menganalisis progress detail dan pemindahan tugas.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ADMIN INPUT ACTIVITY MODAL */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Input Aktivitas Staff</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tercatat untuk tanggal: <strong className="text-indigo-600">{formatReadableDate(adminActivityDate)}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Siswa / Leads</label>
                  <input 
                    type="text" 
                    value={selectedLead?.student_name || ''} 
                    disabled
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Tindakan Staff telah disembunyikan sesuai kebutuhan */}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Status Leads</label>
                  <select
                    value={adminActivityForm.student_response}
                    onChange={(e) => setAdminActivityForm({...adminActivityForm, student_response: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Tertarik">Tertarik</option>
                    <option value="Dalam Konfirmasi">Dalam Konfirmasi</option>
                    <option value="Kurang Merspon">Kurang Merspon</option>
                    <option value="Closing Referal">Closing Referal</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Catatan (Hasil Interview) <span className="text-red-500">*</span></label>
                  <textarea 
                    rows={3}
                    placeholder="Tuliskan keterangan detail dari hasil interview dengan staff..."
                    value={adminActivityForm.notes}
                    onChange={(e) => setAdminActivityForm({...adminActivityForm, notes: e.target.value})}
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                <button
                  disabled={isSubmittingAdmin}
                  onClick={handleResetAdminActivity}
                  className="px-5 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowAdminModal(false)}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    disabled={isSubmittingAdmin}
                    onClick={handleSaveAdminActivity}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmittingAdmin ? 'Menyimpan...' : 'Simpan Aktivitas'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
