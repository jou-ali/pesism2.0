ALTER TABLE tournaments ADD COLUMN current_matchday INT;
ALTER TABLE matchdays
  ADD COLUMN opens_at TIMESTAMPTZ,
  ADD COLUMN deadline_at TIMESTAMPTZ;
