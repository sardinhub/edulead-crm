import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { kpiData as initialKpi } from './mockData';
import { syncReportToSheets } from '../lib/googleSheets';

export const useStore = create(
  persist(
    (set, get) => ({
  isAuthenticated: false,
  user: null,

  // ─── Auth (Supabase-backed) ───────────────────────────────────────────────────
  systemUsers: [],       // diisi oleh fetchSystemUsers
  isAuthLoading: false,

  login: async (email, password) => {
    set({ isAuthLoading: true });
    const { data, error } = await supabase
      .from('system_users')
      .select('id, name, email, role, is_active')
      .ilike('email', email.trim()) // Gunakan ilike agar case-insensitive (Fix Login iPad)
      .eq('password', password)
      .eq('is_active', true)
      .maybeSingle();

    set({ isAuthLoading: false });

    if (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Terjadi kesalahan sistem. Coba lagi.' };
    }
    if (!data) {
      return { success: false, error: 'Email atau Password salah, atau akun tidak aktif!' };
    }

    set({ isAuthenticated: true, user: data });

    // Record Login Activity
    const deviceInfo = navigator.userAgent;
    await supabase.from('login_logs').insert([{
      user_id: data.id,
      user_name: data.name,
      email: data.email,
      role: data.role,
      device_info: deviceInfo
    }]);

    return { success: true };
  },

  logout: () => set({ isAuthenticated: false, user: null }),

  // Daftarkan staff baru ke system_users + marketing_staff
  registerStaff: async ({ name, email, password, role }) => {
    set({ isAuthLoading: true });

    // 1. Insert ke system_users
    const { data: newUser, error: userErr } = await supabase
      .from('system_users')
      .insert([{ name, email, password, role }])
      .select()
      .single();

    if (userErr) {
      set({ isAuthLoading: false });
      console.error('Register error:', userErr);
      const msg = userErr.code === '23505'
        ? 'Email sudah terdaftar di sistem!'
        : userErr.message;
      return { success: false, error: msg };
    }

    // 3. Update local list
    set((state) => ({
      systemUsers: [...state.systemUsers, newUser],
      isAuthLoading: false,
    }));

    return { success: true, data: newUser };
  },

  // Ambil semua user dari DB (untuk halaman UserManagement)
  fetchSystemUsers: async () => {
    const { data, error } = await supabase
      .from('system_users')
      .select('id, name, email, role, is_active, created_at')
      .order('created_at', { ascending: true });
    if (!error && data) set({ systemUsers: data });
    else console.error('fetchSystemUsers error:', error);
  },

  // Nonaktifkan user (soft-delete)
  deactivateUser: async (userId) => {
    const { error } = await supabase
      .from('system_users')
      .update({ is_active: false })
      .eq('id', userId);
    if (!error) {
      set((state) => ({
        systemUsers: state.systemUsers.map(u =>
          u.id === userId ? { ...u, is_active: false } : u
        ),
      }));
      return { success: true };
    }
    return { success: false, error: error.message };
  },

  // Aktifkan kembali user
  reactivateUser: async (userId) => {
    const { error } = await supabase
      .from('system_users')
      .update({ is_active: true })
      .eq('id', userId);
    if (!error) {
      set((state) => ({
        systemUsers: state.systemUsers.map(u =>
          u.id === userId ? { ...u, is_active: true } : u
        ),
      }));
      return { success: true };
    }
    return { success: false, error: error.message };
  },

  changePassword: async (userId, newPassword) => {
    const { error } = await supabase
      .from('system_users')
      .update({ password: newPassword })
      .eq('id', userId);
    if (!error) {
      // Jika user yang diubah adalah yang sedang login, update state lokal termasuk password
      const currentUser = get().user;
      if (currentUser?.id === userId) {
        set({ user: { ...currentUser, password: newPassword } });
      }
      return { success: true };
    }
    return { success: false, error: error.message };
  },

  students: [],
  kpiData: initialKpi,
  isLoading: false,

  fetchStudents: async () => {
    set({ isLoading: true });
    const { user } = get();
    
    let query = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    // Segregasi Data: Staff biasa hanya melihat miliknya (Kecuali Ayu dengan privilege khusus)
    const isPrivileged = user?.role === 'Manager' || user?.email === 'ayu@gmail.com';
    
    if (user && !isPrivileged) {
      query = query.eq('pic_staff', user?.name);
    }
      
    const { data, error } = await query;
      
    if (!error && data) {
      set({ students: data, isLoading: false });
    } else {
      console.error("Gagal menarik data dari Supabase:", error);
      set({ isLoading: false });
    }
  },

  addStudent: async (formData) => {
    const { user } = get();
    // Otomatis menempelkan identitas Staff secara paksa (Mencegah salah input)
    const payload = {
      ...formData,
      pic_staff: formData.pic_staff || user?.name
    };

    const { data, error } = await supabase
      .from('students')
      .insert([payload])
      .select();

    if (error) {
      console.error("Gagal menambah lead:", error);
      alert("Gagal menambahkan data. Cek console.");
    }
  },

  updateStudent: async (id, formData) => {
    const { error } = await supabase
      .from('students')
      .update(formData)
      .eq('id', id);

    if (!error) {
      set((state) => ({
        students: state.students.map(s => s.id === id ? { ...s, ...formData } : s)
      }));
      return { success: true };
    }
    return { success: false, error: error.message };
  },

  deleteStudent: async (id) => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        students: state.students.filter(s => s.id !== id)
      }));
      return { success: true };
    }
    return { success: false, error: error.message };
  },

  syncMonevWithRecap: async (studentData) => {
    const { nama, telepon, asal_sekolah, status_pembayaran } = studentData;
    
    let updates = null;
    
    // Kondisi 1: Pangkal Lunas (WON)
    if (status_pembayaran === 'Pangkal Full' || status_pembayaran === 'Pendaftaran+Pangkal Full') {
      updates = { status: 'DONE', note: 'PANGKAL LUNAS' };
    } 
    // Kondisi 2: DP Pangkal (Convert to DP)
    else if (status_pembayaran === 'DP Pembayaran Pangkal' || status_pembayaran === 'Pendaftaran+DP Pangkal') {
      updates = { note: 'PANGKAL 1' };
    }

    // Jika tidak ada status yang cocok untuk disinkron, berhenti
    if (!updates) return;

    // Cari data di leads_recap yang cocok
    const { data: matchedLeads, error: searchError } = await supabase
      .from('leads_recap')
      .select('id')
      .ilike('student_name', nama.trim())
      .eq('phone', telepon.trim())
      .ilike('school', asal_sekolah.trim());

    if (!searchError && matchedLeads && matchedLeads.length > 0) {
      for (const lead of matchedLeads) {
        await get().updateLeadRecapStatus(lead.id, updates);
      }
      console.log(`✅ Sinkronisasi Berhasil: ${nama} diperbarui ke ${updates.note}`);
    }
  },

  deleteAllStudents: async () => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    set({ isLoading: true });
    // Menghapus semua baris dengan trick datetime (seperti pada activity_reports)
    const { error } = await supabase
      .from('students')
      .delete()
      .gte('created_at', '1970-01-01'); // Filter universal
      
    // Karena cascade off secara manual, kita juga sekalian bersihkan activity_logs-nya
    await supabase.from('activity_logs').delete().gte('date', '1970-01-01');

    if (!error) {
      set({ students: [], isLoading: false });
      return { success: true };
    } else {
      console.error('Gagal hapus semua data leads:', error);
      set({ isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateStudentStatus: async (id, newStatus) => {
    // Optimistic UI Update - Perubahan instan di layar
    set((state) => ({
      students: state.students.map(s => 
        s.id === id ? { ...s, status_current: newStatus } : s
      )
    }));
    
    // DB update
    const { error } = await supabase
      .from('students')
      .update({ status_current: newStatus })
      .eq('id', id);
      
    if (!error) {
      // Catat perpindahan status otomatis
      get().logActivity(id, 'Update_Status', `Status dipindah ke ${newStatus}`);
    } else {
      console.error("Gagal update status:", error);
    }
  },

  updateArrivalStatus: async (id, newArrivalStatus) => {
    // Optimistic UI Update
    set((state) => ({
      students: state.students.map(s => 
        s.id === id ? { ...s, arrival_status: newArrivalStatus } : s
      )
    }));
    
    // DB update
    const { error } = await supabase
      .from('students')
      .update({ arrival_status: newArrivalStatus })
      .eq('id', id);
      
    if (error) {
      console.error("Gagal update status kedatangan:", error);
      // Rollback if needed (optional, but good for UX)
    }
  },

  updateLeadArrivalStatus: async (id, newArrivalStatus) => {
    // Optimistic UI Update on leadsRecap
    set((state) => ({
      leadsRecap: state.leadsRecap.map(l => 
        l.id === id ? { ...l, arrival_status: newArrivalStatus } : l
      )
    }));
    
    // DB update on leads_recap table
    const { error } = await supabase
      .from('leads_recap')
      .update({ arrival_status: newArrivalStatus })
      .eq('id', id);
      
    if (error) {
      console.error("Gagal update status kedatangan lead:", error);
    } else if (newArrivalStatus === 'AKTIF') {
      try {
        const leadObj = get().leadsRecap.find(l => l.id === id);
        if (leadObj) {
          const { data: existingLogs } = await supabase
            .from('referral_monitoring')
            .select('id')
            .eq('lead_id', id)
            .eq('student_response', 'Masuk Kampus')
            .limit(1);

          if (!existingLogs || existingLogs.length === 0) {
            await get().addReferralLog({
              lead_id: id,
              student_name: leadObj.student_name,
              school: leadObj.school || '',
              program: leadObj.program || '',
              activity_date: new Date().toISOString().split('T')[0],
              student_response: 'Masuk Kampus',
              staff_action: 'Siswa Tiba di Kampus',
              notes: 'Otomatis dicatat saat status kedatangan diubah menjadi AKTIF',
              pic_staff: leadObj.staff_name || 'System'
            });
            await get().fetchReferralLogs();
          }
        }
      } catch (err) {
        console.error("Gagal mencatat log masuk kampus otomatis:", err);
      }
    }
  },

  updateFollowUp: async (id, conversationResult, labelJanji) => {
    // 1. Simpan riwayat percakapan secara permanen di activity log
    if (conversationResult) {
      get().logActivity(id, 'Hasil Follow-up', conversationResult);
    }

    // 2. Update Catatan / Label Janji Paling Baru di kartu siswa
    const newCatatan = labelJanji ? `(Janji: ${labelJanji})` : '';

    set((state) => ({
      students: state.students.map(s => 
        s.id === id ? { ...s, catatan: newCatatan } : s
      )
    }));

    const { error } = await supabase
      .from('students')
      .update({ catatan: newCatatan })
      .eq('id', id);
      
    if (error) console.error("Gagal update catatan follow up:", error);
  },

  recordPayment: async (id, newTotalNominal, newStatusPembayaran, newStatusCurrent) => {
    // Optimistic UI Update
    set((state) => ({
      students: state.students.map(s => 
        s.id === id ? { ...s, nominal_pembayaran: newTotalNominal, status_pembayaran: newStatusPembayaran, status_current: newStatusCurrent } : s
      )
    }));

    const { error } = await supabase
      .from('students')
      .update({
         nominal_pembayaran: newTotalNominal,
         status_pembayaran: newStatusPembayaran,
         status_current: newStatusCurrent
      })
      .eq('id', id);

    if (!error) {
      get().logActivity(id, 'Pembayaran', `Pembayaran dicatat: ${newStatusPembayaran} (Total: Rp ${Math.round(newTotalNominal).toLocaleString()})`);
    } else {
      console.error("Gagal mencatat pembayaran:", error);
    }
  },

  logActivity: async (studentId, actionType, notes) => {
    const user = get().user;
    const userName = user ? user.name : 'System/Guest';
    
    const { error } = await supabase
      .from('activities')
      .insert([{
         student_id: studentId,
         user_name: userName,
         action_type: actionType,
         notes: notes
      }]);
      
    if (error) console.error("Gagal mencatat aktivitas:", error);
  },

  // Realtime Live Subscription
  initRealtime: () => {
    const channel = supabase
      .channel('public:students')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload) => {
           const { user, students: currentStudents } = get();
           
           if (payload.eventType === 'INSERT') {
              // Blokir event masuk dari websocket jika data bukan milik Staff bersangkutan
              if (user?.role !== 'Manager' && payload.new.pic_staff !== user?.name) return;

              const exist = currentStudents.find(s => s.id === payload.new.id);
              if (!exist) {
                set({ students: [payload.new, ...currentStudents] });
              }
           } 
           else if (payload.eventType === 'UPDATE') {
              set({
                 students: currentStudents.map(s => 
                   s.id === payload.new.id ? payload.new : s
                 )
              });
           }
           else if (payload.eventType === 'DELETE') {
              set({
                 students: currentStudents.filter(s => s.id !== payload.old.id)
              });
           }
        }
      )
      .subscribe();
      
    return channel;
  },

  // ─── Marketing Monitor ───────────────────────────────────────────────
  marketingStaff: [],
  activityReports: [],
  referralLogs: [],
  isMarketingLoading: false,

  fetchMarketingStaff: async () => {
    // Ambil staff marketing aktif dari tabel system_users (Daftar Karyawan)
    const { data, error } = await supabase
      .from('system_users')
      .select('id, name, is_active')
      .eq('role', 'Marketing')
      .eq('is_active', true)
      .order('name', { ascending: true });
    
    if (!error && data) {
      set({ marketingStaff: data });
    } else {
      console.error('Gagal fetch staff:', error);
    }
  },

  deleteAllReports: async () => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    set({ isMarketingLoading: true });
    // Menghapus semua baris dengan filter tanggal yang pasti mencakup semua data
    const { error } = await supabase
      .from('activity_reports')
      .delete()
      .gte('report_date', '1970-01-01');

    if (!error) {
      set({ activityReports: [], isMarketingLoading: false });
      return { success: true };
    } else {
      console.error('Gagal hapus semua laporan:', error);
      set({ isMarketingLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchActivityReports: async () => {
    set({ isMarketingLoading: true });
    const { data, error } = await supabase
      .from('activity_reports')
      .select('*, system_users(name)')
      .order('report_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) {
      set({ activityReports: data, isMarketingLoading: false });
    } else {
      console.error('Gagal fetch activity reports:', error);
      set({ isMarketingLoading: false });
    }
  },

  submitActivityReport: async (formData) => {
    set({ isMarketingLoading: true });
    const payload = {
      staff_id: formData.staff_id,
      staff_name: formData.staff_name,
      report_date: formData.report_date,
      leads_followed_up: formData.leads_followed_up,
      leads_responded: formData.leads_responded,
      leads_converted: formData.leads_converted,
      responded_leads_details: formData.responded_leads_details || [],
      response_notes: formData.response_notes || null,
      follow_up_actions: formData.follow_up_actions || null,
      obstacles: formData.obstacles || null,
      next_day_plan: formData.next_day_plan || null,
    };
    const { data, error } = await supabase
      .from('activity_reports')
      .insert([payload])
      .select();
    if (error) {
      console.error('Gagal simpan laporan:', error);
      set({ isMarketingLoading: false });
      return { success: false, error: error.message };
    }
    // Optimistic UI: tambah ke list lokal
    set((state) => ({
      activityReports: [data[0], ...state.activityReports],
      isMarketingLoading: false,
    }));
    // Sync ke Google Sheets (fire-and-forget)
    syncReportToSheets({ ...payload }).catch(e => console.warn('Sheets sync error:', e));
    return { success: true, data: data[0] };
  },

  deleteReportById: async (id) => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('activity_reports')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Gagal hapus laporan:', error);
      return { success: false, error: error.message };
    }

    set((state) => ({
      activityReports: state.activityReports.filter(r => r.id !== id)
    }));
    return { success: true };
  },
  // ─── Referral Monitoring ───────────────────────────────────────────
  fetchReferralLogs: async () => {
    const { data, error } = await supabase
      .from('referral_monitoring')
      .select('*')
      .order('activity_date', { ascending: false });

    if (!error && data) {
      set({ referralLogs: data });
    }
  },

  addReferralLog: async (payload) => {
    const { data, error } = await supabase
      .from('referral_monitoring')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Gagal simpan referral log:', error);
      return { success: false, error: error.message };
    }

    set((state) => ({
      referralLogs: [data, ...state.referralLogs]
    }));
    return { success: true };
  },

  deleteReferralLog: async (leadId, dateStr) => {
    const { error } = await supabase
      .from('referral_monitoring')
      .delete()
      .eq('lead_id', leadId)
      .eq('activity_date', dateStr);

    if (error) {
      console.error('Gagal hapus referral log:', error);
      return { success: false, error: error.message };
    }

    set((state) => ({
      referralLogs: state.referralLogs.filter(
        log => !(log.lead_id === leadId && log.activity_date === dateStr)
      )
    }));
    return { success: true };
  },

  // ─── Team Notes (Catatan Tim) ──────────────────────────────────────
  teamNotes: [],
  isNotesLoading: false,

  fetchTeamNotes: async () => {
    set({ isNotesLoading: true });
    const { data, error } = await supabase
      .from('team_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ teamNotes: data, isNotesLoading: false });
    } else {
      console.error('Gagal fetch team notes:', error);
      set({ isNotesLoading: false });
    }
  },

  addTeamNote: async (payload) => {
    set({ isNotesLoading: true });
    const { user } = get();
    const newNote = {
      ...payload,
      author_id: user?.id || null,
      author_name: user?.name || 'System'
    };

    const { data, error } = await supabase
      .from('team_notes')
      .insert([newNote])
      .select()
      .single();

    if (error) {
      console.error('Gagal tambah team note:', error);
      set({ isNotesLoading: false });
      return { success: false, error: error.message };
    }

    set((state) => ({
      teamNotes: [data, ...state.teamNotes],
      isNotesLoading: false
    }));
    return { success: true, data };
  },

  updateTeamNote: async (id, updates) => {
    set({ isNotesLoading: true });
    const { data, error } = await supabase
      .from('team_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Gagal update team note:', error);
      set({ isNotesLoading: false });
      return { success: false, error: error.message };
    }

    set((state) => ({
      teamNotes: state.teamNotes.map(n => n.id === id ? data : n),
      isNotesLoading: false
    }));
    return { success: true, data };
  },

  deleteTeamNote: async (id) => {
    set({ isNotesLoading: true });
    const { error } = await supabase
      .from('team_notes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Gagal hapus team note:', error);
      set({ isNotesLoading: false });
      return { success: false, error: error.message };
    }

    set((state) => ({
      teamNotes: state.teamNotes.filter(n => n.id !== id),
      isNotesLoading: false
    }));
    return { success: true };
  },

  // ─── Leads Recap ───────────────────────────────────────────────────
  leadsRecap: [],
  
  fetchLeadsRecap: async () => {
    const { user } = get();
    if (!user) return;

    let query = supabase
      .from('leads_recap')
      .select('*')
      .order('created_at', { ascending: false });

    // Jika staff, hanya lihat miliknya sendiri (Kecuali Ayu dengan privilege khusus)
    const isPrivileged = user?.role === 'Manager' || user?.email === 'ayu@gmail.com';

    if (!isPrivileged) {
      query = query.eq('staff_name', user.name);
    }

    const { data, error } = await query;
    if (!error && data) {
      set({ leadsRecap: data });
    } else if (error) {
      console.error('Gagal fetch rekap leads:', error);
    }
  },

  importLeadsRecap: async (leadsArray) => {
    // leadsArray: [{ student_name, school, phone, program, note, staff_id, staff_name }]
    const { error } = await supabase
      .from('leads_recap')
      .insert(leadsArray);

    if (error) {
      console.error('Gagal import leads:', error);
      return { success: false, error: error.message };
    }

    get().fetchLeadsRecap();
    return { success: true };
  },

  deleteLeadRecap: async (id) => {
    const { error } = await supabase
      .from('leads_recap')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        leadsRecap: state.leadsRecap.filter(l => l.id !== id)
      }));
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  revertLeadsToUnregistered: async (staffName) => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    // 1. Ambil semua leads milik staff tsb yang program-nya N/A atau kosong
    const { data: leads, error: fetchErr } = await supabase
      .from('leads_recap')
      .select('*')
      .eq('staff_name', staffName)
      .or('program.eq.N/A,program.is.null,program.eq.');

    if (fetchErr) return { success: false, error: fetchErr.message };
    if (!leads || leads.length === 0) return { success: false, error: 'Tidak ada data dengan Program N/A untuk staff ini.' };

    // 2. Insert ke unregistered_students (chunked)
    const rows = leads.map(l => ({
      student_name: l.student_name,
      school:       l.school   || '',
      phone:        l.phone    || '',
      program:      (l.program === 'N/A' || !l.program) ? '' : l.program,
      referral:     l.referral || '',
      staff_id:     l.staff_id,
      staff_name:   l.staff_name,
    }));

    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error: insErr } = await supabase
        .from('unregistered_students')
        .insert(rows.slice(i, i + CHUNK));
      if (insErr) return { success: false, error: insErr.message };
    }

    // 3. Hapus dari leads_recap
    const ids = leads.map(l => l.id);
    const { error: delErr } = await supabase
      .from('leads_recap')
      .delete()
      .in('id', ids);
    if (delErr) return { success: false, error: delErr.message };

    // 4. Update local state
    set(state => ({
      leadsRecap: state.leadsRecap.filter(l => !ids.includes(l.id))
    }));
    get().fetchUnregisteredStudents();

    return { success: true, count: ids.length };
  },

  deleteAllLeadsRecap: async (staffName = null) => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    let query = supabase.from('leads_recap').delete().gte('created_at', '1970-01-01');

    if (staffName && staffName !== 'all') {
      query = query.eq('staff_name', staffName);
    }

    const { error } = await query;

    if (!error) {
      if (staffName && staffName !== 'all') {
        set((state) => ({
          leadsRecap: state.leadsRecap.filter(l => l.staff_name !== staffName)
        }));
      } else {
        set({ leadsRecap: [] });
      }
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  updateLeadRecapStatus: async (id, updates) => {
    const { error } = await supabase
      .from('leads_recap')
      .update(updates)
      .eq('id', id);

    if (!error) {
      set((state) => ({
        leadsRecap: state.leadsRecap.map(l => l.id === id ? { ...l, ...updates } : l)
      }));
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  // ─── Unregistered Students (Siswa Belum Daftar) ─────────────────────────
  unregisteredStudents: [],

  fetchUnregisteredStudents: async () => {
    const { user } = get();
    if (!user) return;

    const isPrivileged = user?.role === 'Manager' || user?.email === 'ayu@gmail.com';
    const PAGE_SIZE = 1000;
    let allData = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('unregistered_students')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (!isPrivileged) {
        query = query.eq('staff_name', user.name);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Gagal fetch unregistered students:', error);
        break;
      }

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += PAGE_SIZE;
        hasMore = data.length === PAGE_SIZE;
      } else {
        hasMore = false;
      }
    }

    set({ unregisteredStudents: allData });
  },


  importUnregisteredStudents: async (studentsArray) => {
    const CHUNK_SIZE = 500;
    for (let i = 0; i < studentsArray.length; i += CHUNK_SIZE) {
      const chunk = studentsArray.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase
        .from('unregistered_students')
        .insert(chunk);

      if (error) {
        console.error('Gagal import unregistered students (chunk):', error);
        return { success: false, error: error.message };
      }
    }

    get().fetchUnregisteredStudents();
    return { success: true };
  },


  deleteUnregisteredStudent: async (id) => {
    const { error } = await supabase
      .from('unregistered_students')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({
        unregisteredStudents: state.unregisteredStudents.filter(s => s.id !== id)
      }));
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  updateUnregisteredStudentNotes: async (id, notes) => {
    const { error } = await supabase
      .from('unregistered_students')
      .update({ notes })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        unregisteredStudents: state.unregisteredStudents.map(s =>
          s.id === id ? { ...s, notes } : s
        )
      }));
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  updateUnregisteredStudentName: async (id, student_name) => {
    const { error } = await supabase
      .from('unregistered_students')
      .update({ student_name })
      .eq('id', id);

    if (!error) {
      set((state) => ({
        unregisteredStudents: state.unregisteredStudents.map(s =>
          s.id === id ? { ...s, student_name } : s
        )
      }));
      return { success: true };
    }
    return { success: false, error: error?.message };
  },

  deleteAllUnregisteredStudents: async (staffName = null) => {
    const { user } = get();
    const isManager = user?.role === 'Manager';

    // Staff biasa hanya bisa hapus data miliknya sendiri
    let query = supabase.from('unregistered_students').delete().gte('created_at', '1970-01-01');

    if (!isManager) {
      // Paksa filter ke nama staff yang login
      query = query.eq('staff_name', user.name);
    } else if (staffName && staffName !== 'all') {
      query = query.eq('staff_name', staffName);
    }

    const { error } = await query;
    if (!error) {
      if (!isManager) {
        set((state) => ({
          unregisteredStudents: state.unregisteredStudents.filter(s => s.staff_name !== user.name)
        }));
      } else if (staffName && staffName !== 'all') {
        set((state) => ({
          unregisteredStudents: state.unregisteredStudents.filter(s => s.staff_name !== staffName)
        }));
      } else {
        set({ unregisteredStudents: [] });
      }
      return { success: true };
    }
    return { success: false, error: error?.message };
  },


  convertUnregisteredToLead: async (student) => {
    // Pindahkan dari unregistered_students ke leads_recap
    const leadData = {
      student_name: student.student_name,
      school: student.school,
      phone: student.phone,
      program: student.program || '',
      note: 'PENDAFTARAN',
      referral: student.referral || '',
      staff_id: student.staff_id,
      staff_name: student.staff_name,
    };

    const { error } = await supabase.from('leads_recap').insert([leadData]);
    if (error) {
      console.error('Gagal konversi ke leads:', error);
      return { success: false, error: error.message };
    }

    // Hapus dari unregistered_students setelah berhasil dipindahkan
    await get().deleteUnregisteredStudent(student.id);
    get().fetchLeadsRecap();
    return { success: true };
  },

  convertAllUnregisteredToLeads: async (studentsArray) => {
    const leads = studentsArray.map(s => ({
      student_name: s.student_name,
      school: s.school,
      phone: s.phone,
      program: s.program || '',
      note: 'PENDAFTARAN',
      referral: s.referral || '',
      staff_id: s.staff_id,
      staff_name: s.staff_name,
    }));

    const { error } = await supabase.from('leads_recap').insert(leads);
    if (error) {
      console.error('Gagal konversi semua ke leads:', error);
      return { success: false, error: error.message };
    }

    // Hapus semua yang sudah dikonversi
    const ids = studentsArray.map(s => s.id);
    await supabase.from('unregistered_students').delete().in('id', ids);
    
    set((state) => ({
      unregisteredStudents: state.unregisteredStudents.filter(s => !ids.includes(s.id))
    }));
    get().fetchLeadsRecap();
    return { success: true };
  },

  convertLeadToStudent: async (lead) => {
    // lead: data dari tabel leads_recap
    // Map ke format tabel students
    const studentData = {
      nama: lead.student_name,
      telepon: lead.phone,
      asal_sekolah: lead.school,
      tanggal_daftar: new Date().toISOString().split('T')[0],
      status_pembayaran: 'Baru mendaftar (via Leads)',
      pic_staff: lead.staff_name,
      nominal_pembayaran: 0,
      catatan: lead.note,
      program_interest: lead.program || 'Reguler',
      priority_level: 'Medium',
      priority_score: 50,
      status_current: 'Pendaftaran'
    };

    const { data, error } = await supabase
      .from('students')
      .insert([studentData])
      .select();

    if (error) {
      console.error('Gagal konversi ke siswa:', error);
      return { success: false, error: error.message };
    }

    // Jika berhasil masuk database utama, hapus dari rekap leads
    await get().deleteLeadRecap(lead.id);
    
    // Log aktivitas otomatis di database utama
    if (data?.[0]) {
       get().logActivity(data[0].id, 'Konversi', `Siswa didaftarkan otomatis dari Rekap Leads (PIC: ${lead.staff_name})`);
    }

    return { success: true };
  },

  // ─── Login Logs ────────────────────────────────────────────────────
  loginLogs: [],
  fetchLoginLogs: async () => {
    const { data, error } = await supabase
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) {
      set({ loginLogs: data });
    } else {
      console.error('Gagal fetch login logs:', error);
    }
  },

  clearLoginLogs: async () => {
    const { user } = get();
    if (user?.role !== 'Manager') return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('login_logs')
      .delete()
      .gte('created_at', '1970-01-01');

    if (!error) {
      set({ loginLogs: [] });
      return { success: true };
    }
    console.error('Gagal hapus login logs:', error);
    return { success: false, error: error.message };
  },

  // ─── Team Chat ────────────────────────────────────────────────────
  chatMessages: [],
  unreadCounts: {}, // { contactId: number }

  fetchChatMessages: async (contact) => {
    const { user } = get();
    if (!user || !contact) return;

    let query;
    if (contact.isBroadcast) {
      // Broadcast: semua pesan dengan recipient_id = null
      query = supabase
        .from('chat_messages')
        .select('*')
        .is('recipient_id', null)
        .order('created_at', { ascending: true })
        .limit(200);
    } else {
      // DM: pesan antara user saat ini dan kontak
      query = supabase
        .from('chat_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},recipient_id.eq.${contact.id}),and(sender_id.eq.${contact.id},recipient_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })
        .limit(200);
    }

    const { data, error } = await query;
    if (!error && data) {
      set({ chatMessages: data });
    } else {
      console.error('Gagal fetch chat messages:', error);
    }
  },

  sendChatMessage: async ({ contact, message, sender }) => {
    if (!sender || !message?.trim()) return;

    const payload = {
      sender_id: sender.id,
      sender_name: sender.name,
      sender_role: sender.role,
      message: message.trim(),
      recipient_id: contact.isBroadcast ? null : contact.id,
      recipient_name: contact.isBroadcast ? null : contact.name,
      is_read: false,
    };

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select()
      .single();

    if (!error && data) {
      // Optimistic update: tambahkan pesan ke list lokal
      set((state) => ({ chatMessages: [...state.chatMessages, data] }));
    } else {
      console.error('Gagal kirim pesan:', error);
    }
  },

  markChatAsRead: async (contact, user) => {
    if (!contact || !user) return;
    // Tandai pesan yang diterima oleh user saat ini sebagai sudah dibaca
    const updateQuery = contact.isBroadcast
      ? supabase.from('chat_messages')
          .update({ is_read: true })
          .is('recipient_id', null)
          .eq('is_read', false)
          .neq('sender_id', user.id)
      : supabase.from('chat_messages')
          .update({ is_read: true })
          .eq('sender_id', contact.id)
          .eq('recipient_id', user.id)
          .eq('is_read', false);

    await updateQuery;

    // Reset unread count untuk kontak ini
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [contact.id]: 0 }
    }));
  },

  initChatRealtime: (currentUser, activeContact, onNewMessage) => {
    const channel = supabase
      .channel('public:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new;
          const { chatMessages, unreadCounts } = get();
          const myId = currentUser?.id;

          // Periksa apakah pesan relevan untuk user ini
          const isBroadcast = newMsg.recipient_id === null;
          const isDMToMe = newMsg.recipient_id === myId;
          const isDMFromMe = newMsg.sender_id === myId;
          const isRelevant = isBroadcast || isDMToMe || isDMFromMe;

          if (!isRelevant) return;

          // Hindari duplikasi
          const exists = chatMessages.find(m => m.id === newMsg.id);
          if (exists) return;

          // Update chatMessages jika percakapan aktif sesuai
          const activeId = activeContact?.id;
          const isActiveConversation =
            (activeContact?.isBroadcast && isBroadcast) ||
            (activeId === newMsg.sender_id) ||
            (activeId === newMsg.recipient_id);

          if (isActiveConversation) {
            set((state) => ({ chatMessages: [...state.chatMessages, newMsg] }));
          }

          // Hitung unread jika bukan dari diri sendiri
          if (newMsg.sender_id !== myId) {
            const contactId = isBroadcast ? 'broadcast' : newMsg.sender_id;
            set((state) => ({
              unreadCounts: {
                ...state.unreadCounts,
                [contactId]: (state.unreadCounts[contactId] || 0) + 1,
              }
            }));

            // Panggil callback (untuk suara notifikasi)
            if (typeof onNewMessage === 'function') {
              onNewMessage(newMsg);
            }
          }
        }
      )
      .subscribe();

    return channel;
  },
}), {
  name: 'edulead-auth-storage',
  partialize: (state) => ({ 
    isAuthenticated: state.isAuthenticated, 
    user: state.user 
  }),
}));
