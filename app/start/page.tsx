import type { Metadata } from "next";
import { Clock3, MapPin, MessageSquareText } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ProjectBrief } from "@/components/project-brief";
export const metadata: Metadata={title:"Start a Project",description:"Build a useful first brief for brand, advertising, production, media, web or connected growth work."};
export default function StartPage(){return <main className="site-shell"><SiteNav/><PageHero index="09" eyebrow="START A PROJECT" title="Tell us what" accent="must move." description="Attention. Perception. Demand. Bookings. Applications. Sales. Investment. Start with the business problem; we will build the right system around it."/><section className="brief-section content-section"><div className="brief-aside"><div className="section-kicker"><span>01</span> GUIDED INTAKE</div><h2>Bring a brief.<br/>Or build one here.</h2><p>This takes about five minutes. It gives us enough context to recommend a responsible next step—not inflate a quote.</p><div className="contact-facts"><span><Clock3/>Designed for a focused first conversation</span><span><MapPin/>St. John&apos;s · Canada-wide delivery</span><span><MessageSquareText/>hello@kingxford.co</span></div></div><ProjectBrief/></section><SiteFooter/></main>}
