import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ServicesVisual } from "@/components/editorial-figures";

export const metadata: Metadata = { alternates: { canonical: "/services" },
  title: "Services",
  description: "Strategy, brand, advertising, production, media, social, web, commerce, PR, data and responsible AI—connected around one commercial objective.",
};

const services = [
  { name:"Strategy, research & advisory", line:"Find the sharp edge.", items:["Market and category research","Customer and audience insight","Competitive intelligence","Segmentation and personas","Brand and marketing audits","Go-to-market strategy","Offer and pricing strategy","Customer journey mapping","City and province expansion","Stakeholder engagement","Annual marketing planning","Fractional marketing leadership"] },
  { name:"Brand systems & design", line:"Become easier to recognize—and choose.", items:["Naming and positioning","Brand architecture","Visual identity","Verbal identity and voice","Logo systems","Brand guidelines","Packaging design","Environmental graphics","Signage and wayfinding","Employer brand","Presentations and reports","Brand governance"] },
  { name:"Advertising & campaigns", line:"Make one idea travel everywhere.", items:["Campaign platforms","Creative concepts","Art direction","Copywriting","TV and connected TV","Radio and streaming audio","Print and direct mail","Out-of-home and DOOH","Digital display","Public awareness campaigns","Recruitment campaigns","Creative testing and versioning"] },
  { name:"Content, social & influence", line:"Build a system, not a posting habit.", items:["Channel strategy","Editorial systems","Content calendars","Short-form video","Community management","Executive social","Creator and influencer programs","UGC direction","Social commerce","Social listening","Reputation and moderation","Crisis escalation protocols"] },
  { name:"Media & performance", line:"Put the idea where attention already lives.", items:["Audience and channel planning","Media buying and negotiation","Paid search","Paid social","Programmatic display","CTV and online video","Streaming audio and podcast","Retail media","Sponsorships","Account-based marketing","Budget pacing","Brand safety and fraud prevention"] },
  { name:"Search & discovery", line:"Show up wherever decisions begin.", items:["Technical SEO","Local SEO and map visibility","On-page and authority SEO","Google Business Profile","Paid search and shopping","Marketplace search","Review and reputation systems","Structured data","Answer-engine optimization","Generative-engine optimization","AI visibility monitoring","Digital PR"] },
  { name:"Web, apps & digital products", line:"Close the distance between interest and action.", items:["UX research","Information architecture","UI and prototyping","Corporate websites","Campaign landing pages","Ecommerce","Web and mobile apps","Portals and SaaS products","CMS implementation","API integrations","Accessibility and performance","Maintenance and optimization"] },
  { name:"Commerce, CRM & experience", line:"Turn attention into a relationship.", items:["Commerce strategy","Shopify and marketplace builds","B2B and DTC commerce","Product catalogues and PIM","CRM setup and migration","Lead capture and scoring","Email and SMS journeys","Marketing automation","Loyalty and referral systems","Subscriptions","Sales enablement","Lifecycle and revenue operations"] },
  { name:"Film, photo & production", line:"Move people before asking them to move.", items:["Commercial film","Brand documentaries","Product photography","Food and hospitality shoots","Architecture and property","Corporate portraits","Drone through qualified operators","Motion graphics","2D and 3D animation","Podcast and audio","Live streaming","Editing, colour and sound"] },
  { name:"PR, reputation & experience", line:"Earn attention beyond the ad.", items:["Media relations","Press office","Corporate communications","Crisis preparedness","Executive profiling","Internal communications","Public affairs support","Investor communications","Community engagement","Experiential activations","Trade shows and launches","Sponsorship strategy"] },
  { name:"Data & optimization", line:"Measure what moved. Improve what happens next.", items:["Measurement strategy","GA4 and tag architecture","KPI design","Executive dashboards","Attribution planning","Campaign lift analysis","Brand tracking","First-party data strategy","Creative performance analysis","Conversion optimization","Experimentation","Pipeline and revenue reporting"] },
  { name:"AI, automation & MarTech", line:"Faster operations. Human responsibility.", items:["AI-readiness assessment","Use-case and ROI roadmap","Brand knowledge assistants","Workflow automation","Content supply chains","Creative QA systems","Hyper-personalization","Predictive media support","Conversational agents","MarTech selection","Governance and provenance","Team training and adoption"] },
];

export default function ServicesPage() {
  return (
    <main className="site-shell">
      <SiteNav />
      <PageHero index="01" eyebrow="THE CONNECTED AGENCY" title="Every capability." accent="One objective." description="The market never experiences your brand, content, media, website and sales journey as separate departments. Neither do we." />
      <section className="service-intro content-section">
        <div className="section-kicker"><span>01</span> THE OPERATING MODEL</div>
        <div className="split-statement">
          <h2>Research.<br />Make.<br /><em>Move.</em></h2>
          <div><p className="large-copy">Choose a capability, or bring us the entire growth problem.</p><p>Every engagement begins with a commercial objective and a measurement plan. We then assemble only the disciplines the work needs—delivered through a senior core, qualified specialists and transparent production partners.</p><a className="rule-link" href="/start">Tell us what must move <ArrowUpRight size={17}/></a></div>
        </div>
      </section>
      <ServicesVisual />
      <section className="service-catalog">
        {services.map((service,index)=>(
          <article className="service-family" id={["strategy","brand","campaigns","content","media","search","digital","commerce","production","pr","data","ai"][index]} key={service.name}>
            <header><span>{String(index+1).padStart(2,"0")}</span><div><h2>{service.name}</h2><p>{service.line}</p></div><ArrowUpRight/></header>
            <div className="service-tags">{service.items.map(item=><span key={item}>{item}</span>)}</div>
          </article>
        ))}
      </section>
      <section className="cross-cutting content-section dark-block">
        <div className="section-kicker inverse"><span>∞</span> BUILT THROUGH EVERYTHING</div>
        <div className="feature-quad">
          <div><b>ACCESSIBLE</b><p>WCAG-aligned experiences, inclusive content and usable production formats from the beginning.</p></div>
          <div><b>LOCALIZABLE</b><p>English-first architecture ready for French, regional and multicultural adaptation as the work expands.</p></div>
          <div><b>RESPONSIBLE</b><p>Consent, claims evidence, creator disclosure, rights, provenance and human review built into delivery.</p></div>
          <div><b>MEASURABLE</b><p>Business KPIs, source ownership, instrumentation and reporting agreed before launch—not added after.</p></div>
        </div>
      </section>
      <section className="next-cta coral-block"><span>Not sure what to buy?</span><h2>Start with the outcome.</h2><a className="button button-dark" href="/tools">Build my growth plan <ArrowUpRight/></a></section>
      <SiteFooter />
    </main>
  );
}
