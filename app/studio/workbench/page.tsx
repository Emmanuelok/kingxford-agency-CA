import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORKSPACE_ENABLED } from "@/lib/release";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Creative Production Workbench",
  description:
    "Connect your campaign brief, content, production tasks, rights review and delivery handoff in the AVALON Creative Group workspace.",
  alternates: { canonical: "/studio/workbench" },
  robots: { index: WORKSPACE_ENABLED, follow: WORKSPACE_ENABLED },
};
export default function ProductionWorkbench() {
  if (!WORKSPACE_ENABLED) notFound();
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace initialView="production" />
      </main>
    </div>
  );
}
