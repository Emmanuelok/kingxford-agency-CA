"use client";
import { WORKSPACE_ENABLED } from "@/lib/release";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="ws-loading"><h1>Something interrupted this page.</h1><p>Please try again or return to the agency homepage.</p><button className="button button-coral" onClick={reset}>Try again</button><a href={WORKSPACE_ENABLED ? "/platform" : "/"}>{WORKSPACE_ENABLED ? "Return to your workspace" : "Return to Avalon"}</a></main>;}
