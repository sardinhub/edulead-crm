import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { kpiData as initialKpi } from './mockData';
import { syncReportToSheets } from '../lib/googleSheets';

export const useStore = create((set, get) => ({
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
      .eq('email', email.trim())
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
      // Jika user yang diubah adalah yang sedang login, update state lokal
      const currentUser = get().user;
      if (currentUser?.id === userId) {
        set({ user: { ...currentUser } });
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

    // Segregasi Data: Staff biasa hanya melihat miliknya
    if (user && user.role !== 'Manager') {
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
    
    // Hanya sinkron jika status adalah salah satu dari tipe Lunas (WON)
    const isLunas = status_pembayaran === 'Pangkal Full' || status_pembayaran === 'Pendaftaran+Pangkal Full';
    if (!isLunas) return;

    // Cari data di leads_recap yang cocok
    // Menggunakan ilike untuk nama/sekolah agar lebih fleksibel dengan huruf besar/kecil
    const { data: matchedLeads, error: searchError } = await supabase
      .from('leads_recap')
      .select('id')
      .ilike('student_name', nama.trim())
      .eq('phone', telepon.trim())
      .ilike('school', asal_sekolah.trim());

    if (!searchError && matchedLeads && matchedLeads.length > 0) {
      // Update semua data yang cocok (biasanya satu) menjadi DONE
      for (const lead of matchedLeads) {
        await get().updateLeadRecapStatus(lead.id, { 
          status: 'DONE', 
          note: 'PANGKAL LUNAS' 
        });
      }
      console.log(`✅ Sinkronisasi Berhasil: ${nama} ditandai DONE di Rekap Leads.`);
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
      get().logActivity(id, 'Pembayaran', `Pembayaran dicatat: ${newStatusPembayaran} (Total: Rp ${newTotalNominal.toLocaleString()})`);
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

  // ─── Leads Recap ───────────────────────────────────────────────────
  leadsRecap: [],
  
  fetchLeadsRecap: async () => {
    const { user } = get();
    if (!user) return;

    let query = supabase
      .from('leads_recap')
      .select('*')
      .order('created_at', { ascending: false });

    // Jika staff, hanya lihat miliknya sendiri
    if (user.role !== 'Manager') {
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
}));
