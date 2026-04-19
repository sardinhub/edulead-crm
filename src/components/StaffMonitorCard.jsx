import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, MessageSquare, CheckCircle2, Lightbulb, Calendar, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

/** Hitung saran evaluasi otomatis berdasarkan metrik */
function generateSuggestions(stats) {
  const suggestions = [];
  const { totalFollowUp, totalResponded, totalConverted } = stats;

  const responseRate = totalFollowUp > 0 ? (totalResponded / totalFollowUp) * 100 : 0;
  const conversionRate = totalFollowUp > 0 ? (totalConverted / totalFollowUp) * 100 : 0;

  // Volume follow-up
  if (totalFollowUp === 0) {
    suggestions.push({ type: 'danger', text: 'Belum ada laporan aktivitas yang tercatat. Segera isi laporan harian.' });
    return suggestions;
  }
  if (totalFollowUp < 10) {
    suggestions.push({ type: 'warning', text: `Volume follow-up masih rendah (${totalFollowUp} leads). Target minimal 15–20 leads per hari untuk hasil optimal.` });
  }

  // Response rate
  if (responseRate < 20) {
    suggestions.push({ type: 'danger', text: `Response rate sangat rendah (${responseRate.toFixed(1)}%). Variasikan waktu follow-up (pagi/sore) dan personalisasi pesan untuk tiap leads.` });
  } else if (responseRate < 40) {
    suggestions.push({ type: 'warning', text: `Response rate sedang (${responseRate.toFixed(1)}%). Coba perkuat opening message dan tambahkan value proposition yang relevan.` });
  } else if (responseRate < 60) {
    suggestions.push({ type: 'info', text: `Response rate cukup baik (${responseRate.toFixed(1)}%). Identifikasi pola pesan yang berhasil dan replikasi ke leads lain.` });
  } else {
    suggestions.push({ type: 'success', text: `Response rate luar biasa! (${responseRate.toFixed(1)}%). Pertahankan kualitas komunikasi ini dan jadikan sebagai template standar.` });
  }

  // Conversion rate
  if (conversionRate < 10) {
    suggestions.push({ type: 'warning', text: `Conversion rate perlu ditingkatkan (${conversionRate.toFixed(1)}%). Fokus intensif pada leads yang sudah merespon positif dan percepat proses follow-up.` });
  } else if (conversionRate < 25) {
    suggestions.push({ type: 'info', text: `Conversion rate berkembang dengan baik (${conversionRate.toFixed(1)}%). Tingkatkan frekuensi follow-up pada leads prioritas tinggi.` });
  } else {
    suggestions.push({ type: 'success', text: `Conversion rate sangat tinggi (${conversionRate.toFixed(1)}%)! Strategi Anda efektif — bagikan teknik ini ke seluruh anggota tim.` });
  }

  // Gap respon vs konversi
  if (totalResponded > 0 && totalConverted / totalResponded < 0.2) {
    suggestions.push({ type: 'warning', text: 'Banyak leads yang merespon namun belum terkonversi. Tingkatkan kualitas closing dan tawarkan benefit/promo yang lebih konkret.' });
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

export default function StaffMonitorCard({ staff, reports, index }) {
  const totalFollowUp = reports.reduce((s, r) => s + (r.leads_followed_up || 0), 0);
  const totalResponded = reports.reduce((s, r) => s + (r.leads_responded || 0), 0);
  const totalConverted = reports.reduce((s, r) => s + (r.leads_converted || 0), 0);

  const responseRate = totalFollowUp > 0 ? (totalResponded / totalFollowUp) * 100 : 0;
  const conversionRate = totalFollowUp > 0 ? (totalConverted / totalFollowUp) * 100 : 0;
  const convFromResponse = totalResponded > 0 ? (totalConverted / totalResponded) * 100 : 0;

  const lastReport = reports.length > 0
    ? reports.sort((a, b) => new Date(b.report_date) - new Date(a.report_date))[0]
    : null;

  const suggestions = generateSuggestions({ totalFollowUp, totalResponded, totalConverted });

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(staff.name)}&background=e0e7ff&color=4338ca&bold=true&size=80`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-5">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={staff.name}
            className="w-14 h-14 rounded-xl border-2 border-white/30 shadow-lg"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-lg leading-tight truncate">{staff.name}</h3>
            <p className="text-indigo-200 text-xs mt-0.5">Marketing Staff</p>
            {lastReport && (
              <div className="flex items-center gap-1 mt-1.5">
                <Calendar className="w-3 h-3 text-indigo-300" />
                <span className="text-xs text-indigo-200">
                  Laporan terakhir: {new Date(lastReport.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-3xl font-black text-white">{totalFollowUp}</div>
            <div className="text-xs text-indigo-200">Total Follow-up</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { label: 'Follow-up', value: totalFollowUp, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Merespon', value: totalResponded, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Konversi', value: totalConverted, icon: CheckCircle2, color: 'text-violet-600', bg: 'bg-violet-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="p-4 text-center">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <div className="text-2xl font-black text-slate-900">{value}</div>
            <div className="text-xs text-slate-400 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Rate Bars */}
      <div className="p-5 space-y-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Analisis Persentase</span>
        </div>
        <RateBar label="Response Rate" value={responseRate} color="bg-emerald-500" />
        <RateBar label="Conversion Rate (dari follow-up)" value={conversionRate} color="bg-indigo-500" />
        <RateBar label="Conversion Rate (dari yang respon)" value={convFromResponse} color="bg-violet-500" />
      </div>

      {/* Suggestions */}
      <div className="p-5 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saran & Evaluasi</span>
        </div>
        {suggestions.map((s, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-2 p-3 rounded-xl border text-xs font-medium leading-relaxed',
              suggestionColors[s.type]
            )}
          >
            <span className="flex-shrink-0 mt-0.5">{suggestionIcons[s.type]}</span>
            <span>{s.text}</span>
          </div>
        ))}
        {reports.length > 0 && lastReport?.next_day_plan && (
          <div className="mt-3 p-3 bg-sky-50 rounded-xl border border-sky-100">
            <div className="text-xs font-semibold text-sky-700 mb-1">📅 Rencana Hari Ini:</div>
            <p className="text-xs text-sky-600 leading-relaxed">{lastReport.next_day_plan}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
