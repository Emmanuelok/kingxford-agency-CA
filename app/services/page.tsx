import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { services } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services | KINGXFORD",
  description:
    "Nine connected agency practices spanning brand, campaigns, social, digital products, search, media, production, AI operations and customer experience.",
};

export default function ServicesPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Capabilities / one accountable system</p>
          <h1 className="display">Everything needed to move a business forward.</h1>
          <p className="lede">
            Strategy, creative, production, technology and growth work as one system—so the idea stays coherent from first insight to final result.
          </p>
          <div className="cluster">
            <Link className="button button--primary" href="/start-a-project">Start a project</Link>
            <Link className="button button--outline" href="/approach">See how we work</Link>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <div className="split">
            <div>
              <p className="eyebrow">Nine connected practices</p>
              <h2 className="section-title">Choose an entry point. Build the right team around it.</h2>
            </div>
            <p className="lede">
              You do not need to diagnose the agency discipline before calling. Bring the business problem; we will shape the smallest complete engagement that can solve it.
            </p>
          </div>

          <figure className="media-frame">
            <Image
              alt="A cinematic overhead production table combining camera craft, colour work, product design and campaign planning"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 92vw"
              src="/media/kingxford-production-system.webp"
            />
            <div className="media-frame__wash" aria-hidden="true" />
            <figcaption><span>AI-assisted conceptual artwork</span><strong>One table. One idea. Every required discipline.</strong></figcaption>
          </figure>

          <div className="page-grid">
            {services.map((service) => (
              <article className="card stack" key={service.slug}>
                <span className="card__number" aria-hidden="true">{service.number}</span>
                <div>
                  <p className="eyebrow">{service.promise}</p>
                  <h3>{service.title}</h3>
                </div>
                <p>{service.description}</p>
                <ul className="list-clean" aria-label={`${service.title} highlights`}>
                  {service.capabilities.slice(0, 3).map((capability) => <li key={capability}>{capability}</li>)}
                </ul>
                <Link className="text-link" href={`/services/${service.slug}`}>
                  Explore this practice <span aria-hidden="true">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell">
          <div className="media-frame">
            <div className="split">
              <div className="stack">
                <p className="eyebrow">The KINGXFORD proof standard</p>
                <h2 className="section-title">Creative built to perform—and built to withstand scrutiny.</h2>
              </div>
              <div className="page-grid">
                {["Claims and pricing evidence", "Consent, rights and AI provenance", "Captions, alt text and accessible journeys", "Measurement tied to a real decision"].map((item) => (
                  <div className="card" key={item}><p>{item}</p></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">Three ways to engage</p>
          <h2 className="section-title">Enough structure to move. Enough flexibility to fit.</h2>
          <div className="page-grid">
            <article className="card stack">
              <span className="tag">01 / Sprint</span>
              <h3>Solve one sharp problem</h3>
              <p>A focused diagnostic, intensive or prototype with a defined decision and a usable output.</p>
            </article>
            <article className="card stack">
              <span className="tag">02 / Project</span>
              <h3>Build a complete launch</h3>
              <p>A senior-led team assembled across the practices required to take an idea from strategy into market.</p>
            </article>
            <article className="card stack">
              <span className="tag">03 / Partnership</span>
              <h3>Operate and improve</h3>
              <p>An embedded growth, content or brand system with a shared roadmap, regular production and honest measurement.</p>
            </article>
          </div>
          <div className="cluster">
            <Link className="button button--primary" href="/estimate">Build a project estimate</Link>
            <Link className="button button--outline" href="/work">See the work model</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
