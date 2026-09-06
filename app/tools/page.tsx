import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Growth Tools & Media Lab",
  description:
    "Transparent campaign economics, conversion experiments, search-copy checks and production planning, connected to your shared campaign brief.",
  alternates: { canonical: "/tools" },
};
export default function ToolsPage() {
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace initialView="media" />
      </main>
    </div>
  );
}
