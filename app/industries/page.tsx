import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { industries } from "@/lib/content";

export const metadata: Metadata = {
  title: "Industries | KINGXFORD",
  description: "Priority sectors for KINGXFORD in Newfoundland and Labrador, Atlantic Canada and national growth markets.",
};

export default function IndustriesPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Sector intelligence / commercial clarity</p>
          <h1 className="display">Know the world. Then make something the world has not seen.</h1>
          <p className="lede">
            We combine category fluency with an outsider’s ability to question familiar language, stale conventions and inherited customer journeys.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <div className="split">
            <div>
              <p className="eyebrow">Six priority sectors</p>
              <h2 className="section-title">Atlantic roots. National ambition.</h2>
            </div>
            <p className="lede">Our launch focus reflects the organizations shaping Newfoundland and Labrador today and the markets where that expertise can travel.</p>
          </div>
          <figure className="media-frame">
            <Image
              alt="A cinematic Canadian industry triptych showing North Atlantic marine technology, hospitality and contemporary consumer culture"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 92vw"
              src="/media/kingxford-canadian-industries.webp"
            />
            <div className="media-frame__wash" aria-hidden="true" />
            <figcaption><span>AI-assisted conceptual artwork</span><strong>Technical capability, lived culture and commercial momentum.</strong></figcaption>
          </figure>
          <div className="page-grid">
            {industries.map((industry, index) => (
              <article className="card stack" key={industry.slug}>
                <span className="card__number">0{index + 1}</span>
                <p className="eyebrow">{industry.signal}</p>
                <h3>{industry.name}</h3>
                <p>{industry.introduction}</p>
                <Link className="text-link" href={`/industries/${industry.slug}`}>See the sector opportunity <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell split">
          <div className="media-frame stack">
            <p className="eyebrow">How we learn a category</p>
            <h2 className="section-title">No borrowed confidence.</h2>
            <p className="lede">We begin with evidence: customer and stakeholder conversations, field immersion, commercial data, search behaviour, frontline expertise and the rules governing what can be claimed.</p>
          </div>
          <div className="stack">
            {["Listen to the people closest to the work", "Map the decision and every influence around it", "Find the proof competitors cannot easily copy", "Build the idea in the language of the audience"].map((step, index) => (
              <div className="card" key={step}><span className="card__number">0{index + 1}</span><h3>{step}</h3></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">A useful first conversation</p>
          <h2 className="section-title">Tell us where the market is getting stuck.</h2>
          <p className="lede">A new category, an expansion market, a reputation gap or a slow customer journey is enough to begin.</p>
          <Link className="button button--primary" href="/start-a-project">Start with the challenge</Link>
        </div>
      </section>
    </main>
  );
}
