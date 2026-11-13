ALTER TABLE tournament_players
  ADD COLUMN team_name TEXT,
  ADD COLUMN crest_url TEXT,
  ADD COLUMN primary_color TEXT,
  ADD COLUMN secondary_color TEXT;

CREATE TABLE team_setup_tokens (
  token TEXT PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
