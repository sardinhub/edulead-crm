import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, UserCheck, CalendarDays, Users, MessageCircle,
  CheckCircle2, FileText, Zap, AlertTriangle, Sunrise,
  UserPlus, Loader2, CheckCheck, ChevronDown, Search, Check
} from 'lucide-react';
import { useStore } from '../store/useStore';
// Removed AddStaffModal import in favor of unified User Management

const today = () => new Date().toISOString().split('T')[0];

const formFields = [
  {
    id: 'leads_followed_up',
    label: 'Jumlah Leads Difollow-up',
    type: 'number',
    placeholder: '0',
    icon: Users,
    color: 'indigo',
    hint: 'Total leads yang dihubungi hari ini',
  },
  {
    id: 'leads_responded',
    label: 'Leads Merespon (Prioritas Sedang & Tinggi)',
    type: 'number',
    placeholder: '0',
    icon: MessageCircle,
    color: 'emerald',
    hint: 'Leads yang memberikan respon positif',
  },
  {
    id: 'leads_converted',
    label: 'Leads Terkonversi (Pendaftaran → Pangkal)',
    type: 'number',
    placeholder: '0',
    icon: CheckCircle2,
    color: 'violet',
    hint: 'Leads yang berhasil masuk ke tahap Pangkal',
  },
];

const textFields = [
  {
    id: 'response_notes',
    label: 'Catatan Respon dari Leads Responsif',
    icon: FileText,
    color: 'sky',
    placeholder: 'Tuliskan tanggapan/respon menarik dari leads yang responsif hari ini...',
    rows: 3,
  },
  {
    id: 'follow_up_actions',
    label: 'Tindakan Lanjutan',
    icon: Zap,
    color: 'amber',
    placeholder: 'Apa tindakan konkret yang akan dilakukan sebagai follow-up berikutnya?',
    rows: 3,
  },
  {
    id: 'obstacles',
    label: 'Hambatan',
    icon: AlertTriangle,
    color: 'red',
    placeholder: 'Kendala apa yang dihadapi hari ini dalam proses follow-up?',
    rows: 2,
  },
  {
    id: 'next_day_plan',
    label: 'Rencana Aktivitas Hari Selanjutnya',
    icon: Sunrise,
    color: 'orange',
    placeholder: 'Apa yang akan dilakukan besok? Target leads mana yang diprioritaskan?',
    rows: 3,
  },
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'focus:border-indigo-500 focus:ring-indigo-500/20', label: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'focus:border-emerald-500 focus:ring-emerald-500/20', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'focus:border-violet-500 focus:ring-violet-500/20', label: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'focus:border-sky-500 focus:ring-sky-500/20', label: 'text-sky-700', badge: 'bg-sky-100 text-sky-700' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'focus:border-amber-500 focus:ring-amber-500/20', label: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'focus:border-red-500 focus:ring-red-500/20', label: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'focus:border-orange-500 focus:ring-orange-500/20', label: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
};

const KONVERSI_OPTIONS = [
  { id: 'Pendaftaran',   label: 'Pendaftaran',    color: 'indigo' },
  { id: 'DP Pangkal',    label: 'DP Pangkal',     color: 'amber' },
  { id: 'Pangkal Lunas', label: 'Pangkal Lunas',  color: 'emerald' },
  { id: 'Biaya Seragam', label: 'Biaya Seragam',  color: 'violet' },
  { id: 'Biaya Asrama',  label: 'Biaya Asrama',   color: 'sky' },
];

const KONVERSI_COLORS = {
  indigo:  { chip: 'bg-indigo-100 text-indigo-700 ring-indigo-200',  check: 'bg-indigo-600 border-indigo-600', unchecked: 'border-slate-300 hover:border-indigo-400' },
  amber:   { chip: 'bg-amber-100 text-amber-700 ring-amber-200',    check: 'bg-amber-500 border-amber-500',   unchecked: 'border-slate-300 hover:border-amber-400' },
  emerald: { chip: 'bg-emerald-100 text-emerald-700 ring-emerald-200', check: 'bg-emerald-600 border-emerald-600', unchecked: 'border-slate-300 hover:border-emerald-400' },
  violet:  { chip: 'bg-violet-100 text-violet-700 ring-violet-200', check: 'bg-violet-600 border-violet-600', unchecked: 'border-slate-300 hover:border-violet-400' },
  sky:     { chip: 'bg-sky-100 text-sky-700 ring-sky-200',          check: 'bg-sky-600 border-sky-600',       unchecked: 'border-slate-300 hover:border-sky-400' },
};

