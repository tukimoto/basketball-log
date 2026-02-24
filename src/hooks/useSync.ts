import { useCallback, useEffect, useState } from "react";
import { api } from "@/api/client";
import { usePlayerStore } from "@/stores/playerStore";
import { useGameStore } from "@/stores/gameStore";
import { storage } from "@/lib/storage";

type SyncStatus = "idle" | "syncing" | "success" | "error" | "offline";

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSynced, setLastSynced] = useState<number | null>(
    storage.get<number>("last_synced"),
  );

  const pushToCloud = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    setStatus("syncing");
    try {
      const { players } = usePlayerStore.getState();
      const { games, gamePlayers, logs } = useGameStore.getState();

      await Promise.all(players.map((p) => api.players.save(p)));
      await Promise.all(games.map((g) => api.games.save(g)));

      if (gamePlayers.length > 0) {
        await api.gamePlayers.save(gamePlayers);
      }
      if (logs.length > 0) {
        await api.logs.save(logs);
      }

      const now = Date.now();
      storage.set("last_synced", now);
      setLastSynced(now);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  const pullFromCloud = useCallback(async () => {
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    setStatus("syncing");
    try {
      const [cloudPlayers, cloudGames, cloudGamePlayers, cloudLogs] =
        await Promise.allSettled([
          api.players.list(),
          api.games.list(),
          api.gamePlayers.list(),
          api.logs.list(),
        ]);

      const players =
        cloudPlayers.status === "fulfilled" ? cloudPlayers.value : [];
      const games = cloudGames.status === "fulfilled" ? cloudGames.value : [];
      const gamePlayers =
        cloudGamePlayers.status === "fulfilled" ? cloudGamePlayers.value : [];
      const logs = cloudLogs.status === "fulfilled" ? cloudLogs.value : [];

      const { players: localPlayers } = usePlayerStore.getState();
      const {
        games: localGames,
        gamePlayers: localGamePlayers,
        logs: localLogs,
      } = useGameStore.getState();

      const hasCloudData =
        players.length > 0 ||
        games.length > 0 ||
        gamePlayers.length > 0 ||
        logs.length > 0;
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
    } catch {
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

  return { status, lastSynced, pushToCloud, pullFromCloud };
}
