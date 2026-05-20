-- ============================================================
-- REFERRAL MONITORING — Supabase SQL Schema
-- ============================================================

-- 1. Tambah kolom referred_by di tabel leads_recap (jika belum ada)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='leads_recap' AND column_name='referred_by') THEN
        ALTER TABLE leads_recap ADD COLUMN referred_by TEXT;
    END IF;
END $$;

-- 2. Buat tabel referral_monitoring
CREATE TABLE IF NOT EXISTS referral_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads_recap(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  school TEXT,
  program TEXT,
  activity_date DATE NOT NULL,
  student_response TEXT,
  staff_action TEXT,
  pic_staff TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE referral_monitoring ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on referral_monitoring" ON referral_monitoring;
CREATE POLICY "Allow all on referral_monitoring" ON referral_monitoring
  FOR ALL USING (true) WITH CHECK (true);

-- Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_referral_monitoring_lead_id ON referral_monitoring(lead_id);
CREATE INDEX IF NOT EXISTS idx_referral_monitoring_date ON referral_monitoring(activity_date DESC);
