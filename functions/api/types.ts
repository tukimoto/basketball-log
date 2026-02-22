export interface Env {
  DB: D1Database;
  API_KEY?: string;
}

export type CFContext = EventContext<Env, string, unknown>;

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ error: message }, status);
}

export function checkAuth(request: Request, env: Env): Response | null {
  const apiKey = env.API_KEY;
  if (!apiKey) return null;

  const provided = request.headers.get("X-API-Key");
  if (provided !== apiKey) {
    return errorResponse("Unauthorized", 401);
  }
  return null;
}
