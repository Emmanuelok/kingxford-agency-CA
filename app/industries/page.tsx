import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = { title:"Industries", description:"Sector-specialist advertising, production, digital and growth systems from St. John's to markets across Canada." };

const sectors=[
  ["Tourism, hospitality & destinations","Direct bookings, fuller tables and year-round demand through destination storytelling, creator content, search and reputation."],
  ["Food, beverage & retail","Unify shelf, storefront, feed and checkout through packaging, product content, commerce, local media and loyalty."],
  ["Construction, architecture & real estate","Sell the vision before the doors open—and credibility before the bid closes—with project brands, film, digital launches and pursuit content."],
  ["Ocean, fisheries & aquaculture","Translate technical capability and provenance into market access, procurement confidence, investment and export value."],
  ["Energy, mining & industrial","Turn complex operations into clear stories for customers, communities, talent, investors and regulators."],
  ["Technology, SaaS & startups","Make complex products understandable, differentiated and easier to buy through product marketing, demos, ABM and digital experiences."],
  ["Healthcare & wellness","Build accessible education, trusted local discovery and privacy-conscious journeys from first question to appropriate next step."],
  ["Education & training","Turn programs into clear futures and interest into enrolment through recruitment campaigns, student stories and nurture systems."],
  ["Government & public institutions","Make important information accessible, actionable and measurable through public campaigns, consultation and digital service design."],
  ["Professional, legal & financial","Make expertise clear, credible and easy to engage through positioning, thought leadership, search and qualified-inquiry journeys."],
  ["Automotive, marine & mobility","Move inventory and strengthen service relationships through visual production, feed-based media, digital experiences and CRM."],
  ["Arts, culture, film & events","Build anticipation, fill seats and extend the story through key art, trailers, sponsors, ticket funnels and live content."],
  ["Nonprofits, faith & community","Move people from awareness to participation through fundraising, volunteer recruitment, events and impact storytelling."],
  ["Franchises & multi-location","Protect one brand while winning many local markets with templates, local media, listings, content and performance reporting."],
  ["Indigenous economic development","Support community-led stories and opportunities through respectful engagement, clear consent and qualified partnership."],
];

export default function IndustriesPage(){return <main className="site-shell"><SiteNav/><PageHero index="03" eyebrow="SECTOR INTELLIGENCE" title="Know the market." accent="Move the category." description="Sector context changes the audience, the buying journey, the claim, the channel and the measure of success. Our solutions are built around those realities."/>
  <section className="industry-feature"><img src="/images/sector-studio.webp" alt="A single campaign studio set bringing together hospitality, construction, retail and technology"/><div><span>ST. JOHN&apos;S / ATLANTIC CANADA / NATIONAL</span><h2>Local fluency.<br/>National standards.</h2><p>We launch where we know the conditions—then scale through evidence, local partners and market-specific creative, not cloned city pages.</p></div></section>
  <section className="industry-grid content-section">{sectors.map((s,i)=><article key={s[0]}><span>{String(i+1).padStart(2,"0")}</span><h2>{s[0]}</h2><p>{s[1]}</p><a href="/start">Discuss this sector <ArrowUpRight/></a></article>)}</section>
  <section className="expansion-section content-section dark-block"><div><div className="section-kicker inverse"><span>→</span> EXPANSION ROADMAP</div><h2>City by city.<br/><em>Without losing the care.</em></h2></div><div className="city-path"><span className="active">St. John&apos;s / Avalon</span><span>Newfoundland & Labrador</span><span>Atlantic Canada</span><span>Calgary · Ottawa · Toronto</span><span>Montréal / French-ready</span></div></section>
  <SiteFooter/></main>}
