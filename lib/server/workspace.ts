import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function cloudConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}
export function aiConfigured() {
  return (
    cloudConfigured() &&
    !!process.env.AI_GATEWAY_API_KEY &&
    !!process.env.KINGXFORD_AI_MODEL &&
    process.env.KINGXFORD_AI_ENABLED === "true"
  );
}
export async function db() {
  if (!cloudConfigured())
    throw new ApiError(
      503,
      "Cloud storage is not configured. Device-local planning remains available.",
    );
  const jar = await cookies();
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (items) => {
          for (const { name, value, options } of items)
            jar.set(name, value, options);
        },
      },
    },
  );
}
export async function authenticated(requireAccess = true) {
  const client = await db();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.is_anonymous)
    throw new ApiError(
      401,
      "Sign in with an invited agency account to continue.",
    );
  if (requireAccess && data.user.app_metadata?.kingxford_access !== true)
    throw new ApiError(
      403,
      "This account has not been granted KINGXFORD workspace access.",
    );
  return { client, user: data.user };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
    : new URL(request.url).origin;
  if (!origin || origin !== expected)
    throw new ApiError(
      403,
      "This request must come from the configured KINGXFORD site.",
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new ApiError(415, "Send JSON content.");
}
export async function readJson(request: Request, limit = 2000000) {
  const body = request.body;
  if (!body) throw new ApiError(400, "A request body is required.");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0,
    result = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        await reader.cancel();
        throw new ApiError(413, "The request is too large.");
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return JSON.parse(result);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(400, "The request could not be read as JSON.");
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Vary: "Cookie",
    },
  });
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.message }, error.status);
  if (error instanceof z.ZodError)
    return json(
      {
        error:
          "Some fields are invalid. Check the supplied values and try again.",
      },
      400,
    );
  // Do not log requests, tokens, briefs or provider bodies.
  console.error(
    "KINGXFORD_API_FAILURE",
    error instanceof Error ? error.name : "UnknownError",
  );
  return json(
    {
      error:
        "The service could not complete this request. Your device copy has not changed.",
    },
    500,
  );
}
