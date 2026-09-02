import type { Metadata } from "next";
import { ArrowUpRight, LockKeyhole, ShieldCheck, WandSparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { PlatformSignalFigure } from "@/components/editorial-figures";
import { PlatformDemo, PlatformModules } from "@/components/platform-demo";

export const metadata: Metadata = { title:"Client Platform", description:"A transparent client workspace for briefs, approvals, content, media, assets, budgets, decisions and results." };
export default function PlatformPage(){return <main className="site-shell"><SiteNav/><PageHero index="05" eyebrow="THE CLIENT OPERATING SYSTEM" title="Every decision." accent="Every dollar. Visible." description="A great agency relationship should never leave you asking where the work stands, which file is final or what happens next."/>
  <PlatformSignalFigure />
  <section className="platform-demo-section content-section"><div className="section-intro-row"><div className="section-kicker"><span>01</span> WORKING CONCEPT</div><p>Explore the demonstration tabs. The full client workspace will connect the public brief to delivery, approval and measurement.</p></div><PlatformDemo/></section>
  <section className="platform-modules content-section dark-block"><div className="split-statement compact"><h2>One place.<br/><em>Less friction.</em></h2><p className="large-copy">The platform organizes the relationship around decisions—not folders.</p></div><PlatformModules/></section>
  <section className="trust-trio content-section"><article><LockKeyhole/><h3>Your accounts remain yours.</h3><p>Advertising, analytics, commerce and CRM access should use governed invitations—not shared passwords.</p></article><article><ShieldCheck/><h3>Compliance is a workflow.</h3><p>Consent, claims evidence, rights, releases, approvals and retention belong inside delivery—not in a forgotten checklist.</p></article><article><WandSparkles/><h3>AI with a human owner.</h3><p>Automation can accelerate planning and production. People remain accountable for judgment, truth, rights and quality.</p></article></section>
  <section className="next-cta coral-block"><span>Ready for a clearer agency relationship?</span><h2>Build the first brief.</h2><a className="button button-dark" href="/start">Start a project <ArrowUpRight/></a></section><SiteFooter/></main>}
