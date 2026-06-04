-- ════════════════════════════════════════════════════════════
-- JobLink V1 — Initial Schema
-- Run in Supabase SQL Editor
-- ════════════════════════════════════════════════════════════

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL UNIQUE,
  role              TEXT NOT NULL DEFAULT 'job_seeker' CHECK (role IN ('job_seeker', 'employer', 'admin')),
  credits_balance   INTEGER NOT NULL DEFAULT 10,
  plan              TEXT NOT NULL DEFAULT 'free',
  lang_preference   TEXT NOT NULL DEFAULT 'en',
  onboarding_done   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Seeker profiles ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles_seeker (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  full_name         TEXT,
  location          TEXT,
  degree            TEXT,
  institution       TEXT,
  field_of_study    TEXT,
  graduation_year   INTEGER,
  bio               TEXT,
  skills            TEXT[] DEFAULT '{}',
  languages         TEXT[] DEFAULT '{English}',
  linkedin_url      TEXT,
  github_url        TEXT,
  portfolio_url     TEXT,
  avatar_url        TEXT,
  cv_url            TEXT,
  remote_setup_type TEXT,  -- 'fibre','4g','3g','satellite'
  power_backup_type TEXT,  -- 'generator','solar','ups','none'
  is_open_to_work   BOOLEAN DEFAULT true,
  embedding         vector(1536),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── Employer profiles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles_employer (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  company_name  TEXT,
  industry      TEXT,
  company_size  TEXT,
  location      TEXT,
  website       TEXT,
  description   TEXT,
  logo_url      TEXT,
  is_verified   BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Jobs ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id           UUID REFERENCES profiles_employer(id),
  external_id           TEXT UNIQUE,
  title                 TEXT NOT NULL,
  company_name          TEXT NOT NULL,
  company_logo_url      TEXT,
  location              TEXT,
  is_remote             BOOLEAN DEFAULT true,
  job_type              TEXT DEFAULT 'full_time',
  experience_level      TEXT DEFAULT 'any',
  description           TEXT,
  requirements          TEXT,
  tags                  TEXT[] DEFAULT '{}',
  salary_min            INTEGER,
  salary_max            INTEGER,
  salary_currency       TEXT DEFAULT 'USD',
  external_url          TEXT,
  source                TEXT DEFAULT 'native',  -- 'native','tier1','tier2','tier3'
  source_name           TEXT,
  africa_hiring_signal  INTEGER DEFAULT 3 CHECK (africa_hiring_signal BETWEEN 1 AND 5),
  description_metadata  JSONB,   -- cached AI-parsed job requirements
  embedding             vector(1536),
  is_active             BOOLEAN DEFAULT true,
  posted_at             TIMESTAMPTZ DEFAULT NOW(),
  scraped_at            TIMESTAMPTZ DEFAULT NOW(),
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_active ON jobs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_jobs_signal ON jobs(africa_hiring_signal);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON jobs(external_id) WHERE external_id IS NOT NULL;

-- ── Applications (generated packages) ────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id            UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  cv_html           TEXT,
  cover_letter      TEXT,
  status            TEXT NOT NULL DEFAULT 'generated'
                    CHECK (status IN ('generated','submitted','acknowledged','interview','offered','rejected','withdrawn')),
  submitted_at      TIMESTAMPTZ,
  notes             TEXT,
  credit_used       BOOLEAN DEFAULT true,
  job_snapshot      JSONB,  -- snapshot of job at time of generation
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- ── Remote Ready badges ───────────────────────────────────
CREATE TABLE IF NOT EXISTS remote_ready (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  speed_sessions        JSONB DEFAULT '[]',  -- [{mbps, latency, ip_hash, tested_at}]
  speed_passed          BOOLEAN DEFAULT false,
  speed_passed_at       TIMESTAMPTZ,
  power_video_url       TEXT,
  video_status          TEXT DEFAULT 'pending' CHECK (video_status IN ('pending','approved','rejected','not_submitted')),
  video_reviewed_at     TIMESTAMPTZ,
  video_reviewer_notes  TEXT,
  badge_active          BOOLEAN DEFAULT false,
  verified_at           TIMESTAMPTZ,
  expires_at            TIMESTAMPTZ,
  employer_flags        INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── Credits log ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS credits_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('signup_bonus','used','purchased','refunded','admin_grant')),
  amount      INTEGER NOT NULL,
  job_id      UUID REFERENCES jobs(id),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_log_user ON credits_log(user_id);

-- ── Subscriptions (payment records) ──────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_name    TEXT NOT NULL,  -- 'starter','standard','pro'
  credits_amount  INTEGER NOT NULL,
  amount_paid     INTEGER NOT NULL,
  currency        TEXT DEFAULT 'XAF',
  payment_method  TEXT,
  payment_ref     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','failed')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- ── Job sources (scraper registry) ───────────────────────
CREATE TABLE IF NOT EXISTS job_sources (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  url                   TEXT,
  tier                  INTEGER CHECK (tier BETWEEN 1 AND 3),
  africa_base_signal    INTEGER DEFAULT 3,
  scrape_method         TEXT DEFAULT 'api',  -- 'api','scrape','manual'
  is_active             BOOLEAN DEFAULT true,
  last_scraped_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- Seed job sources
INSERT INTO job_sources (name, url, tier, africa_base_signal, scrape_method) VALUES
  ('We Work Remotely',  'https://weworkremotely.com',    3, 3, 'scrape'),
  ('Wellfound',         'https://wellfound.com',          3, 3, 'api'),
  ('Remote.co',         'https://remote.co/remote-jobs', 3, 3, 'scrape'),
  ('Andela Network',    'https://andela.com',             1, 5, 'manual'),
  ('Turing',            'https://turing.com',             1, 5, 'manual'),
  ('Direct Employers',  NULL,                             1, 5, 'manual'),
  ('African Tech Cos',  NULL,                             2, 4, 'manual')
ON CONFLICT DO NOTHING;

-- ── pgvector match function ───────────────────────────────
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(1536),
  min_signal      integer DEFAULT 2,
  match_count     integer DEFAULT 20,
  match_offset    integer DEFAULT 0
)
RETURNS TABLE (
  id                   uuid,
  title                text,
  company_name         text,
  company_logo_url     text,
  location             text,
  is_remote            boolean,
  job_type             text,
  experience_level     text,
  tags                 text[],
  salary_min           integer,
  salary_max           integer,
  salary_currency      text,
  external_url         text,
  source               text,
  source_name          text,
  africa_hiring_signal integer,
  posted_at            timestamptz,
  match_score          float
)
LANGUAGE SQL STABLE AS $$
  SELECT
    j.id, j.title, j.company_name, j.company_logo_url, j.location, j.is_remote,
    j.job_type, j.experience_level, j.tags, j.salary_min, j.salary_max,
    j.salary_currency, j.external_url, j.source, j.source_name,
    j.africa_hiring_signal, j.posted_at,
    ROUND(((1 - (j.embedding <=> query_embedding)) * 100)::numeric, 1)::float AS match_score
  FROM jobs j
  WHERE j.is_active = true
    AND j.embedding IS NOT NULL
    AND j.africa_hiring_signal >= min_signal
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count
  OFFSET match_offset;
$$;

SELECT 'JobLink schema created ✅' AS status;
