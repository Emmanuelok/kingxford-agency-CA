import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Growth Tools & Performance Studios",
  description:
    "Plan campaign economics, import actual results, inspect attribution and run connected specialist workflows with AVALON Creative Group.",
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
