import type { Env } from "./types";
import { jsonResponse, errorResponse, checkAuth } from "./types";

interface GameBody {
  id: string;
  opponentName: string;
  gameDate: string;
  opponentScore: number;
  createdAt: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const { results } = await env.DB.prepare(
    "SELECT id, opponent_name as opponentName, game_date as gameDate, opponent_score as opponentScore, created_at as createdAt FROM games ORDER BY created_at DESC",
  ).all();
  return jsonResponse(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const body = (await request.json()) as GameBody;
  await env.DB.prepare(
    "INSERT OR REPLACE INTO games (id, opponent_name, game_date, opponent_score, created_at) VALUES (?, ?, ?, ?, ?)",
  )
    .bind(body.id, body.opponentName, body.gameDate, body.opponentScore, body.createdAt)
    .run();
  return jsonResponse({ ok: true }, 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return errorResponse("id is required");

  await env.DB.prepare("DELETE FROM games WHERE id = ?").bind(id).run();
  return jsonResponse({ ok: true });
};
