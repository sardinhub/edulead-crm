-- ============================================================
-- TEAM NOTES — Supabase SQL Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS team_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  note_date DATE,
  author_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Migrasi untuk tabel yang sudah ada (menambahkan kolom note_date)
ALTER TABLE team_notes ADD COLUMN IF NOT EXISTS note_date DATE;

-- RLS
ALTER TABLE team_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on team_notes" ON team_notes;
CREATE POLICY "Allow all on team_notes" ON team_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_team_notes()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_team_notes_updated_at ON team_notes;
CREATE TRIGGER update_team_notes_updated_at
  BEFORE UPDATE ON team_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_team_notes();
