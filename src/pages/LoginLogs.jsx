import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Monitor, Tablet, Smartphone, User, Clock, Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function LoginLogs() {
  const { loginLogs, fetchLoginLogs, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLoginLogs();
  }, []);

  // Secure: Only Manager can access Log Status
  if (user?.role !== 'Manager') {
    return (
      <div className="p-20 text-center text-slate-500 italic">
        Halaman ini hanya dapat diakses oleh Manager untuk kebutuhan monitoring keamanan.
      </div>
    );
  }

  const filteredLogs = loginLogs.filter(log => 
    log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDeviceIcon = (ua) => {
    if (!ua) return <Monitor className="w-4 h-4" />;
    const lowerUA = ua.toLowerCase();
    if (lowerUA.includes('mobi')) return <Smartphone className="w-4 h-4" />;
    if (lowerUA.includes('tablet')) return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  const parseDeviceInfo = (ua) => {
    if (!ua) return 'Unknown Device';
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Macintosh')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone')) os = 'iOS';
    else if (ua.includes('Linux')) os = 'Linux';

    return `${browser} on ${os}`;
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <History className="w-7 h-7 text-indigo-600" />
            Log Status Login
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            Monitor Aktivitas Login Seluruh Tim
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama, email, atau role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Info Pengguna</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider text-center">Waktu Login</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Device / Browser</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Detail Raw</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                        {log.user_name?.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 uppercase tracking-tight">{log.user_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{log.email}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase ring-1",
                            log.role === 'Manager' ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-blue-50 text-blue-600 ring-blue-100"
                          )}>
                            {log.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                        <Calendar className="w-3 h-3 text-indigo-400" />
                        {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : (log.login_date || '—')}
                      </div>
                      <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px]">
                        <Clock className="w-3 h-3" />
                        {log.created_at ? new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : (log.login_time || '—')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        {getDeviceIcon(log.device_info)}
                      </div>
                      <span className="font-bold text-slate-600 text-xs">
                        {parseDeviceInfo(log.device_info)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 max-w-xs">
                    <p className="text-[9px] text-slate-400 font-medium truncate italic" title={log.device_info}>
                      {log.device_info}
                    </p>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                    Tidak ada riwayat login ditemukan.
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
