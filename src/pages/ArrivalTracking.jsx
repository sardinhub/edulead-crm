import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Filter, User, CheckCircle2, Plane, XCircle, Clock, LayoutGrid, List } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ARRIVAL_STATUSES = [
  { id: 'AKTIF', label: 'SUDAH DI KAMPUS', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-100', icon: CheckCircle2 },
  { id: 'PROSES', label: 'DALAM PERJALANAN', color: 'bg-sky-500', text: 'text-sky-600', bg: 'bg-sky-50', ring: 'ring-sky-100', icon: Plane },
  { id: 'BATAL', label: 'BATAL GABUNG', color: 'bg-rose-500', text: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-100', icon: XCircle },
  { id: 'GELOMBANG_2', label: 'GELOMBANG 2', color: 'bg-violet-500', text: 'text-violet-600', bg: 'bg-violet-50', ring: 'ring-violet-100', icon: Clock },
  { id: 'BELUM KONFIRMASI', label: 'BELUM KONFIRMASI', color: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-50', ring: 'ring-slate-100', icon: LayoutGrid },
];

export default function ArrivalTracking() {
  const { leadsRecap, fetchLeadsRecap, updateLeadArrivalStatus, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchLeadsRecap();
  }, []);

  // Filter: Hanya leads yang keterangan (note) = PANGKAL LUNAS dari Rekap Leads
  const lunasLeads = useMemo(() => {
    return leadsRecap.filter(l => {
      const isLunas = l.note?.toUpperCase().includes('PANGKAL LUNAS');
      
      const matchesSearch = 
        l.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.phone?.includes(searchTerm);
      
      const currentArrival = l.arrival_status || 'BELUM KONFIRMASI';
      const matchesArrivalStatus = filterStatus === 'all' || currentArrival === filterStatus;

      return isLunas && matchesSearch && matchesArrivalStatus;
    });
  }, [leadsRecap, searchTerm, filterStatus]);

  // Statistik (dihitung dari semua leads PANGKAL LUNAS, tanpa filter search)
  const allLunasLeads = useMemo(() => {
    return leadsRecap.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS'));
  }, [leadsRecap]);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <MapPin className="w-7 h-7 text-indigo-600" />
            Pelacakan Kedatangan Siswa
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            Siswa dari Rekap Leads dengan status PANGKAL LUNAS
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Lunas</p>
          <p className="text-2xl font-black text-slate-900">{allLunasLeads.length}</p>
        </div>
        {ARRIVAL_STATUSES.filter(st => st.id !== 'BELUM KONFIRMASI').map(st => (
          <div key={st.id} className={cn("p-4 rounded-3xl border shadow-sm transition-all", st.bg, st.ring.replace('ring-', 'border-'))}>
            <p className={cn("text-[10px] font-black uppercase tracking-wider", st.text)}>{st.label.split(' ')[0]}</p>
            <p className={cn("text-2xl font-black", st.text)}>{allLunasLeads.filter(s => s.arrival_status === st.id).length}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama siswa atau asal sekolah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 md:w-72">
          <Filter className="w-5 h-5 text-slate-400 ml-2" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer"
          >
            <option value="all">SEMUA STATUS DATANG</option>
            {ARRIVAL_STATUSES.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Siswa & Sekolah</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider text-center">Telepon</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">PIC Staff</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Referral</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider text-center">Update Status Kedatangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lunasLeads.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.school || '—'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-xs font-bold text-indigo-500">{item.phone || '—'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                       </div>
                       <span className="font-bold text-slate-700 text-xs">{item.staff_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold text-slate-500">{item.referral || '—'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {ARRIVAL_STATUSES.map(st => {
                        const Icon = st.icon;
                        const isSelected = (item.arrival_status || 'BELUM KONFIRMASI') === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => updateLeadArrivalStatus(item.id, st.id)}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all hover:scale-105 active:scale-95",
                              isSelected 
                                ? `${st.bg} ${st.text} ring-1 ${st.ring} shadow-md`
                                : "bg-slate-50 text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent hover:border-slate-200"
                            )}
                            title={st.label}
                          >
                            <Icon className={cn("w-3.5 h-3.5", isSelected ? st.text : "text-slate-300")} />
                            <span className="hidden lg:inline">{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {lunasLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                    Tidak ada siswa PANGKAL LUNAS yang sesuai dengan filter pencarian.
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
