import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About | KINGXFORD",
  description: "A Newfoundland-born independent agency being built for organizations with the ambition to move markets, communities and culture.",
};

export default function AboutPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">About / Newfoundland-born, nationally minded</p>
          <h1 className="display">An agency built at the edge—without thinking at the edges.</h1>
          <p className="lede">KINGXFORD is an independent St. John’s agency in launch: combining commercial strategy, original creative, production, technology and measurable growth in one accountable partnership.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <figure className="media-frame">
            <Image
              alt="Conceptual blue-hour harbour studio scene with three AI-generated figures reviewing a cinema camera"
              fill
              priority
              sizes="(max-width: 900px) 100vw, 92vw"
              src="/media/kingxford-atlantic-studio.webp"
            />
            <div className="media-frame__wash" aria-hidden="true" />
            <figcaption><span>Conceptual brand visualization</span><strong>AI-assisted artwork—not KINGXFORD premises or staff.</strong></figcaption>
          </figure>
          <div className="split">
            <div className="stack"><p className="eyebrow">Why here</p><h2 className="section-title">Distance can create a clearer point of view.</h2></div>
            <div className="rich-copy">
              <p>Newfoundland and Labrador has always connected local ingenuity to global conditions: ocean, energy, culture, science, hospitality and trade. KINGXFORD takes that same posture—grounded in place, alert to the world and built to make expertise travel.</p>
              <p>We are beginning in St. John’s, serving organizations across Atlantic Canada and building a distributed model for thoughtful expansion across Canadian cities and provinces.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">What we are building</p>
          <div className="page-grid">
            <article className="card stack"><span className="card__number">01</span><h3>A senior-led core</h3><p>The people who frame the problem stay accountable through the work, launch and learning.</p></article>
            <article className="card stack"><span className="card__number">02</span><h3>A specialist network</h3><p>Directors, developers, strategists, makers and subject experts join around the actual needs of the brief.</p></article>
            <article className="card stack"><span className="card__number">03</span><h3>A Canadian footprint</h3><p>Expansion follows client need, local leadership and cultural fluency—not pins placed on a map.</p></article>
            <article className="card stack"><span className="card__number">04</span><h3>A higher proof standard</h3><p>Accessibility, claims, consent, rights, privacy and AI provenance are designed into the work.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div className="media-frame stack"><p className="eyebrow">Current stage</p><h2 className="section-title">New agency. Clear disclosures.</h2><p className="lede">We will never dress fictional work as a client case, inflate a partner network into imaginary offices or publish a result without context.</p></div>
          <div className="stack">
            <div className="card"><h3>Founded in St. John’s</h3><p>Our launch base and first community of focus.</p></div>
            <div className="card"><h3>Built project by project</h3><p>Teams and timelines are made visible before work begins.</p></div>
            <div className="card"><h3>Expanding with intention</h3><p>National-ready delivery now; permanent presence only when it is real.</p></div>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Come build the first chapter</p>
          <h2 className="section-title">If the ambition is real, the conversation can start early.</h2>
          <div className="cluster"><Link className="button button--primary" href="/start-a-project">Work with KINGXFORD</Link><Link className="button button--outline" href="/locations">See our market plan</Link></div>
        </div>
      </section>
    </main>
  );
}
