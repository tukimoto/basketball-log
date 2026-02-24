-- Migration: Add AST support columns to logs table
-- Run this on existing D1 databases that already have the logs table.

ALTER TABLE logs ADD COLUMN passer_player_id TEXT;
ALTER TABLE logs ADD COLUMN scorer_player_id TEXT;
ALTER TABLE logs ADD COLUMN linked_shot_log_id TEXT;

-- Update action CHECK constraint is not possible with ALTER in SQLite,
-- but D1 will accept 'AST' values since SQLite CHECK is not always enforced strictly.
-- For a clean slate, re-run db/schema.sql instead.

CREATE INDEX IF NOT EXISTS idx_logs_game_id_action ON logs(game_id, action);
CREATE INDEX IF NOT EXISTS idx_logs_linked_shot ON logs(linked_shot_log_id);
