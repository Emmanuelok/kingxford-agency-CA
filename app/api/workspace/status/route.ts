import {
  aiConfigured,
  cloudConfigured,
  db,
  json,
} from "@/lib/server/workspace";
export const dynamic = "force-dynamic";
export async function GET() {
  let email: string | null = null,
    userId: string | null = null;
  if (cloudConfigured())
    try {
      const client = await db();
      const { data } = await client.auth.getUser();
      if (
        data.user &&
        !data.user.is_anonymous &&
        data.user.app_metadata?.kingxford_access === true
      ) {
        email = data.user.email ?? null;
        userId = data.user.id;
      }
    } catch {}
  return json({ cloud: cloudConfigured(), ai: aiConfigured(), email, userId });
}
