-- Esquema T&M (subconjunto del documento docs/modelo-de-mejora.md, sección 4).
-- Idempotente: se ejecuta en cada arranque.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS counters (name TEXT PRIMARY KEY, v INTEGER NOT NULL) STRICT;
INSERT OR IGNORE INTO counters (name, v) VALUES ('server_seq', 0);

-- ---------- Usuarios y acceso ----------
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at  INTEGER NOT NULL,
  deleted_at  INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS login_tokens (
  token_hash  TEXT PRIMARY KEY,           -- sha256 del token del enlace
  email       TEXT NOT NULL COLLATE NOCASE,
  consent_v   TEXT,                       -- versión del texto de consentimiento aceptado
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER
) STRICT;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,           -- sha256 del token de sesión; nunca el token
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS consents (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     TEXT NOT NULL,
  version     TEXT NOT NULL,
  granted_at  INTEGER NOT NULL,
  revoked_at  INTEGER,
  PRIMARY KEY (user_id, purpose, version)
) STRICT;

-- ---------- Alimentos (se cargan desde web/assets/js/data) ----------
CREATE TABLE IF NOT EXISTS foods (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  kind        TEXT NOT NULL CHECK (kind IN ('generic','recipe','custom')),
  name        TEXT NOT NULL,
  category    TEXT,
  icon        TEXT,
  unit        TEXT NOT NULL DEFAULT 'g',
  source      TEXT NOT NULL DEFAULT 'tm_curated',
  kcal REAL NOT NULL, protein_g REAL NOT NULL, carbs_g REAL NOT NULL, fat_g REAL NOT NULL,
  fiber_g REAL, sugar_g REAL, sat_fat_g REAL, sodium_mg REAL,
  revision    INTEGER NOT NULL DEFAULT 1,
  updated_at  INTEGER NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS portions (
  food_id  INTEGER NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
  label    TEXT NOT NULL,
  grams    REAL NOT NULL CHECK (grams > 0),
  sort     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (food_id, label)
) STRICT, WITHOUT ROWID;

CREATE VIRTUAL TABLE IF NOT EXISTS food_fts USING fts5(
  name, category, content='', contentless_delete=1,
  tokenize = "unicode61 remove_diacritics 2", prefix = '2 3'
);

-- ---------- Diario ----------
CREATE TABLE IF NOT EXISTS meal_entries (
  id            TEXT NOT NULL,            -- id generado en el cliente
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day           TEXT NOT NULL,            -- YYYY-MM-DD local
  meal          TEXT NOT NULL CHECK (meal IN ('desayuno','almuerzo','cena','snacks')),
  slug          TEXT,                     -- NULL en calorías rápidas
  label         TEXT NOT NULL,
  icon          TEXT,
  qty           REAL,
  portion_label TEXT,
  portion_g     REAL,
  grams         REAL,
  unit          TEXT,
  kcal REAL NOT NULL, protein_g REAL NOT NULL, carbs_g REAL NOT NULL, fat_g REAL NOT NULL,
  quick         INTEGER NOT NULL DEFAULT 0,
  updated_at    INTEGER NOT NULL,
  deleted_at    INTEGER,
  server_seq    INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
) STRICT;
CREATE INDEX IF NOT EXISTS me_user_day ON meal_entries(user_id, day) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS me_user_seq ON meal_entries(user_id, server_seq);

CREATE TABLE IF NOT EXISTS workouts (
  id          TEXT NOT NULL,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  slug        TEXT,
  label       TEXT NOT NULL,
  icon        TEXT,
  minutes     REAL NOT NULL,
  kcal        REAL NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  server_seq  INTEGER NOT NULL,
  PRIMARY KEY (user_id, id)
) STRICT;
CREATE INDEX IF NOT EXISTS wo_user_seq ON workouts(user_id, server_seq);

CREATE TABLE IF NOT EXISTS body_metrics (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day         TEXT NOT NULL,
  metric      TEXT NOT NULL CHECK (metric IN ('weight_kg')),
  value       REAL NOT NULL,
  updated_at  INTEGER NOT NULL,
  deleted_at  INTEGER,
  server_seq  INTEGER NOT NULL,
  PRIMARY KEY (user_id, metric, day)
) STRICT, WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS bm_user_seq ON body_metrics(user_id, server_seq);

CREATE TABLE IF NOT EXISTS goals (       -- meta vigente (una fila por usuario)
  user_id     TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data        TEXT NOT NULL,             -- JSON { kcal, p, c, f, profile }
  updated_at  INTEGER NOT NULL,
  server_seq  INTEGER NOT NULL
) STRICT;

-- ---------- Sincronización ----------
CREATE TABLE IF NOT EXISTS sync_ops (    -- cada operación del cliente se aplica una sola vez
  user_id    TEXT NOT NULL,
  op_id      TEXT NOT NULL,
  result     TEXT NOT NULL,              -- 'applied' | 'stale' | 'rejected'
  applied_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, op_id)
) STRICT, WITHOUT ROWID;
