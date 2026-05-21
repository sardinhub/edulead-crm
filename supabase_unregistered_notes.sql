-- ============================================================
-- Tambahkan kolom 'notes' ke tabel unregistered_students
-- Jalankan di SQL Editor Supabase Dashboard Anda
-- ============================================================

ALTER TABLE unregistered_students
  ADD COLUMN IF NOT EXISTS notes TEXT;
