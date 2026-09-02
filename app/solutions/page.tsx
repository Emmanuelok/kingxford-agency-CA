import type { Metadata } from "next";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { SolutionsVisual } from "@/components/editorial-figures";

export const metadata: Metadata = { title:"Solutions", description:"Start with the business result: launch, leads, local demand, online sales, content or market expansion." };

const outcomes = [
  {n:"01",title:"Launch something new",desc:"Build the strategy, identity, story, experience and first wave of demand around a new venture, product, location or service.",path:"Research → Positioning → Brand → Digital → Campaign → Launch",engagement:"Brand & Digital Launch"},
  {n:"02",title:"Generate better leads",desc:"Connect a sharper offer to qualified audiences, conversion journeys, follow-up systems and pipeline reporting.",path:"Offer → Media → Landing pages → CRM → Nurture → Attribution",engagement:"Campaign Pilot"},
  {n:"03",title:"Build a stronger brand",desc:"Clarify what makes the business matter, then make that advantage recognizable across every touchpoint.",path:"Audit → Insight → Positioning → Identity → Governance → Activation",engagement:"Brand Clarity Sprint"},
  {n:"04",title:"Increase local demand",desc:"Become easier to find, trust and choose across search, maps, reviews, neighbourhood media and local content.",path:"Local audit → Search → Reputation → Content → Ads → Conversion",engagement:"Local Market Launch"},
  {n:"05",title:"Grow online sales",desc:"Align merchandising, creative, storefront, media, lifecycle and retention around profitable customer value.",path:"Commerce audit → UX → Creative → Acquisition → CRM → Loyalty",engagement:"Commerce Growth Sprint"},
  {n:"06",title:"Keep content moving",desc:"Turn one production system into a dependable stream of channel-ready film, photo, motion, copy and creator assets.",path:"Strategy → Content pillars → Production → Adaptation → Publish → Learn",engagement:"Always-On Content Studio"},
  {n:"07",title:"Enter a new market",desc:"Adapt the proposition, channels, experience and creative for the next city, province or Canadian audience.",path:"Market intelligence → Localization → Rollout → Media → Sales enablement",engagement:"Next-City Expansion Playbook"},
];

export default function SolutionsPage(){return <main className="site-shell"><SiteNav/><PageHero index="02" eyebrow="START WITH THE RESULT" title="What needs" accent="to move?" description="You do not need to diagnose which agency departments to hire. Choose the business result; we will assemble the right system around it."/>
  <SolutionsVisual />
  <section className="outcome-list content-section">
    {outcomes.map(o=><article className="outcome-card" key={o.n}><span className="outcome-num">{o.n}</span><div><h2>{o.title}</h2><p>{o.desc}</p><small>{o.path}</small></div><div className="outcome-engagement"><span>Recommended entry</span><b>{o.engagement}</b><a href="/start">Build this plan <ArrowRight/></a></div></article>)}
  </section>
  <section className="process-band"><div className="section-kicker inverse"><span>06</span> ONE CONNECTED PROCESS</div><div className="process-steps">{["Diagnose","Align","Make","Launch","Learn","Scale"].map((x,i)=><div key={x}><span>0{i+1}</span><b>{x}</b></div>)}</div></section>
  <section className="next-cta acid-block"><span>Have several problems at once?</span><h2>Good. Bring the whole thing.</h2><a className="button button-dark" href="/tools">Use the growth planner <ArrowUpRight/></a></section><SiteFooter/></main>}
