import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { storage } from "@/lib/storage";

type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastPushCounts, setLastPushCounts] = useState<{
    players: number;
    games: number;
    logs: number;
  } | null>(null);
  const [lastSynced, setLastSynced] = useState<number | null>(
    storage.get<number>("last_synced"),
  );

  const pushToCloud = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      setErrorMessage(null);
      return;
    }

    setStatus("syncing");
    setErrorMessage(null);
    setLastPushCounts(null);
    try {
      const { players } = usePlayerStore.getState();
      const { games, gamePlayers, logs } = useGameStore.getState();

      if (players.length > 0) {
        await api.players.save(players);
      }
      if (games.length > 0) {
        await api.games.save(games);
      }
      if (gamePlayers.length > 0) {
        await api.gamePlayers.save(gamePlayers);
      }
      if (logs.length > 0) {
        await api.logs.save(logs);
      }

      const now = Date.now();
      storage.set("last_synced", now);
      setLastSynced(now);
      setLastPushCounts({ players: players.length, games: games.length, logs: logs.length });
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus("error");
    }
  }, []);

  const pullFromCloud = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      setErrorMessage(null);
      return;
    }

    setStatus("syncing");
    setErrorMessage(null);
    try {
      const [cloudPlayers, cloudGames, cloudGamePlayers, cloudLogs] =
        await Promise.allSettled([
          api.players.list(),
          api.games.list(),
          api.gamePlayers.list(),
          api.logs.list(),
        ]);

      const { players: localPlayers } = usePlayerStore.getState();
      const {
        games: localGames,
        gamePlayers: localGamePlayers,
        logs: localLogs,
      } = useGameStore.getState();

      const players =
        cloudPlayers.status === "fulfilled" ? cloudPlayers.value : localPlayers;
      const games =
        cloudGames.status === "fulfilled" ? cloudGames.value : localGames;
      const gamePlayers =
        cloudGamePlayers.status === "fulfilled"
          ? cloudGamePlayers.value
          : localGamePlayers;
      const logs =
        cloudLogs.status === "fulfilled" ? cloudLogs.value : localLogs;

      const hasCloudData =
        (cloudPlayers.status === "fulfilled" && cloudPlayers.value.length > 0) ||
        (cloudGames.status === "fulfilled" && cloudGames.value.length > 0) ||
        (cloudGamePlayers.status === "fulfilled" &&
          cloudGamePlayers.value.length > 0) ||
        (cloudLogs.status === "fulfilled" && cloudLogs.value.length > 0);
      const hasLocalData =
        localPlayers.length > 0 ||
        localGames.length > 0 ||
        localGamePlayers.length > 0 ||
        localLogs.length > 0;

      if (!hasCloudData && hasLocalData) {
        setStatus("success");
        return;
      }

      storage.set("players", players);
      storage.set("games", games);
      storage.set("game_players", gamePlayers);
      storage.set("logs", logs);

      usePlayerStore.getState().load();
      useGameStore.getState().load();

      const now = Date.now();
      storage.set("last_synced", now);
      setLastSynced(now);
      setStatus("success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    const handle = () => setStatus(navigator.onLine ? "idle" : "offline");
    window.addEventListener("online", handle);
    window.addEventListener("offline", handle);
    handle();
    return () => {
      window.removeEventListener("online", handle);
      window.removeEventListener("offline", handle);
    };
  }, []);

  return { status, errorMessage, lastPushCounts, lastSynced, pushToCloud, pullFromCloud };
}
