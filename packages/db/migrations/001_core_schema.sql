-- ══════════════════════════════════════════════════════════
-- JobLink V1 — Core Schema
-- Run in Supabase SQL Editor in order
-- ══════════════════════════════════════════════════════════

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'admin')),
  credits_balance   INTEGER NOT NULL DEFAULT 10,
  lang_preference   TEXT NOT NULL DEFAULT 'en',
  plan              TEXT NOT NULL DEFAULT 'free',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own record" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own record" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true);

-- ── Seeker Profiles ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles_seeker (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name         TEXT,
  location          TEXT,
  degree            TEXT,
  institution       TEXT,
  field_of_study    TEXT,
  graduation_year   TEXT,
  bio               TEXT,
  skills            TEXT[] DEFAULT '{}',
  languages         TEXT[] DEFAULT '{"English"}',
  experience_level  TEXT DEFAULT 'entry',
  remote_setup      TEXT DEFAULT 'basic',
  avatar_url        TEXT,
  cv_url            TEXT,
  is_open_to_work   BOOLEAN DEFAULT true,
  linkedin_url      TEXT,
  github_url        TEXT,
  portfolio_url     TEXT,
  embedding         vector(1536),
  profile_score     INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE profiles_seeker ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Seekers manage own profile" ON profiles_seeker FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON profiles_seeker FOR ALL TO service_role USING (true);

-- ── Employer Profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles_employer (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name      TEXT,
  industry          TEXT,
  company_size      TEXT,
  location          TEXT,
  website           TEXT,
  description       TEXT,
  logo_url          TEXT,
  is_verified       BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE profiles_employer ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employers manage own profile" ON profiles_employer FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Public read verified employers" ON profiles_employer FOR SELECT TO anon USING (is_verified = true);
CREATE POLICY "Service role full access" ON profiles_employer FOR ALL TO service_role USING (true);

-- ── Jobs ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  company_name          TEXT NOT NULL,
  company_logo_url      TEXT,
  location              TEXT,
  is_remote             BOOLEAN DEFAULT true,
  job_type              TEXT DEFAULT 'full_time',
  experience_level      TEXT DEFAULT 'any',
  description           TEXT,
  requirements          TEXT,
  salary_min            INTEGER,
  salary_max            INTEGER,
  salary_currency       TEXT DEFAULT 'USD',
  tags                  TEXT[] DEFAULT '{}',
  external_url          TEXT,
  source                TEXT DEFAULT 'native',
  source_tier           INTEGER DEFAULT 2 CHECK (source_tier BETWEEN 1 AND 3),
  africa_hiring_signal  INTEGER DEFAULT 3 CHECK (africa_hiring_signal BETWEEN 1 AND 5),
  parsed_requirements   JSONB,
  embedding             vector(1536),
  is_active             BOOLEAN DEFAULT true,
  employer_id           UUID REFERENCES profiles_employer(id),
  posted_at             TIMESTAMPTZ DEFAULT NOW(),
  expires_at            TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  scraped_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX idx_jobs_signal ON jobs(africa_hiring_signal);
CREATE INDEX idx_jobs_source_tier ON jobs(source_tier);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read active jobs" ON jobs FOR SELECT TO anon USING (is_active = true);
CREATE POLICY "Authenticated read all jobs" ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service role full access" ON jobs FOR ALL TO service_role USING (true);

-- ── Applications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES jobs(id),
  cv_html           TEXT,
  cover_letter      TEXT,
  status            TEXT DEFAULT 'generated' CHECK (status IN ('generated','submitted','acknowledged','interview','offered','rejected','withdrawn')),
  credit_used       BOOLEAN DEFAULT true,
  submitted_at      TIMESTAMPTZ,
  notes             TEXT,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE UNIQUE INDEX idx_applications_user_job ON applications(user_id, job_id);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own applications" ON applications FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON applications FOR ALL TO service_role USING (true);

-- ── Remote Ready ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS remote_ready (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  speed_sessions        JSONB DEFAULT '[]',
  speed_passed          BOOLEAN DEFAULT false,
  speed_avg_mbps        DECIMAL,
  speed_avg_latency_ms  INTEGER,
  power_video_url       TEXT,
  video_passed          BOOLEAN DEFAULT false,
  video_reviewed_at     TIMESTAMPTZ,
  badge_active          BOOLEAN DEFAULT false,
  verified_at           TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  employer_reports      INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE remote_ready ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own verification" ON remote_ready FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON remote_ready FOR ALL TO service_role USING (true);

-- ── Credits Log ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credits_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('signup_bonus','used','purchased','admin_grant','refund')),
  amount      INTEGER NOT NULL,
  job_id      UUID REFERENCES jobs(id),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credits_user ON credits_log(user_id);

ALTER TABLE credits_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON credits_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON credits_log FOR ALL TO service_role USING (true);

-- ── Subscriptions ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package         TEXT NOT NULL,
  credits         INTEGER NOT NULL,
  amount          INTEGER NOT NULL,
  currency        TEXT DEFAULT 'XAF',
  payment_method  TEXT,
  phone           TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','failed','refunded')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subs" ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subs" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON subscriptions FOR ALL TO service_role USING (true);

-- ── Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role full access" ON notifications FOR ALL TO service_role USING (true);

-- ── Job Sources ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_sources (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  url                     TEXT NOT NULL,
  tier                    INTEGER DEFAULT 2 CHECK (tier BETWEEN 1 AND 3),
  africa_base_signal      INTEGER DEFAULT 3,
  last_scraped            TIMESTAMPTZ,
  is_active               BOOLEAN DEFAULT true,
  scrape_count            INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sources" ON job_sources FOR SELECT TO anon USING (true);
CREATE POLICY "Service role full access" ON job_sources FOR ALL TO service_role USING (true);

SELECT 'JobLink schema created ✅' AS status;
