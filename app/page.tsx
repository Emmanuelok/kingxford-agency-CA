import { ArrowRight, ArrowUpRight, Check, MoveRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CTASection } from "@/components/CTASection";
import { MediaFrame } from "@/components/MediaFrame";
import { ScrollCinema } from "@/components/ScrollCinema";
import { SectionHeading } from "@/components/SectionHeading";
import { SITE } from "@/lib/site";

const serviceGroups = [
  {
    number: "01",
    title: "Brand + Positioning",
    copy: "Research, positioning, identity and messaging that give people a precise reason to choose you.",
    items: ["Market intelligence", "Brand systems", "Naming + narrative"],
    href: "/services/brand-strategy",
  },
  {
    number: "02",
    title: "Campaigns + Creative",
    copy: "Campaign platforms, words and worlds designed to earn attention and move across every useful channel.",
    items: ["Integrated campaigns", "Art direction", "Launch systems"],
    href: "/services/campaigns-advertising",
  },
  {
    number: "03",
    title: "Film + Content",
    copy: "Original production and recurring content operations—from the hero film to the forty assets around it.",
    items: ["Commercial film", "Photography + motion", "Content systems"],
    href: "/services/film-content-production",
  },
  {
    number: "04",
    title: "Media + Discovery",
    copy: "Paid, organic and answer-engine visibility brought together around audiences and commercial intent.",
    items: ["Media strategy", "Search everywhere", "Performance reporting"],
    href: "/services/media-growth",
  },
  {
    number: "05",
    title: "Web + Digital Products",
    copy: "Fast, accessible websites and digital tools that turn a compelling story into a useful customer journey.",
    items: ["UX + interface design", "Web development", "Commerce + portals"],
    href: "/services/web-digital-products",
  },
  {
    number: "06",
    title: "Data + Conversion",
    copy: "Measurement, CRM and experimentation that reveal what is working and what deserves the next dollar.",
    items: ["Analytics + dashboards", "CRM journeys", "Conversion testing"],
    href: "/services/data-crm-experience",
  },
];

const approach = [
  ["01", "Find the signal", "We listen closely, study the market and define the decision the work must change."],
  ["02", "Build the idea", "Strategy, creative and experience design develop together—not in disconnected handoffs."],
  ["03", "Make it travel", "We produce a flexible system of stories and assets shaped for the places people actually look."],
  ["04", "Prove the movement", "Distribution, measurement and iteration stay connected to the original business objective."],
];

const industries = [
  { label: "Ocean, energy + industrial", href: "/industries/ocean-energy-industrial" },
  { label: "Technology, defence + space", href: "/industries/technology-defence-space" },
  { label: "Tourism, hospitality + culture", href: "/industries/tourism-hospitality-culture" },
  { label: "Public, community + nonprofit", href: "/industries/public-community-nonprofit" },
  { label: "Retail, consumer + commerce", href: "/industries/retail-consumer-commerce" },
  { label: "Professional, property + growth", href: "/industries/professional-property-growth" },
];

const concepts = [
  {
    index: "01",
    sector: "Ocean technology",
    title: "Signal across the Atlantic",
    client: "Northline Oceans",
    image: SITE.images.conceptOcean,
    alt: "Cinematic composite representing ocean technology, industry and Canadian growth sectors",
    href: "/work/northline-oceans",
  },
  {
    index: "02",
    sector: "Tourism + hospitality",
    title: "Stay for the weather",
    client: "Wild Shore House",
    image: SITE.images.conceptTravel,
    alt: "Cinematic Atlantic production scene at blue hour near St. John’s",
    href: "/work/wild-shore",
  },
  {
    index: "03",
    sector: "Retail + culture",
    title: "Made here. Chosen everywhere.",
    client: "Forge & Field",
    image: SITE.images.conceptMakers,
    alt: "Overhead creative production system with strategy, film and digital materials",
    href: "/work/forge-and-field",
  },
];

