import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus, Shield, Mail, Users, Loader2, CheckCircle2,
  UserX, UserCheck, Eye, EyeOff, AlertTriangle, RefreshCw,
  Calendar, Crown
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const roleOptions = [
  { value: 'Marketing', label: 'Marketing Staff', color: 'bg-slate-100 text-slate-700' },
  { value: 'Manager',   label: 'Manager',          color: 'bg-indigo-100 text-indigo-700' },
];

const initialForm = { name: '', email: '', password: '', role: 'Marketing' };

export default function UserManagement() {
  const {
    user: currentUser,
    systemUsers,
    fetchSystemUsers,
    registerStaff,
    deactivateUser,
    reactivateUser,
    isAuthLoading,
  } = useStore();

  const [form, setForm]               = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [formMsg, setFormMsg]         = useState(null); // { type: 'success'|'error', text }
  const [actionLoading, setActionLoading] = useState(null); // userId being toggled
  const [filterRole, setFilterRole]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  useEffect(() => {
    fetchSystemUsers();
  }, [fetchSystemUsers]);

  /* ── Form submit ─────────────────────────────────────────────────────── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return;

    setFormMsg(null);
    const result = await registerStaff(form);

    if (result.success) {
      setFormMsg({ type: 'success', text: `✅ Akun "${form.name}" berhasil didaftarkan!` });
      setForm(initialForm);
      fetchSystemUsers();
    } else {
      setFormMsg({ type: 'error', text: `⚠️ ${result.error}` });
    }
  };

  /* ── Toggle aktif/nonaktif ───────────────────────────────────────────── */
  const handleToggleActive = async (userId, isCurrentlyActive) => {
    if (userId === currentUser?.id) {
      alert('Tidak dapat menonaktifkan akun yang sedang login!');
      return;
    }
    setActionLoading(userId);
    if (isCurrentlyActive) {
      await deactivateUser(userId);
    } else {
      await reactivateUser(userId);
    }
    setActionLoading(null);
  };

  /* ── Filtered list ───────────────────────────────────────────────────── */
  const filteredUsers = systemUsers.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus === 'active' && !u.is_active) return false;
    if (filterStatus === 'inactive' && u.is_active) return false;
    return true;
  });

  const activeCount   = systemUsers.filter(u => u.is_active).length;
  const inactiveCount = systemUsers.filter(u => !u.is_active).length;

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
            <p className="text-slate-500 text-sm">Kelola akses dan akun staf aplikasi — tersimpan permanen di database</p>
          </div>
        </div>
      </motion.div>

      {/* ── Summary badges ───────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { label: 'Total Pengguna', value: systemUsers.length, color: 'bg-white border-slate-200 text-slate-700' },
          { label: 'Akun Aktif',     value: activeCount,        color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { label: 'Akun Nonaktif',  value: inactiveCount,      color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(b => (
          <div key={b.label} className={cn('flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm shadow-sm', b.color)}>
            <span className="text-xl font-black">{b.value}</span>
            <span className="text-xs opacity-70">{b.label}</span>
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Form Daftar Pengguna Baru ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftarkan Pengguna Baru</h2>
                <p className="text-xs text-slate-400">Data langsung tersimpan ke database</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {/* Nama */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  required type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email Akun <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    required type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="budi@edulead.com"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jabatan Sistem</label>
                <div className="flex gap-2">
                  {roleOptions.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role: r.value }))}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all',
                        form.role === r.value
                          ? r.value === 'Manager'
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                            : 'border-slate-400 bg-slate-100 text-slate-700'
                          : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                      )}
                    >
                      {r.value === 'Manager' && <Crown className="w-3 h-3 inline mr-1" />}
                      {r.label}
                    </button>
                  ))}
                </div>
                {form.role === 'Marketing' && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    💡 Akun Marketing otomatis terdaftar sebagai staff di modul Monitoring
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password Sementara <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 karakter"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Message */}
              <AnimatePresence>
                {formMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={cn(
                      'p-3 rounded-xl text-xs font-semibold',
                      formMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    )}
                  >
                    {formMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={isAuthLoading}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
              >
                {isAuthLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  <><UserPlus className="w-4 h-4" /> Daftarkan Pengguna</>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* ── Tabel Daftar Pengguna ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Users className="w-4 h-4 text-slate-400" />
                <h2 className="font-bold text-slate-800">Daftar Pengguna Terdaftar</h2>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: 'all',      label: 'Semua' },
                  { value: 'active',   label: '✅ Aktif' },
                  { value: 'inactive', label: '🚫 Nonaktif' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterStatus(f.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      filterStatus === f.value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
                <div className="w-px h-5 bg-slate-200 self-center hidden sm:block" />
                {[
                  { value: 'all', label: 'Semua Jabatan' },
                  { value: 'Manager', label: '👑 Manager' },
                  { value: 'Marketing', label: '📣 Marketing' },
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setFilterRole(f.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      filterRole === f.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                onClick={fetchSystemUsers}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Pengguna', 'Email', 'Jabatan', 'Status', 'Terdaftar', 'Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={cn(
                        'transition-colors',
                        u.is_active ? 'hover:bg-slate-50' : 'bg-slate-50/50 opacity-60'
                      )}
                    >
                      {/* Avatar + Nama */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative flex-shrink-0">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=e0e7ff&color=4338ca&bold=true`}
                              alt={u.name}
                              className="w-9 h-9 rounded-xl"
                            />
                            {u.id === currentUser?.id && (
                              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" title="Anda" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm leading-tight">
                              {u.name}
                              {u.id === currentUser?.id && (
                                <span className="ml-1 text-xs font-normal text-slate-400">(Anda)</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="text-xs truncate max-w-[160px]">{u.email}</span>
                        </div>
                      </td>

                      {/* Role badge */}
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                          u.role === 'Manager'
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600'
                        )}>
                          {u.role === 'Manager'
                            ? <><Crown className="w-3 h-3" /> Manager</>
                            : 'Marketing'
                          }
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="w-3 h-3" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                            <UserX className="w-3 h-3" /> Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Tanggal daftar */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Aksi toggle aktif */}
                      <td className="px-4 py-3">
                        {u.id === currentUser?.id ? (
                          <span className="text-xs text-slate-300 italic">—</span>
                        ) : (
                          <button
                            onClick={() => handleToggleActive(u.id, u.is_active)}
                            disabled={actionLoading === u.id}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50',
                              u.is_active
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            )}
                          >
                            {actionLoading === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : u.is_active ? (
                              <><UserX className="w-3.5 h-3.5" /> Nonaktifkan</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Aktifkan</>
                            )}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-slate-400 text-sm">Tidak ada pengguna yang sesuai filter</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                💡 Pengguna yang dinonaktifkan tidak dapat login, namun datanya tetap tersimpan di database.
                Semua akun Marketing otomatis tercatat sebagai staff di modul Monitoring.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
