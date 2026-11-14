DROP TABLE IF EXISTS team_setup_tokens;

ALTER TABLE tournament_players
  DROP COLUMN IF EXISTS primary_color,
  DROP COLUMN IF EXISTS secondary_color;
