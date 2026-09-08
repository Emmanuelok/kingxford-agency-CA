import { z } from "zod";
import { WORKSPACE_ENABLED } from "@/lib/release";
import {
  ApiError,
  apiFailure,
  authenticated,
  db,
  hasWorkspaceAccess,
  json,
  ownerHeader,
  readJson,
  sameOrigin,
} from "@/lib/server/workspace";
const credentials = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(200),
  })
  .strict();
export async function POST(request: Request) {
  if (!WORKSPACE_ENABLED) return json({ error: "Not found" }, 404);
  try {
    sameOrigin(request);
    const input = credentials.parse(await readJson(request, 2000));
    const client = await db();
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error?.name === "AuthRetryableFetchError" || (error?.status ?? 0) >= 500)
      throw new ApiError(503, "The account service is temporarily unavailable. Try again shortly.");
    if (error?.status === 429)
      throw new ApiError(429, "Too many sign-in attempts. Please wait before trying again.");
    if (error || !data.user || data.user.is_anonymous)
      throw new ApiError(
        401,
        "Unable to sign in. Check your invited account credentials.",
      );
    if (!hasWorkspaceAccess(data.user)) {
      await client.auth.signOut({ scope: "local" });
      throw new ApiError(
        403,
        "This account has not been granted Avalon workspace access.",
      );
    }
    return json({ email: data.user.email, userId: data.user.id });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function DELETE(request: Request) {
  if (!WORKSPACE_ENABLED) return json({ error: "Not found" }, 404);
  try {
    sameOrigin(request);
    // Revoked members must still be able to clear their own session.
    const { client, user } = await authenticated(false);
    if (ownerHeader(request) !== user.id)
      throw new ApiError(
        409,
        "The signed-in account changed. Reload before signing out.",
      );
    const { error } = await client.auth.signOut({ scope: "local" });
    if (error)
      throw new ApiError(
        502,
        "Sign-out could not be confirmed. Please try again.",
      );
    return json({ signedOut: true });
  } catch (e) {
    return apiFailure(e);
  }
}
