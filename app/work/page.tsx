import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { caseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work | KINGXFORD",
  description: "Clearly labelled concept demonstrations showing how KINGXFORD thinks across ocean technology, hospitality and consumer growth.",
};

export default function WorkPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Work / launch-stage portfolio</p>
          <h1 className="display">The thinking is real. These launch cases are demonstrations.</h1>
          <p className="lede">
            KINGXFORD is a new agency. Until commissioned work can be published with client permission, these fictional briefs show the strategic depth, connected capabilities and measurement discipline we bring to a problem.
          </p>
          <div className="disclosure">
            <strong>Clear disclosure:</strong> the organizations, briefs and creative platforms below are fictional. They are not client endorsements, delivered projects or performance claims.
          </div>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <figure className="media-frame">
            <Image
              alt="Cinematic scenes representing ocean industry, destination hospitality and Canadian consumer brands"
              fill
              sizes="(max-width: 900px) 100vw, 92vw"
              src="/media/kingxford-canadian-industries.webp"
            />
            <div className="media-frame__wash" aria-hidden="true" />
            <figcaption><span>AI-assisted fictional artwork</span><strong>One connected agency model, applied to different commercial realities.</strong></figcaption>
          </figure>
          {caseStudies.map((project, index) => (
            <article className="media-frame split" key={project.slug}>
              <div className="stack">
                <span className="card__number">0{index + 1} / concept demonstration</span>
                <p className="eyebrow">{project.client} / {project.sector}</p>
                <h2 className="section-title">{project.title}</h2>
                <p className="lede">{project.summary}</p>
                <Link className="button button--outline" href={`/work/${project.slug}`}>Open the demonstration</Link>
              </div>
              <div className={`card stack case-field case-field--${project.palette}`} aria-label={`Conceptual visual field for ${project.client}`}>
                <span className="tag">Challenge</span>
                <strong>{project.challenge}</strong>
                <span className="tag">Platform</span>
                <strong>{project.idea}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">Commission a founding case</p>
            <h2 className="section-title">Make the first real chapter unmistakable.</h2>
          </div>
          <div className="stack">
            <p className="lede">We are looking for ambitious Newfoundland and Labrador organizations ready to solve a consequential brand, launch or growth problem—and document the work honestly.</p>
            <Link className="button button--primary" href="/start-a-project">Bring us the brief</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
