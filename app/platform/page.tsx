import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORKSPACE_ENABLED } from "@/lib/release";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
import { AGENTS } from "@/lib/campaign";
export const metadata: Metadata = {
  title: "Connected Creative Workspace",
  description:
    `AVALON Creative Group: ${AGENTS.length} specialist engines, connected campaign workflows, production delivery, actual performance analysis and accountable launch review in one workspace.`,
  alternates: { canonical: "/platform" },
  robots: { index: WORKSPACE_ENABLED, follow: WORKSPACE_ENABLED },
};
export default function PlatformPage() {
  if (!WORKSPACE_ENABLED) notFound();
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace />
      </main>
    </div>
  );
}
