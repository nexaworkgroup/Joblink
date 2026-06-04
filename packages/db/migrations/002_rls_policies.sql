-- ════════════════════════════════════════════════════════
-- JobLink V1 — Row Level Security Policies (Safe Re-run)
-- Drops existing policies before recreating — safe to run multiple times
-- ════════════════════════════════════════════════════════

-- ── Users ────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users read own record"   ON users;
DROP POLICY IF EXISTS "Users update own record" ON users;
CREATE POLICY "Users read own record"   ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users update own record" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ── Seeker profiles ───────────────────────────────────
ALTER TABLE profiles_seeker ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seekers manage own profile"    ON profiles_seeker;
DROP POLICY IF EXISTS "Employers view seeker profiles" ON profiles_seeker;
CREATE POLICY "Seekers manage own profile"     ON profiles_seeker FOR ALL    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Employers view seeker profiles" ON profiles_seeker FOR SELECT TO authenticated USING (true);

-- ── Employer profiles ─────────────────────────────────
ALTER TABLE profiles_employer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Employers manage own profile"  ON profiles_employer;
DROP POLICY IF EXISTS "Public read employer profiles" ON profiles_employer;
CREATE POLICY "Employers manage own profile"  ON profiles_employer FOR ALL    TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read employer profiles" ON profiles_employer FOR SELECT USING (true);

-- ── Jobs ──────────────────────────────────────────────
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active jobs"        ON jobs;
DROP POLICY IF EXISTS "Employers manage own jobs"      ON jobs;
DROP POLICY IF EXISTS "Service role full access jobs"  ON jobs;
CREATE POLICY "Public read active jobs"   ON jobs FOR SELECT USING (is_active = true);
CREATE POLICY "Employers manage own jobs" ON jobs FOR ALL TO authenticated
  USING (employer_id IN (SELECT id FROM profiles_employer WHERE user_id = auth.uid()))
  WITH CHECK (employer_id IN (SELECT id FROM profiles_employer WHERE user_id = auth.uid()));
CREATE POLICY "Service role full access jobs" ON jobs FOR ALL TO service_role USING (true);

-- ── Applications ──────────────────────────────────────
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Seekers manage own applications" ON applications;
CREATE POLICY "Seekers manage own applications" ON applications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Remote Ready ──────────────────────────────────────
ALTER TABLE remote_ready ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own remote ready" ON remote_ready;
CREATE POLICY "Users manage own remote ready" ON remote_ready FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Credits log ───────────────────────────────────────
ALTER TABLE credits_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own credits" ON credits_log;
CREATE POLICY "Users view own credits" ON credits_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ── Notifications ─────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own notifications" ON notifications;
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL TO authenticated USING (auth.uid() = user_id);

-- ── Subscriptions ─────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own subscriptions"   ON subscriptions;
DROP POLICY IF EXISTS "Users create own subscriptions" ON subscriptions;
CREATE POLICY "Users view own subscriptions"   ON subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users create own subscriptions" ON subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ── Job sources ───────────────────────────────────────
ALTER TABLE job_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read job sources" ON job_sources;
CREATE POLICY "Public read job sources" ON job_sources FOR SELECT USING (true);

SELECT 'RLS policies applied ✅' AS status;
