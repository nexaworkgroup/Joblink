-- Run this in Supabase SQL Editor to fix any jobs that lost their employer_id link
-- This backfills employer_id based on company_name matching

UPDATE jobs j
SET employer_id = pe.id
FROM profiles_employer pe
WHERE j.source = 'native'
  AND j.employer_id IS NULL
  AND lower(j.company_name) = lower(pe.company_name);

-- Check what we have
SELECT 
  j.id,
  j.title,
  j.company_name,
  j.employer_id,
  j.source,
  pe.id as employer_profile_id,
  u.email as employer_email
FROM jobs j
LEFT JOIN profiles_employer pe ON pe.id = j.employer_id
LEFT JOIN users u ON u.id = pe.user_id
WHERE j.source = 'native'
ORDER BY j.created_at DESC;
