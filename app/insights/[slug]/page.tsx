import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/MediaFrame";
import { insightBySlug, insights } from "@/lib/content";

export function generateStaticParams() {
  return insights.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const insight = insightBySlug(slug);
  return insight ? { title: `${insight.title} | KINGXFORD`, description: insight.deck } : { title: "Insight not found | KINGXFORD" };
}

export default async function InsightDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const insight = insightBySlug(slug);
  if (!insight) notFound();
  const insightImage = insight.slug === "one-shoot-many-stories"
    ? "/media/kingxford-atlantic-studio.webp"
    : "/media/kingxford-production-system.webp";

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <Link className="text-link" href="/insights">← All insights</Link>
          <p className="eyebrow">{insight.category} / {insight.published} / {insight.readTime}</p>
          <h1 className="display">{insight.title}</h1>
          <p className="lede">{insight.deck}</p>
          <p>By {insight.byline}</p>
          <MediaFrame
            alt={insight.slug === "one-shoot-many-stories"
              ? "Conceptual blue-hour creative studio overlooking a North Atlantic harbour, with a production team reviewing a cinema camera"
              : "Overhead cinematic workspace with a cinema camera, colour controls, interface sketches and campaign planning materials"}
            badge={<><span>KINGXFORD field note</span><strong>Evidence translated into a practical operating move.</strong></>}
            className="page-hero__visual"
            src={insightImage}
          />
        </div>
      </header>

      <article className="section">
        <div className="shell split">
          <div className="rich-copy stack">
            {insight.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
          <aside className="card stack" aria-label="Practical actions">
            <p className="eyebrow">Three practical moves</p>
            {insight.actions.map((action, index) => <div key={action}><span className="card__number">0{index + 1}</span><h3>{action}</h3></div>)}
          </aside>
        </div>
      </article>

      <section className="section section--compact">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">Source note</p>
            <h2 className="section-title">Evidence before assertion.</h2>
            <p>{insight.sourceNote}</p>
          </div>
          <ul className="card list-clean source-list" aria-label="Primary sources">
            {insight.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} rel="noreferrer" target="_blank">{source.label} <span aria-hidden="true">↗</span></a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Apply the thinking</p>
          <h2 className="section-title">Make the next decision with your own evidence.</h2>
          <Link className="button button--primary" href="/start-a-project">Set up a working session</Link>
        </div>
      </section>
    </main>
  );
}
