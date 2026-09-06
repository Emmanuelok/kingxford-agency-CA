import { z } from "zod";
import {
  ApiError,
  apiFailure,
  authenticated,
  db,
  json,
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
  try {
    sameOrigin(request);
    const input = credentials.parse(await readJson(request, 2000));
    const client = await db();
    const { data, error } = await client.auth.signInWithPassword(input);
    if (error || !data.user || data.user.is_anonymous)
      throw new ApiError(
        401,
        "Unable to sign in. Check your invited account credentials.",
      );
    if (data.user.app_metadata?.kingxford_access !== true) {
      await client.auth.signOut({ scope: "local" });
      throw new ApiError(
        403,
        "This account has not been granted KINGXFORD workspace access.",
      );
    }
    return json({ email: data.user.email, userId: data.user.id });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    // Revoked members must still be able to clear their own session.
    const { client, user } = await authenticated(false);
    if (request.headers.get("x-kingxford-owner") !== user.id)
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
