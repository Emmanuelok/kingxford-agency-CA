"use client";
import { CampaignWorkspace } from "@/components/campaign-workspace";
/** Backwards-compatible entrypoint: all planning now uses shared campaign state. */
export function GrowthSuite(){return <CampaignWorkspace initialView="media"/>;}
