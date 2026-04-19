-- ============================================================
-- MARKETING MONITOR — Supabase SQL Schema (IDEMPOTENT)
-- Aman dijalankan berulang kali tanpa error duplikasi
-- ============================================================

-- ─── 0. System Users (Akun Login Aplikasi) ────────────────────────────────

CREATE TABLE IF NOT EXISTS system_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Marketing' CHECK (role IN ('Manager', 'Marketing')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed: Manager default
INSERT INTO system_users (name, email, password, role)
VALUES ('Sardin Damis', 'sardindamis.smi@gmail.com', 'Rahasiaku123', 'Manager')
ON CONFLICT (email) DO NOTHING;

-- RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on system_users" ON system_users;
CREATE POLICY "Allow all on system_users" ON system_users
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 1. Marketing Staff ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS marketing_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed data staff awal (skip jika sudah ada)
INSERT INTO marketing_staff (name)
SELECT unnest(ARRAY['Irfandi Nyondri', 'Bella Sintia', 'Kasmira', 'Salma'])
WHERE NOT EXISTS (SELECT 1 FROM marketing_staff LIMIT 1);

-- RLS
ALTER TABLE marketing_staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on marketing_staff" ON marketing_staff;
CREATE POLICY "Allow all on marketing_staff" ON marketing_staff
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 2. Activity Reports ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES marketing_staff(id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  report_date DATE NOT NULL,
  leads_followed_up INTEGER DEFAULT 0 CHECK (leads_followed_up >= 0),
  leads_responded INTEGER DEFAULT 0 CHECK (leads_responded >= 0),
  leads_converted INTEGER DEFAULT 0 CHECK (leads_converted >= 0),
  response_notes TEXT,
  follow_up_actions TEXT,
  obstacles TEXT,
  next_day_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE activity_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on activity_reports" ON activity_reports;
CREATE POLICY "Allow all on activity_reports" ON activity_reports
  FOR ALL USING (true) WITH CHECK (true);

-- ─── 3. Index ──────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_activity_reports_staff_id   ON activity_reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_activity_reports_date       ON activity_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_activity_reports_staff_name ON activity_reports(staff_name);

-- ─── 4. Auto-update updated_at ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_activity_reports_updated_at ON activity_reports;
CREATE TRIGGER update_activity_reports_updated_at
  BEFORE UPDATE ON activity_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
