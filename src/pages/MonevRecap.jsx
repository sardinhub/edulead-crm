import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Search, Download, Filter, User, Printer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function MonevRecap() {
  const { students, marketingStaff, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStaff, setFilterStaff] = useState('all');

  // Authorize: Only Manager can see this (though route is protected, we double check)
  if (user?.role !== 'Manager') {
    return (
      <div className="p-20 text-center text-slate-500 italic">
        Anda tidak memiliki otoritas untuk mengakses halaman ini.
      </div>
    );
  }

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = 
        s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.telepon?.includes(searchTerm) ||
        s.asal_sekolah?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStaff = filterStaff === 'all' || s.pic_staff === filterStaff;
      
      return matchesSearch && matchesStaff;
    });
  }, [students, searchTerm, filterStaff]);

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) return alert('Tidak ada data untuk diekspor.');

    const headers = ['Nama Siswa', 'Asal Sekolah', 'Telepon', 'Status Pembayaran', 'Nominal', 'PIC Staff', 'Catatan', 'Tanggal'];
    const rows = filteredStudents.map(s => [
      s.nama?.replace(/,/g, ' '), 
      s.asal_sekolah?.replace(/,/g, ' '), 
      s.telepon, 
      s.status_pembayaran, 
      s.nominal_pembayaran, 
      s.pic_staff, 
      s.catatan?.replace(/,/g, '.').replace(/\n/g, ' '), 
      s.tanggal_daftar || s.created_at?.split('T')[0]
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(e => e.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Rekap_Monev_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 font-outfit">
            <FileSearch className="w-7 h-7 text-indigo-600" />
            Rekap Hasil Monev Leads
          </h1>
          <p className="text-slate-500 mt-1 uppercase text-[10px] font-bold tracking-widest">
            Semua Progres Database Utama (Pendaftaran & Pembayaran)
          </p>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari nama siswa, sekolah, atau nomor telepon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        
        <div className="flex items-center gap-2 md:w-72">
          <Filter className="w-5 h-5 text-slate-400 ml-2" />
          <select 
            value={filterStaff}
            onChange={(e) => setFilterStaff(e.target.value)}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-600 cursor-pointer"
          >
            <option value="all">SEMUA STAFF</option>
            {marketingStaff.map(staff => (
              <option key={staff.id} value={staff.name}>{staff.name}</option>
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
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider text-center">Status Bayar</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider text-right">Nominal</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">PIC Staff</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Catatan Progres</th>
                <th className="px-6 py-5 font-black text-slate-400 text-[10px] uppercase tracking-wider">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredStudents.map((item) => (
                <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.nama}</span>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.asal_sekolah}</span>
                      <span className="text-[10px] text-indigo-400 font-bold mt-0.5">{item.telepon}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-sm ring-1",
                      item.status_pembayaran?.includes('Pangkal Full') || item.status_pembayaran?.includes('WON')
                        ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                        : item.status_pembayaran?.includes('DP') || item.status_pembayaran?.includes('Pangkal 1')
                        ? "bg-amber-50 text-amber-600 ring-amber-100"
                        : "bg-blue-50 text-blue-600 ring-blue-100"
                    )}>
                      {item.status_pembayaran}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-slate-900 text-sm">
                    Rp {Number(item.nominal_pembayaran || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                       </div>
                       <span className="font-bold text-slate-700 text-xs">{item.pic_staff}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 max-w-xs">
                    <p className="text-[11px] text-slate-500 leading-relaxed italic line-clamp-2" title={item.catatan}>
                      {item.catatan || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-400">{item.tanggal_daftar || item.created_at?.split('T')[0]}</span>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-300 italic font-medium">
                    Tidak ada data monev yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; font-size: 10px; }
          .print\\:hidden { display: none !important; }
          aside, header, nav, .bg-indigo-50, .bg-violet-50 { display: none !important; }
          .max-w-7xl { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .shadow-xl, .shadow-sm { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .rounded-[2.5rem], .rounded-3xl, .rounded-2xl { border-radius: 0 !important; }
          table { width: 100% !important; }
          th { background: #f8fafc !important; color: #475569 !important; font-weight: 800 !important; }
          td { border-bottom: 1px solid #f1f5f9 !important; }
          .line-clamp-2 { -webkit-line-clamp: initial !important; }
          .p-6, .p-8 { padding: 10px !important; }
        }
      `}} />
    </div>
  );
}
