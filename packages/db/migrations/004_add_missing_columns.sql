-- Run in Supabase SQL Editor
-- Adds any missing columns to profiles_seeker safely

ALTER TABLE profiles_seeker
  ADD COLUMN IF NOT EXISTS remote_setup_type TEXT,
  ADD COLUMN IF NOT EXISTS power_backup_type TEXT,
  ADD COLUMN IF NOT EXISTS languages         TEXT[] DEFAULT '{English}',
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT,
  ADD COLUMN IF NOT EXISTS github_url        TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url     TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url        TEXT,
  ADD COLUMN IF NOT EXISTS cv_url            TEXT,
  ADD COLUMN IF NOT EXISTS is_open_to_work   BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS graduation_year   INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_done  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS credits_balance  INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS plan             TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS lang_preference  TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ DEFAULT NOW();

SELECT 'Missing columns added ✅' AS status;