const initialForm = {
  staff_id: '',
  staff_name: '',
  report_date: today(),
  leads_followed_up: '',
  leads_responded: '',
  leads_converted: '',
  responded_leads_details: [], // Array of { name, phone, school, konversi: [], note }
  response_notes: '',
  follow_up_actions: '',
  obstacles: '',
  next_day_plan: '',
};

export default function ActivityForm() {
  const {
    user,
    marketingStaff, fetchMarketingStaff,
    students, fetchStudents,
    submitActivityReport, isMarketingLoading
  } = useStore();

  const isManager = user?.role === 'Manager';
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMarketingStaff();
    fetchStudents();
  }, [fetchMarketingStaff]);

  // Untuk non-Manager: otomatis isi staff dari akun yang login
  useEffect(() => {
    if (!isManager && user?.name && marketingStaff.length > 0) {
      const match = marketingStaff.find(
        s => s.name.toLowerCase() === user?.name?.toLowerCase() && s.is_active
      );
      if (match) {
        setForm(f => ({ ...f, staff_id: match.id, staff_name: match.name }));
      }
    }
  }, [isManager, user, marketingStaff]);

  const validate = () => {
    const e = {};
    if (!form.staff_id) e.staff_id = 'Pilih nama staff terlebih dahulu';
    if (!form.report_date) e.report_date = 'Tanggal laporan wajib diisi';
    if (form.leads_followed_up === '' || Number(form.leads_followed_up) < 0) e.leads_followed_up = 'Wajib diisi (min 0)';
    if (form.leads_responded === '' || Number(form.leads_responded) < 0) e.leads_responded = 'Wajib diisi (min 0)';
    if (form.leads_converted === '' || Number(form.leads_converted) < 0) e.leads_converted = 'Wajib diisi (min 0)';
    if (Number(form.leads_responded) > Number(form.leads_followed_up)) e.leads_responded = 'Tidak boleh melebihi jumlah follow-up';
    if (Number(form.leads_converted) > Number(form.leads_responded)) e.leads_converted = 'Tidak boleh melebihi jumlah yang merespon';

    // Validasi Detail Leads Respon
    if (form.responded_leads_details && form.responded_leads_details.length > 0) {
      const anyEmpty = form.responded_leads_details.some(l => !l.name || !l.phone || !l.school);
      if (anyEmpty) e.general = 'Mohon lengkapi seluruh kolom Nama, HP, dan Sekolah pada detail leads yang merespon.';
    }

    return e;
  };

  const handleStaffChange = (e) => {
    const selectedId = e.target.value;
    const selectedStaff = marketingStaff.find(s => s.id === selectedId);
    setForm(f => ({
      ...f,
      staff_id: selectedId,
      staff_name: selectedStaff ? selectedStaff.name : '',
    }));
    setErrors(e2 => ({ ...e2, staff_id: undefined }));
  };

  const handleChange = (field, value) => {
    setForm(f => {
      const newForm = { ...f, [field]: value };
      
      // Auto-sync leads detail rows
      if (field === 'leads_responded') {
        const count = Math.max(0, parseInt(value) || 0);
        const currentDetails = [...(f.responded_leads_details || [])];
        
        if (count > currentDetails.length) {
          // Add rows
          for (let i = currentDetails.length; i < count; i++) {
            currentDetails.push({ name: '', phone: '', school: '', konversi: [], note: '' });
          }
        } else if (count < currentDetails.length) {
          // Remove rows
          currentDetails.splice(count);
        }
        newForm.responded_leads_details = currentDetails;
      }
      
      return newForm;
    });
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const handleLeadDetailChange = (index, field, value) => {
    setForm(f => {
      const newDetails = [...f.responded_leads_details];
      newDetails[index] = { ...newDetails[index], [field]: value };
      return { ...f, responded_leads_details: newDetails };
    });
  };

  // Pilih siswa dari autocomplete → auto-fill phone & school
  const handleSelectStudent = (index, student) => {
    setForm(f => {
      const newDetails = [...f.responded_leads_details];
      newDetails[index] = {
        ...newDetails[index],
        name: student.nama,
        phone: student.telepon || '',
        school: student.asal_sekolah || '',
      };
      return { ...f, responded_leads_details: newDetails };
    });
  };

  // Toggle checklist konversi
  const handleToggleKonversi = (index, optionId) => {
    setForm(f => {
      const newDetails = [...f.responded_leads_details];
      const current = newDetails[index].konversi || [];
      const updated = current.includes(optionId)
        ? current.filter(k => k !== optionId)
        : [...current, optionId];
      newDetails[index] = { ...newDetails[index], konversi: updated };
      return { ...f, responded_leads_details: newDetails };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    const payload = {
      ...form,
      leads_followed_up: Number(form.leads_followed_up) || 0,
      leads_responded: Number(form.leads_responded) || 0,
      leads_converted: Number(form.leads_converted) || 0,
    };
    const result = await submitActivityReport(payload);
    if (result.success) {
      setSubmitted(true);
      // Untuk Manager: pertahankan pilihan staff; untuk Staff: tetap nama sendiri
      setForm(f => ({
        ...initialForm,
        staff_id: f.staff_id,
        staff_name: f.staff_name,
      }));
      setTimeout(() => setSubmitted(false), 4000);
    } else {
      setErrors({ general: result.error || 'Gagal menyimpan laporan' });
    }
  };

  const responseRate = form.leads_followed_up > 0
    ? ((Number(form.leads_responded) / Number(form.leads_followed_up)) * 100).toFixed(1)
    : '—';
  const conversionRate = form.leads_followed_up > 0
    ? ((Number(form.leads_converted) / Number(form.leads_followed_up)) * 100).toFixed(1)
    : '—';

  return (
    <div className="p-6 md:p-8">
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Input Laporan Harian</h1>
            <p className="text-slate-500 text-sm">Rekam aktivitas follow-up tim marketing hari ini</p>
          </div>
        </div>
      </motion.div>

      {/* Success Toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-800">Laporan berhasil disimpan!</p>
              <p className="text-sm text-emerald-600">Data aktivitas telah tercatat ke database.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column — Identity */}
          <div className="lg:col-span-1 space-y-6">

            {/* Staff Selector Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-semibold text-slate-700">Identitas Staf</span>
                </div>
                {!isManager && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-wider">
                    Auto-Locked
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Staff — locked display untuk non-Manager, dropdown untuk Manager */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Staff <span className="text-red-500">*</span>
                  </label>

                  {isManager ? (
                    /* Manager: dropdown semua staff aktif */
                    <div className="relative">
                      <select
                        id="staff_select"
                        value={form.staff_id}
                        onChange={handleStaffChange}
                        className="w-full appearance-none pl-4 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      >
                        <option value="">-- Pilih Staf --</option>
                        {marketingStaff.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    /* Staff: tampilan nama terkunci, tidak bisa diubah */
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-indigo-200 bg-indigo-50">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(form.staff_name || user?.name || '')}&background=e0e7ff&color=4338ca&bold=true`}
                        alt="avatar"
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-indigo-900 truncate">
                          {form.staff_name || user?.name || '—'}
                        </p>
                        <p className="text-xs text-indigo-500">Akun yang sedang login</p>
                      </div>
                      <UserCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    </div>
                  )}

                  {errors.staff_id && <p className="mt-1 text-xs text-red-600">⚠ {errors.staff_id}</p>}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Tanggal Laporan <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={form.report_date}
                    onChange={e => handleChange('report_date', e.target.value)}
                    max={today()}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  {errors.report_date && <p className="mt-1 text-xs text-red-600">⚠ {errors.report_date}</p>}
                </div>
              </div>

              {/* Live Rate Preview */}
              {form.leads_followed_up > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-5 pt-4 border-t border-slate-100 space-y-3"
                >
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Preview Persentase</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Response Rate</span>
                    <span className="text-sm font-bold text-emerald-600">{responseRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">Conversion Rate</span>
                    <span className="text-sm font-bold text-violet-600">{conversionRate}%</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Number Fields */}
            {formFields.map((field, idx) => {
              const colors = colorMap[field.color];
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.05 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <label htmlFor={field.id} className="text-sm font-semibold text-slate-700">
                      {field.label} <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <input
                    id={field.id}
                    type="number"
                    min="0"
                    value={form[field.id]}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-2xl font-bold focus:outline-none focus:ring-2 transition-all ${colors.border}`}
                  />
                  <p className="text-xs text-slate-400 mt-1.5">{field.hint}</p>
                  {errors[field.id] && <p className="mt-1 text-xs text-red-600">⚠ {errors[field.id]}</p>}
                </motion.div>
              );
            })}

            {/* Dynamic Responsive Leads Details Section */}
            <AnimatePresence>
              {(form.responded_leads_details || []).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="space-y-4 pt-6 border-t-2 border-indigo-100/50"
                >
                   <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                        <UserPlus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">DATA DETAIL LEADS RESPONSIVE</h3>
                        <p className="text-[10px] text-indigo-500 font-medium tracking-wide">WAJIB DIISI UNTUK TIAP LEAD YANG MERESPON</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                      {form.responded_leads_details.length} Data Siswa
                    </span>
                  </div>

                  {form.responded_leads_details.map((lead, idx) => {
                    // Filter suggestions siswa berdasarkan ketikan
                    const suggestions = lead.name && lead.name.length >= 2
                      ? students.filter(s =>
                          s.nama?.toLowerCase().includes(lead.name.toLowerCase()) ||
                          s.telepon?.includes(lead.name)
                        ).slice(0, 6)
                      : [];
                    const selectedKonversi = lead.konversi || [];

                    return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                      <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-black text-emerald-600 uppercase">Leads Responsif #{idx + 1}</span>
                        {selectedKonversi.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {selectedKonversi.map(k => {
                              const opt = KONVERSI_OPTIONS.find(o => o.id === k);
                              if (!opt) return null;
                              const c = KONVERSI_COLORS[opt.color];
                              return (
                                <span key={k} className={`px-2 py-0.5 rounded-full text-[9px] font-bold ring-1 ${c.chip}`}>
                                  {opt.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        {/* ── Nama Siswa (Autocomplete) ── */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                            Nama Siswa <span className="text-slate-300 normal-case font-normal">(ketik untuk cari dari database)</span>
                          </label>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 text-slate-300 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={lead.name}
                              onChange={e => handleLeadDetailChange(idx, 'name', e.target.value)}
                              placeholder="Ketik nama atau HP untuk mencari..."
                              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                            {/* Dropdown suggestions */}
                            {suggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                {suggestions.map(s => (
                                  <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => handleSelectStudent(idx, s)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-slate-50 last:border-0"
                                  >
                                    <p className="font-bold text-slate-800 text-sm">{s.nama}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-emerald-600 font-medium">{s.telepon}</span>
                                      <span className="text-[10px] text-slate-400">·</span>
                                      <span className="text-[10px] text-slate-400">{s.asal_sekolah}</span>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── No. HP & Sekolah (Auto-fill) ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                              No. HP / WA
                              {lead.phone && <span className="ml-1 text-emerald-500 font-normal normal-case">✓ terisi otomatis</span>}
                            </label>
                            <input
                              type="tel"
                              value={lead.phone}
                              onChange={e => handleLeadDetailChange(idx, 'phone', e.target.value)}
                              placeholder="08... (otomatis terisi)"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">
                              Asal Sekolah
                              {lead.school && <span className="ml-1 text-emerald-500 font-normal normal-case">✓ terisi otomatis</span>}
                            </label>
                            <input
                              type="text"
                              value={lead.school}
                              onChange={e => handleLeadDetailChange(idx, 'school', e.target.value)}
                              placeholder="SMA N 1... (otomatis terisi)"
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                            />
                          </div>
                        </div>

                        {/* ── Status Konversi (Checklist) ── */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">
                            Status Konversi <span className="text-slate-300 normal-case font-normal">(centang yang sesuai)</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {KONVERSI_OPTIONS.map(opt => {
                              const isChecked = selectedKonversi.includes(opt.id);
                              const c = KONVERSI_COLORS[opt.color];
                              return (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => handleToggleKonversi(idx, opt.id)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                                    isChecked
                                      ? `${c.chip} ring-1 ${c.check} border-current shadow-sm`
                                      : `bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50`
                                  }`}
                                >
                                  <span className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isChecked ? c.check : 'border-slate-300'
                                  }`}>
                                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                                  </span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                          {selectedKonversi.length === 0 && (
                            <p className="text-[10px] text-slate-300 italic mt-1.5 ml-1">Belum ada status yang dipilih</p>
                          )}
                        </div>

                        {/* ── Keterangan Tambahan ── */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Keterangan Tambahan <span className="text-slate-300 font-normal normal-case">(opsional)</span></label>
                          <textarea
                            rows={2}
                            value={lead.note}
                            onChange={e => handleLeadDetailChange(idx, 'note', e.target.value)}
                            placeholder="Tulis singkat hasil komunikasi, janji, atau catatan lainnya..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Right Column — Text Fields */}
          <div className="lg:col-span-2 space-y-5">
            {textFields.map((field, idx) => {
              const colors = colorMap[field.color];
              const Icon = field.icon;
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div>
                      <label htmlFor={field.id} className="block text-sm font-semibold text-slate-800">
                        {field.label}
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">Opsional — semakin detail semakin baik</p>
                    </div>
                  </div>
                  <textarea
                    id={field.id}
                    rows={field.rows}
                    value={form[field.id]}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${colors.border}`}
                  />
                </motion.div>
              );
            })}

            {/* Error General */}
            {errors.general && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700">
                ⚠️ {errors.general}
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isMarketingLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-base shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {isMarketingLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Menyimpan Laporan...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Simpan Laporan Aktivitas
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </div>
  );
}
