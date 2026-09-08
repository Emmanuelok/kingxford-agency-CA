import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, MoveRight } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import styles from "./services.module.css";

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
const serviceDetails = [
  { id: "strategy", label: "Strategy", route: "brief", description: "Make confident decisions about your audience, your offer and your next market. We turn the questions behind your business into a clear direction for the work.", alt: "A creative team reviewing research and visual references", imageAspectRatio: "1600 / 1073" },
  { id: "brand", label: "Brand", route: "agents", description: "Create a distinctive identity that holds together everywhere your business appears. From the first impression to the smallest detail, make the brand unmistakably yours.", alt: "Branded packaging and stationery with colour swatches held in hand", imageAspectRatio: "1600 / 1073" },
  { id: "campaigns", label: "Campaigns", route: "workflows", description: "Build a campaign around an idea with enough strength to live across formats. Connect the message, the visual direction and the channel plan from the beginning.", alt: "A coordinated, colorful outdoor campaign on a city street", imageAspectRatio: "1600 / 1073" },
  { id: "content", label: "Content", route: "content", description: "Give your audience a reason to pay attention and a reason to return. Plan, produce and adapt useful content around a consistent editorial direction.", alt: "A ceramic cup and coffee arranged for an editorial still life", imageAspectRatio: "4 / 3" },
  { id: "media", label: "Media", route: "media", description: "Match your investment to the people, places and moments that matter. Keep creative, audience decisions, budget pacing and performance in the same conversation.", alt: "A product campaign coordinated across magazine, print and mobile formats", imageAspectRatio: "4 / 3" },
  { id: "search", label: "Search", route: "search", description: "Make your business easier to find, understand and trust. Connect technical foundations, useful content and local visibility to the way your customers actually search.", alt: "A smartphone map beside a creative studio storefront", imageAspectRatio: "1600 / 1073" },
  { id: "digital", label: "Digital", route: "search", description: "Design useful digital experiences around the people who use them. Join thoughtful interfaces with reliable engineering, accessible interactions and a clear path to action.", alt: "A product website displayed across a laptop, tablet and phone", imageAspectRatio: "4 / 3" },
  { id: "commerce", label: "Commerce", route: "agents", description: "Connect the store, the customer journey and the relationship after purchase. Make each handoff between marketing, sales and service feel considered.", alt: "Ceramic products being packed for an online order", imageAspectRatio: "1600 / 1073" },
  { id: "production", label: "Production", route: "production", description: "Bring the idea into the real world with craft you can see and hear. Build the shot list, the production plan and the delivery formats around the story you need to tell.", alt: "A crew preparing lighting and a cinema camera on a film set", imageAspectRatio: "1600 / 1073" },
  { id: "pr", label: "PR & experience", route: "agents", description: "Develop the stories, relationships and experiences that earn attention. Plan the message and the response with the same care as the moment itself.", alt: "Microphones arranged at an empty press briefing table", imageAspectRatio: "4 / 3" },
  { id: "data", label: "Data", route: "performance", description: "Separate useful signals from noise. Agree what success means, establish trustworthy measurement and turn the evidence into the next decision.", alt: "A magnifying loupe and pen beside an illustrative analytics report", imageAspectRatio: "4 / 3" },
  { id: "ai", label: "AI & automation", route: "workflows", description: "Put automation to work where it can make a practical difference. Connect tools and workflows with clear responsibilities, traceable inputs and human review.", alt: "Connected network and server hardware in a technology workspace", imageAspectRatio: "4 / 3" },
];

