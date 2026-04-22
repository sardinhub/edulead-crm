-- ============================================================
-- TEAM CHAT — Supabase SQL Schema
-- Jalankan di Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES system_users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL,
  recipient_id UUID REFERENCES system_users(id) ON DELETE SET NULL, -- NULL = broadcast ke semua staff
  recipient_name TEXT,                                               -- NULL jika broadcast
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_chat_sender    ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_recipient ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_created   ON chat_messages(created_at DESC);

-- RLS: semua user authenticated bisa baca dan insert
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on chat_messages" ON chat_messages;
CREATE POLICY "Allow all on chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime untuk tabel ini (jalankan di Supabase Dashboard > Database > Replication jika belum)
-- Atau aktifkan via SQL:
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
