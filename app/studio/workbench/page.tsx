import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Production Workbench",
  description:
    "Turn the shared campaign brief into a shot plan, delivery matrix and owned production checklist.",
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
