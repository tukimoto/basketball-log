import type { Env } from "./types";
import { jsonResponse, errorResponse, checkAuth } from "./types";

interface GamePlayerBody {
  gameId: string;
  playerId: string;
  isActiveQ1: boolean;
  isActiveQ2: boolean;
  isActiveQ3: boolean;
  isActiveQ4: boolean;
  isActiveQ5: boolean;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");

  let query =
    "SELECT game_id as gameId, player_id as playerId, is_active_q1 as isActiveQ1, is_active_q2 as isActiveQ2, is_active_q3 as isActiveQ3, is_active_q4 as isActiveQ4, is_active_q5 as isActiveQ5 FROM game_players";
  const bindings: string[] = [];

  if (gameId) {
    query += " WHERE game_id = ?";
    bindings.push(gameId);
  }

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();

  const mapped = (results as Record<string, unknown>[]).map((r) => ({
    ...r,
    isActiveQ1: !!r["isActiveQ1"],
    isActiveQ2: !!r["isActiveQ2"],
    isActiveQ3: !!r["isActiveQ3"],
    isActiveQ4: !!r["isActiveQ4"],
    isActiveQ5: !!r["isActiveQ5"],
  }));
  return jsonResponse(mapped);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const body = (await request.json()) as GamePlayerBody | GamePlayerBody[];
  const entries = Array.isArray(body) ? body : [body];

  const stmt = env.DB.prepare(
    "INSERT OR REPLACE INTO game_players (game_id, player_id, is_active_q1, is_active_q2, is_active_q3, is_active_q4, is_active_q5) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );

  const batch = entries.map((e) =>
    stmt.bind(
      e.gameId, e.playerId,
      e.isActiveQ1 ? 1 : 0, e.isActiveQ2 ? 1 : 0, e.isActiveQ3 ? 1 : 0,
      e.isActiveQ4 ? 1 : 0, e.isActiveQ5 ? 1 : 0,
    ),
  );

  await env.DB.batch(batch);
  return jsonResponse({ ok: true, count: entries.length }, 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");
  if (!gameId) return errorResponse("gameId is required");

  await env.DB.prepare("DELETE FROM game_players WHERE game_id = ?").bind(gameId).run();
  return jsonResponse({ ok: true });
};
