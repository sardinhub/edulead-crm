import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileSpreadsheet, Download, Search, Trash2, 
  Phone, MessageCircle, Filter, X, Upload, CheckCircle2, AlertCircle,
  Users, UserPlus, Clock, ExternalLink, UserCheck, Send, Square, CheckSquare,
  Radio, Zap, AlertTriangle, ArrowRightCircle, ChevronRight
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
    updateLeadRecapStatus, convertLeadToStudent,
    unregisteredStudents, fetchUnregisteredStudents, importUnregisteredStudents,
    deleteUnregisteredStudent, deleteAllUnregisteredStudents,
    convertUnregisteredToLead, convertAllUnregisteredToLeads
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

  // --- State untuk Panel Siswa Belum Daftar ---
  const [isUnregPanelOpen, setIsUnregPanelOpen] = useState(false);
  const [isUnregImportModalOpen, setIsUnregImportModalOpen] = useState(false);
  const [unregPreviewData, setUnregPreviewData] = useState([]);
  const [unregSelectedStaff, setUnregSelectedStaff] = useState('');
  const [unregImportLoading, setUnregImportLoading] = useState(false);
  const [unregSearchTerm, setUnregSearchTerm] = useState('');

  // --- State untuk Broadcast WhatsApp ---
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Halo {nama}, kami dari tim marketing ingin menginformasikan tentang program kami. Apakah Anda masih tertarik untuk mendaftar? 😊'
  );
  const [broadcastProgress, setBroadcastProgress] = useState(null); // { current, total }
  const broadcastIndexRef = useRef(0);

  const isManager = user?.role === 'Manager';

  useEffect(() => {
    fetchLeadsRecap();
    fetchUnregisteredStudents();
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
    const isSystemNote = finalNote.toUpperCase().includes('PENDAFTARAN') || finalNote.toUpperCase().includes('PANGKAL');
    
    // Ekstrak bagian sistem saja (sebelum ' | ') jika sudah pernah ada alasan sebelumnya
    if (isSystemNote && finalNote.includes(' | ')) {
       finalNote = finalNote.split(' | ')[0];
    }

    if (reason.trim() !== '') {
      if (isSystemNote) {
        finalNote = `${finalNote} | ${reason}`;
      } else {
        finalNote = reason;
      }
    } else {
      if (!isSystemNote) {
        finalNote = '';
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

  // Handler: Import Siswa Belum Daftar
  const handleUnregFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      // Helper: ambil nilai dari berbagai kemungkinan nama kolom
      const pick = (item, ...keys) => {
        for (const k of keys) {
          const val = item[k];
          if (val !== undefined && val !== null && String(val).trim() !== '') return val;
        }
        return '';
      };

      // Helper: normalisasi nomor HP (tangani format angka Excel yang besar)
      const normalizePhone = (val) => {
        if (!val && val !== 0) return '';
        // Jika angka (Excel menyimpan HP sebagai number)
        let str = String(val).trim();
        // Tangani scientific notation: mis. 6.28e+11
        if (str.includes('e') || str.includes('E')) {
          str = Number(val).toFixed(0);
        }
        // Jika dimulai dengan 62, ganti jadi 0
        if (str.startsWith('62')) str = '0' + str.slice(2);
        return str;
      };

      const mapped = data.map(item => ({
        student_name: pick(item, 'Nama Siswa', 'Nama', 'NAMA', 'name', 'Name', 'NAMA SISWA'),
        school: pick(item, 'Asal Sekolah', 'Sekolah', 'SEKOLAH', 'school', 'School', 'ASAL SEKOLAH', 'Asal', 'ASAL'),
        phone: normalizePhone(pick(item,
          'No. Telepon', 'Telepon', 'WhatsApp', 'No Telepon', 'Nomor Telepon',
          'No HP', 'No. HP', 'Nomor HP', 'HP', 'Phone', 'No.Telepon',
          'TELEPON', 'NO HP', 'NO. HP', 'NO TELEPON', 'WHATSAPP', 'No. Hp', 'no hp'
        )),
        program: pick(item, 'Program', 'Tujuan', 'PROGRAM', 'program', 'Jurusan'),
        referral: pick(item, 'Referral', 'Referal', 'Sumber', 'REFERRAL', 'referral', 'Sumber Data'),
      })).filter(item => item.student_name);

      setUnregPreviewData(mapped);
    };
    reader.readAsBinaryString(file);
  };


  const handleUnregConfirmImport = async () => {
    if (isManager && !unregSelectedStaff) {
      alert('Silakan pilih Staff PIC untuk data ini');
      return;
    }
    setUnregImportLoading(true);
    const staffObj = marketingStaff.find(s => s.id === unregSelectedStaff);
    const finalStudents = unregPreviewData.map(l => ({
      ...l,
      staff_id: isManager ? unregSelectedStaff : user.id,
      staff_name: isManager ? staffObj?.name : user.name
    }));
    const result = await importUnregisteredStudents(finalStudents);
    setUnregImportLoading(false);
    if (result.success) {
      setIsUnregImportModalOpen(false);
      setUnregPreviewData([]);
      setUnregSelectedStaff('');
      alert(`✅ Berhasil mengimpor ${finalStudents.length} data siswa belum daftar!`);
    } else {
      alert('❌ Gagal mengimpor: ' + result.error);
    }
  };

  const handleConvertUnregToLead = async (student) => {
    if (window.confirm(`Pindahkan "${student.student_name}" ke Rekap Leads untuk diproses follow-up?`)) {
      setUnregImportLoading(true);
      const result = await convertUnregisteredToLead(student);
      setUnregImportLoading(false);
      if (result.success) {
        alert('✅ Berhasil dipindahkan ke Rekap Leads!');
      } else {
        alert('❌ Gagal: ' + result.error);
      }
    }
  };

  const handleConvertAllUnregToLeads = async () => {
    const visible = filteredUnreg;
    if (visible.length === 0) return;
    if (window.confirm(`Pindahkan SEMUA (${visible.length}) siswa yang tampil ke Rekap Leads?`)) {
      setUnregImportLoading(true);
      const result = await convertAllUnregisteredToLeads(visible);
      setUnregImportLoading(false);
      if (result.success) {
        alert(`✅ ${visible.length} siswa berhasil dipindahkan ke Rekap Leads!`);
      } else {
        alert('❌ Gagal: ' + result.error);
      }
    }
  };

  const handleDeleteAllUnreg = async () => {
    if (!window.confirm('⚠️ Hapus SELURUH data Siswa Belum Daftar? Tindakan ini tidak dapat dibatalkan.')) return;
    setUnregImportLoading(true);
    const result = await deleteAllUnregisteredStudents();
    setUnregImportLoading(false);
    if (result.success) {
      alert('✅ Semua data berhasil dihapus.');
    } else {
      alert('❌ Gagal: ' + result.error);
    }
  };

  const filteredUnreg = unregisteredStudents.filter(s => {
    const term = unregSearchTerm.toLowerCase();
    return s.student_name?.toLowerCase().includes(term) || s.school?.toLowerCase().includes(term);
  });

  // Handler: Parsing Excel (Leads Recap)
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

  // --- Handlers Broadcast WA ---
  const handleToggleSelect = (id) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const eligibleIds = filteredLeads
      .filter(l => l.phone)
      .map(l => l.id);
    if (selectedLeadIds.size === eligibleIds.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(eligibleIds));
    }
  };

  const selectedLeads = filteredLeads.filter(l => selectedLeadIds.has(l.id) && l.phone);
  const allEligibleSelected = filteredLeads.filter(l => l.phone).length > 0 &&
    filteredLeads.filter(l => l.phone).every(l => selectedLeadIds.has(l.id));

  const handleStartBroadcast = () => {
    if (selectedLeads.length === 0) return;
    // Reset index dan buka WA pertama langsung di sini
    broadcastIndexRef.current = 0;
    const leads = selectedLeads; // snapshot saat ini
    setIsBroadcastModalOpen(false);

    const first = leads[0];
    let cleanPhone = first.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const personalizedMsg = broadcastMessage.replace(/{nama}/gi, first.student_name);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMsg)}`, '_blank');
    broadcastIndexRef.current = 1;
    setBroadcastProgress({ current: 1, total: leads.length });
  };

  const sendNextWA = () => {
    const idx = broadcastIndexRef.current;
    const leads = filteredLeads.filter(l => selectedLeadIds.has(l.id) && l.phone);
    if (idx >= leads.length) {
      setBroadcastProgress(null);
      setSelectedLeadIds(new Set());
      return;
    }
    const lead = leads[idx];
    let cleanPhone = lead.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    const personalizedMsg = broadcastMessage.replace(/{nama}/gi, lead.student_name);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(personalizedMsg)}`;
    window.open(waUrl, '_blank');
    broadcastIndexRef.current = idx + 1;
    setBroadcastProgress({ current: idx + 1, total: leads.length });
  };

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
          {/* Tombol Data Belum Daftar */}
          <button
            onClick={() => setIsUnregPanelOpen(true)}
            className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 hover:scale-[1.02] active:scale-95 transition-all outline-none"
            title="Lihat Data Siswa Belum Pernah Mendaftar"
          >
            <AlertTriangle className="w-4 h-4" />
            Belum Daftar
            {unregisteredStudents.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unregisteredStudents.length > 99 ? '99+' : unregisteredStudents.length}
              </span>
            )}
          </button>

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
            {/* Tombol Pilih Semua & Broadcast */}
            <button
              onClick={handleSelectAll}
              title={allEligibleSelected ? 'Batalkan Semua Pilihan' : 'Pilih Semua Nomor'}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all outline-none",
                allEligibleSelected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-600"
              )}
            >
              {allEligibleSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              <span className="hidden sm:inline">{allEligibleSelected ? 'Batal Pilih' : 'Pilih Semua'}</span>
            </button>
            {selectedLeadIds.size > 0 && (
              <button
                onClick={() => setIsBroadcastModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-[1.02] active:scale-95 transition-all outline-none"
              >
                <Zap className="w-4 h-4" />
                Broadcast WA ({selectedLeadIds.size})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-4 py-4 font-bold text-slate-900 text-sm w-10">
                  <span className="sr-only">Pilih</span>
                </th>
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
                
                const isSelected = selectedLeadIds.has(lead.id);
                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={lead.id} 
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors border-b border-slate-50 group",
                    isLunas && "bg-slate-50/80",
                    isSelected && "bg-emerald-50/60 hover:bg-emerald-50/80"
                  )}
                >
                  {/* Checkbox Pilih */}
                  <td className="px-4 py-4">
                    {lead.phone ? (
                      <button
                        onClick={() => handleToggleSelect(lead.id)}
                        className={cn(
                          "w-5 h-5 rounded flex items-center justify-center border-2 transition-all",
                          isSelected
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 hover:border-emerald-400"
                        )}
                        title={isSelected ? 'Batalkan Pilihan' : 'Pilih untuk Broadcast WA'}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    ) : (
                      <span className="w-5 h-5 flex items-center justify-center text-slate-200 text-xs" title="Tidak ada nomor HP">—</span>
                    )}
                  </td>
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
                  <td colSpan={isManager ? 10 : 9} className="px-6 py-20 text-center text-slate-400 italic">
                    Belum ada data leads untuk ditampilkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FLOATING BAR: Progress Broadcast */}
      <AnimatePresence>
        {broadcastProgress && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-[340px]"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Mengirim Broadcast WA</p>
              <p className="text-xs text-slate-400">
                {broadcastProgress.current} dari {broadcastProgress.total} siswa telah dibuka
              </p>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500 rounded-full"
                  animate={{ width: `${(broadcastProgress.current / broadcastProgress.total) * 100}%` }}
                  transition={{ type: 'spring', stiffness: 100 }}
                />
              </div>
            </div>
            {broadcastProgress.current < broadcastProgress.total ? (
              <button
                onClick={sendNextWA}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                Kirim Berikutnya
              </button>
            ) : (
              <button
                onClick={() => { setBroadcastProgress(null); setSelectedLeadIds(new Set()); }}
                className="px-4 py-2 bg-slate-600 text-white rounded-xl text-xs font-bold hover:bg-slate-500 transition-all"
              >
                Selesai ✓
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Broadcast WhatsApp */}
      <AnimatePresence>
        {isBroadcastModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Send className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Broadcast WhatsApp</h3>
                    <p className="text-xs text-emerald-700 font-medium">{selectedLeads.length} siswa dipilih</p>
                  </div>
                </div>
                <button onClick={() => setIsBroadcastModalOpen(false)} className="p-2 text-slate-400 hover:bg-white/60 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Info penerima */}
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 space-y-2 max-h-36 overflow-y-auto">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Daftar Penerima</p>
                  {selectedLeads.map((lead, i) => (
                    <div key={lead.id} className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{lead.student_name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto shrink-0">{lead.phone}</span>
                    </div>
                  ))}
                </div>

                {/* Template pesan */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    Template Pesan
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={5}
                    placeholder="Tulis pesan broadcast di sini. Gunakan {nama} untuk nama siswa otomatis."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                  />
                  <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                    <span className="font-bold text-emerald-600">{'{nama}'}</span> akan otomatis diganti dengan nama masing-masing siswa.
                  </p>
                </div>

                {/* Cara kerja */}
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 flex gap-2">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Setelah klik <strong>Mulai Kirim</strong>, WhatsApp akan terbuka per siswa. Klik <strong>"Kirim Berikutnya"</strong> di notifikasi bawah untuk melanjutkan ke siswa berikutnya setelah Anda mengirim pesan.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleStartBroadcast}
                  disabled={selectedLeads.length === 0 || !broadcastMessage.trim()}
                  className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  Mulai Kirim ke {selectedLeads.length} Siswa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

      {/* ══════════════════════════════════════════════════════════════════
          SLIDE-OVER PANEL: Siswa Belum Pernah Mendaftar
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isUnregPanelOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUnregPanelOpen(false)}
              className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-[95] w-full max-w-4xl bg-white shadow-2xl flex flex-col"
            >
              {/* Panel Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-200">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Siswa Belum Pernah Mendaftar</h2>
                    <p className="text-xs text-amber-700 font-medium">
                      {filteredUnreg.length} dari {unregisteredStudents.length} data — Import, Follow-up, lalu Konversi ke Leads
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tombol Import Excel */}
                  <button
                    onClick={() => setIsUnregImportModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-amber-200 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-50 transition-all shadow-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Import Excel
                  </button>
                  {/* Tombol Konversi Semua */}
                  {filteredUnreg.length > 0 && (
                    <button
                      onClick={handleConvertAllUnregToLeads}
                      disabled={unregImportLoading}
                      className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50"
                    >
                      <ArrowRightCircle className="w-4 h-4" />
                      Pindahkan Semua ke Leads ({filteredUnreg.length})
                    </button>
                  )}
                  {/* Tombol Hapus Semua (Manager) */}
                  {isManager && unregisteredStudents.length > 0 && (
                    <button
                      onClick={handleDeleteAllUnreg}
                      disabled={unregImportLoading}
                      className="flex items-center gap-2 px-3 py-2.5 bg-white border border-red-200 text-red-500 rounded-xl text-sm font-bold hover:bg-red-50 transition-all"
                      title="Hapus Semua Data"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsUnregPanelOpen(false)}
                    className="p-2.5 text-slate-400 hover:bg-white rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Notifikasi cara kerja */}
              <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3 shrink-0">
                <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Cara Kerja:</strong> Import data siswa belum daftar → hubungi via WhatsApp → klik <strong>Pindahkan ke Leads</strong> agar masuk ke alur rekap follow-up.
                </p>
              </div>

              {/* Search bar */}
              <div className="px-5 py-3 border-b border-slate-100 shrink-0">
                <div className="relative max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama atau sekolah..."
                    value={unregSearchTerm}
                    onChange={(e) => setUnregSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Tabel */}
              <div className="flex-1 overflow-y-auto">
                {filteredUnreg.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-20">
                    <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center">
                      <AlertTriangle className="w-10 h-10 text-amber-300" />
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-500 text-lg">Belum Ada Data</p>
                      <p className="text-sm mt-1">Klik <strong className="text-amber-600">Import Excel</strong> untuk menambahkan data siswa yang belum pernah mendaftar</p>
                    </div>
                    <button
                      onClick={() => setIsUnregImportModalOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all"
                    >
                      <Upload className="w-4 h-4" />
                      Import Sekarang
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">#</th>
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">Nama Siswa</th>
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">Telepon & Sekolah</th>
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">Program</th>
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">Referral</th>
                        {isManager && <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide">PIC</th>}
                        <th className="px-5 py-3.5 font-bold text-slate-700 text-xs uppercase tracking-wide text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnreg.map((student, idx) => (
                        <motion.tr
                          key={student.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="hover:bg-amber-50/40 transition-colors border-b border-slate-50 group"
                        >
                          <td className="px-5 py-4">
                            <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{student.student_name}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              {student.phone ? (
                                <button
                                  onClick={() => handleWhatsApp(student.phone)}
                                  className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs hover:text-emerald-700 transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  {student.phone}
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400 italic">— no HP</span>
                              )}
                              <p className="text-[11px] text-slate-400 italic flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {student.school || '—'}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 bg-violet-50 text-violet-700 ring-violet-100 italic">
                              {student.program || 'N/A'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-[11px] font-bold text-indigo-600 uppercase">
                              {student.referral || '—'}
                            </p>
                          </td>
                          {isManager && (
                            <td className="px-5 py-4">
                              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-300" />
                                {student.staff_name}
                              </span>
                            </td>
                          )}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Tombol WA */}
                              {student.phone && (
                                <button
                                  onClick={() => handleWhatsApp(student.phone)}
                                  className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                                  title="Hubungi via WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </button>
                              )}
                              {/* Tombol Pindahkan ke Leads */}
                              <button
                                onClick={() => handleConvertUnregToLead(student)}
                                disabled={unregImportLoading}
                                className="p-2 bg-violet-50 text-violet-600 hover:bg-violet-600 hover:text-white rounded-lg transition-all shadow-sm disabled:opacity-50"
                                title="Pindahkan ke Rekap Leads"
                              >
                                <ArrowRightCircle className="w-4 h-4" />
                              </button>
                              {/* Tombol Hapus */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus data "${student.student_name}"?`)) {
                                    deleteUnregisteredStudent(student.id);
                                  }
                                }}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Hapus Data"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Panel Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-slate-500 font-medium">
                    <span className="font-bold text-amber-600">{filteredUnreg.length}</span> siswa belum mendaftar
                  </p>
                  {/* Tombol Hapus Semua — aktif hanya Manager */}
                  <button
                    onClick={isManager ? handleDeleteAllUnreg : undefined}
                    disabled={!isManager || unregImportLoading || unregisteredStudents.length === 0}
                    title={!isManager ? 'Hanya Manager yang dapat menghapus semua data' : 'Hapus seluruh data siswa belum daftar'}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isManager && unregisteredStudents.length > 0
                        ? 'bg-white border-red-200 text-red-500 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm'
                        : 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus Semua
                    {!isManager && <span className="ml-0.5">🔒</span>}
                  </button>
                </div>

                {filteredUnreg.length > 0 && (
                  <button
                    onClick={handleConvertAllUnregToLeads}
                    disabled={unregImportLoading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 shadow-lg shadow-violet-200 transition-all disabled:opacity-50"
                  >
                    <ArrowRightCircle className="w-4 h-4" />
                    {unregImportLoading ? 'Memproses...' : `Pindahkan Semua (${filteredUnreg.length}) ke Leads`}
                  </button>
                )}
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: Import Excel — Siswa Belum Daftar
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isUnregImportModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-xl">Import Data Siswa Belum Daftar</h3>
                    <p className="text-xs text-slate-500 italic">Format: Nama Siswa, Sekolah, No. Telepon, Program, Referral</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsUnregImportModalOpen(false); setUnregPreviewData([]); }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[60vh] space-y-6">
                {/* Pilih Staff (Manager) */}
                {isManager && (
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <UserPlus className="w-4 h-4" />
                      Pilih Staff PIC Penugasan
                    </label>
                    <select
                      value={unregSelectedStaff}
                      onChange={(e) => setUnregSelectedStaff(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                    >
                      <option value="">Pilih Staff Penerima Data...</option>
                      {marketingStaff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}

                {/* Upload Area */}
                <div className={cn(
                  "border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center transition-all",
                  unregPreviewData.length > 0 ? "border-amber-200 bg-amber-50/20" : "border-slate-200 hover:border-amber-300 hover:bg-amber-50/20"
                )}>
                  {unregPreviewData.length > 0 ? (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-amber-600" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-lg">{unregPreviewData.length} Data Terbaca</h4>
                      <button
                        onClick={() => setUnregPreviewData([])}
                        className="text-sm text-red-500 font-bold hover:underline"
                      >
                        Ganti File
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-amber-300" />
                      </div>
                      <p className="text-slate-500 text-sm mb-4 text-center">Pilih file Excel berisi data siswa yang belum mendaftar</p>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleUnregFileUpload}
                        className="hidden"
                        id="unreg-excel-input"
                      />
                      <label
                        htmlFor="unreg-excel-input"
                        className="px-8 py-2.5 bg-white border border-amber-200 rounded-xl font-bold text-amber-700 hover:shadow-md transition-all cursor-pointer"
                      >
                        Pilih File Excel
                      </label>
                    </>
                  )}
                </div>

                {/* Preview */}
                {unregPreviewData.length > 0 && (
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
                          {unregPreviewData.slice(0, 3).map((item, i) => (
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

              {/* Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400 font-medium">Bantuan? Tanyakan Admin IT</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setIsUnregImportModalOpen(false); setUnregPreviewData([]); }}
                    className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUnregConfirmImport}
                    disabled={unregImportLoading || unregPreviewData.length === 0}
                    className="px-10 py-2.5 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 disabled:opacity-50 disabled:grayscale shadow-lg shadow-amber-200 transition-all flex items-center gap-2"
                  >
                    {unregImportLoading ? 'Memproses...' : 'Simpan Sekarang'}
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
