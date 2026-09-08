import {
  db,
  integrationConfig,
  json,
} from "@/lib/server/workspace";
import { workspaceIdentity } from "@/lib/server/guards";
export const dynamic = "force-dynamic";
export async function GET() {
  const config = integrationConfig();
  let identity = workspaceIdentity(null);
  let cloudState = config.cloud ? "sign-in-required" : "not-configured";
  let cloudMessage = config.cloud
    ? "Sign in to verify private cloud storage."
    : config.cloudSupplied
      ? "Cloud configuration needs review. Device planning remains available."
      : "Cloud storage is not connected. Work is saved on this device.";
  if (config.cloud)
    try {
      const client = await db();
      const { data, error } = await client.auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") {
        cloudState = "unavailable";
        cloudMessage = "The account connection could not be verified. Sign in again or retry shortly.";
      }
      if (!error && data.user && !data.user.is_anonymous) {
        identity = workspaceIdentity(data.user);
        if (!identity.workspaceAccess) {
          cloudState = "access-denied";
          cloudMessage = "This account no longer has workspace access. You can sign out or ask the workspace owner to restore access. Your device drafts remain available.";
        } else {
          // A read-only probe does not overwrite snapshots or consume model quota.
          const { error: storageError } = await client
            .from("kingxford_workspaces")
            .select("revision")
            .eq("owner_id", data.user.id)
            .maybeSingle();
          cloudState = storageError ? "unavailable" : "connected";
          cloudMessage = storageError
            ? "Signed in, but cloud storage did not respond. Keep a device backup and ask the owner to verify storage setup."
            : "Private cloud storage responded. Save and load are manual.";
        }
      }
    } catch {
      cloudState = "unavailable";
      cloudMessage = "Cloud verification is temporarily unavailable. Device planning remains available.";
    }
  return json({
    cloud: config.cloud,
    ai: config.ai,
    ...identity,
    release: "4.0.0",
    checkedAt: new Date().toISOString(),
    capabilities: {
      cloud: { state: cloudState, message: cloudMessage },
      ai: {
        state: config.ai ? "configured" : "not-configured",
        message: config.ai
          ? "AI drafting is configured. Provider availability and account quota are checked when you request a draft."
          : "AI drafting is not connected. Planning engines are available on this device.",
      },
      publishing: { state: "not-connected", message: "No advertising or social account is connected. Nothing is published automatically." },
    },
  });
}
