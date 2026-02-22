-- Consolidate duplicate (model, date) rows by summing token values,
-- then add a unique index to prevent future duplicates.

-- Step 1: Create temp table with consolidated data
CREATE TABLE token_usage_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Step 2: Insert consolidated data (sum duplicates per model+date)
INSERT INTO token_usage_new (model, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, date, created_at)
  SELECT
    model,
    SUM(input_tokens),
    SUM(output_tokens),
    SUM(cache_creation_tokens),
    SUM(cache_read_tokens),
    date,
    MIN(created_at)
  FROM token_usage
  GROUP BY model, date;

-- Step 3: Drop old table and rename
DROP TABLE token_usage;
ALTER TABLE token_usage_new RENAME TO token_usage;

-- Step 4: Recreate indexes (unique on model+date, regular on date and model)
CREATE UNIQUE INDEX idx_unique_model_date ON token_usage(model, date);
CREATE INDEX idx_date ON token_usage(date);
CREATE INDEX idx_model ON token_usage(model);
