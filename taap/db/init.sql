-- TAAP schema for the isolated Hostinger Postgres in /home/taap.
-- The Node process still uses JSON files in data/ for sessions/leads;
-- this database is ready for the swap and is dumped daily.

CREATE TABLE IF NOT EXISTS clients (
  chat_id TEXT PRIMARY KEY,
  username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  chat_id TEXT PRIMARY KEY,
  mode TEXT NOT NULL DEFAULT 'idle',
  handed_off BOOLEAN NOT NULL DEFAULT false,
  slots JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  chat_id TEXT NOT NULL,
  username TEXT,
  slots JSONB NOT NULL,
  lead_score DOUBLE PRECISION,
  source_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS decision_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  chat_id TEXT,
  message TEXT,
  model TEXT,
  answers JSONB,
  decision JSONB,
  latency_ms INTEGER
);

CREATE TABLE IF NOT EXISTS operator_queue (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  chat_id TEXT NOT NULL,
  username TEXT,
  reason TEXT,
  text TEXT,
  handled BOOLEAN NOT NULL DEFAULT false
);

-- Visa KB: Node still reads db/visa-rules.json; this table is the Postgres copy.
-- Re-seed an existing volume with db/seed-visa.sql.
CREATE TABLE IF NOT EXISTS visa_rules (
  id BIGSERIAL PRIMARY KEY,
  country TEXT NOT NULL,
  citizenship TEXT,
  visa_type TEXT,
  required BOOLEAN,
  documents TEXT,
  stay_days INTEGER,
  processing_days INTEGER,
  fee TEXT,
  apply_url TEXT,
  source_url TEXT,
  checked_at DATE,
  valid_until DATE,
  notes_ru TEXT,
  notes_tg TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS visa_rules_country_citizenship_type
  ON visa_rules (country, citizenship, visa_type);

CREATE TABLE IF NOT EXISTS visa_gaps (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  country TEXT,
  citizenship TEXT,
  visa_type TEXT,
  question TEXT,
  chat_id TEXT
);
