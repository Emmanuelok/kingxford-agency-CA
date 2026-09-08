import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
import { AGENTS } from "@/lib/campaign";
export const metadata: Metadata = {
  title: "Connected Creative Workspace",
  description:
    `AVALON Creative Group: ${AGENTS.length} specialist engines, connected campaign workflows, production delivery, actual performance analysis and accountable launch review in one workspace.`,
  alternates: { canonical: "/platform" },
};
export default function PlatformPage() {
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace />
      </main>
    </div>
  );
}
