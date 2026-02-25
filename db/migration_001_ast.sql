-- Migration: Add AST support and update action CHECK constraint
-- This migration recreates the logs table to update the CHECK constraint which is not possible with ALTER TABLE in SQLite.

-- 1. Create a new table with the updated schema
CREATE TABLE logs_new (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 5),
  player_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SHOT', 'FT', 'REB', 'FOUL', 'AST')),
  zone_id INTEGER CHECK (zone_id IS NULL OR (zone_id BETWEEN 1 AND 9)),
  result TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  passer_player_id TEXT,
  scorer_player_id TEXT,
  linked_shot_log_id TEXT,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

-- 2. Copy data from the old table to the new table
-- Note: new columns will be NULL for existing rows
INSERT INTO logs_new (id, game_id, quarter, player_id, action, zone_id, result, timestamp)
SELECT id, game_id, quarter, player_id, action, zone_id, result, timestamp FROM logs;

-- 3. Drop the old table
DROP TABLE logs;

-- 4. Rename the new table to the original name
ALTER TABLE logs_new RENAME TO logs;

-- 5. Re-create indexes
CREATE INDEX idx_logs_game_id ON logs(game_id);
CREATE INDEX idx_logs_player_id ON logs(player_id);
CREATE INDEX idx_logs_game_id_action ON logs(game_id, action);
CREATE INDEX idx_logs_linked_shot ON logs(linked_shot_log_id);
