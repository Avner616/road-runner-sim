-- Migration: create runners table
-- Maps to RunnerProfile in src/engine/types/runner.ts
-- hidden_potential is stored but never exposed to the client via RLS SELECT *

CREATE TABLE public.runners (
  id               TEXT        PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  gender           TEXT        NOT NULL CHECK (gender IN ('male', 'female', 'non-binary')),
  age              INTEGER     NOT NULL CHECK (age BETWEEN 1 AND 120),
  nationality      TEXT        NOT NULL,
  home_location    TEXT        NOT NULL,
  avatar_url       TEXT,
  runner_type      TEXT        NOT NULL CHECK (runner_type IN ('elite', 'amateur')),
  preferred_event  TEXT        NOT NULL CHECK (preferred_event IN ('5k', '10k', 'half', 'marathon')),
  attributes       JSONB       NOT NULL,
  hidden_potential JSONB       NOT NULL,
  fitness_age      INTEGER     NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX runners_user_id_idx ON public.runners (user_id);

-- Row Level Security
ALTER TABLE public.runners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "runners_select_own"
  ON public.runners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "runners_insert_own"
  ON public.runners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runners_update_own"
  ON public.runners FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "runners_delete_own"
  ON public.runners FOR DELETE
  USING (auth.uid() = user_id);
