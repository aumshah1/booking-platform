-- ============================================================
-- BlueWings Connect — WhatsApp Bot Migration
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/apzlvejxaczwxvjeoywf/sql
-- ============================================================

-- 1. WhatsApp conversation sessions
CREATE TABLE IF NOT EXISTS wa_sessions (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number     TEXT        UNIQUE NOT NULL,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  state            TEXT        DEFAULT 'IDLE',
  context          JSONB       DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_wa_sessions_phone ON wa_sessions(phone_number);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_wa_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wa_sessions_updated_at ON wa_sessions;
CREATE TRIGGER wa_sessions_updated_at
  BEFORE UPDATE ON wa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_wa_session_timestamp();

-- Row-level security (optional — backend uses service role key)
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Push notification subscriptions (for PWA push notifications)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint     TEXT        NOT NULL,
  p256dh       TEXT        NOT NULL,
  auth         TEXT        NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own subscriptions
CREATE POLICY "Users manage own push subscriptions"
  ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
