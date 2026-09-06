"use client";
import { CampaignWorkspace } from "@/components/campaign-workspace";
/** Legacy entrypoints now open operational studios, not inert sample panels. */
export function PlatformDemo(){return <CampaignWorkspace/>;}
export function PlatformModules(){return <a className="button button-coral" href="/platform">Open the connected campaign workspace</a>;}
