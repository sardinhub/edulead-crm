import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, Search, Trash2, 
  Phone, MessageCircle, Filter, X, Upload, CheckCircle2, AlertCircle,
  Users, UserPlus, Clock, ExternalLink, UserCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

const ClipboardList = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
);

export default function LeadsRecap() {
  const { 
    user, leadsRecap, fetchLeadsRecap, importLeadsRecap, deleteLeadRecap,
    marketingStaff, fetchMarketingStaff, deleteAllLeadsRecap,
    updateLeadRecapStatus, convertLeadToStudent
  } = useStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [filterStaff, setFilterStaff] = useState('all');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualLead, setManualLead] = useState({
    student_name: '',
    phone: '',
    school: '',
    program: 'AVSEC',
    note: 'PENDAFTARAN',
    referral: ''
  });
  const [selectedManualStaff, setSelectedManualStaff] = useState('');
  const [staffToClear, setStaffToClear] = useState('all');

  const isManager = user?.role === 'Manager';

  useEffect(() => {
    fetchLeadsRecap();
    if (isManager) fetchMarketingStaff();
  }, [user]);

  const handleConfirmClear = async () => {
    const targetName = staffToClear === 'all' ? 'SELURUH data Rekap Leads' : `data milik staff "${staffToClear}"`;
    
    if (!window.confirm(`⚠️ KONFIRMASI AKHIR: Hapus ${targetName}?`)) return;
    
    setImportLoading(true);
    const result = await deleteAllLeadsRecap(staffToClear);
    setImportLoading(false);
    
    if (result.success) {
      setIsClearModalOpen(false);
      alert(`✅ Berhasil: ${targetName} telah dibersihkan.`);
    } else {
      alert('❌ Gagal: ' + result.error);
    }
  };

  const handleUpdateStatus = async (lead, newStatus) => {
    if (newStatus === 'Selesai') {
      if (window.confirm('Apakah siswa ini akan diproses pelunasan? Jika Ya, status akan berubah jadi DONE dan keterangan menjadi PANGKAL LUNAS.')) {
        await updateLeadRecapStatus(lead.id, { status: 'DONE', note: 'PANGKAL LUNAS' });
      }
      return;
    }
    
    const reason = window.prompt(`Masukkan alasan singkat untuk status "${newStatus}":\n(Opsional, klik OK untuk melewati)`);
    if (reason === null) return; // Batal diklik
    
    let finalNote = lead.note || '';
    if (reason.trim() !== '') {
      if (finalNote.toUpperCase().includes('PENDAFTARAN') || finalNote.toUpperCase().includes('PANGKAL')) {
        finalNote = `${finalNote} | ${reason}`;
      } else {
        finalNote = reason;
      }
    }

    await updateLeadRecapStatus(lead.id, { status: newStatus, note: finalNote });
  };

  const handleConvert = async (lead) => {
    if (window.confirm(`Konversi ${lead.student_name} menjadi SISWA RESMI? Data akan dipindahkan ke Database Utama.`)) {
      setImportLoading(true);
      const result = await convertLeadToStudent(lead);
      setImportLoading(false);
      if (result.success) {
        alert('🎉 Berhasil! Siswa telah didaftarkan ke Database Utama.');
      } else {
        alert('Gagal konversi: ' + result.error);
      }
    }
  };

  // Handler: Parsing Excel
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Mapping sederhana: Cari header yang mirip
      const mapped = data.map(item => {
        let rawDate = item['Tanggal Daftar'] || item['Tanggal'] || item['Date'] || item['Waktu'];
        let created_at = undefined;

        if (rawDate) {
          if (rawDate instanceof Date && !isNaN(rawDate)) {
             created_at = rawDate.toISOString();
          } else if (typeof rawDate === 'number') {
             const dateObj = new Date((rawDate - (25567 + 1)) * 86400 * 1000);
             if (!isNaN(dateObj)) created_at = dateObj.toISOString();
          } else if (typeof rawDate === 'string') {
             const parts = rawDate.split(/[-/]/);
             if (parts.length === 3) {
                let day = parts[0], month = parts[1], year = parts[2];
                if (year.length === 2) year = '20' + year;
                if (year.length === 4) {
                   if (parts[0].length === 4) { year = parts[0]; month = parts[1]; day = parts[2]; }
                   const dt = new Date(`${year}-${month}-${day}T12:00:00Z`);
                   if (!isNaN(dt)) created_at = dt.toISOString();
                }
             } else {
                const dt = new Date(rawDate);
                if (!isNaN(dt)) created_at = dt.toISOString();
             }
          }
        }

        return {
          student_name: item['Nama Siswa'] || item['Nama'] || '',
          school: item['Asal Sekolah'] || item['Sekolah'] || '',
          phone: String(item['No. Telepon'] || item['Telepon'] || item['WhatsApp'] || ''),
          program: item['Program'] || item['Tujuan'] || '',
          note: item['Keterangan'] || item['Catatan'] || '',
          referral: item['Referral'] || item['Referal'] || item['Referensi'] || item['Sumber'] || '',
          ...(created_at ? { created_at } : {})
        };
      }).filter(item => item.student_name);
      
      setPreviewData(mapped);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!selectedStaff && isManager) {
      alert('Silakan pilih Staff PIC untuk leads ini');
      return;
    }
    
    setImportLoading(true);
    const staffObj = marketingStaff.find(s => s.id === selectedStaff);
    
    const finalLeads = previewData.map(l => ({
      ...l,
      staff_id: isManager ? selectedStaff : user.id,
      staff_name: isManager ? staffObj?.name : user.name
    }));

    const result = await importLeadsRecap(finalLeads);
    setImportLoading(false);
    
    if (result.success) {
      setIsImportModalOpen(false);
      setPreviewData([]);
      setSelectedStaff('');
      alert(`Berhasil mengimpor ${finalLeads.length} leads!`);
    } else {
      alert('Gagal mengimpor: ' + result.error);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualLead.student_name || !manualLead.phone) {
      alert('Nama Siswa dan No. Telepon wajib diisi!');
      return;
    }

    if (isManager && !selectedManualStaff) {
      alert('Silakan pilih PIC Staff untuk lead ini');
      return;
    }

    setImportLoading(true);
    const staffObj = isManager 
      ? marketingStaff.find(s => s.id === selectedManualStaff)
      : user;

    const newLead = {
      ...manualLead,
      staff_id: isManager ? selectedManualStaff : user.id,
      staff_name: staffObj?.name || user.name
    };

    const result = await importLeadsRecap([newLead]);
    setImportLoading(false);

    if (result.success) {
      setIsManualModalOpen(false);
      setManualLead({
        student_name: '',
        phone: '',
        school: '',
        program: 'AVSEC',
        note: 'PENDAFTARAN',
        referral: ''
      });
      setSelectedManualStaff('');
      alert('✅ Lead berhasil didaftarkan secara manual!');
    } else {
      alert('❌ Gagal mendaftarkan lead: ' + result.error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Hapus data lead ini?')) {
      await deleteLeadRecap(id);
    }
  };

  const handleWhatsApp = (phone) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const filteredLeads = leadsRecap.filter(l => {
    const matchesSearch = 
      l.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.school?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStaff = filterStaff === 'all' || l.staff_name === filterStaff;
    
    return matchesSearch && matchesStaff;
  });

  // Calculate Stats
  const stats = {
    total: filteredLeads.length,
    pencapaian: filteredLeads.filter(l => 
      l.staff_name && l.referral && 
      l.staff_name.trim().toUpperCase() === l.referral.trim().toUpperCase() &&
      l.note?.toUpperCase().includes('PANGKAL LUNAS')
    ).length,
    pendaftaran: filteredLeads.filter(l => l.note?.toUpperCase().includes('PENDAFTARAN')).length,
    lunas: filteredLeads.filter(l => l.note?.toUpperCase().includes('PANGKAL LUNAS')).length,
    pangkal1: filteredLeads.filter(l => l.note?.toUpperCase().includes('PANGKAL 1')).length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-violet-600" />
            Rekap Leads Marketing
          </h1>
          <p className="text-slate-500 text-sm">Kelola dan pelajari progres konversi leads</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isManager && (
            <>
              <button 
                onClick={() => setIsClearModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all outline-none"
                title="Hapus Seluruh Data"
              >
                <Trash2 className="w-4 h-4" />
                Bersihkan Data
              </button>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all outline-none shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import Excel
              </button>
            </>
          )}
          <button 
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-600 text-white rounded-xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 hover:scale-[1.02] active:scale-95 transition-all outline-none"
          >
            <UserPlus className="w-4 h-4" />
            Daftar Manual
          </button>
        </div>
      </div>

      {/* Stats Quick View (Summary) */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Leads</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-slate-900">{stats.total}</h3>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <Users className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-violet-100 shadow-md shadow-violet-100/50 flex flex-col justify-between">
          <p className="text-[10px] font-bold text-violet-600 uppercase tracking-wider mb-1">Pencapaian (ACH)</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-violet-700">{stats.pencapaian}</h3>
            <div className="p-1.5 bg-violet-50 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-violet-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">PENDAFTARAN</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-emerald-600">{stats.pendaftaran}</h3>
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">PANGKAL LUNAS</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-blue-600">{stats.lunas}</h3>
            <div className="p-1.5 bg-blue-50 rounded-lg">
              <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">PANGKAL 1</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-amber-600">{stats.pangkal1}</h3>
            <div className="p-1.5 bg-amber-50 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Staff Aktif</p>
          <div className="flex items-end justify-between">
            <h3 className="text-xl font-bold text-slate-700">{isManager ? marketingStaff.length : 1}</h3>
            <div className="p-1.5 bg-slate-50 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Table Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama siswa atau sekolah..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {isManager && (
              <select 
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-violet-500/10 min-w-[140px]"
              >
                <option value="all">Semua Staff</option>
                {marketingStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Tanggal Daftar</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Nama Siswa</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Telepon & Sekolah</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Status Follow-up</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Program</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Referral</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-sm">Keterangan</th>
                {isManager && <th className="px-6 py-4 font-bold text-slate-900 text-sm">PIC Staff</th>}
                <th className="px-6 py-4 font-bold text-slate-900 text-sm text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const isLunas = lead.note?.toUpperCase()?.includes('PANGKAL LUNAS');
                let reasonText = null;
                if (lead.note) {
                  if (lead.note.includes(' | ')) {
                    reasonText = lead.note.split(' | ').pop().trim();
                  } else if (
                    !lead.note.toUpperCase().includes('PENDAFTARAN') && 
                    !lead.note.toUpperCase().includes('PANGKAL 1') && 
                    !isLunas
                  ) {
                    reasonText = lead.note.trim();
                  }
                }
                
                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={lead.id} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors border-b border-slate-50 group",
                    isLunas && "bg-slate-50/80"
                  )}
                >
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-500 whitespace-nowrap">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={cn("font-bold", isLunas ? "text-slate-400" : "text-slate-900")}>{lead.student_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <button 
                        onClick={() => handleWhatsApp(lead.phone)}
                        disabled={isLunas}
                        className={cn(
                          "flex items-center gap-2 font-bold text-xs transition-colors",
                          isLunas ? "text-slate-400" : "text-emerald-600 hover:text-emerald-700"
                        )}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {lead.phone}
                      </button>
                      <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {lead.school || '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={isLunas ? 'DONE' : (lead.status || 'Belum Dihubungi')}
                      disabled={isLunas}
                      onChange={(e) => handleUpdateStatus(lead, e.target.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold border-none outline-none ring-1 appearance-none cursor-pointer transition-all",
                        isLunas ? "bg-slate-600 text-white ring-slate-700" : (
                          lead.status === 'Tertarik' && "bg-emerald-50 text-emerald-700 ring-emerald-100" ||
                          lead.status === 'Janji Datang' && "bg-blue-50 text-blue-700 ring-blue-100" ||
                          lead.status === 'Tidak Tertarik' && "bg-slate-100 text-slate-600 ring-slate-200" ||
                          lead.status === 'Tidak dapat dihubungi' && "bg-red-50 text-red-700 ring-red-100" ||
                          (lead.status === 'Belum Dihubungi' || !lead.status) && "bg-amber-50 text-amber-700 ring-amber-100"
                        )
                      )}
                    >
                      {isLunas && <option value="DONE">DONE</option>}
                      <option value="Belum Dihubungi">Belum Dihubungi</option>
                      <option value="Tertarik">Tertarik</option>
                      <option value="Janji Datang">Janji Datang</option>
                      <option value="Tidak Tertarik">Tidak Tertarik</option>
                      <option value="Tidak dapat dihubungi">Tidak dapat dihubungi</option>
                      <option value="Selesai">Selesai (Pelunasan)</option>
                    </select>
                    {reasonText && (
                      <div className="mt-2 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full mt-1.5 shrink-0" />
                        <p className="text-[11px] text-slate-500 italic leading-tight line-clamp-2" title={reasonText}>
                          {reasonText}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 italic",
                      isLunas ? "bg-slate-200 text-slate-500 ring-slate-300" : "bg-violet-50 text-violet-700 ring-violet-100"
                    )}>
                      {lead.program || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[11px] font-bold text-indigo-600 uppercase">
                      {lead.referral || '—'}
                    </p>
                  </td>
                  <td className="px-6 py-4 max-w-xs transition-all">
                    <p className={cn(
                      "text-[11px] line-clamp-1 italic",
                      isLunas ? "text-emerald-600 font-bold" : "text-slate-400"
                    )} title={lead.note}>
                      {lead.note || '—'}
                    </p>
                  </td>
                  {isManager && (
                    <td className="px-6 py-4">
                       <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-300" />
                          {lead.staff_name}
                       </span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleConvert(lead)}
                        disabled={isLunas || !isManager}
                        className={cn(
                          "p-2 transition-all rounded-lg shadow-sm",
                          (isLunas || !isManager) ? "bg-slate-100 text-slate-300 cursor-not-allowed" : "text-violet-600 bg-violet-50 hover:bg-violet-600 hover:text-white"
                        )}
                        title={isLunas ? "Sudah Jadi Siswa/Lunas" : !isManager ? "Hanya Manager yang dapat mendaftarkan siswa" : "Daftarkan Siswa ke Database Utama"}
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(lead.id)}
                        disabled={isLunas}
                        className={cn(
                          "p-2 transition-colors",
                          isLunas ? "text-slate-200 cursor-not-allowed" : "text-slate-300 hover:text-red-500"
                        )}
                        title="Hapus Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                );
              })}
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={isManager ? 8 : 7} className="px-6 py-20 text-center text-slate-400 italic">
                    Belum ada data leads untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Import Excel */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white relative">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Import Leads dari Excel</h3>
                    <p className="text-xs text-slate-500 italic">Dukung format: Tanggal, Nama, Sekolah, Telepon, Program, Keterangan</p>
                  </div>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6">
                {/* 1. Pilih Staff (Hanya Manager) */}
                {isManager && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Pilih Staff (PIC Penugasan)
                    </label>
                    <select 
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    >
                      <option value="">Pilih Staff Penerima Leads...</option>
                      {marketingStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {/* 2. Upload Area */}
                <div 
                  className={cn(
                    "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all",
                    previewData.length > 0 ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/20"
                  )}
                >
                  {previewData.length > 0 ? (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg">{previewData.length} Data Terbaca</h4>
                      <button 
                        onClick={() => setPreviewData([])}
                        className="text-sm text-red-500 font-bold hover:underline"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm mb-4 text-center">Klik tombol di bawah atau seret file ke sini</p>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        onChange={handleFileUpload}
                        className="hidden" 
                        id="excel-input"
                      />
                      <label 
                        htmlFor="excel-input"
                        className="px-8 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:shadow-md transition-all cursor-pointer"
                      >
                        Pilih File Excel
                      </label>
                    </>
                  )}
                </div>

                {/* 3. Preview Section Tiny Table */}
                {previewData.length > 0 && (
                   <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Preview 3 Data Pertama</p>
                      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-[11px] text-left">
                           <thead className="bg-slate-50">
                              <tr>
                                <th className="px-3 py-2">Nama</th>
                                <th className="px-3 py-2">Sekolah</th>
                                <th className="px-3 py-2">HP</th>
                              </tr>
                           </thead>
                           <tbody>
                              {previewData.slice(0, 3).map((item, i) => (
                                <tr key={i} className="border-t border-slate-50">
                                  <td className="px-3 py-2 font-bold">{item.student_name}</td>
                                  <td className="px-3 py-2">{item.school}</td>
                                  <td className="px-3 py-2 text-emerald-600 font-bold">{item.phone}</td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                      </div>
                   </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Bantuan? Tanyakan Admin IT</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsImportModalOpen(false)}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleConfirmImport}
                    disabled={importLoading || previewData.length === 0}
                    className="px-10 py-2.5 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 disabled:opacity-50 disabled:grayscale shadow-lg shadow-violet-200 transition-all flex items-center gap-2"
                  >
                    {importLoading ? 'Memproses...' : 'Simpan Sekarang'}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Daftar Manual */}
      <AnimatePresence>
        {isManualModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl">Daftar Manual Siswa</h3>
                </div>
                <button onClick={() => setIsManualModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Siswa</label>
                    <input 
                      required
                      type="text"
                      value={manualLead.student_name}
                      onChange={(e) => setManualLead({...manualLead, student_name: e.target.value.toUpperCase()})}
                      placeholder="CONTOH: BUDI SANTOSO"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">No. Telepon (WhatsApp)</label>
                    <input 
                      required
                      type="tel"
                      value={manualLead.phone}
                      onChange={(e) => setManualLead({...manualLead, phone: e.target.value})}
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Asal Sekolah</label>
                    <input 
                      type="text"
                      value={manualLead.school}
                      onChange={(e) => setManualLead({...manualLead, school: e.target.value.toUpperCase()})}
                      placeholder="CONTOH: SMA NEGERI 1 JAKARTA"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Program</label>
                      <select 
                        value={manualLead.program}
                        onChange={(e) => setManualLead({...manualLead, program: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm font-bold"
                      >
                        <option value="AVSEC">AVSEC</option>
                        <option value="Flight Attendant">Flight Attendant</option>
                        <option value="GROUND STAFF">GROUND STAFF</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase ml-1">Referral</label>
                      <input 
                        type="text"
                        value={manualLead.referral}
                        onChange={(e) => setManualLead({...manualLead, referral: e.target.value.toUpperCase()})}
                        placeholder="SUMBER DATA"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {isManager && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">PIC Staff</label>
                        <select 
                          required
                          value={selectedManualStaff}
                          onChange={(e) => setSelectedManualStaff(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 outline-none transition-all text-sm font-medium"
                        >
                          <option value="">Pilih Staff...</option>
                          {marketingStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Keterangan</label>
                    <input 
                      disabled
                      type="text"
                      value={manualLead.note}
                      className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsManualModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={importLoading}
                    className="flex-[2] py-3 bg-violet-600 text-white rounded-xl font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2"
                  >
                    {importLoading ? 'Menyimpan...' : 'Simpan Data'}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Bersihkan Data (Pilih PIC) */}
      <AnimatePresence>
        {isClearModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  Bersihkan Data Leads
                </h3>
                <button onClick={() => setIsClearModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium leading-relaxed">
                    Data yang sudah dihapus tidak dapat dikembalikan. Silakan pilih kategori data yang ingin dibersihkan.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Data Milik:</label>
                  <select 
                    value={staffToClear}
                    onChange={(e) => setStaffToClear(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none transition-all font-medium"
                  >
                    <option value="all">Keluaran: SEMUA STAFF</option>
                    {marketingStaff.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex gap-3">
                <button 
                  onClick={() => setIsClearModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button 
                  onClick={handleConfirmClear}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
                >
                  Hapus Data
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
