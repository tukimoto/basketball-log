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

  try {
    const body = (await request.json()) as PlayerBody | PlayerBody[];
    const entries = Array.isArray(body) ? body : [body];

    const stmt = env.DB.prepare(
      "INSERT OR REPLACE INTO players (id, number, name, created_at) VALUES (?, ?, ?, ?)",
    );

    const batch = entries.map((e) => stmt.bind(e.id, e.number, e.name, e.createdAt));

    await env.DB.batch(batch);
    return jsonResponse({ ok: true, count: entries.length }, 201);
  } catch (err) {
    console.error("D1 Batch Insert Error (players):", err);
    return errorResponse(err instanceof Error ? err.message : "Database error", 500);
  }
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
