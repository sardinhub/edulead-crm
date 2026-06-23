import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Users, MessageSquare, CheckCircle2,
  Lightbulb, Calendar, BarChart2, Radio, Phone, MessageCircle,
  Users2, ChevronDown, ChevronUp, FileText, Zap, Sunrise,
  Target, Activity, Clock, Flame, Trophy, Star
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';

function cn(...inputs) { return twMerge(clsx(inputs)); }

/** Konfigurasi target konversi bulanan per staff */
const MONTHLY_TARGETS = {
  // Target 5 konversi per bulan
  'Fitri Alfani': 5,
  'Shera': 5,
  // Target 3 konversi per bulan (default untuk staff berikut)
  'Bella Sintia': 3,
  'Salma': 3,
  'Irfandi Nyondri': 3,
  'Kasmira': 3,
};

/** Mendapatkan target bulanan untuk staff tertentu */
function getMonthlyTarget(staffName) {
  if (!staffName) return 3;
  // Cek exact match
  if (MONTHLY_TARGETS[staffName] !== undefined) return MONTHLY_TARGETS[staffName];
  // Cek partial match (case-insensitive)
  const key = Object.keys(MONTHLY_TARGETS).find(
    k => staffName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(staffName.toLowerCase())
  );
  return key ? MONTHLY_TARGETS[key] : 3;
}

