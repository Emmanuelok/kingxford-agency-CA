/** Server-only, framework-independent boundaries. Never import into client code. */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Environment = Record<string, string | undefined>;

function httpOrigin(value: string, production = false) {
  try {
    const url = new URL(value);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username || url.password ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && local && !production))
    ) return null;
    return url.origin;
  } catch {
    return null;
  }
}

/** Supabase's project URL is a base origin, not an API route or dashboard URL. */
function databaseOrigin(value: string, production = false) {
  const origin = httpOrigin(value, production);
  if (!origin) return null;
  const url = new URL(value);
  return url.pathname === "/" && !url.search && !url.hash ? origin : null;
}

/** Reject a mistakenly pasted secret/service-role key before it can bypass RLS. */
function publicDatabaseKey(key: string) {
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return true;
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return false;
  try {
    const payload = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString("utf8"));
    // This is configuration validation only, never token authentication.
    return payload?.role === "anon";
  } catch {
    return false;
  }
}

export function integrationConfig(env: Environment = process.env) {
  const suppliedUrl = env.SUPABASE_URL?.trim() ?? "";
  const url = databaseOrigin(suppliedUrl, env.NODE_ENV === "production") ?? "";
  const key = env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
  const cloud = !!url && publicDatabaseKey(key);
  // An explicit Avalon false takes precedence over a legacy true.
  const enabled = (env.AVALON_AI_ENABLED ?? env.KINGXFORD_AI_ENABLED)?.trim() === "true";
  const model = (env.AVALON_AI_MODEL ?? env.KINGXFORD_AI_MODEL)?.trim() ?? "";
  const gatewayKey = env.AI_GATEWAY_API_KEY?.trim() ?? "";
  const validModel = model.length <= 200 && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.:-]+$/.test(model);
  return {
    url, key, cloud, model, gatewayKey,
    cloudSupplied: !!suppliedUrl || !!key,
    ai: cloud && enabled && validModel && !!gatewayKey,
    aiEnabled: enabled,
  };
}

export function sameOrigin(request: Request, siteUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  const expected = siteUrl ? httpOrigin(siteUrl) : new URL(request.url).origin;
  if (!expected)
    throw new ApiError(503, "The site address is not configured correctly. Contact the workspace owner.");
  if (!request.headers.get("origin") || request.headers.get("origin") !== expected)
    throw new ApiError(403, "This request must come from the configured Avalon site.");
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new ApiError(415, "Send JSON content.");
}

export async function readJson(request: Request | Response, limit = 2000000, timeoutMs = 12000): Promise<unknown> {
  if (!request.body) throw new ApiError(400, "A request body is required.");
  const declared = request.headers.get("content-length");
  if (declared && /^\d+$/.test(declared) && Number(declared) > limit) {
    // Stream cancellation is best effort; a broken source must not delay rejection.
    void request.body.cancel().catch(() => {});
    throw new ApiError(413, "The request is too large.");
  }
  const reader = request.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytes = 0, result = "";
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new ApiError(408, "The request body took too long to arrive. Please try again."));
      void reader.cancel().catch(() => {});
    }, timeoutMs);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > limit) {
        void reader.cancel().catch(() => {});
        throw new ApiError(413, "The request is too large.");
      }
      result += decoder.decode(value, { stream: true });
    }
    result += decoder.decode();
    return JSON.parse(result);
  } catch (error) {
    void reader.cancel().catch(() => {});
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw error;
    throw new ApiError(400, "The request could not be read as JSON.");
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

export function ownerHeader(request: Request) {
  return request.headers.get("x-avalon-owner") ?? request.headers.get("x-kingxford-owner");
}

type WorkspaceUser = { id?: string; email?: string; is_anonymous?: boolean; app_metadata?: Record<string, unknown> };

export function hasWorkspaceAccess(user: WorkspaceUser | null) {
  // Preserve the existing database entitlement during the visual rebrand.
  return !!user && !user.is_anonymous && user.app_metadata?.kingxford_access === true;
}

/** Retain a verified account identity even after workspace access is revoked. */
export function workspaceIdentity(user: WorkspaceUser | null) {
  const signedIn = !!user && !user.is_anonymous;
  return {
    email: signedIn ? user.email ?? null : null,
    userId: signedIn ? user.id ?? null : null,
    workspaceAccess: hasWorkspaceAccess(user),
  };
}

export function providerDraft(value: unknown) {
  const result = value as {
    choices?: { finish_reason?: unknown; message?: { content?: unknown; refusal?: unknown } }[];
  } | null;
  const choice = result?.choices?.[0];
  if (choice?.message?.refusal || choice?.finish_reason === "content_filter")
    throw new ApiError(422, "The provider could not draft this request. Review the brief and try a different task.");
  if (choice?.finish_reason === "length")
    throw new ApiError(502, "The provider stopped before finishing the draft. Shorten the brief and try again; no partial draft was saved.");
  const output = choice?.message?.content;
  if (choice?.finish_reason !== "stop" || typeof output !== "string" || !output.trim() || output.length > 20000)
    throw new ApiError(502, "The provider returned an unusable response. No draft was saved.");
  return output.trim();
}
