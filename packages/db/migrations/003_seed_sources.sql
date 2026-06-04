-- Seed verified job sources
INSERT INTO job_sources (name, url, tier, africa_base_signal) VALUES
  ('We Work Remotely',   'https://weworkremotely.com',     1, 4),
  ('Remote.com Jobs',    'https://remote.com/jobs',        1, 5),
  ('Wellfound Remote',   'https://wellfound.com/jobs',     1, 4),
  ('Andela Network',     'https://andela.com',             1, 5),
  ('Turing Jobs',        'https://turing.com',             1, 5),
  ('YC Work at Startup', 'https://workatastartup.com',     2, 3),
  ('Flutterwave Careers','https://flutterwave.com/careers',1, 5),
  ('Paystack Careers',   'https://paystack.com/careers',   1, 5),
  ('Wave Careers',       'https://wave.com/careers',       1, 5),
  ('UN Jobs Africa',     'https://unjobs.org',             2, 4),
  ('ReliefWeb',          'https://reliefweb.int/jobs',     2, 4)
ON CONFLICT DO NOTHING;

SELECT 'Job sources seeded ✅' AS status;
