-- Run once in the Supabase SQL Editor as the project owner.
-- Keep app_private out of the Data API's exposed schemas.
BEGIN;
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS app_private.analysis_usage (
  day date PRIMARY KEY,
  count integer NOT NULL DEFAULT 0 CHECK (count >= 0)
);
CREATE TABLE IF NOT EXISTS app_private.users (
  id uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON ALL TABLES IN SCHEMA app_private FROM PUBLIC, anon, authenticated;
ALTER TABLE app_private.analysis_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_private.users ENABLE ROW LEVEL SECURITY;
COMMIT;

-- The table owner can access these tables. If a separate backend database role
-- is used, explicitly grant only the necessary privileges and add appropriate
-- RLS policies. Never grant client roles access to this schema.
