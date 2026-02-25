import { create } from "zustand";
import type { Game, GamePlayer, Log, Quarter, InputState, Action, Result } from "@/types";
import { storage } from "@/lib/storage";
import { generateId } from "@/lib/utils";
import { calcTeamScore } from "@/lib/stats";

const GAMES_KEY = "games";
const GAME_PLAYERS_KEY = "game_players";
const LOGS_KEY = "logs";

interface GameStore {
  games: Game[];
  gamePlayers: GamePlayer[];
  logs: Log[];

  currentGameId: string | null;
  currentQuarter: Quarter;
  inputState: InputState;
  inputStep: "zone" | "action" | "player";

  load: () => void;

  createGame: (opponentName: string, gameDate: string) => Game;
  deleteGame: (id: string) => void;
  setCurrentGame: (id: string | null) => void;
  updateOpponentScore: (gameId: string, delta: number) => void;
  setOpponentScore: (gameId: string, score: number) => void;

  setGamePlayers: (gameId: string, playerIds: string[], activePlayerIds: string[]) => void;
  togglePlayerActive: (gameId: string, playerId: string, quarter: Quarter) => void;
  getActivePlayers: (gameId: string, quarter: Quarter) => string[];
  getGamePlayerIds: (gameId: string) => string[];

  setQuarter: (q: Quarter) => void;
  selectZone: (zoneId: number) => void;
  selectAction: (action: Action, result: Result) => void;
  selectPlayer: (playerId: string) => Log | undefined;
  resetInput: () => void;

  addAssistLog: (passerPlayerId: string, scorerPlayerId: string, linkedShotLogId: string) => void;

  undo: () => void;
  deleteLog: (logId: string) => void;
  updateLog: (logId: string, updatedLog: Partial<Log>) => void;

  getGameLogs: (gameId: string) => Log[];
  getTeamScore: (gameId: string) => number;
}

