import Link from "next/link";
import { WORKSPACE_ENABLED } from "@/lib/release";
export default function NotFound(){return <main className="ws-loading"><span>AVALON / 404</span><h1>This page is not on the plan.</h1><p>Explore our services or tell us about your next project.</p><Link className="button button-coral" href={WORKSPACE_ENABLED ? "/platform" : "/services"}>{WORKSPACE_ENABLED ? "Open workspace" : "Explore services"}</Link><Link href="/">Agency home</Link></main>;}
