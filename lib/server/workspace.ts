import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { ApiError, hasWorkspaceAccess, integrationConfig } from "@/lib/server/guards";
export { ApiError, hasWorkspaceAccess, integrationConfig, ownerHeader, readJson, sameOrigin } from "@/lib/server/guards";

export function cloudConfigured() {
  return integrationConfig().cloud;
}
export function aiConfigured() {
  return integrationConfig().ai;
}
export async function db() {
  const config = integrationConfig();
  if (!config.cloud)
    throw new ApiError(
      503,
      "Cloud storage is not configured. Device-local planning remains available.",
    );
  const jar = await cookies();
  return createServerClient(
    config.url,
    config.key,
    {
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          cache: "no-store",
          signal: init?.signal
            ? AbortSignal.any([init.signal, AbortSignal.timeout(12000)])
            : AbortSignal.timeout(12000),
        }),
      },
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
  if (error?.name === "AuthRetryableFetchError" || (error?.status ?? 0) >= 500)
    throw new ApiError(503, "The account service is temporarily unavailable. Your device copy is safe; try again shortly.");
  if (error || !data.user || data.user.is_anonymous)
    throw new ApiError(
      401,
      "Sign in with an invited agency account to continue.",
    );
  if (requireAccess && !hasWorkspaceAccess(data.user))
    throw new ApiError(
      403,
      "This account has not been granted Avalon workspace access.",
    );
  return { client, user: data.user };
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
      "X-Content-Type-Options": "nosniff",
      Vary: "Cookie",
    },
  });
}
export function apiFailure(error: unknown) {
  if (error instanceof ApiError)
    return json({ error: error.message }, error.status);
  if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name))
    return json({ error: "The connection timed out. Your device copy is safe; try again shortly." }, 504);
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
    "AVALON_API_FAILURE",
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
