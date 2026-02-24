const API_BASE = "/api";

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const apiKey = localStorage.getItem("bball_api_key");
  if (apiKey) headers["X-API-Key"] = apiKey;
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as { error?: string }).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

export const api = {
  players: {
    list: () => request<{ id: string; number: number; name: string; createdAt: number }[]>("/players"),
    save: (data: { id: string; number: number; name: string; createdAt: number }) =>
      request("/players", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/players?id=${id}`, { method: "DELETE" }),
  },
  games: {
    list: () =>
      request<{ id: string; opponentName: string; gameDate: string; opponentScore: number; createdAt: number }[]>("/games"),
    save: (data: { id: string; opponentName: string; gameDate: string; opponentScore: number; createdAt: number }) =>
      request("/games", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/games?id=${id}`, { method: "DELETE" }),
  },
  logs: {
    list: (gameId?: string) =>
      request<{ id: string; gameId: string; quarter: number; playerId: string; action: string; zoneId: number | null; result: string; timestamp: number; passerPlayerId?: string | null; scorerPlayerId?: string | null; linkedShotLogId?: string | null }[]>(
        gameId ? `/logs?gameId=${gameId}` : "/logs",
      ),
    save: (data: unknown) =>
      request("/logs", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: string) => request(`/logs?id=${id}`, { method: "DELETE" }),
    removeByGame: (gameId: string) =>
      request(`/logs?gameId=${gameId}`, { method: "DELETE" }),
  },
  gamePlayers: {
    list: (gameId?: string) =>
      request<{ gameId: string; playerId: string; isActiveQ1: boolean; isActiveQ2: boolean; isActiveQ3: boolean; isActiveQ4: boolean; isActiveQ5: boolean }[]>(
        gameId ? `/game-players?gameId=${gameId}` : "/game-players",
      ),
    save: (data: unknown) =>
      request("/game-players", { method: "POST", body: JSON.stringify(data) }),
    removeByGame: (gameId: string) =>
      request(`/game-players?gameId=${gameId}`, { method: "DELETE" }),
  },
};
