-- Trousseau cloud share schema (Vercel Postgres).
-- Run once against POSTGRES_URL, e.g.:
--   psql "$POSTGRES_URL" -f scripts/migrate-cloud.sql

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  site TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funds (
  id TEXT NOT NULL,
  budget_id TEXT NOT NULL REFERENCES budgets (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (budget_id, id)
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT NOT NULL,
  budget_id TEXT NOT NULL REFERENCES budgets (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "group" TEXT NOT NULL,
  sort INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (budget_id, id)
);

CREATE TABLE IF NOT EXISTS line_items (
  id TEXT NOT NULL,
  budget_id TEXT NOT NULL REFERENCES budgets (id) ON DELETE CASCADE,
  category_id TEXT NOT NULL,
  label TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  due_date TEXT,
  notes TEXT,
  sort INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (budget_id, id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT NOT NULL,
  budget_id TEXT NOT NULL REFERENCES budgets (id) ON DELETE CASCADE,
  line_item_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  url TEXT,
  mime TEXT,
  size DOUBLE PRECISION,
  blob_pathname TEXT,
  created_at TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (budget_id, id)
);

CREATE INDEX IF NOT EXISTS funds_budget_idx ON funds (budget_id);
CREATE INDEX IF NOT EXISTS categories_budget_idx ON categories (budget_id);
CREATE INDEX IF NOT EXISTS line_items_budget_idx ON line_items (budget_id);
CREATE INDEX IF NOT EXISTS attachments_budget_idx ON attachments (budget_id);

-- Optional gift / vendor metadata (backup payload v2). Safe on fresh and existing DBs.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE funds ADD COLUMN IF NOT EXISTS received_date TEXT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS vendor_url TEXT;

-- Backup payload v3: thank-yous, payment stubs, balance / reimbursement dates, offsets.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS thanked BOOLEAN;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS remaining_balance_due_date TEXT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS payments TEXT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS expected_back_date TEXT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS back_received BOOLEAN;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS due_offset_days INT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS balance_offset_days INT;

-- Backup payload v4: gift earmarks + who-pays on lines.
ALTER TABLE funds ADD COLUMN IF NOT EXISTS earmark_category_id TEXT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS who_pays TEXT;

-- Backup payload v5: multi-installment due schedules on lines.
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS installments TEXT;

-- Backup payload v6: post-wedding offsets, who-pays $, quote lock, plate, attachment roles.
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS expected_back_offset_days INT;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS who_pays_left DOUBLE PRECISION;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS who_pays_right DOUBLE PRECISION;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS quoted_amount DOUBLE PRECISION;
ALTER TABLE line_items ADD COLUMN IF NOT EXISTS per_guest_amount DOUBLE PRECISION;
ALTER TABLE attachments ADD COLUMN IF NOT EXISTS role TEXT;
