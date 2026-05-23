-- ── Burnt Calories — initial schema ─────────────────────────────────────────

-- Ingredients (static reference data)
CREATE TABLE IF NOT EXISTS ingredients (
  id        INTEGER PRIMARY KEY,
  name      TEXT    NOT NULL,
  cat       TEXT    NOT NULL,
  sub       TEXT    NOT NULL,
  ref       NUMERIC NOT NULL,
  cal       NUMERIC NOT NULL,
  p         NUMERIC NOT NULL,
  c         NUMERIC NOT NULL,
  f         NUMERIC NOT NULL,
  fi        NUMERIC NOT NULL,
  benefits  TEXT[]  NOT NULL DEFAULT '{}'
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id        BIGINT  PRIMARY KEY,
  name      TEXT    NOT NULL,
  cat       TEXT    NOT NULL,
  goal      TEXT[]  NOT NULL DEFAULT '{}',
  prep      INTEGER NOT NULL DEFAULT 0,
  cook      INTEGER NOT NULL DEFAULT 0,
  serves    INTEGER NOT NULL DEFAULT 1,
  emoji     TEXT    NOT NULL DEFAULT '🍽️',
  "desc"    TEXT    NOT NULL DEFAULT '',
  ings      JSONB   NOT NULL DEFAULT '[]',
  method    TEXT[]  NOT NULL DEFAULT '{}',
  tags      TEXT[]  NOT NULL DEFAULT '{}',
  custom    BOOLEAN NOT NULL DEFAULT FALSE
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT    NOT NULL UNIQUE,
  age            INTEGER,
  weight         NUMERIC,
  height         NUMERIC,
  gender         TEXT,
  goal           TEXT,
  activity_level TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients     ENABLE ROW LEVEL SECURITY;

-- Ingredients: public read only
CREATE POLICY "anon_read_ingredients"  ON ingredients FOR SELECT USING (true);

-- Recipes: public read/write (tighten after auth is added)
CREATE POLICY "anon_read_recipes"      ON recipes FOR SELECT USING (true);
CREATE POLICY "anon_insert_recipes"    ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_recipes"    ON recipes FOR UPDATE USING (true);
CREATE POLICY "anon_delete_recipes"    ON recipes FOR DELETE USING (true);

-- Clients: public read/write (tighten after auth is added)
CREATE POLICY "anon_read_clients"      ON clients FOR SELECT USING (true);
CREATE POLICY "anon_insert_clients"    ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_update_clients"    ON clients FOR UPDATE USING (true);
CREATE POLICY "anon_delete_clients"    ON clients FOR DELETE USING (true);
