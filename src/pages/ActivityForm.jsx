import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, UserCheck, CalendarDays,
  CheckCircle2, Zap, Sunrise,
  Loader2, CheckCheck, ChevronDown,
  Radio, Phone, MessageSquare, Users2, Plus, Trash2,
  MapPin
} from 'lucide-react';
import { useStore } from '../store/useStore';

const today = () => new Date().toISOString().split('T')[0];

// ─── Metode Follow Up Config ──────────────────────────────────────────────────
const FOLLOW_UP_METHODS = [
  {
    key: 'broadcast',
    label: 'Hanya Broadcast',
    icon: Radio,
    color: 'sky',
    description: 'Kirim pesan broadcast massal',
  },
  {
    key: 'telepon',
    label: 'Telepon',
    icon: Phone,
    color: 'violet',
    description: 'Follow up via panggilan telepon',
  },
  {
    key: 'whatsapp',
    label: 'Komunikasi WhatsApp',
    icon: MessageSquare,
    color: 'emerald',
    description: 'Komunikasi personal via WhatsApp',
  },
  {
    key: 'bertemu',
    label: 'Bertemu Langsung',
    icon: Users2,
    color: 'amber',
    description: 'Pertemuan tatap muka',
  },
];

const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'focus:border-indigo-500 focus:ring-indigo-500/20', label: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700', card: 'border-indigo-200 bg-indigo-50/30', check: 'accent-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'focus:border-emerald-500 focus:ring-emerald-500/20', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700', card: 'border-emerald-200 bg-emerald-50/30', check: 'accent-emerald-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'focus:border-violet-500 focus:ring-violet-500/20', label: 'text-violet-700', badge: 'bg-violet-100 text-violet-700', card: 'border-violet-200 bg-violet-50/30', check: 'accent-violet-600' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'focus:border-sky-500 focus:ring-sky-500/20', label: 'text-sky-700', badge: 'bg-sky-100 text-sky-700', card: 'border-sky-200 bg-sky-50/30', check: 'accent-sky-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'focus:border-amber-500 focus:ring-amber-500/20', label: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', card: 'border-amber-200 bg-amber-50/30', check: 'accent-amber-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'focus:border-red-500 focus:ring-red-500/20', label: 'text-red-700', badge: 'bg-red-100 text-red-700', card: 'border-red-200 bg-red-50/30', check: 'accent-red-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'focus:border-orange-500 focus:ring-orange-500/20', label: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', card: 'border-orange-200 bg-orange-50/30', check: 'accent-orange-600' },
};

const textFields = [
  {
    id: 'follow_up_actions',
    label: 'Tindakan Lanjutan',
    icon: Zap,
    color: 'amber',
    placeholder: 'Apa tindakan konkret yang akan dilakukan sebagai follow-up berikutnya?',
    rows: 3,
    required: true,
  },
  {
    id: 'obstacles',
    label: 'Aktivitas Anda hari ini',
    icon: CheckCheck,
    color: 'emerald',
    placeholder: 'Apa saja aktivitas yang Anda lakukan hari ini?',
    rows: 2,
    required: true,
  },
  {
    id: 'next_day_plan',
    label: 'Rencana Aktivitas Hari Selanjutnya',
    icon: Sunrise,
    color: 'orange',
    placeholder: 'Apa yang akan dilakukan besok? Target leads mana yang diprioritaskan?',
    rows: 3,
    required: true,
  },
];

// Initial state untuk setiap metode
const initialMethodData = {
  broadcast: { total_sent: '', total_responded: '', content: '', respondents: [] },
  telepon: { total_called: '', total_responded: '', respondents: [] },
  whatsapp: { total_contacted: '', total_responded: '', content: '', respondents: [] },
  bertemu: {
    meetings: [{ name: '', phone: '', location: '' }],
  },
};

const initialForm = {
  staff_id: '',
  staff_name: '',
  report_date: today(),
  leads_followed_up: 0,
  leads_responded: 0,
  leads_converted: '',
  // Metode Follow Up baru
  follow_up_methods: [],       // array key: 'broadcast' | 'telepon' | 'whatsapp' | 'bertemu'
  method_data: { ...initialMethodData },
  // Text fields
  follow_up_actions: '',
  obstacles: '',
  next_day_plan: '',
};

