import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2, Users, MessageCircle, CheckCircle2,
  RefreshCw, Filter, TrendingUp, Award, Calendar, Lock,
  Trash2, Database, Download, FileText, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useStore } from '../store/useStore';
import StaffMonitorCard from '../components/StaffMonitorCard';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) { return twMerge(clsx(inputs)); }

function StatBanner({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-2xl p-6 border flex items-center gap-5', bg)}
    >
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0', color)}>
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-black text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

export default function MonitoringList() {
  const {
    user,
    marketingStaff, fetchMarketingStaff,
    activityReports, fetchActivityReports,
    deleteReportById, deleteAllReports,
    isMarketingLoading
  } = useStore();

  const [actionLoading, setActionLoading] = useState(null);

  const handleClearAll = async () => {
    if (!window.confirm('⚠️ PERINGATAN: Anda akan menghapus SELURUH data laporan. Tindakan ini tidak bisa dibatalkan. Lanjutkan?')) return;
    if (!window.confirm('KONFIRMASI TERAKHIR: Hapus semua data laporan sekarang?')) return;
    
    const result = await deleteAllReports();
    if (result.success) {
      alert('✅ Berhasil: Semua data laporan telah dibersihkan.');
      fetchActivityReports();
    } else {
      alert('❌ Gagal: ' + result.error);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Hapus laporan ini?')) return;
    setActionLoading(id);
    const result = await deleteReportById(id);
    if (!result.success) {
      alert('❌ Gagal menghapus: ' + result.error);
    } else {
      fetchActivityReports();
    }
    setActionLoading(null);
  };

  const handleExportExcel = () => {
    const dataToExport = tableRows.map(r => ({
      Tanggal: new Date(r.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      Staff: r.staff_name,
      'Follow-up': r.leads_followed_up,
      Merespon: r.leads_responded,
      Konversi: r.leads_converted,
      Hambatan: r.obstacles || '',
      Rencana: r.next_day_plan || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
    XLSX.writeFile(workbook, `Laporan_Marketing.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(16);
    doc.text("Laporan Aktivitas Marketing", 14, 20);
    
    const tableColumn = ["Tanggal", "Staff", "Follow-up", "Merespon", "Konversi", "Hambatan", "Rencana"];
    const tableRowsData = [];

    tableRows.forEach(r => {
      const rowData = [
        new Date(r.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
        r.staff_name,
        r.leads_followed_up,
        r.leads_responded,
        r.leads_converted,
        r.obstacles || '',
        r.next_day_plan || ''
      ];
      tableRowsData.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRowsData,
      startY: 25,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });
    
    doc.save(`Laporan_Marketing.pdf`);
  };

  const isManager = user?.role === 'Manager';

  const [filterStaff, setFilterStaff] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('cards');

  useEffect(() => {
    fetchMarketingStaff();
    fetchActivityReports();
  }, []);

  // ── Filter by period ───────────────────────────────────────────────────
  const getFilteredReports = () => {
    let reports = [...activityReports];
    const now = new Date();

    // Non-manager: always scope to own name only
    if (!isManager) {
      reports = reports.filter(r => r.staff_name === user?.name);
    }

    if (filterPeriod === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      reports = reports.filter(r => r.report_date === todayStr);
    } else if (filterPeriod === 'week') {
      const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
      reports = reports.filter(r => new Date(r.report_date) >= weekAgo);
    } else if (filterPeriod === 'month') {
      const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);
      reports = reports.filter(r => new Date(r.report_date) >= monthAgo);
    }
    return reports;
  };

  const filteredReports = getFilteredReports();

  // ── Aggregated stats (scoped to what's visible) ────────────────────────
  const totalFollowUp  = filteredReports.reduce((s, r) => s + (r.leads_followed_up || 0), 0);
  const totalResponded = filteredReports.reduce((s, r) => s + (r.leads_responded   || 0), 0);
  const totalConverted = filteredReports.reduce((s, r) => s + (r.leads_converted   || 0), 0);
  const responseRate   = totalFollowUp > 0 ? ((totalResponded / totalFollowUp) * 100).toFixed(1) : '0';
  const conversionRate = totalFollowUp > 0 ? ((totalConverted / totalFollowUp) * 100).toFixed(1) : '0';

  // ── Staff list visible to this user ───────────────────────────────────
  const visibleStaff = isManager
    ? marketingStaff.filter(s => s.is_active && (filterStaff === 'all' || s.id === filterStaff))
    : marketingStaff.filter(s => s.is_active && s.name?.toLowerCase() === user?.name?.toLowerCase());

  const getStaffReports = (staffId) => {
    const staffName = marketingStaff.find(s => s.id === staffId)?.name;
    return filteredReports.filter(r => r.staff_id === staffId || r.staff_name === staffName);
  };

  // ── Top performer (Manager only) ───────────────────────────────────────
  const topPerformer = isManager
    ? marketingStaff
        .filter(s => s.is_active)
        .map(s => {
          const reports = activityReports.filter(r => r.staff_name === s.name);
          const conv = reports.reduce((acc, r) => acc + (r.leads_converted || 0), 0);
          return { ...s, conv };
        })
        .sort((a, b) => b.conv - a.conv)[0]
    : null;

  // ── Table rows: also filter by staff picker (manager) ─────────────────
  const tableRows = filteredReports
    .sort((a, b) => new Date(b.report_date) - new Date(a.report_date))
    .filter(r => {
      if (!isManager) return true; // already pre-filtered above
      return filterStaff === 'all' || r.staff_name === marketingStaff.find(s => s.id === filterStaff)?.name;
    });

  const periodOptions = [
    { value: 'all',   label: 'Semua Waktu' },
    { value: 'today', label: 'Hari Ini' },
    { value: 'week',  label: '7 Hari Terakhir' },
    { value: 'month', label: '30 Hari Terakhir' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <BarChart2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">List Monitoring</h1>
            <p className="text-slate-500 text-sm">
              {isManager
                ? 'Ringkasan performa & evaluasi seluruh tim marketing'
                : `Progress aktivitas Anda — ${user?.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Role badge */}
          <span className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border',
            isManager
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          )}>
            {isManager ? '👑 Manager View' : <><Lock className="w-3 h-3" /> Staff View</>}
          </span>

          <button
            onClick={() => { fetchMarketingStaff(); fetchActivityReports(); }}
            disabled={isMarketingLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', isMarketingLoading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Stats Banner ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className={cn(
          'grid gap-4',
          isManager
            ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-5'
            : 'grid-cols-1 sm:grid-cols-3'
        )}
      >
        <StatBanner
          icon={Users}
          label={isManager ? 'Total Follow-up Tim' : 'Total Follow-up Saya'}
          value={totalFollowUp.toLocaleString()}
          sub={isManager ? 'Seluruh staff' : 'Semua periode'}
          color="bg-indigo-600"
          bg="bg-white border-slate-200 shadow-sm"
        />
        <StatBanner
          icon={MessageCircle}
          label="Total Merespon"
          value={totalResponded.toLocaleString()}
          sub={`Response Rate: ${responseRate}%`}
          color="bg-emerald-500"
          bg="bg-white border-slate-200 shadow-sm"
        />
        <StatBanner
          icon={CheckCircle2}
          label="Total Konversi"
          value={totalConverted.toLocaleString()}
          sub={`Conversion Rate: ${conversionRate}%`}
          color="bg-violet-600"
          bg="bg-white border-slate-200 shadow-sm"
        />

        {/* Extra cards for Manager only */}
        {isManager && (
          <>
            <StatBanner
              icon={TrendingUp}
              label="Response Rate Tim"
              value={`${responseRate}%`}
              sub="Rata-rata semua staff"
              color="bg-sky-500"
              bg="bg-white border-slate-200 shadow-sm"
            />
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-600">Top Performer</p>
                <p className="text-base font-black text-amber-900 leading-tight">
                  {topPerformer?.name || '—'}
                </p>
                <p className="text-xs text-amber-500 mt-0.5">{topPerformer?.conv || 0} konversi</p>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
          <Filter className="w-4 h-4" />
          Filter:
        </div>

        {/* Period filter */}
        <div className="flex gap-1.5 flex-wrap">
          {periodOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilterPeriod(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                filterPeriod === opt.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Staff filter — Manager only */}
        {isManager && (
          <>
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterStaff('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filterStaff === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                Semua Staff
              </button>
              {marketingStaff.filter(s => s.is_active).map(s => (
                <button
                  key={s.id}
                  onClick={() => setFilterStaff(s.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                    filterStaff === s.id ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* Hapus Semua & Export Buttons — Manager Only */}
            <div className="h-5 w-px bg-slate-200 hidden sm:block mx-1" />
            
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-100"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel
            </button>
            
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all border border-sky-100"
              title="Download PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 ml-1"
              title="Hapus seluruh data laporan harian"
            >
              <Database className="w-3.5 h-3.5" />
              Bersihkan Data
            </button>
          </>
        )}

        {/* View toggle */}
        <div className="ml-auto flex gap-1.5">
          {['cards', 'table'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                activeTab === tab ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {tab === 'cards' ? '📊 Kartu' : '📋 Tabel'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      {isMarketingLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        </div>

      ) : activeTab === 'cards' ? (
        /* ── Cards view ── */
        <div className={cn(
          'grid gap-6',
          isManager ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl'
        )}>
          {visibleStaff.length === 0 ? (
            <div className="col-span-2 text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {isManager
                  ? 'Belum ada data staff aktif'
                  : 'Nama akun Anda belum terdaftar di marketing staff'}
              </p>
              {!isManager && (
                <p className="text-xs mt-1 text-slate-300">
                  Pastikan nama akun login sama persis dengan nama staff di database.
                </p>
              )}
            </div>
          ) : (
            visibleStaff.map((staff, idx) => (
              <StaffMonitorCard
                key={staff.id}
                staff={staff}
                reports={getStaffReports(staff.id)}
                index={idx}
              />
            ))
          )}
        </div>

      ) : (
        /* ── Table view ── */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h3 className="font-semibold text-slate-800">Riwayat Laporan Detail</h3>
            <span className="ml-auto text-xs text-slate-400">{tableRows.length} laporan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Tanggal',
                    ...(isManager ? ['Staff'] : []),
                    'Follow-up', 'Merespon', 'Konversi',
                    'Resp. Rate', 'Conv. Rate', 'Hambatan', 'Rencana',
                    ...(isManager ? ['Aksi'] : [])
                  ].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.map(r => {
                  const rr = r.leads_followed_up > 0 ? ((r.leads_responded / r.leads_followed_up) * 100).toFixed(1) : '0';
                  const cr = r.leads_followed_up > 0 ? ((r.leads_converted / r.leads_followed_up) * 100).toFixed(1) : '0';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-medium text-slate-600">
                          {new Date(r.report_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      {isManager && (
                        <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{r.staff_name}</td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{r.leads_followed_up}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">{r.leads_responded}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-bold">{r.leads_converted}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-bold',
                          Number(rr) >= 50 ? 'bg-emerald-50 text-emerald-700' :
                          Number(rr) >= 25 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        )}>{rr}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-bold',
                          Number(cr) >= 25 ? 'bg-emerald-50 text-emerald-700' :
                          Number(cr) >= 10 ? 'bg-sky-50 text-sky-700' : 'bg-slate-100 text-slate-600'
                        )}>{cr}%</span>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs text-slate-500 truncate">{r.obstacles || '—'}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[160px]">
                        <p className="text-xs text-slate-500 truncate">{r.next_day_plan || '—'}</p>
                      </td>
                      {isManager && (
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            disabled={actionLoading === r.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all flex items-center justify-center"
                            title="Hapus baris ini"
                          >
                            <Trash2 className={cn("w-4 h-4", actionLoading === r.id && "animate-pulse")} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {tableRows.length === 0 && (
                  <tr>
                    <td colSpan={isManager ? 9 : 8} className="px-4 py-12 text-center text-slate-400 text-sm">
                      Belum ada laporan pada periode ini
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
