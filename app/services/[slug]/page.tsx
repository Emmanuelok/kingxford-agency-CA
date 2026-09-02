import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/MediaFrame";
import { serviceBySlug, services } from "@/lib/content";

export function generateStaticParams() {
  return services.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  return service
    ? { title: `${service.title} | KINGXFORD`, description: service.description }
    : { title: "Service not found | KINGXFORD" };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const related = service.related.map(serviceBySlug).filter(Boolean);

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <Link className="text-link" href="/services">← All services</Link>
          <p className="eyebrow">Service {service.number} / {service.shortTitle}</p>
          <h1 className="display">{service.title}</h1>
          <p className="lede">{service.promise} {service.description}</p>
          <div className="cluster">
            <Link className="button button--primary" href="/start-a-project">Discuss this service</Link>
            <Link className="button button--outline" href="/estimate">Build an estimate</Link>
          </div>
          <MediaFrame
            alt="Overhead cinematic workspace with a cinema camera, colour controls, interface sketches and campaign planning materials"
            badge={<><span>Practice {service.number}</span><strong>{service.shortTitle} inside one connected production system.</strong></>}
            className="page-hero__visual"
            src="/media/kingxford-production-system.webp"
          />
        </div>
      </header>

      <section className="section">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">What we can build</p>
            <h2 className="section-title">A complete practice, shaped around your problem.</h2>
            <p className="lede">Use one capability or combine several. Scope follows the decision that needs to change—not an off-the-shelf bundle.</p>
          </div>
          <ul className="card list-clean">
            {service.capabilities.map((capability, index) => (
              <li key={capability}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span> {capability}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">What leaves the room</p>
          <h2 className="section-title">Useful outputs, not presentation theatre.</h2>
          <div className="page-grid">
            {service.deliverables.map((deliverable) => (
              <article className="card" key={deliverable}><h3>{deliverable}</h3></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div className="media-frame stack">
            <p className="eyebrow">Designed outcomes</p>
            <h2 className="section-title">The work is only valuable when something changes.</h2>
            <ul>
              {service.outcomes.map((outcome) => <li key={outcome}>{outcome}</li>)}
            </ul>
          </div>
          <div className="stack">
            <p className="eyebrow">Ways to engage</p>
            {service.engagements.map((engagement, index) => (
              <div className="card" key={engagement}>
                <span className="card__number">0{index + 1}</span>
                <h3>{engagement}</h3>
              </div>
            ))}
            <p>Every engagement begins with alignment on audience, decision, evidence, constraints and measurement.</p>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Connected practices</p>
          <h2 className="section-title">Build the system around the idea.</h2>
          <div className="page-grid">
            {related.map((item) => item && (
              <Link className="card stack" href={`/services/${item.slug}`} key={item.slug}>
                <span className="card__number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.promise}</p>
              </Link>
            ))}
          </div>
          <Link className="button button--primary" href="/start-a-project">Bring us the business problem</Link>
        </div>
      </section>
    </main>
  );
}
