import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Production studio | KINGXFORD",
  description: "Cinematic film, photography, motion and modular content production planned as an accessible, rights-cleared operating system.",
};

export default function StudioPage() {
  const disciplines = ["Creative development", "Directing + cinematography", "Photography", "Editorial + colour", "Sound design", "Motion + VFX", "Social adaptation", "Asset operations"];
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">KINGXFORD Studio / production without the disconnect</p>
          <h1 className="display">Make one defining story. Build every useful frame around it.</h1>
          <p className="lede">A connected production model for hero film, photography, motion and platform-native content—from first treatment to final rights record.</p>
          <Link className="button button--primary" href="/start-a-project">Brief the studio</Link>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <figure className="media-frame">
            <Image
              alt="An overhead cinematic studio environment with camera equipment, editing controls, campaign plans and a digital prototype"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 92vw"
              src="/media/kingxford-production-system.webp"
            />
            <div className="media-frame__wash" aria-hidden="true" />
            <figcaption><span>AI-assisted conceptual artwork</span><strong>Capture, craft and content operations designed together.</strong></figcaption>
          </figure>
          <div className="split">
          <div className="media-frame stack">
            <p className="eyebrow">The production equation</p>
            <h2 className="section-title">One idea × planned capture × modular craft.</h2>
            <p className="lede">The answer is not maximum volume. It is the right set of coherent assets, captured efficiently and finished for the contexts where people will actually experience them.</p>
          </div>
          <div className="page-grid">
            {disciplines.map((discipline, index) => <div className="card" key={discipline}><span className="card__number">{String(index + 1).padStart(2, "0")}</span><h3>{discipline}</h3></div>)}
          </div>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">One shoot, many stories</p>
          <h2 className="section-title">Plan the full asset map before call time.</h2>
          <div className="page-grid">
            <article className="card stack"><span className="tag">Hero</span><h3>The defining expression</h3><p>A flagship film or image series with the space, craft and pacing to create memory.</p></article>
            <article className="card stack"><span className="tag">Native</span><h3>Designed for the platform</h3><p>Vertical stories, quiet loops, interviews, demonstrations and cut-downs conceived in their own formats.</p></article>
            <article className="card stack"><span className="tag">Utility</span><h3>Built for everyday use</h3><p>Stills, product views, recruitment moments, web backgrounds, thumbnails and internal communications.</p></article>
            <article className="card stack"><span className="tag">Control</span><h3>Ready to use responsibly</h3><p>Captions, alt text, source records, releases, music and talent rights, expiry dates and approved masters.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div className="stack"><p className="eyebrow">Field-ready</p><h2 className="section-title">Made for real weather, real work and real people.</h2></div>
          <div className="rich-copy">
            <p>Newfoundland and Labrador offers extraordinary environments—and demands serious preparation. We plan around access, safety, weather alternatives, consent, technical realities and the dignity of the people represented.</p>
            <p>When a project requires specialist crews, aerial work, marine operations, remote logistics, union talent or regulated environments, qualified partners are scoped before production begins.</p>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Production brief</p>
          <h2 className="section-title">Tell us what the audience must feel, understand or do.</h2>
          <div className="cluster"><Link className="button button--primary" href="/start-a-project">Start a production</Link><Link className="button button--outline" href="/services/film-content-production">See the full practice</Link></div>
        </div>
      </section>
    </main>
  );
}
