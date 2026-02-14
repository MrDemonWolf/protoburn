import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(":memory:");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS token_usage (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_date ON token_usage(date);
  CREATE INDEX IF NOT EXISTS idx_model ON token_usage(model);
  CREATE INDEX IF NOT EXISTS idx_model_date ON token_usage(model, date);
`);

const db = drizzle(sqlite, { schema });

export default db;
export { schema };
