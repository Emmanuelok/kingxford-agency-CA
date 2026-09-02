import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/MediaFrame";
import { industries, industryBySlug, serviceBySlug } from "@/lib/content";

export function generateStaticParams() {
  return industries.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  return industry
    ? { title: `${industry.name} agency | KINGXFORD`, description: industry.introduction }
    : { title: "Industry not found | KINGXFORD" };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = industryBySlug(slug);
  if (!industry) notFound();
  const relevant = industry.relevantServices.map(serviceBySlug).filter(Boolean);

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <Link className="text-link" href="/industries">← All industries</Link>
          <p className="eyebrow">Sector focus</p>
          <h1 className="display">{industry.name}</h1>
          <p className="lede">{industry.signal} {industry.introduction}</p>
          <Link className="button button--primary" href="/start-a-project">Discuss your market</Link>
          <MediaFrame
            alt="Cinematic triptych combining North Atlantic marine technology, a coastal hospitality setting and Canadian makers at work"
            badge={<><span>Sector field</span><strong>{industry.signal}</strong></>}
            className="page-hero__visual"
            src="/media/kingxford-canadian-industries.webp"
          />
        </div>
      </header>

      <section className="section">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">Pressure map</p>
            <h2 className="section-title">The conditions the work must survive.</h2>
          </div>
          <div className="stack">
            {industry.pressures.map((pressure, index) => (
              <div className="card" key={pressure}><span className="card__number">P{index + 1}</span><h3>{pressure}</h3></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Opportunity field</p>
          <h2 className="section-title">Where KINGXFORD can create leverage.</h2>
          <div className="page-grid">
            {industry.opportunities.map((opportunity, index) => (
              <article className="card stack" key={opportunity}>
                <span className="card__number">0{index + 1}</span>
                <h3>{opportunity}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">A likely team</p>
          <h2 className="section-title">Connected capabilities for this market.</h2>
          <div className="page-grid">
            {relevant.map((service) => service && (
              <Link className="card stack" href={`/services/${service.slug}`} key={service.slug}>
                <span className="card__number">{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.promise}</p>
              </Link>
            ))}
          </div>
          <div className="disclosure">
            <strong>Our standard:</strong> sector familiarity never replaces discovery. Claims, cultural context, regulatory requirements and operational realities are validated with the client and qualified specialists.
          </div>
          <Link className="button button--primary" href="/start-a-project">Assemble the right team</Link>
        </div>
      </section>
    </main>
  );
}
