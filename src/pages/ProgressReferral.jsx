import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Search, Users, Phone, MessageCircle, MapPin, CheckCircle2, X, Trophy, Crown, Star, ChevronDown, ChevronUp, Award, Sparkles, UserCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

export default function ProgressReferral() {
  const { user, leadsRecap, fetchLeadsRecap, addReferralLog } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [promotorSearch, setPromotorSearch] = useState('');
  const [expandedPromotor, setExpandedPromotor] = useState(null);
  
  // Form State
  const [studentResponse, setStudentResponse] = useState('');
  const [staffAction, setStaffAction] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLeadsRecap();
  }, [user]);

  // Filter students who are 'PANGKAL LUNAS' and arrival_status === 'AKTIF'
  const referralCandidates = leadsRecap.filter(l => 
    l.note?.toUpperCase().includes('PANGKAL LUNAS') && 
    l.arrival_status === 'AKTIF'
  );

  const filteredCandidates = referralCandidates.filter(c => {
    const term = searchTerm.toLowerCase();
    return c.student_name?.toLowerCase().includes(term) || 
           c.school?.toLowerCase().includes(term) ||
           c.staff_name?.toLowerCase().includes(term);
  });

  const getReferralCount = (studentName) => {
    return leadsRecap.filter(l => 
      l.referred_by === studentName && 
      l.note?.toUpperCase().includes('PANGKAL LUNAS')
    ).length;
  };

  // ═══════════════════════════════════════════════════════════════
  // PROMOTOR LOGIC — Siswa Aktif yang berhasil mereferensikan
  // ═══════════════════════════════════════════════════════════════
  const promotorData = useMemo(() => {
    // Ambil semua leads yang punya referred_by (artinya direferensikan oleh seseorang)
    const referredLeads = leadsRecap.filter(l => l.referred_by && l.referred_by.trim() !== '');

    // Kelompokkan berdasarkan nama promotor (referred_by)
    const grouped = {};
    referredLeads.forEach(lead => {
      const promotorName = lead.referred_by.trim().toUpperCase();
      if (!grouped[promotorName]) {
        grouped[promotorName] = {
          promotorName,
          referrals: [],
          hasReward: false,
          totalPendaftaran: 0,
          totalPangkalLunas: 0,
        };
      }
      grouped[promotorName].referrals.push(lead);
      
      const noteUpper = lead.note?.toUpperCase() || '';
      if (noteUpper.includes('PANGKAL LUNAS')) {
        grouped[promotorName].totalPangkalLunas++;
        grouped[promotorName].hasReward = true;
      } else if (noteUpper.includes('PENDAFTARAN') || noteUpper.includes('PANGKAL 1')) {
        grouped[promotorName].totalPendaftaran++;
      }
    });

    // Cari data siswa aktif promotor dari referralCandidates / leadsRecap
    return Object.values(grouped).map(p => {
      const promotorLead = leadsRecap.find(l => 
        l.student_name?.toUpperCase() === p.promotorName &&
        l.note?.toUpperCase().includes('PANGKAL LUNAS') &&
        l.arrival_status === 'AKTIF'
      );
      return {
        ...p,
        promotorLead,
        staffName: promotorLead?.staff_name || p.referrals[0]?.staff_name || '—',
      };
    }).sort((a, b) => {
      // Prioritaskan yang punya reward
      if (a.hasReward !== b.hasReward) return a.hasReward ? -1 : 1;
      return b.referrals.length - a.referrals.length;
    });
  }, [leadsRecap]);

  const filteredPromotors = promotorData.filter(p => {
    const term = promotorSearch.toLowerCase();
    if (!term) return true;
    return p.promotorName.toLowerCase().includes(term) || 
           p.staffName?.toLowerCase().includes(term) ||
           p.referrals.some(r => r.student_name?.toLowerCase().includes(term));
  });

  const promotorStats = useMemo(() => ({
    totalPromotors: promotorData.length,
    totalReferrals: promotorData.reduce((sum, p) => sum + p.referrals.length, 0),
    rewardEligible: promotorData.filter(p => p.hasReward).length,
    totalPangkalLunas: promotorData.reduce((sum, p) => sum + p.totalPangkalLunas, 0),
  }), [promotorData]);

  const getReferralStatusInfo = (lead) => {
    const noteUpper = lead.note?.toUpperCase() || '';
    if (noteUpper.includes('PANGKAL LUNAS')) {
      return {
        label: 'Telah membayar pangkal',
        color: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        isComplete: true,
      };
    }
    if (noteUpper.includes('PANGKAL 1')) {
      return {
        label: 'DP Pangkal (Sebagian)',
        color: 'bg-amber-50 text-amber-700 ring-amber-200',
        icon: <Star className="w-3.5 h-3.5" />,
        isComplete: false,
      };
    }
    if (noteUpper.includes('PENDAFTARAN')) {
      return {
        label: 'Telah melakukan Pendaftaran',
        color: 'bg-blue-50 text-blue-700 ring-blue-200',
        icon: <UserCheck className="w-3.5 h-3.5" />,
        isComplete: false,
      };
    }
    return {
      label: lead.note || 'Dalam Proses',
      color: 'bg-slate-50 text-slate-600 ring-slate-200',
      icon: null,
      isComplete: false,
    };
  };

  const handleOpenModal = (lead) => {
    setSelectedLead(lead);
    setStudentResponse('');
    setStaffAction('');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleActionChange = async (e) => {
    const val = e.target.value;
    if (val === 'Join') {
      if (window.confirm('Arahkan ke form Daftar Manual untuk menginput data teman yang direferensikan?')) {
        // Jika sudah ada respon siswa yang diisi, simpan log nya sekalian
        if (studentResponse) {
          await addReferralLog({
            lead_id: selectedLead.id,
            student_name: selectedLead.student_name,
            school: selectedLead.school,
            program: selectedLead.program,
            activity_date: new Date().toISOString().split('T')[0],
            student_response: studentResponse,
            staff_action: 'Join (Daftar Manual)',
            notes: notes,
            pic_staff: user?.name || selectedLead.staff_name
          });
        }
        setIsModalOpen(false);
        navigate(`/recap?action=manual&referrer=${encodeURIComponent(selectedLead.student_name)}`);
      } else {
        setStaffAction('');
      }
    } else {
      setStaffAction(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentResponse || !staffAction) return;

    setIsSubmitting(true);
    
    // Simpan ke DB
    await addReferralLog({
      lead_id: selectedLead.id,
      student_name: selectedLead.student_name,
      school: selectedLead.school,
      program: selectedLead.program,
      activity_date: new Date().toISOString().split('T')[0],
      student_response: studentResponse,
      staff_action: staffAction,
      notes: notes,
      pic_staff: user?.name || selectedLead.staff_name
    });

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Gift className="w-7 h-7 text-pink-500" />
            Progress Referral
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Daftar siswa yang sudah Lunas Pangkal & Sudah di Kampus. Follow-up untuk program Referral.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Kandidat Referral</p>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-black text-slate-900">{referralCandidates.length}</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-100">
              Siap dihubungi
            </span>
          </div>
        </div>
        <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center">
          <Gift className="w-8 h-8 text-pink-500" />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari nama, sekolah, atau PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Nama Siswa</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Telepon & Sekolah</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Program</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">Status Kampus</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide">PIC Marketing</th>
                <th className="px-6 py-4 font-bold text-slate-900 text-xs uppercase tracking-wide text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map((lead, idx) => {
                const refCount = getReferralCount(lead.student_name);
                return (
                <motion.tr 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={lead.id} 
                  className="hover:bg-slate-50/50 transition-colors border-b border-slate-50 group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{lead.student_name}</p>
                      {refCount > 0 && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md ring-1 ring-amber-200">
                          [{refCount} Referensi]
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Didaftarkan: {lead.created_at ? new Date(lead.created_at).toLocaleDateString('id-ID') : '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="flex items-center gap-2 font-bold text-xs text-emerald-600">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {lead.phone || '—'}
                      </span>
                      <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {lead.school || '—'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 ring-1 ring-violet-100 italic">
                      {lead.program || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      SUDAH DI KAMPUS
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {lead.staff_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenModal(lead)}
                      disabled={!lead.phone}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm",
                        lead.phone 
                          ? "bg-pink-500 text-white hover:bg-pink-600 hover:scale-105 active:scale-95 shadow-pink-200" 
                          : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      )}
                    >
                      <Gift className="w-4 h-4" />
                      Tawarkan Referral
                    </button>
                  </td>
                </motion.tr>
              )})}
              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <Gift className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-slate-500 font-medium">Belum ada kandidat referral yang sesuai.</p>
                      <p className="text-sm text-slate-400 mt-1">Siswa harus berstatus PANGKAL LUNAS dan SUDAH DI KAMPUS.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION: PROMOTOR BERHASIL                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Promotor Berhasil
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Siswa aktif yang berhasil mereferensikan teman baru melalui program referral.
            </p>
          </div>
        </div>

        {/* Stats Cards Promotor */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2">Total Promotor</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-amber-800">{promotorStats.totalPromotors}</h3>
              <div className="p-2 bg-amber-100/80 rounded-xl">
                <Crown className="w-4 h-4 text-amber-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Total Referensi</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-blue-800">{promotorStats.totalReferrals}</h3>
              <div className="p-2 bg-blue-100/80 rounded-xl">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100 shadow-sm"
          >
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-2">Closing Pangkal</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-emerald-800">{promotorStats.totalPangkalLunas}</h3>
              <div className="p-2 bg-emerald-100/80 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-pink-50 to-rose-50 p-5 rounded-2xl border border-pink-100 shadow-sm relative overflow-hidden"
          >
            <p className="text-[10px] font-bold text-pink-600 uppercase tracking-wider mb-2">Berhak Reward</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-pink-800">{promotorStats.rewardEligible}</h3>
              <div className="p-2 bg-pink-100/80 rounded-xl relative">
                <Award className="w-4 h-4 text-pink-600" />
                {promotorStats.rewardEligible > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full animate-ping" />
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Promotor List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-slate-50/50">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari nama promotor atau referensi..."
                value={promotorSearch}
                onChange={(e) => setPromotorSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 w-full bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-50">
            {filteredPromotors.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <Trophy className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 font-medium">Belum ada Promotor.</p>
                  <p className="text-sm text-slate-400 mt-1">Promotor akan muncul ketika siswa aktif berhasil mereferensikan teman baru via Daftar Manual.</p>
                </div>
              </div>
            ) : (
              filteredPromotors.map((promotor, idx) => {
                const isExpanded = expandedPromotor === promotor.promotorName;
                return (
                  <motion.div
                    key={promotor.promotorName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    {/* Promotor Header Card */}
                    <button
                      onClick={() => setExpandedPromotor(isExpanded ? null : promotor.promotorName)}
                      className="w-full px-6 py-5 flex items-center justify-between hover:bg-amber-50/30 transition-all group text-left"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar / Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center relative shrink-0",
                          promotor.hasReward 
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50" 
                            : "bg-gradient-to-br from-slate-200 to-slate-300"
                        )}>
                          {promotor.hasReward ? (
                            <Crown className="w-6 h-6 text-white" />
                          ) : (
                            <Users className="w-6 h-6 text-white" />
                          )}
                          {promotor.hasReward && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white">
                              <Sparkles className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-slate-900 text-base">{promotor.promotorName}</p>
                            {promotor.hasReward && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 text-[10px] font-bold rounded-full ring-1 ring-amber-200 animate-pulse">
                                <Award className="w-3 h-3" />
                                BERHAK REWARD
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3 text-slate-400" />
                              PIC: {promotor.staffName}
                            </span>
                            <span className="text-[11px] text-slate-400">•</span>
                            <span className="text-[11px] font-bold text-violet-600">
                              {promotor.referrals.length} referensi
                            </span>
                            {promotor.totalPangkalLunas > 0 && (
                              <>
                                <span className="text-[11px] text-slate-400">•</span>
                                <span className="text-[11px] font-bold text-emerald-600">
                                  {promotor.totalPangkalLunas} lunas pangkal
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Progress Indicators */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          {promotor.referrals.slice(0, 5).map((ref, i) => {
                            const status = getReferralStatusInfo(ref);
                            return (
                              <div
                                key={i}
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full",
                                  status.isComplete ? "bg-emerald-500" :
                                  ref.note?.toUpperCase().includes('PENDAFTARAN') ? "bg-blue-400" :
                                  ref.note?.toUpperCase().includes('PANGKAL 1') ? "bg-amber-400" :
                                  "bg-slate-300"
                                )}
                                title={`${ref.student_name}: ${status.label}`}
                              />
                            );
                          })}
                          {promotor.referrals.length > 5 && (
                            <span className="text-[10px] text-slate-400 font-bold ml-0.5">+{promotor.referrals.length - 5}</span>
                          )}
                        </div>

                        <div className={cn(
                          "p-2 rounded-xl transition-all",
                          isExpanded ? "bg-amber-100 rotate-180" : "bg-slate-50 group-hover:bg-amber-50"
                        )}>
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Referral Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-5 space-y-2">
                            <div className="bg-slate-50/80 rounded-2xl p-4">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Daftar Teman yang Direferensikan
                              </p>
                              <div className="space-y-2.5">
                                {promotor.referrals.map((ref) => {
                                  const statusInfo = getReferralStatusInfo(ref);
                                  return (
                                    <div
                                      key={ref.id}
                                      className={cn(
                                        "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                                        statusInfo.isComplete 
                                          ? "bg-emerald-50/50 border-emerald-100" 
                                          : "bg-white border-slate-100"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                          statusInfo.isComplete 
                                            ? "bg-emerald-100" 
                                            : "bg-slate-100"
                                        )}>
                                          {statusInfo.isComplete ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          ) : (
                                            <UserCheck className="w-4 h-4 text-slate-400" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-bold text-slate-800 text-sm">{ref.student_name}</p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-slate-400">{ref.school || '—'}</span>
                                            {ref.program && (
                                              <>
                                                <span className="text-[10px] text-slate-300">•</span>
                                                <span className="text-[10px] text-violet-500 font-medium italic">{ref.program}</span>
                                              </>
                                            )}
                                            <span className="text-[10px] text-slate-300">•</span>
                                            <span className="text-[10px] text-slate-400">
                                              PIC: {ref.staff_name || '—'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={cn(
                                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold ring-1",
                                          statusInfo.color
                                        )}>
                                          {statusInfo.icon}
                                          {statusInfo.label}
                                        </span>
                                        {statusInfo.isComplete && (
                                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 rounded-lg text-[10px] font-bold ring-1 ring-amber-200 shadow-sm">
                                            <Trophy className="w-3 h-3" />
                                            Reward
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* MODAL INPUT PROGRESS REFERRAL */}
      <AnimatePresence>
        {isModalOpen && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                    <Gift className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xl">Progress Referral</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nama Siswa</label>
                    <input type="text" disabled value={selectedLead.student_name} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Program</label>
                    <input type="text" disabled value={selectedLead.program} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Asal Sekolah</label>
                    <input type="text" disabled value={selectedLead.school} className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed font-bold text-sm" />
                  </div>
                </div>

                <hr className="border-slate-100 my-4" />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Respon Siswa</label>
                    <select 
                      required
                      value={studentResponse}
                      onChange={(e) => setStudentResponse(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Pilih Respon...</option>
                      <option value="Tertarik">Tertarik</option>
                      <option value="Pikir-pikir dulu">Pikir-pikir dulu</option>
                      <option value="Menolak">Menolak</option>
                      <option value="Tidak dapat dihubungi">Tidak dapat dihubungi</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Tindakan Staff</label>
                    <select 
                      required
                      value={staffAction}
                      onChange={handleActionChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm font-bold"
                    >
                      <option value="">Pilih Tindakan...</option>
                      <option value="Kirim Brosur via WA">Kirim Brosur via WA</option>
                      <option value="Jadwalkan Telepon">Jadwalkan Telepon</option>
                      <option value="Tawarkan Bonus/Insentif">Tawarkan Bonus/Insentif</option>
                      <option value="Join">Join (Daftar Manual)</option>
                      <option value="Selesai">Selesai / Skip</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Catatan</label>
                    <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambahkan detail jika perlu..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-pink-500/20 outline-none transition-all text-sm resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all">Batal</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] py-3 text-sm font-bold text-white bg-pink-600 hover:bg-pink-700 rounded-xl transition-all disabled:opacity-50">
                    {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
