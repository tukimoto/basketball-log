import type { Env } from "./types";
import { jsonResponse, errorResponse, checkAuth } from "./types";

interface LogBody {
  id: string;
  gameId: string;
  quarter: number;
  playerId: string;
  action: string;
  zoneId: number | null;
  result: string;
  timestamp: number;
  passerPlayerId?: string | null;
  scorerPlayerId?: string | null;
  linkedShotLogId?: string | null;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const gameId = url.searchParams.get("gameId");

  let query = `SELECT id, game_id as gameId, quarter, player_id as playerId, action, zone_id as zoneId, result, timestamp,
    passer_player_id as passerPlayerId, scorer_player_id as scorerPlayerId, linked_shot_log_id as linkedShotLogId
    FROM logs`;
  const bindings: string[] = [];

  if (gameId) {
    query += " WHERE game_id = ?";
    bindings.push(gameId);
  }
  query += " ORDER BY timestamp ASC";

  const stmt = env.DB.prepare(query);
  const { results } = bindings.length > 0 ? await stmt.bind(...bindings).all() : await stmt.all();
  return jsonResponse(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  try {
    const body = (await request.json()) as LogBody | LogBody[];
    const entries = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(
      `INSERT OR REPLACE INTO logs
        (id, game_id, quarter, player_id, action, zone_id, result, timestamp, passer_player_id, scorer_player_id, linked_shot_log_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const batch = entries.map((e) =>
      stmt.bind(
        e.id,
        e.gameId,
        e.quarter,
        e.playerId,
        e.action,
        e.zoneId ?? null,
        e.result,
        e.timestamp,
        e.passerPlayerId ?? null,
        e.scorerPlayerId ?? null,
        e.linkedShotLogId ?? null,
      ),
    );

    await env.DB.batch(batch);
    return jsonResponse({ ok: true, count: entries.length }, 201);
  } catch (err) {
    console.error("D1 Batch Insert Error:", err);
    return errorResponse(err instanceof Error ? err.message : "Database error", 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const gameId = url.searchParams.get("gameId");

  if (id) {
    await env.DB.prepare("DELETE FROM logs WHERE id = ?").bind(id).run();
  } else if (gameId) {
    await env.DB.prepare("DELETE FROM logs WHERE game_id = ?").bind(gameId).run();
  } else {
    return errorResponse("id or gameId is required");
  }
  return jsonResponse({ ok: true });
};