const emptyInput: InputState = {
  zoneId: null,
  action: null,
  result: null,
  playerId: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  games: [],
  gamePlayers: [],
  logs: [],
  currentGameId: null,
  currentQuarter: 1,
  inputState: { ...emptyInput },
  inputStep: "zone",

  load() {
    const games = storage.get<Game[]>(GAMES_KEY) ?? [];
    const gamePlayers = storage.get<GamePlayer[]>(GAME_PLAYERS_KEY) ?? [];
    const logs = storage.get<Log[]>(LOGS_KEY) ?? [];
    set({ games, gamePlayers, logs });
  },

  createGame(opponentName, gameDate) {
    const game: Game = {
      id: generateId(),
      opponentName,
      gameDate,
      opponentScore: 0,
      createdAt: Date.now(),
    };
    const next = [...get().games, game];
    storage.set(GAMES_KEY, next);
    set({ games: next });
    return game;
  },

  deleteGame(id) {
    const games = get().games.filter((g) => g.id !== id);
    const gamePlayers = get().gamePlayers.filter((gp) => gp.gameId !== id);
    const logs = get().logs.filter((l) => l.gameId !== id);
    storage.set(GAMES_KEY, games);
    storage.set(GAME_PLAYERS_KEY, gamePlayers);
    storage.set(LOGS_KEY, logs);
    set({ games, gamePlayers, logs });
  },

  setCurrentGame(id) {
    set({ currentGameId: id, currentQuarter: 1, inputState: { ...emptyInput }, inputStep: "zone" });
  },

  updateOpponentScore(gameId, delta) {
    const games = get().games.map((g) =>
      g.id === gameId
        ? { ...g, opponentScore: Math.max(0, g.opponentScore + delta) }
        : g,
    );
    storage.set(GAMES_KEY, games);
    set({ games });
  },

  setOpponentScore(gameId, score) {
    const games = get().games.map((g) =>
      g.id === gameId ? { ...g, opponentScore: Math.max(0, score) } : g,
    );
    storage.set(GAMES_KEY, games);
    set({ games });
  },

  setGamePlayers(gameId, playerIds, activePlayerIds) {
    const existing = get().gamePlayers.filter((gp) => gp.gameId !== gameId);
    const newEntries: GamePlayer[] = playerIds.map((pid) => ({
      gameId,
      playerId: pid,
      isActiveQ1: activePlayerIds.includes(pid),
      isActiveQ2: false,
      isActiveQ3: false,
      isActiveQ4: false,
      isActiveQ5: false,
    }));
    const next = [...existing, ...newEntries];
    storage.set(GAME_PLAYERS_KEY, next);
    set({ gamePlayers: next });
  },

  togglePlayerActive(gameId, playerId, quarter) {
    const next = get().gamePlayers.map((gp) => {
      if (gp.gameId !== gameId || gp.playerId !== playerId) return gp;
      const key = `isActiveQ${quarter}` as keyof GamePlayer;
      return { ...gp, [key]: !gp[key] };
    });
    storage.set(GAME_PLAYERS_KEY, next);
    set({ gamePlayers: next });
  },

  getActivePlayers(gameId, quarter) {
    const key = `isActiveQ${quarter}` as keyof GamePlayer;
    return get()
      .gamePlayers.filter((gp) => gp.gameId === gameId && gp[key] === true)
      .map((gp) => gp.playerId);
  },

  getGamePlayerIds(gameId) {
    return get()
      .gamePlayers.filter((gp) => gp.gameId === gameId)
      .map((gp) => gp.playerId);
  },

  setQuarter(q) {
    set({ currentQuarter: q });
  },

  selectZone(zoneId) {
    set((s) => ({
      inputState: { ...s.inputState, zoneId },
      inputStep: "action",
    }));
  },

  selectAction(action, result) {
    const state = get();
    const newInputState = { ...state.inputState, action, result };

    if (action === "FT") {
      newInputState.zoneId = null;
    }

    set({
      inputState: newInputState,
      inputStep: "player",
    });
  },

  selectPlayer(playerId) {
    const { inputState, currentGameId, currentQuarter, logs } = get();

    if (!currentGameId || !inputState.action || !inputState.result) return;

    if (inputState.action !== "FT" && inputState.zoneId === null) return;

    const log: Log = {
      id: generateId(),
      gameId: currentGameId,
      quarter: currentQuarter,
      playerId,
      action: inputState.action,
      zoneId: inputState.zoneId,
      result: inputState.result,
      timestamp: Date.now(),
    };

    const nextLogs = [...logs, log];
    storage.set(LOGS_KEY, nextLogs);

    set({
      logs: nextLogs,
      inputState: { ...emptyInput },
      inputStep: "zone",
    });

    return log;
  },

  addAssistLog(passerPlayerId, scorerPlayerId, linkedShotLogId) {
    const { currentGameId, currentQuarter, logs } = get();
    if (!currentGameId) return;

    const log: Log = {
      id: generateId(),
      gameId: currentGameId,
      quarter: currentQuarter,
      playerId: passerPlayerId,
      action: "AST",
      zoneId: null,
      result: "AST",
      timestamp: Date.now(),
      passerPlayerId,
      scorerPlayerId,
      linkedShotLogId,
    };

    const nextLogs = [...logs, log];
    storage.set(LOGS_KEY, nextLogs);
    set({ logs: nextLogs });
  },

  resetInput() {
    set({ inputState: { ...emptyInput }, inputStep: "zone" });
  },

  undo() {
    const { logs, currentGameId } = get();
    if (!currentGameId) return;

    const gameLogs = logs.filter((l) => l.gameId === currentGameId);
    if (gameLogs.length === 0) return;

    const lastLog = gameLogs[gameLogs.length - 1]!;
    get().deleteLog(lastLog.id);
  },

  deleteLog(logId) {
    const { logs } = get();
    const logToDelete = logs.find((l) => l.id === logId);
    if (!logToDelete) return;

    const idsToRemove = new Set([logId]);

    // シュート成功を消す場合、紐づくアシストも消す
    if (logToDelete.action === "SHOT" && logToDelete.result === "MAKE") {
      for (const l of logs) {
        if (l.action === "AST" && l.linkedShotLogId === logId) {
          idsToRemove.add(l.id);
        }
      }
    }

    const nextLogs = logs.filter((l) => !idsToRemove.has(l.id));
    storage.set(LOGS_KEY, nextLogs);
    set({ logs: nextLogs });
  },

  updateLog(logId, updatedLog) {
    const nextLogs = get().logs.map((l) =>
      l.id === logId ? { ...l, ...updatedLog } : l,
    );
    storage.set(LOGS_KEY, nextLogs);
    set({ logs: nextLogs });
  },

  getGameLogs(gameId) {
    return get().logs.filter((l) => l.gameId === gameId);
  },

  getTeamScore(gameId) {
    return calcTeamScore(get().logs.filter((l) => l.gameId === gameId));
  },
}));