// ─── Hitung total leads dari semua metode ────────────────────────────────────
function calcTotals(methods, methodData) {
  let totalFollowedUp = 0;
  let totalResponded = 0;

  if (methods.includes('broadcast')) {
    totalFollowedUp += parseInt(methodData.broadcast.total_sent) || 0;
    totalResponded += parseInt(methodData.broadcast.total_responded) || 0;
  }
  if (methods.includes('telepon')) {
    totalFollowedUp += parseInt(methodData.telepon.total_called) || 0;
    totalResponded += parseInt(methodData.telepon.total_responded) || 0;
  }
  if (methods.includes('whatsapp')) {
    totalFollowedUp += parseInt(methodData.whatsapp.total_contacted) || 0;
    totalResponded += parseInt(methodData.whatsapp.total_responded) || 0;
  }
  if (methods.includes('bertemu')) {
    const meetCount = (methodData.bertemu.meetings || []).filter(m => m.name || m.phone).length;
    totalFollowedUp += meetCount;
    totalResponded += meetCount; // Bertemu langsung = otomatis merespon
  }

  return { totalFollowedUp, totalResponded };
}

export default function ActivityForm() {
  const {
    user,
    marketingStaff, fetchMarketingStaff,
    students, fetchStudents,
    leadsRecap, fetchLeadsRecap,
    submitActivityReport, isMarketingLoading
  } = useStore();

  const isManager = user?.role === 'Manager';
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchMarketingStaff();
    fetchStudents();
    fetchLeadsRecap();
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

  // Recalc totals setiap kali method atau method_data berubah
  useEffect(() => {
    const { totalFollowedUp, totalResponded } = calcTotals(form.follow_up_methods, form.method_data);
    setForm(f => ({ ...f, leads_followed_up: totalFollowedUp, leads_responded: totalResponded }));
  }, [form.follow_up_methods, form.method_data]);

  const validate = () => {
    const e = {};
    if (!form.staff_id) e.staff_id = 'Pilih nama staff terlebih dahulu';
    if (!form.report_date) e.report_date = 'Tanggal laporan wajib diisi';
    if (form.follow_up_methods.length === 0) e.follow_up_methods = 'Pilih minimal satu metode follow up';
    if (form.leads_converted === '' || Number(form.leads_converted) < 0) e.leads_converted = 'Wajib diisi (min 0)';
    if (Number(form.leads_converted) > form.leads_responded) e.leads_converted = 'Tidak boleh melebihi jumlah yang merespon';

    // Validasi bertemu langsung
    if (form.follow_up_methods.includes('bertemu')) {
      const meetings = form.method_data.bertemu.meetings || [];
      const hasEmpty = meetings.some(m => !m.name || !m.phone || !m.location);
      if (hasEmpty) e.bertemu = 'Mohon lengkapi Nama, No. HP, dan Lokasi untuk setiap pertemuan.';
    }

    // Validasi broadcast, telepon, whatsapp respondents & content
    form.follow_up_methods.forEach(method => {
      if (method === 'broadcast' || method === 'whatsapp') {
        if (!form.method_data[method].content?.trim()) {
           e[`${method}_content`] = `Isi ${method === 'broadcast' ? 'Broadcast' : 'WhatsApp'} wajib diisi`;
        }
      }
      if (['broadcast', 'telepon', 'whatsapp'].includes(method)) {
        const respondents = form.method_data[method].respondents || [];
        const hasEmpty = respondents.some(r => !r.name || !r.phone || !r.school || !r.response);
        if (hasEmpty) {
          e[`${method}_respondents`] = 'Mohon lengkapi semua data responden (Nama, No HP, Sekolah, Respon).';
        }
      }
    });

    // Validasi field teks wajib
    if (!form.follow_up_actions?.trim()) e.follow_up_actions = 'Tindakan Lanjutan wajib diisi';
    if (!form.obstacles?.trim()) e.obstacles = 'Aktivitas hari ini wajib diisi';
    if (!form.next_day_plan?.trim()) e.next_day_plan = 'Rencana Aktivitas Hari Selanjutnya wajib diisi';

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
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  // Toggle checkbox metode follow up
  const handleMethodToggle = (key) => {
    setForm(f => {
      const current = f.follow_up_methods;
      const newMethods = current.includes(key)
        ? current.filter(m => m !== key)
        : [...current, key];
      return { ...f, follow_up_methods: newMethods };
    });
    setErrors(e => ({ ...e, follow_up_methods: undefined, [key]: undefined }));
  };

  // Update data numerik untuk metode broadcast/telepon/whatsapp
  const handleMethodDataChange = (methodKey, field, value) => {
    setForm(f => {
      const newMethodData = {
        ...f.method_data,
        [methodKey]: {
          ...f.method_data[methodKey],
          [field]: value,
        },
      };

      if (field === 'total_responded') {
        const count = parseInt(value, 10) || 0;
        const currentRespondents = newMethodData[methodKey].respondents || [];
        const newRespondents = [...currentRespondents];
        
        if (count > newRespondents.length) {
          for (let i = newRespondents.length; i < count; i++) {
            newRespondents.push({ name: '', phone: '', school: '', response: '' });
          }
        } else if (count < newRespondents.length) {
          newRespondents.length = count;
        }
        
        newMethodData[methodKey].respondents = newRespondents;
      }

      return {
        ...f,
        method_data: newMethodData,
      };
    });
  };

  const handleRespondentChange = (methodKey, idx, field, value) => {
    setForm(f => {
      const respondents = [...f.method_data[methodKey].respondents];
      respondents[idx] = { ...respondents[idx], [field]: value };
      return {
        ...f,
        method_data: {
          ...f.method_data,
          [methodKey]: { ...f.method_data[methodKey], respondents },
        },
      };
    });
  };

  // Update data pertemuan langsung
  const handleMeetingChange = (idx, field, value) => {
    setForm(f => {
      const meetings = [...f.method_data.bertemu.meetings];
      meetings[idx] = { ...meetings[idx], [field]: value };
      return {
        ...f,
        method_data: {
          ...f.method_data,
          bertemu: { ...f.method_data.bertemu, meetings },
        },
      };
    });
  };

  const addMeeting = () => {
    setForm(f => ({
      ...f,
      method_data: {
        ...f.method_data,
        bertemu: {
          meetings: [...f.method_data.bertemu.meetings, { name: '', phone: '', location: '' }],
        },
      },
    }));
  };

  const removeMeeting = (idx) => {
    setForm(f => {
      const meetings = f.method_data.bertemu.meetings.filter((_, i) => i !== idx);
      return {
        ...f,
        method_data: {
          ...f.method_data,
          bertemu: { meetings: meetings.length > 0 ? meetings : [{ name: '', phone: '', location: '' }] },
        },
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    // Bangun response_notes dari data metode (untuk backward compat kolom DB)
    const methodSummary = buildMethodSummary(form.follow_up_methods, form.method_data);

    const payload = {
      staff_id: form.staff_id,
      staff_name: form.staff_name,
      report_date: form.report_date,
      leads_followed_up: form.leads_followed_up,
      leads_responded: form.leads_responded,
      leads_converted: Number(form.leads_converted) || 0,
      responded_leads_details: buildRespondedLeadsDetails(form.follow_up_methods, form.method_data),
      response_notes: methodSummary,
      follow_up_actions: form.follow_up_actions || null,
      obstacles: form.obstacles || null,
      next_day_plan: form.next_day_plan || null,
    };

    const result = await submitActivityReport(payload);
    if (result.success) {
      setSubmitted(true);
      setForm(f => ({
        ...initialForm,
        staff_id: f.staff_id,
        staff_name: f.staff_name,
        method_data: { ...initialMethodData },
      }));
      setTimeout(() => setSubmitted(false), 4000);
    } else {
      setErrors({ general: result.error || 'Gagal menyimpan laporan' });
    }
  };

  // Build summary teks dari metode (untuk kolom response_notes DB lama)
  function buildMethodSummary(methods, methodData) {
    const parts = [];
    if (methods.includes('broadcast')) {
      parts.push(`[Broadcast] Terkirim: ${methodData.broadcast.total_sent || 0}, Merespon: ${methodData.broadcast.total_responded || 0}\nIsi Broadcast: ${methodData.broadcast.content || '-'}`);
    }
    if (methods.includes('telepon')) {
      parts.push(`[Telepon] Ditelepon: ${methodData.telepon.total_called || 0}, Merespon: ${methodData.telepon.total_responded || 0}`);
    }
    if (methods.includes('whatsapp')) {
      parts.push(`[WhatsApp] Dihubungi: ${methodData.whatsapp.total_contacted || 0}, Merespon: ${methodData.whatsapp.total_responded || 0}\nIsi WhatsApp: ${methodData.whatsapp.content || '-'}`);
    }
    if (methods.includes('bertemu')) {
      const meetings = methodData.bertemu.meetings || [];
      const names = meetings.filter(m => m.name).map(m => `${m.name} (${m.location})`).join(', ');
      parts.push(`[Bertemu Langsung] ${names}`);
    }
    return parts.join('\n');
  }

  // Build responded_leads_details dari meetings (untuk backward compat)
  function buildRespondedLeadsDetails(methods, methodData) {
    const details = [];
    if (methods.includes('bertemu')) {
      (methodData.bertemu.meetings || []).forEach(m => {
        if (m.name) details.push({ name: m.name, phone: m.phone, school: m.location, konversi: [], note: '' });
      });
    }
    ['broadcast', 'telepon', 'whatsapp'].forEach(method => {
      if (methods.includes(method)) {
        (methodData[method].respondents || []).forEach(r => {
          if (r.name) details.push({ name: r.name, phone: r.phone, school: r.school, konversi: [], note: r.response });
        });
      }
    });
    return details;
  }

  const responseRate = form.leads_followed_up > 0
    ? ((form.leads_responded / form.leads_followed_up) * 100).toFixed(1)
    : '—';
  const conversionRate = form.leads_followed_up > 0
    ? ((Number(form.leads_converted) / form.leads_followed_up) * 100).toFixed(1)
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

          {/* ── Left Column ── */}
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Nama Staff <span className="text-red-500">*</span>
                  </label>

                  {isManager ? (
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

            {/* Leads Terkonversi */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-violet-600" />
                </div>
                <label htmlFor="leads_converted" className="text-sm font-semibold text-slate-700">
                  Leads Terkonversi (Pendaftaran → Pangkal) <span className="text-red-500">*</span>
                </label>
              </div>
              <input
                id="leads_converted"
                type="number"
                min="0"
                value={form.leads_converted}
                onChange={e => handleChange('leads_converted', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-2xl font-bold focus:outline-none focus:ring-2 transition-all focus:border-violet-500 focus:ring-violet-500/20"
              />
              <p className="text-xs text-slate-400 mt-1.5">Leads yang berhasil masuk ke tahap Pangkal</p>
              {errors.leads_converted && <p className="mt-1 text-xs text-red-600">⚠ {errors.leads_converted}</p>}
            </motion.div>

            {/* Auto-calculated totals display */}
            <AnimatePresence>
              {form.leads_followed_up > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-3">Rekapitulasi Otomatis</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-100">Total Leads Follow-up</span>
                      <span className="text-xl font-black">{form.leads_followed_up}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-100">Total Leads Merespon</span>
                      <span className="text-xl font-black text-emerald-300">{form.leads_responded}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-indigo-100">Terkonversi</span>
                      <span className="text-xl font-black text-amber-300">{form.leads_converted || 0}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* ── Right Column ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* ══ METODE FOLLOW UP ══ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-start gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Metode Follow Up yang Dilakukan</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Centang semua metode yang digunakan hari ini</p>
                  {errors.follow_up_methods && (
                    <p className="mt-1 text-xs text-red-600">⚠ {errors.follow_up_methods}</p>
                  )}
                </div>
              </div>

              {/* Checkbox Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {FOLLOW_UP_METHODS.map(method => {
                  const Icon = method.icon;
                  const colors = colorMap[method.color];
                  const isChecked = form.follow_up_methods.includes(method.key);
                  return (
                    <button
                      key={method.key}
                      type="button"
                      onClick={() => handleMethodToggle(method.key)}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                        isChecked
                          ? `${colors.card} border-current ${colors.text}`
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isChecked ? colors.bg : 'bg-white'}`}>
                        <Icon className={`w-4 h-4 ${isChecked ? colors.text : 'text-slate-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold leading-tight ${isChecked ? '' : 'text-slate-600'}`}>{method.label}</p>
                      </div>
                      <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        isChecked ? `${colors.bg} border-current` : 'border-slate-300 bg-white'
                      }`}>
                        {isChecked && <div className={`w-2 h-2 rounded-sm ${colors.text.replace('text-', 'bg-')}`} />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Sub-forms per metode ── */}
              <div className="space-y-4">
                <AnimatePresence>

                  {/* Broadcast */}
                  {form.follow_up_methods.includes('broadcast') && (
                    <motion.div
                      key="broadcast"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border-2 border-sky-200 bg-sky-50/40 p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Radio className="w-4 h-4 text-sky-600" />
                        <span className="text-xs font-bold text-sky-700 uppercase tracking-wide">Hanya Broadcast</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Leads Dibroadcast</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.broadcast.total_sent}
                            onChange={e => handleMethodDataChange('broadcast', 'total_sent', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah yang Merespon</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.broadcast.total_responded}
                            onChange={e => handleMethodDataChange('broadcast', 'total_responded', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Isi Broadcast <span className="text-red-400">*</span></label>
                        <textarea
                          rows={2}
                          value={form.method_data.broadcast.content}
                          onChange={e => handleMethodDataChange('broadcast', 'content', e.target.value)}
                          placeholder="Tuliskan isi pesan broadcast..."
                          className="w-full px-3 py-2.5 rounded-xl border border-sky-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all resize-none"
                        />
                        {errors.broadcast_content && <p className="mt-1 text-xs text-red-600">⚠ {errors.broadcast_content}</p>}
                      </div>

                      {errors.broadcast_respondents && (
                        <p className="mb-2 text-xs text-red-600">⚠ {errors.broadcast_respondents}</p>
                      )}

                      {form.method_data.broadcast.respondents.length > 0 && (
                        <div className="space-y-3 mt-4 border-t border-sky-200 pt-3">
                          <p className="text-[10px] font-bold text-sky-700 uppercase">Data Responden</p>
                          {form.method_data.broadcast.respondents.map((r, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-sky-200 p-3 space-y-2">
                              <span className="text-[10px] font-black text-sky-600 uppercase mb-1 block">Responden #{idx + 1}</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.name} onChange={e => handleRespondentChange('broadcast', idx, 'name', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. HP <span className="text-red-400">*</span></label>
                                  <input type="tel" value={r.phone} onChange={e => handleRespondentChange('broadcast', idx, 'phone', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asal Sekolah <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.school} onChange={e => handleRespondentChange('broadcast', idx, 'school', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Isi Respon <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.response} onChange={e => handleRespondentChange('broadcast', idx, 'response', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Telepon */}
                  {form.follow_up_methods.includes('telepon') && (
                    <motion.div
                      key="telepon"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border-2 border-violet-200 bg-violet-50/40 p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <Phone className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-bold text-violet-700 uppercase tracking-wide">Telepon</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Leads Ditelepon</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.telepon.total_called}
                            onChange={e => handleMethodDataChange('telepon', 'total_called', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-violet-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah yang Merespon</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.telepon.total_responded}
                            onChange={e => handleMethodDataChange('telepon', 'total_responded', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-violet-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                          />
                        </div>
                      </div>

                      {errors.telepon_respondents && (
                        <p className="mb-2 text-xs text-red-600">⚠ {errors.telepon_respondents}</p>
                      )}

                      {form.method_data.telepon.respondents.length > 0 && (
                        <div className="space-y-3 mt-4 border-t border-violet-200 pt-3">
                          <p className="text-[10px] font-bold text-violet-700 uppercase">Data Responden</p>
                          {form.method_data.telepon.respondents.map((r, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-violet-200 p-3 space-y-2">
                              <span className="text-[10px] font-black text-violet-600 uppercase mb-1 block">Responden #{idx + 1}</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.name} onChange={e => handleRespondentChange('telepon', idx, 'name', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. HP <span className="text-red-400">*</span></label>
                                  <input type="tel" value={r.phone} onChange={e => handleRespondentChange('telepon', idx, 'phone', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asal Sekolah <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.school} onChange={e => handleRespondentChange('telepon', idx, 'school', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Isi Respon <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.response} onChange={e => handleRespondentChange('telepon', idx, 'response', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* WhatsApp */}
                  {form.follow_up_methods.includes('whatsapp') && (
                    <motion.div
                      key="whatsapp"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Komunikasi WhatsApp</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah Leads Dihubungi WA</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.whatsapp.total_contacted}
                            onChange={e => handleMethodDataChange('whatsapp', 'total_contacted', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Jumlah yang Merespon</label>
                          <input
                            type="number" min="0"
                            value={form.method_data.whatsapp.total_responded}
                            onChange={e => handleMethodDataChange('whatsapp', 'total_responded', e.target.value)}
                            placeholder="0"
                            className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Isi WhatsApp <span className="text-red-400">*</span></label>
                        <textarea
                          rows={2}
                          value={form.method_data.whatsapp.content}
                          onChange={e => handleMethodDataChange('whatsapp', 'content', e.target.value)}
                          placeholder="Tuliskan isi pesan WhatsApp..."
                          className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                        />
                        {errors.whatsapp_content && <p className="mt-1 text-xs text-red-600">⚠ {errors.whatsapp_content}</p>}
                      </div>

                      {errors.whatsapp_respondents && (
                        <p className="mb-2 text-xs text-red-600">⚠ {errors.whatsapp_respondents}</p>
                      )}

                      {form.method_data.whatsapp.respondents.length > 0 && (
                        <div className="space-y-3 mt-4 border-t border-emerald-200 pt-3">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Data Responden</p>
                          {form.method_data.whatsapp.respondents.map((r, idx) => (
                            <div key={idx} className="bg-white rounded-xl border border-emerald-200 p-3 space-y-2">
                              <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">Responden #{idx + 1}</span>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.name} onChange={e => handleRespondentChange('whatsapp', idx, 'name', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. HP <span className="text-red-400">*</span></label>
                                  <input type="tel" value={r.phone} onChange={e => handleRespondentChange('whatsapp', idx, 'phone', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Asal Sekolah <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.school} onChange={e => handleRespondentChange('whatsapp', idx, 'school', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Isi Respon <span className="text-red-400">*</span></label>
                                  <input type="text" value={r.response} onChange={e => handleRespondentChange('whatsapp', idx, 'response', e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Bertemu Langsung */}
                  {form.follow_up_methods.includes('bertemu') && (
                    <motion.div
                      key="bertemu"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="rounded-xl border-2 border-amber-200 bg-amber-50/40 p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Users2 className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Bertemu Langsung</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                            {form.method_data.bertemu.meetings.filter(m => m.name).length} orang
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={addMeeting}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Tambah
                        </button>
                      </div>

                      {errors.bertemu && (
                        <p className="mb-2 text-xs text-red-600">⚠ {errors.bertemu}</p>
                      )}

                      <div className="space-y-3">
                        {form.method_data.bertemu.meetings.map((meeting, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-xl border border-amber-200 p-3 space-y-2"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] font-black text-amber-600 uppercase">Pertemuan #{idx + 1}</span>
                              {form.method_data.bertemu.meetings.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMeeting(idx)}
                                  className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama <span className="text-red-400">*</span></label>
                                <input
                                  type="text"
                                  value={meeting.name}
                                  onChange={e => handleMeetingChange(idx, 'name', e.target.value)}
                                  placeholder="Nama lengkap..."
                                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">No. Telepon <span className="text-red-400">*</span></label>
                                <input
                                  type="tel"
                                  value={meeting.phone}
                                  onChange={e => handleMeetingChange(idx, 'phone', e.target.value)}
                                  placeholder="08xx-xxxx-xxxx"
                                  className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Lokasi Pertemuan <span className="text-red-400">*</span></span>
                              </label>
                              <input
                                type="text"
                                value={meeting.location}
                                onChange={e => handleMeetingChange(idx, 'location', e.target.value)}
                                placeholder="Contoh: Kantor, Sekolah SMA 1, Kafe Bintaro..."
                                className="w-full px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </motion.div>

            {/* Text Fields */}
            {textFields.map((field, idx) => {
              const colors = colorMap[field.color];
              const Icon = field.icon;
              const hasError = !!errors[field.id];
              return (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.06 }}
                  className={`bg-white rounded-2xl border shadow-sm p-6 transition-all ${
                    hasError ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-9 h-9 rounded-xl ${hasError ? 'bg-red-50' : colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${hasError ? 'text-red-500' : colors.text}`} />
                    </div>
                    <div className="flex-1">
                      <label htmlFor={field.id} className="block text-sm font-semibold text-slate-800">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {field.required ? 'Wajib diisi sebelum submit' : 'Opsional — semakin detail semakin baik'}
                      </p>
                    </div>
                    {field.required && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        form[field.id]?.trim()
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {form[field.id]?.trim() ? '✓ Terisi' : 'WAJIB'}
                      </span>
                    )}
                  </div>
                  <textarea
                    id={field.id}
                    rows={field.rows}
                    value={form[field.id]}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-4 py-3 rounded-xl border text-slate-800 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${
                      hasError
                        ? 'border-red-300 bg-red-50/30 focus:ring-red-500/20 focus:border-red-500'
                        : `border-slate-200 bg-slate-50 ${colors.border}`
                    }`}
                  />
                  {hasError && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                      ⚠ {errors[field.id]}
                    </p>
                  )}
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
