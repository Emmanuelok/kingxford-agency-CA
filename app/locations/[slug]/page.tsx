import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/MediaFrame";
import { locationBySlug, locations } from "@/lib/content";

export function generateStaticParams() {
  return locations.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const location = locationBySlug(slug);
  return location ? { title: `${location.city}, ${location.province} | KINGXFORD`, description: location.detail } : { title: "Location not found | KINGXFORD" };
}

export default async function LocationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const location = locationBySlug(slug);
  if (!location) notFound();

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <Link className="text-link" href="/locations">← All locations</Link>
          <p className="eyebrow">{location.status} / {location.province}</p>
          <h1 className="display">{location.city}</h1>
          <p className="lede">{location.statement}</p>
          <MediaFrame
            alt={location.slug === "st-johns"
              ? "Conceptual blue-hour creative studio overlooking a North Atlantic harbour, with a production team reviewing a cinema camera"
              : "Cinematic triptych combining North Atlantic marine technology, a coastal hospitality setting and Canadian makers at work"}
            badge={<><span>{location.status}</span><strong>{location.city}, seen through the KINGXFORD expansion model.</strong></>}
            className="page-hero__visual"
            src={location.slug === "st-johns" ? "/media/kingxford-atlantic-studio.webp" : "/media/kingxford-canadian-industries.webp"}
          />
        </div>
      </header>

      <section className="section">
        <div className="shell split">
          <div className="stack"><p className="eyebrow">Market model</p><h2 className="section-title">What our presence means here.</h2><p className="lede">{location.detail}</p></div>
          <div className="card stack"><p className="eyebrow">Priority conversations</p>{location.focus.map((focus, index) => <div key={focus}><span className="card__number">0{index + 1}</span><h3>{focus}</h3></div>)}</div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack"><p className="eyebrow">Work across distance</p><h2 className="section-title">Distributed by default. In person when it matters.</h2><p className="lede">Discovery, reviews and production planning can move quickly online. Field research, workshops, filming and critical launch moments are scoped on site when they create better work.</p><Link className="button button--primary" href="/start-a-project">Start a conversation in {location.city}</Link></div>
      </section>
    </main>
  );
}
