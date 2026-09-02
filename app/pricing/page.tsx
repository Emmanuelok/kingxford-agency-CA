import type { Metadata } from "next";
import { ArrowUpRight, Check } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { InvestmentFigure } from "@/components/editorial-figures";
export const metadata: Metadata={title:"Engagements & Planning Ranges",description:"Transparent Canadian-dollar planning ranges for diagnostics, launches, campaigns, content and integrated growth partnerships."};
const offers=[
 ["Growth diagnostic","$2.5K–$5K","Audit, research, priorities and a practical 90-day roadmap.",["Current-state audit","Priority research","Working session","Action roadmap"]],
 ["Local market launch","$7.5K–$15K","A focused market-entry or local-demand system.",["Positioning refresh","Conversion landing experience","Local discovery","Launch creative and tracking"]],
 ["Brand & digital launch","$18K–$55K+","Strategy, identity, messaging, digital experience and launch system.",["Research and positioning","Identity and voice","Website or commerce","Launch toolkit"]],
 ["Campaign pilot","$15K–$40K + media","An 8–12 week creative, landing, media and measurement test.",["Campaign concept","Channel creative","Conversion journey","Media and reporting"]],
 ["Content studio","$4K–$15K / month","A planned and produced stream of adaptable content.",["Editorial strategy","Production day(s)","Channel adaptations","Calendar and learning"]],
 ["Always-on growth","$6K–$18K / month + media","Connected acquisition, content, optimization and reporting.",["Performance media","Creative refresh","Conversion optimization","Pipeline reporting"]],
 ["Integrated partner","$20K–$50K+ / month","Embedded strategy, creative, production, media, technology and intelligence.",["Integrated planning","Senior oversight","Flexible production","Transparent commercial view"]],
];
export default function PricingPage(){return <main className="site-shell"><SiteNav/><PageHero index="07" eyebrow="WAYS TO WORK" title="Clear ranges." accent="No mystery retainer." description="These are Canadian-dollar planning ranges—not a quote. They help us begin with commercial fit, then scope the real work transparently."/><section className="pricing-note content-section"><div className="section-kicker"><span>CAD</span> PLANNING GUIDANCE</div><h2>Agency fees are not media spend.</h2><p>Final estimates separate strategy, creative, production, talent, travel, permits, printing, licensing, technology, media and taxes. You should always know what each dollar is for.</p></section><InvestmentFigure/><section className="pricing-grid content-section">{offers.map((o,i)=><article key={String(o[0])}><span>0{i+1}</span><h2>{String(o[0])}</h2><b>{String(o[1])}</b><p>{String(o[2])}</p><ul>{(o[3] as string[]).map(x=><li key={x}><Check/>{x}</li>)}</ul><a href="/start">Build this brief <ArrowUpRight/></a></article>)}</section><section className="next-cta acid-block"><span>Smaller budget or uncertain scope?</span><h2>Start with diagnosis.</h2><a className="button button-dark" href="/tools">Use the free planning tools <ArrowUpRight/></a></section><SiteFooter/></main>}
