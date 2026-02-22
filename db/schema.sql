DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS game_players;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  number INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  opponent_name TEXT NOT NULL,
  game_date TEXT NOT NULL,
  opponent_score INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE game_players (
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  is_active_q1 INTEGER DEFAULT 0,
  is_active_q2 INTEGER DEFAULT 0,
  is_active_q3 INTEGER DEFAULT 0,
  is_active_q4 INTEGER DEFAULT 0,
  is_active_q5 INTEGER DEFAULT 0,
  PRIMARY KEY (game_id, player_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 5),
  player_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SHOT', 'FT', 'REB', 'FOUL')),
  zone_id INTEGER CHECK (zone_id IS NULL OR (zone_id BETWEEN 1 AND 9)),
  result TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
);

CREATE INDEX idx_logs_game_id ON logs(game_id);
CREATE INDEX idx_logs_player_id ON logs(player_id);
CREATE INDEX idx_game_players_game_id ON game_players(game_id);
