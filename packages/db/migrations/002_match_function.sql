-- AI match function for job feed
CREATE OR REPLACE FUNCTION match_jobs(
  query_embedding vector(1536),
  match_count     INTEGER DEFAULT 20,
  min_signal      INTEGER DEFAULT 2,
  match_offset    INTEGER DEFAULT 0
)
RETURNS TABLE (
  id                   UUID,
  title                TEXT,
  company_name         TEXT,
  company_logo_url     TEXT,
  location             TEXT,
  is_remote            BOOLEAN,
  job_type             TEXT,
  experience_level     TEXT,
  salary_min           INTEGER,
  salary_max           INTEGER,
  salary_currency      TEXT,
  tags                 TEXT[],
  external_url         TEXT,
  source               TEXT,
  source_tier          INTEGER,
  africa_hiring_signal INTEGER,
  posted_at            TIMESTAMPTZ,
  match_score          INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id, j.title, j.company_name, j.company_logo_url,
    j.location, j.is_remote, j.job_type, j.experience_level,
    j.salary_min, j.salary_max, j.salary_currency,
    j.tags, j.external_url, j.source, j.source_tier,
    j.africa_hiring_signal, j.posted_at,
    LEAST(100, ROUND((1 - (j.embedding <=> query_embedding)) * 100)::INTEGER) AS match_score
  FROM jobs j
  WHERE
    j.is_active = true
    AND j.embedding IS NOT NULL
    AND j.africa_hiring_signal >= min_signal
  ORDER BY j.embedding <=> query_embedding
  LIMIT match_count OFFSET match_offset;
END;
$$;

SELECT 'match_jobs function created ✅' AS status;
