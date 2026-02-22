import type { Env } from "./types";
import { jsonResponse, errorResponse, checkAuth } from "./types";

interface PlayerBody {
  id: string;
  number: number;
  name: string;
  createdAt: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const { results } = await env.DB.prepare(
    "SELECT id, number, name, created_at as createdAt FROM players ORDER BY number",
  ).all();
  return jsonResponse(results);
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const body = (await request.json()) as PlayerBody;
  await env.DB.prepare(
    "INSERT OR REPLACE INTO players (id, number, name, created_at) VALUES (?, ?, ?, ?)",
  )
    .bind(body.id, body.number, body.name, body.createdAt)
    .run();
  return jsonResponse({ ok: true }, 201);
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request }) => {
  const authErr = checkAuth(request, env);
  if (authErr) return authErr;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return errorResponse("id is required");

  await env.DB.prepare("DELETE FROM players WHERE id = ?").bind(id).run();
  return jsonResponse({ ok: true });
};