function calcCurrentMonthConversions(studentsList, leadsList, staffName) {
  const curYear = new Date().getFullYear();
  const curMonth = new Date().getMonth(); // 0-indexed
  const uniqueNames = new Set();

  // 1. Ambil dari studentsList (Pangkal Full + bulan ini + staff cocok)
  (studentsList || []).filter(s => {
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

  // 2. Ambil dari leadsList (PANGKAL LUNAS + dibuat bulan ini + staff cocok)
  (leadsList || []).filter(l => {
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
}

/** Hitung saran evaluasi otomatis berdasarkan metrik */
function generateSuggestions(stats) {
  const suggestions = [];
  const { totalFollowUp, totalResponded, totalConverted, reportCount, streak } = stats;

  const responseRate = totalFollowUp > 0 ? (totalResponded / totalFollowUp) * 100 : 0;
  const conversionRate = totalFollowUp > 0 ? (totalConverted / totalFollowUp) * 100 : 0;

  if (totalFollowUp === 0) {
    suggestions.push({ type: 'danger', text: 'Belum ada laporan aktivitas yang tercatat. Segera isi laporan harian.' });
    return suggestions;
  }

  // Streak laporan
  if (streak === 0) {
    suggestions.push({ type: 'danger', text: 'Tidak ada laporan hari ini. Segera isi laporan harian sebelum hari berakhir.' });
  } else if (streak >= 5) {
    suggestions.push({ type: 'success', text: `🔥 Streak ${streak} hari berturut-turut! Konsistensi yang luar biasa — pertahankan!` });
  }

  // Volume follow-up
  const avgPerDay = reportCount > 0 ? totalFollowUp / reportCount : 0;
  if (avgPerDay < 10) {
    suggestions.push({ type: 'warning', text: `Rata-rata follow-up hanya ${avgPerDay.toFixed(1)} leads/hari. Target minimal 15–20 leads per hari untuk hasil optimal.` });
  }

  // Response rate
  if (responseRate < 20) {
    suggestions.push({ type: 'danger', text: `Response rate sangat rendah (${responseRate.toFixed(1)}%). Variasikan waktu follow-up dan personalisasi pesan untuk tiap leads.` });
  } else if (responseRate < 40) {
    suggestions.push({ type: 'warning', text: `Response rate sedang (${responseRate.toFixed(1)}%). Coba perkuat opening message dan tambahkan value proposition yang relevan.` });
  } else if (responseRate < 60) {
    suggestions.push({ type: 'info', text: `Response rate cukup baik (${responseRate.toFixed(1)}%). Identifikasi pola pesan yang berhasil dan replikasi ke leads lain.` });
  } else {
    suggestions.push({ type: 'success', text: `Response rate luar biasa! (${responseRate.toFixed(1)}%). Pertahankan kualitas komunikasi ini dan jadikan sebagai template standar.` });
  }

  // Conversion rate
  if (conversionRate < 5) {
    suggestions.push({ type: 'warning', text: `Conversion rate perlu ditingkatkan (${conversionRate.toFixed(1)}%). Fokus intensif pada leads yang sudah merespon positif.` });
  } else if (conversionRate < 20) {
    suggestions.push({ type: 'info', text: `Conversion rate berkembang (${conversionRate.toFixed(1)}%). Tingkatkan frekuensi follow-up pada leads prioritas tinggi.` });
  } else {
    suggestions.push({ type: 'success', text: `Conversion rate tinggi (${conversionRate.toFixed(1)}%)! Strategi Anda efektif — bagikan teknik ini ke tim.` });
  }

  // Gap respon vs konversi
  if (totalResponded > 0 && totalConverted / totalResponded < 0.15) {
    suggestions.push({ type: 'warning', text: 'Banyak leads merespon namun belum terkonversi. Tingkatkan kualitas closing dan tawarkan benefit yang lebih konkret.' });
  }

  return suggestions;
}

const suggestionColors = {
  danger: 'bg-red-50 text-red-700 border-red-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const suggestionIcons = {
  danger: '🔴',
  warning: '⚠️',
  info: '💡',
  success: '✅',
};

/** Parse ringkasan metode dari response_notes */
function parseMethodSummary(response_notes) {
  if (!response_notes) return null;
  const result = { broadcast: null, telepon: null, whatsapp: null, bertemu: null };

  const broadcastMatch = response_notes.match(/\[Broadcast\] Terkirim: (\d+), Merespon: (\d+)/);
  if (broadcastMatch) result.broadcast = { sent: parseInt(broadcastMatch[1]), responded: parseInt(broadcastMatch[2]) };

  const teleponMatch = response_notes.match(/\[Telepon\] Ditelepon: (\d+), Merespon: (\d+)/);
  if (teleponMatch) result.telepon = { called: parseInt(teleponMatch[1]), responded: parseInt(teleponMatch[2]) };

  const waMatch = response_notes.match(/\[WhatsApp\] Dihubungi: (\d+), Merespon: (\d+)/);
  if (waMatch) result.whatsapp = { contacted: parseInt(waMatch[1]), responded: parseInt(waMatch[2]) };

  const bertemuMatch = response_notes.match(/\[Bertemu Langsung\] (.+)/);
  if (bertemuMatch) result.bertemu = { detail: bertemuMatch[1] };

  return result;
}

/** Hitung breakdown metode dari semua laporan */
function calcMethodBreakdown(reports) {
  const totals = {
    broadcast: { sent: 0, responded: 0, count: 0 },
    telepon: { called: 0, responded: 0, count: 0 },
    whatsapp: { contacted: 0, responded: 0, count: 0 },
    bertemu: { meetings: 0, count: 0 },
  };
  for (const r of reports) {
    const m = parseMethodSummary(r.response_notes);
    if (!m) continue;
    if (m.broadcast) { totals.broadcast.sent += m.broadcast.sent; totals.broadcast.responded += m.broadcast.responded; totals.broadcast.count++; }
    if (m.telepon) { totals.telepon.called += m.telepon.called; totals.telepon.responded += m.telepon.responded; totals.telepon.count++; }
    if (m.whatsapp) { totals.whatsapp.contacted += m.whatsapp.contacted; totals.whatsapp.responded += m.whatsapp.responded; totals.whatsapp.count++; }
    if (m.bertemu) { totals.bertemu.meetings += (r.responded_leads_details?.length || 0); totals.bertemu.count++; }
  }
  return totals;
}

/** Hitung streak laporan berturut-turut (hari ini atau kemarin sebagai awal) */
function calcStreak(reports) {
  if (!reports.length) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const uniqueDates = [...new Set(reports.map(r => r.report_date))].sort((a, b) => new Date(b) - new Date(a));

  let streak = 0;
  let checkDate = new Date(today);

  for (const dateStr of uniqueDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((checkDate - d) / (1000 * 60 * 60 * 24));
    if (diffDays === 0 || (streak === 0 && diffDays === 1)) {
      streak++;
      checkDate = new Date(d);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/** Data 7 hari terakhir untuk mini-chart */
function getLast7Days(reports) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayReports = reports.filter(r => r.report_date === dateStr);
    const followUp = dayReports.reduce((s, r) => s + (r.leads_followed_up || 0), 0);
    const responded = dayReports.reduce((s, r) => s + (r.leads_responded || 0), 0);
    const converted = dayReports.reduce((s, r) => s + (r.leads_converted || 0), 0);
    days.push({
      date: dateStr,
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      followUp,
      responded,
      converted,
      hasReport: dayReports.length > 0,
    });
  }
  return days;
}

function RateBar({ label, value, max = 100, color }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-500 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={cn('h-full rounded-full', color)}
        />
      </div>
    </div>
  );
}

/** Mini bar chart untuk tren 7 hari */
function MiniTrendChart({ days }) {
  const maxVal = Math.max(...days.map(d => d.followUp), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {days.map((day, i) => {
        const pct = (day.followUp / maxVal) * 100;
        const isToday = i === 6;
        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col-reverse h-12 relative group">
              {day.hasReport ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(pct, 8)}%` }}
                  transition={{ duration: 0.8, delay: i * 0.06 }}
                  className={cn(
                    'w-full rounded-t-sm',
                    isToday ? 'bg-indigo-600' : 'bg-indigo-200'
                  )}
                />
              ) : (
                <div className="w-full h-1 rounded bg-slate-100 self-end" />
              )}
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-800 text-white text-[9px] font-bold px-1.5 py-1 rounded whitespace-nowrap z-10">
                {day.followUp} leads
              </div>
            </div>
            <span className={cn('text-[9px] font-semibold', isToday ? 'text-indigo-600' : 'text-slate-400')}>
              {day.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function StaffMonitorCard({ staff, reports, index }) {
  const [showDetail, setShowDetail] = useState(false);
  const students = useStore(state => state.students);
  const leadsRecap = useStore(state => state.leadsRecap);

  const totalFollowUp = reports.reduce((s, r) => s + (r.leads_followed_up || 0), 0);
  const totalResponded = reports.reduce((s, r) => s + (r.leads_responded || 0), 0);
  const totalConverted = reports.reduce((s, r) => s + (r.leads_converted || 0), 0);
  const reportCount = reports.length;

  const responseRate = totalFollowUp > 0 ? (totalResponded / totalFollowUp) * 100 : 0;
  const conversionRate = totalFollowUp > 0 ? (totalConverted / totalFollowUp) * 100 : 0;
  const convFromResponse = totalResponded > 0 ? (totalConverted / totalResponded) * 100 : 0;

  const sortedReports = [...reports].sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
  const lastReport = sortedReports[0] || null;

  // Hari aktif unik
  const activeDays = new Set(reports.map(r => r.report_date)).size;

  // Rata-rata per hari
  const avgFollowUpPerDay = activeDays > 0 ? (totalFollowUp / activeDays) : 0;

  // Streak
  const streak = calcStreak(reports);

  // Breakdown metode
  const methodBreakdown = calcMethodBreakdown(reports);

  // Tren 7 hari
  const last7Days = getLast7Days(reports);
  const thisWeekTotal = last7Days.slice(3).reduce((s, d) => s + d.followUp, 0);
  const lastWeekTotal = last7Days.slice(0, 3).reduce((s, d) => s + d.followUp, 0);
  const trendUp = thisWeekTotal >= lastWeekTotal;

  const suggestions = generateSuggestions({ totalFollowUp, totalResponded, totalConverted, reportCount, streak });

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=e0e7ff&color=4338ca&bold=true&size=80`;

  // Skor performa 0–100
  const perfScore = Math.min(
    Math.round((responseRate * 0.4) + (conversionRate * 0.4) + (Math.min(avgFollowUpPerDay / 20, 1) * 20)),
    100
  );
  const perfColor = perfScore >= 70 ? 'text-emerald-600' : perfScore >= 40 ? 'text-amber-600' : 'text-red-600';
  const perfBg = perfScore >= 70 ? 'bg-emerald-50' : perfScore >= 40 ? 'bg-amber-50' : 'bg-red-50';
  const perfLabel = perfScore >= 70 ? 'Performa Baik' : perfScore >= 40 ? 'Performa Sedang' : 'Perlu Peningkatan';

  // ── Target & pencapaian bulan berjalan ─────────────────────────────
  const monthlyTarget = getMonthlyTarget(staff.name);
  const currentMonthConversions = calcCurrentMonthConversions(students, leadsRecap, staff.name);
  const achievementPct = Math.min((currentMonthConversions / monthlyTarget) * 100, 100);
  const isAchieved = currentMonthConversions >= monthlyTarget;
  const now = new Date();
  const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* ── Header ────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={avatarUrl} alt={staff.name} className="w-14 h-14 rounded-xl border-2 border-white/30 shadow-lg" />
            {streak >= 3 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center shadow">
                <Flame className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight truncate">{staff.name}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-indigo-200 text-xs">Marketing Staff</span>
              {streak > 0 && (
                <span className="text-[10px] font-bold bg-amber-400/20 text-amber-200 px-1.5 py-0.5 rounded-full border border-amber-300/30">
                  🔥 {streak} hari streak
                </span>
              )}
            </div>
            {lastReport && (
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-indigo-300" />
                <span className="text-xs text-indigo-200">
                  Laporan terakhir: {new Date(lastReport.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          {/* Skor Performa */}
          <div className={cn('flex flex-col items-center px-3 py-2 rounded-xl', perfBg)}>
            <span className={cn('text-2xl font-black', perfColor)}>{perfScore}</span>
            <span className={cn('text-[10px] font-bold', perfColor)}>SKOR</span>
          </div>
        </div>
        {/* Perf label */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-indigo-100 font-medium">{perfLabel}</span>
          <div className="flex items-center gap-1.5">
            {trendUp ? <TrendingUp className="w-3.5 h-3.5 text-emerald-300" /> : <TrendingDown className="w-3.5 h-3.5 text-red-300" />}
            <span className={cn('text-xs font-bold', trendUp ? 'text-emerald-300' : 'text-red-300')}>
              {trendUp ? 'Tren Naik' : 'Tren Turun'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Target Pencapaian Bulan Berjalan ─────────── */}
      <div className={cn(
        'mx-4 mt-4 mb-2 rounded-2xl border p-3.5',
        isAchieved
          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
          : achievementPct >= 66
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
            : 'bg-gradient-to-r from-slate-50 to-indigo-50/30 border-slate-200'
      )}>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-lg flex items-center justify-center',
              isAchieved ? 'bg-emerald-500' : 'bg-indigo-500'
            )}>
              {isAchieved
                ? <Trophy className="w-3.5 h-3.5 text-white" />
                : <Star className="w-3.5 h-3.5 text-white" />}
            </div>
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-wider',
              isAchieved ? 'text-emerald-700' : 'text-slate-500'
            )}>
              Target Pencapaian — {monthName}
            </span>
          </div>
          <span className={cn(
            'text-[10px] font-black px-2 py-0.5 rounded-full',
            isAchieved
              ? 'bg-emerald-500 text-white'
              : achievementPct >= 66
                ? 'bg-amber-400 text-white'
                : 'bg-slate-200 text-slate-600'
          )}>
            {isAchieved ? '✅ TERCAPAI' : `${Math.round(achievementPct)}%`}
          </span>
        </div>

        {/* Angka pencapaian */}
        <div className="flex items-end justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className={cn(
              'text-3xl font-black leading-none',
              isAchieved ? 'text-emerald-600'
                : achievementPct >= 66 ? 'text-amber-600'
                : 'text-indigo-700'
            )}>
              {currentMonthConversions}
            </span>
            <span className="text-sm font-bold text-slate-400">/ {monthlyTarget}</span>
            <span className="text-xs text-slate-400 ml-0.5">konversi</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Sisa</p>
            <p className={cn(
              'text-sm font-black',
              isAchieved ? 'text-emerald-600' : 'text-slate-700'
            )}>
              {isAchieved ? '🎉 Done!' : `${monthlyTarget - currentMonthConversions} lagi`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2.5 bg-white/70 rounded-full overflow-hidden border border-white/50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${achievementPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.08 + 0.3 }}
            className={cn(
              'h-full rounded-full',
              isAchieved
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
                : achievementPct >= 66
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500'
                  : 'bg-gradient-to-r from-indigo-400 to-violet-500'
            )}
          />
        </div>
      </div>

      {/* ── Stats Grid Utama ──────────────────────────── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Follow-up', value: totalFollowUp, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Merespon', value: totalResponded, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Konversi', value: totalConverted, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Laporan', value: reportCount, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-3 text-center">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1', bg)}>
              <Icon className={cn('w-3.5 h-3.5', color)} />
            </div>
            <div className="text-xl font-black text-slate-900">{value}</div>
            <div className="text-[10px] text-slate-400 font-medium leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Stat Tambahan ─────────────────────────────── */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
        <div className="px-3 py-2.5 text-center">
          <p className="text-xs text-slate-400">Hari Aktif</p>
          <p className="text-base font-black text-slate-700">{activeDays}<span className="text-xs font-medium text-slate-400 ml-0.5">hari</span></p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-xs text-slate-400">Rata-rata/hari</p>
          <p className="text-base font-black text-slate-700">{avgFollowUpPerDay.toFixed(1)}<span className="text-xs font-medium text-slate-400 ml-0.5">leads</span></p>
        </div>
        <div className="px-3 py-2.5 text-center">
          <p className="text-xs text-slate-400">Resp. Rate</p>
          <p className={cn('text-base font-black', responseRate >= 40 ? 'text-emerald-600' : responseRate >= 20 ? 'text-amber-600' : 'text-red-600')}>
            {responseRate.toFixed(0)}<span className="text-xs font-medium">%</span>
          </p>
        </div>
      </div>

      {/* ── Rate Bars ─────────────────────────────────── */}
      <div className="p-4 space-y-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-2">
          <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Analisis Persentase</span>
        </div>
        <RateBar label="Response Rate" value={responseRate} color="bg-emerald-500" />
        <RateBar label="Conversion Rate (dari follow-up)" value={conversionRate} color="bg-indigo-500" />
        <RateBar label="Closing Rate (dari yang merespon)" value={convFromResponse} color="bg-violet-500" />
      </div>

      {/* ── Tren 7 Hari ───────────────────────────────── */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tren 7 Hari Terakhir</span>
          </div>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', trendUp ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
            {trendUp ? '↑ Naik' : '↓ Turun'}
          </span>
        </div>
        <MiniTrendChart days={last7Days} />
      </div>

      {/* ── Breakdown Metode Follow Up ────────────────── */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Breakdown Metode Follow Up</span>
        </div>
        <div className="space-y-2">
          {/* Broadcast */}
          {methodBreakdown.broadcast.count > 0 && (
            <div className="flex items-center gap-2 p-2 bg-sky-50 rounded-lg border border-sky-100">
              <Radio className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span className="text-xs text-sky-700 font-medium flex-1">Broadcast</span>
              <span className="text-xs font-bold text-sky-800">{methodBreakdown.broadcast.sent} dikirim</span>
              <span className="text-[10px] text-sky-500 mx-1">→</span>
              <span className="text-xs font-bold text-emerald-700">{methodBreakdown.broadcast.responded} respon</span>
            </div>
          )}
          {/* Telepon */}
          {methodBreakdown.telepon.count > 0 && (
            <div className="flex items-center gap-2 p-2 bg-violet-50 rounded-lg border border-violet-100">
              <Phone className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
              <span className="text-xs text-violet-700 font-medium flex-1">Telepon</span>
              <span className="text-xs font-bold text-violet-800">{methodBreakdown.telepon.called} ditelepon</span>
              <span className="text-[10px] text-violet-500 mx-1">→</span>
              <span className="text-xs font-bold text-emerald-700">{methodBreakdown.telepon.responded} respon</span>
            </div>
          )}
          {/* WhatsApp */}
          {methodBreakdown.whatsapp.count > 0 && (
            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-xs text-emerald-700 font-medium flex-1">WhatsApp</span>
              <span className="text-xs font-bold text-emerald-800">{methodBreakdown.whatsapp.contacted} dihubungi</span>
              <span className="text-[10px] text-emerald-500 mx-1">→</span>
              <span className="text-xs font-bold text-emerald-700">{methodBreakdown.whatsapp.responded} respon</span>
            </div>
          )}
          {/* Bertemu */}
          {methodBreakdown.bertemu.count > 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
              <Users2 className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="text-xs text-amber-700 font-medium flex-1">Bertemu Langsung</span>
              <span className="text-xs font-bold text-amber-800">{methodBreakdown.bertemu.meetings} pertemuan</span>
            </div>
          )}
          {/* Jika belum ada data metode baru */}
          {methodBreakdown.broadcast.count === 0 && methodBreakdown.telepon.count === 0 &&
           methodBreakdown.whatsapp.count === 0 && methodBreakdown.bertemu.count === 0 && (
            <p className="text-xs text-slate-400 text-center py-1">Belum ada data metode follow up terbaru</p>
          )}
        </div>
      </div>

      {/* ── Aktivitas & Rencana Terkini ───────────────── */}
      {lastReport && (
        <div className="p-4 border-b border-slate-100">
          <button
            onClick={() => setShowDetail(v => !v)}
            className="w-full flex items-center justify-between mb-2 group"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Laporan Terakhir</span>
              <span className="text-[10px] text-slate-400">
                {new Date(lastReport.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </span>
            </div>
            {showDetail
              ? <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              : <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />}
          </button>
          <AnimatePresence>
            {showDetail && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {lastReport.obstacles && (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-1 mb-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Aktivitas Hari Ini</p>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">{lastReport.obstacles}</p>
                  </div>
                )}
                {lastReport.follow_up_actions && (
                  <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-3 h-3 text-amber-600" />
                      <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">Tindakan Lanjutan</p>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">{lastReport.follow_up_actions}</p>
                  </div>
                )}
                {lastReport.next_day_plan && (
                  <div className="p-2.5 bg-sky-50 rounded-xl border border-sky-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Sunrise className="w-3 h-3 text-sky-600" />
                      <p className="text-[10px] font-bold text-sky-700 uppercase tracking-wide">Rencana Hari Berikutnya</p>
                    </div>
                    <p className="text-xs text-sky-800 leading-relaxed">{lastReport.next_day_plan}</p>
                  </div>
                )}
                {lastReport.response_notes && (
                  <div className="p-2.5 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Target className="w-3 h-3 text-indigo-600" />
                      <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Metode Follow Up</p>
                    </div>
                    <p className="text-xs text-indigo-800 leading-relaxed whitespace-pre-line">{lastReport.response_notes}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Evaluasi & Saran ──────────────────────────── */}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluasi Otomatis</span>
        </div>
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2 p-2.5 rounded-xl border text-xs font-medium leading-relaxed',
              suggestionColors[s.type]
            )}
          >
            <span className="flex-shrink-0 mt-0.5">{suggestionIcons[s.type]}</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
