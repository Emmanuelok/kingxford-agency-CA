import type { Metadata } from "next";
import Link from "next/link";
import { locations } from "@/lib/content";

export const metadata: Metadata = {
  title: "Locations | KINGXFORD",
  description: "KINGXFORD launches in St. John’s and serves organizations across Atlantic Canada and national markets through a distributed model.",
};

export default function LocationsPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Locations / one coast to another</p>
          <h1 className="display">Born in St. John’s. Built to move across Canada.</h1>
          <p className="lede">Our launch base is real. Our national service model is distributed. Permanent offices will be named only when they exist.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <div className="disclosure"><strong>Location transparency:</strong> St. John’s is KINGXFORD’s launch base. Every other city below is a current service market or future expansion priority—not a claimed office.</div>
          <div className="page-grid">
            {locations.map((location, index) => (
              <article className="card stack" key={location.slug}>
                <div className="cluster"><span className="card__number">{String(index + 1).padStart(2, "0")}</span><span className="tag">{location.status}</span></div>
                <p className="eyebrow">{location.province}</p>
                <h2>{location.city}</h2>
                <p>{location.statement}</p>
                <Link className="text-link" href={`/locations/${location.slug}`}>View market focus <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell split">
          <div className="media-frame stack"><p className="eyebrow">Expansion rule</p><h2 className="section-title">Presence follows usefulness.</h2></div>
          <div className="rich-copy"><p>We expand when sustained client demand, trusted local talent and regional context can support a meaningful practice—not to make the map look larger.</p><p>Québec work requires native French-language capability and cultural fluency. Indigenous, northern and distinct local communities require partnership, consent and context specific to the assignment.</p></div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack"><p className="eyebrow">Wherever the brief begins</p><h2 className="section-title">Bring us the market you need to enter—or understand.</h2><Link className="button button--primary" href="/start-a-project">Discuss your location</Link></div>
      </section>
    </main>
  );
}
