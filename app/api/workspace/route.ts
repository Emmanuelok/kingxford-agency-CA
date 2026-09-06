import { z } from "zod";
import { workspaceSchema } from "@/lib/campaign";
import {
  ApiError,
  apiFailure,
  authenticated,
  json,
  readJson,
  sameOrigin,
} from "@/lib/server/workspace";
export const dynamic = "force-dynamic";
const inputSchema = z
  .object({
    workspace: workspaceSchema,
    revision: z.number().int().min(1).nullable(),
    expectedOwnerId: z.string().uuid(),
  })
  .strict();
export async function GET(request: Request) {
  try {
    const { client, user } = await authenticated();
    if (request.headers.get("x-kingxford-owner") !== user.id)
      throw new ApiError(
        409,
        "The signed-in account changed. Reload the workspace before accessing cloud data.",
      );
    const { data, error } = await client
      .from("kingxford_workspaces")
      .select("payload,revision")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (error)
      throw new ApiError(
        503,
        "Workspace storage is not ready. Ask the owner to verify the database setup.",
      );
    return json({
      workspace: data?.payload ?? null,
      revision: data?.revision ?? null,
      ownerId: user.id,
    });
  } catch (e) {
    return apiFailure(e);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const { client, user } = await authenticated();
    const input = inputSchema.parse(await readJson(request));
    if (input.expectedOwnerId !== user.id)
      throw new ApiError(
        409,
        "The signed-in account changed. Reload before saving; no cloud data was overwritten.",
      );
    const values = {
      payload: input.workspace,
      revision: (input.revision ?? 0) + 1,
      updated_at: new Date().toISOString(),
    };
    const result =
      input.revision === null
        ? await client
            .from("kingxford_workspaces")
            .insert({ ...values, owner_id: user.id })
            .select("revision")
            .single()
        : await client
            .from("kingxford_workspaces")
            .update(values)
            .eq("owner_id", user.id)
            .eq("revision", input.revision)
            .select("revision")
            .maybeSingle();
    if (result.error?.code === "23505" || (!result.error && !result.data))
      throw new ApiError(
        409,
        "A newer cloud snapshot exists. Export your device copy, then load cloud before saving again.",
      );
    if (result.error)
      throw new ApiError(
        503,
        "Cloud save failed. Keep your device backup and ask the owner to check storage setup.",
      );
    return json({ revision: result.data!.revision, ownerId: user.id });
  } catch (e) {
    return apiFailure(e);
  }
}
