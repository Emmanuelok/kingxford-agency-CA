import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORKSPACE_ENABLED } from "@/lib/release";
import { SiteNav } from "@/components/site-nav";
import { CampaignWorkspace } from "@/components/campaign-workspace";
export const metadata: Metadata = {
  title: "Growth Tools & Performance Studios",
  description:
    "Plan campaign economics, import actual results, inspect attribution and run connected specialist workflows with AVALON Creative Group.",
  alternates: { canonical: "/tools" },
  robots: { index: WORKSPACE_ENABLED, follow: WORKSPACE_ENABLED },
};
export default function ToolsPage() {
  if (!WORKSPACE_ENABLED) notFound();
  return (
    <div className="site-shell workspace-shell">
      <SiteNav />
      <main>
        <CampaignWorkspace initialView="media" />
      </main>
    </div>
  );
}
