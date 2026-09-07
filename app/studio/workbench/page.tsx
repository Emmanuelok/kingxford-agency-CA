import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Creative Production Workbench",
  description:
    "Connect your campaign brief, content, production tasks, rights review and delivery handoff in the AVALON Creative Group workspace.",
  alternates: { canonical: "/studio/workbench" },
};
export default function ProductionWorkbench() {
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace initialView="production" />
      </main>
    </div>
  );
}