export const metadata: Metadata = {
  title: "KINGXFORD — Creative and Growth Agency in St. John’s",
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

export default function HomePage() {
  return (
    <main>
      <ScrollCinema
        mobileVideoUrl={SITE.cinematicVideoMobileUrl}
        posterUrl={SITE.cinematicPosterUrl}
        videoUrl={SITE.cinematicVideoUrl}
      />

      <section className="section declaration">
        <div className="shell declaration__grid">
          <p className="eyebrow"><span aria-hidden="true" />What we believe</p>
          <div>
            <h2 className="display display--statement">
              The best growth work does not look like a pile of deliverables.
              <span> It feels like one clear signal.</span>
            </h2>
            <div className="declaration__base">
              <p>
                KINGXFORD brings senior strategy, bold creative, original production, technology and distribution into one room. Fewer seams. Better decisions. Work built to carry its weight.
              </p>
              <Link className="text-link" href="/approach">See how we work <ArrowRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section services-home" id="capabilities">
        <div className="shell">
          <SectionHeading
            eyebrow="Connected capabilities"
            title={<>One agency.<br /><span className="type-muted">The whole system.</span></>}
            copy={<p>Bring us a focused assignment or the full commercial challenge. We assemble the right disciplines around the outcome—not an org chart.</p>}
          />
          <div className="services-grid">
            {serviceGroups.map((service) => (
              <Link className="service-card" href={service.href} key={service.number}>
                <div className="service-card__top">
                  <span>{service.number}</span>
                  <ArrowUpRight aria-hidden="true" />
                </div>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
                <ul>
                  {service.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </Link>
            ))}
          </div>
          <div className="section-link-row">
            <p>Need a sharper place to begin?</p>
            <Link className="button button--outline" href="/services">Explore every service <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="section system-feature">
        <div className="shell system-feature__grid">
          <MediaFrame
            alt="A cinematic overhead view of a connected creative production and digital planning workspace"
            badge={<><span>Production system</span><strong>One shoot. Every useful format.</strong></>}
            src={SITE.images.homeStrategy}
          />
          <div className="system-feature__copy">
            <p className="eyebrow"><span aria-hidden="true" />Content that keeps working</p>
            <h2 className="section-title">Make the hero.<br />Build the engine.</h2>
            <p>
              We plan original production as a living content operation: a defining film or image system, then channel-ready stories, cut-downs, stills, captions, rights and distribution assets.
            </p>
            <ul className="proof-list">
              <li><Check aria-hidden="true" />One creative spine across every format</li>
              <li><Check aria-hidden="true" />Accessibility and usage rights built in</li>
              <li><Check aria-hidden="true" />A clear library your team can actually use</li>
            </ul>
              <Link className="text-link" href="/services/film-content-production">Explore film + content <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="section approach-home">
        <div className="shell">
          <SectionHeading
            eyebrow="The KINGXFORD method"
            title={<>Move from<br /><span className="type-cobalt">fog to focus.</span></>}
            copy={<p>A senior-led process that protects the big idea while keeping scope, timing and accountability visible.</p>}
          />
          <div className="approach-steps">
            {approach.map(([number, title, copy]) => (
              <article className="approach-step" key={number}>
                <span className="approach-step__number">{number}</span>
                <div className="approach-step__line" aria-hidden="true"><span /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section industries-home">
        <div className="shell industries-home__grid">
          <div className="industries-home__intro">
            <p className="eyebrow eyebrow--light"><span aria-hidden="true" />Where we go deep</p>
            <h2 className="section-title">Built for<br />real economies.</h2>
            <p>
              We understand markets where trust must be earned, complexity must become clear and the work must perform beyond an awards room.
            </p>
            <Link className="button button--light" href="/industries">Explore industries <ArrowUpRight aria-hidden="true" /></Link>
          </div>
          <div className="industry-list">
            {industries.map((industry, index) => (
              <Link href={industry.href} key={industry.href}>
                <span>0{index + 1}</span>
                <strong>{industry.label}</strong>
                <MoveRight aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section work-home">
        <div className="shell">
          <SectionHeading
            eyebrow="Selected concept work"
            title={<>See the system<br /><span className="type-muted">in motion.</span></>}
            copy={<p>These fictional demonstration concepts show how KINGXFORD would connect strategy, creative, production and growth. They are not commissioned client work and claim no performance results.</p>}
          />
          <div className="concept-grid">
            {concepts.map((concept) => (
              <Link className="concept-card" href={concept.href} key={concept.index}>
                <MediaFrame alt={concept.alt} src={concept.image} />
                <div className="concept-card__meta">
                  <span>{concept.index} · {concept.sector}</span>
                  <span>Fictional demonstration</span>
                </div>
                <div className="concept-card__title">
                  <div><h3>{concept.title}</h3><p>{concept.client}</p></div>
                  <ArrowUpRight aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
          <Link className="button button--outline" href="/work">Explore all concept work <ArrowUpRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="section region-home">
        <div className="shell region-home__grid">
          <div>
            <p className="eyebrow"><span aria-hidden="true" />Rooted on the edge</p>
            <h2 className="display">St. John’s makes you see the world differently.</h2>
          </div>
          <div className="region-home__copy">
            <p>
              A working harbour, a distinct culture and a direct line to North Atlantic industries. KINGXFORD starts here—close enough to understand the place, ambitious enough to build across Canada.
            </p>
            <Link className="text-link" href="/about">Meet KINGXFORD <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <CTASection />
    </main>
  );
}