export default function ServicesPage() {
  return (
    <main className={`site-shell ${styles.page}`}>
      <SiteNav />
      <section className={styles.hero} id="main-content" aria-labelledby="services-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span aria-hidden="true" /> AVALON / OUR CAPABILITIES</p>
          <h1 id="services-title">Every capability.<br /><em>One objective.</em></h1>
          <p className={styles.heroDescription}>Strategy with a point of view. Creative with something to say. Digital experiences that move your business forward.</p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} href="/start">Tell us what must move <ArrowUpRight size={20} /></Link>
            <a className={styles.lightLink} href="#capabilities">Explore our services <ArrowDown size={19} /></a>
          </div>
          <div className={styles.heroNote}><span>12 disciplines</span><span>One connected creative group</span></div>
        </div>
        <figure className={styles.heroImage}>
          <Image src="/images/services/strategy-v4.webp" alt={serviceDetails[0].alt} fill sizes="(max-width: 900px) 100vw, 50vw" priority />
          <figcaption><span>THE WAY WE WORK</span><p>Good questions.<br /><em>Extraordinary possibilities.</em></p></figcaption>
          <div className={styles.heroImageCorner} aria-hidden="true"><ArrowUpRight /></div>
        </figure>
      </section>

      <section className={styles.introduction} aria-labelledby="intro-title">
        <div><p className={styles.eyebrow}>INDEPENDENT THINKING. CONNECTED DELIVERY.</p><h2 id="intro-title">Bring the ambition.<br />We’ll bring <em>the disciplines.</em></h2></div>
        <div className={styles.introductionCopy}><p>Your customers experience one business. Your brand, content, media and digital experience should feel like one, too.</p><p>Choose a specific capability or bring us the entire growth problem. We assemble the work around a commercial objective, with a senior core, qualified specialists and transparent production partners.</p><Link className={styles.underlinedLink} href="/platform?view=brief">Create your shared brief <ArrowUpRight size={20} /></Link></div>
      </section>

      <nav className={styles.directory} id="capabilities" aria-label="Service categories">
        <a href="#services-list" className={styles.directoryTitle}>Find your next move <ArrowDown size={18} /></a>
        <div className={styles.directoryLinks}>
          {serviceDetails.map((service, index) => <a href={`#${service.id}`} key={service.id}><span>{String(index + 1).padStart(2, "0")}</span>{service.label}</a>)}
        </div>
      </nav>

      <div id="services-list" className={styles.catalog}>
        {services.map((service, index) => {
          const detail = serviceDetails[index];
          return (
            <article className={styles.service} id={detail.id} key={detail.id} aria-labelledby={`${detail.id}-title`}>
              <div className={styles.serviceInner}>
                <figure className={styles.serviceImage} style={{ aspectRatio: detail.imageAspectRatio }}>
                  <Image src={`/images/services/${detail.id}-v4.webp`} alt={detail.alt} fill sizes="(max-width: 900px) 100vw, 48vw" />
                  <figcaption><span>AVALON / {detail.label}</span><span>{String(index + 1).padStart(2, "0")}</span></figcaption>
                </figure>
                <div className={styles.serviceCopy}>
                  <p className={styles.eyebrow}>DISCIPLINE {String(index + 1).padStart(2, "0")} / 12</p>
                  <h2 id={`${detail.id}-title`}>{service.name}</h2>
                  <p className={styles.serviceLine}>{service.line}</p>
                  <p className={styles.serviceDescription}>{detail.description}</p>
                  <div className={styles.capabilitiesHeading}><h3>What we can help with</h3><span>12 capabilities</span></div>
                  <ul className={styles.capabilityList}>{service.items.map(item => <li key={item}><Check size={14} aria-hidden="true" /><span>{item}</span></li>)}</ul>
                  <div className={styles.serviceActions}>
                    <Link href="/start">Discuss an engagement <ArrowUpRight size={18} /></Link>
                    <Link href={`/platform?view=${detail.route}`}>Explore the workspace tools <MoveRight size={18} /></Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <p className={styles.imageryCredit}>AI-generated service imagery. Scenes illustrate our capabilities.</p>

      <section className={styles.connectedWork} aria-labelledby="connected-title">
        <div className={styles.connectedHeader}><p className={styles.eyebrow}>FROM CAPABILITY TO ACTION</p><h2 id="connected-title">Built to work<br /><em>together.</em></h2><p>A shared brief gives every discipline the same starting point. Connected studios keep the plan, the production and the learning in view.</p><Link className={styles.primaryAction} href="/platform?view=brief">Open your workspace <ArrowUpRight size={20} /></Link></div>
        <ol className={styles.steps}>
          <li><span>01</span><div><h3>Set the direction.</h3><p>Capture your audience, offer, objective and evidence in one shared brief.</p></div><ArrowUpRight aria-hidden="true" /></li>
          <li><span>02</span><div><h3>Connect the work.</h3><p>Develop the plan with specialist tools for creative, content, production and growth.</p></div><ArrowUpRight aria-hidden="true" /></li>
          <li><span>03</span><div><h3>Learn. Then move.</h3><p>Bring campaign results back into the workspace and use the evidence to plan the next test.</p></div><ArrowUpRight aria-hidden="true" /></li>
        </ol>
      </section>
      <section className={styles.standards} aria-label="Standards across our services">
        <div><h2>Accessible</h2><p>Inclusive content, usable production formats and WCAG-aligned experiences considered from the beginning.</p></div>
        <div><h2>Localizable</h2><p>English-first architecture ready for French, regional and multicultural adaptation as the work expands.</p></div>
        <div><h2>Responsible</h2><p>Consent, claims evidence, creator disclosure, rights, provenance and human review built into delivery.</p></div>
        <div><h2>Measurable</h2><p>Business KPIs, source ownership, instrumentation and reporting agreed before launch.</p></div>
      </section>
      <section className={styles.closing}>
        <p className={styles.eyebrow}>NOT SURE WHERE TO START?</p>
        <h2>Start with<br /><em>the outcome.</em></h2>
        <div><p>You don’t need a shopping list of services. Tell us where you want to go.</p><Link href="/tools" className={styles.darkAction}>Build my growth plan <ArrowUpRight size={22} /></Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
