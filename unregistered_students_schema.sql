-- ============================================================
-- TABEL: unregistered_students
-- Menyimpan data siswa yang BELUM PERNAH mendaftar
-- untuk kebutuhan follow-up tim marketing
-- Jalankan sekali di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS unregistered_students (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name TEXT NOT NULL,
  school       TEXT,
  phone        TEXT,
  program      TEXT,
  referral     TEXT,
  staff_id     UUID REFERENCES system_users(id) ON DELETE SET NULL,
  staff_name   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_unreg_staff_name  ON unregistered_students(staff_name);
CREATE INDEX IF NOT EXISTS idx_unreg_created_at  ON unregistered_students(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE unregistered_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on unregistered_students" ON unregistered_students;
CREATE POLICY "Allow all on unregistered_students" ON unregistered_students
  FOR ALL USING (true) WITH CHECK (true);
