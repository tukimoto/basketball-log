export type Action = "SHOT" | "FT" | "REB" | "FOUL";

export type ShotResult = "MAKE" | "MISS";
export type ReboundResult = "OFF" | "DEF";
export type FoulResult = string;
export type Result = ShotResult | ReboundResult | FoulResult;

export type Quarter = 1 | 2 | 3 | 4 | 5;

export interface Log {
  id: string;
  gameId: string;
  quarter: Quarter;
  playerId: string;
  action: Action;
  zoneId: number | null; // 1-9 (FTの場合はnull)
  result: Result;
  timestamp: number;
  synced?: boolean;
}

export interface Player {
  id: string;
  number: number;
  name: string;
  createdAt: number;
}

export interface Game {
  id: string;
  opponentName: string;
  gameDate: string;
  opponentScore: number;
  createdAt: number;
}

export interface GamePlayer {
  gameId: string;
  playerId: string;
  isActiveQ1: boolean;
  isActiveQ2: boolean;
  isActiveQ3: boolean;
  isActiveQ4: boolean;
  isActiveQ5: boolean;
}

export interface InputState {
  zoneId: number | null;
  action: Action | null;
  result: Result | null;
  playerId: string | null;
}

export type InputStep = "zone" | "action" | "player";

export interface PlayerStats {
  playerId: string;
  playerName: string;
  playerNumber: number;
  shotMade: number;
  shotMiss: number;
  ftMade: number;
  ftMiss: number;
  offReb: number;
  defReb: number;
  fouls: number;
  points: number;
  fgPercent: number;
  ftPercent: number;
}
