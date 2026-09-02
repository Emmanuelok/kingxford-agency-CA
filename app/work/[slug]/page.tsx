import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaFrame } from "@/components/MediaFrame";
import { caseBySlug, caseStudies } from "@/lib/content";

export function generateStaticParams() {
  return caseStudies.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = caseBySlug(slug);
  return project
    ? { title: `${project.client}: concept demonstration | KINGXFORD`, description: project.summary }
    : { title: "Work not found | KINGXFORD" };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = caseBySlug(slug);
  if (!project) notFound();
  const projectImage = project.slug === "wild-shore"
    ? "/media/kingxford-atlantic-studio.webp"
    : project.slug === "forge-and-field"
      ? "/media/kingxford-production-system.webp"
      : "/media/kingxford-canadian-industries.webp";
  const projectAlt = project.slug === "wild-shore"
    ? "Conceptual blue-hour creative studio overlooking a North Atlantic harbour, with a production team reviewing a cinema camera"
    : project.slug === "forge-and-field"
      ? "Overhead cinematic workspace with a cinema camera, colour controls, interface sketches and campaign planning materials"
      : "Cinematic triptych combining North Atlantic marine technology, a coastal hospitality setting and Canadian makers at work";

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <Link className="text-link" href="/work">← All work</Link>
          <p className="eyebrow">{project.sector}</p>
          <h1 className="display">{project.title}</h1>
          <p className="lede">{project.summary}</p>
          <div className="disclosure">
            <strong>Fictional concept demonstration.</strong> {project.client} is not a real KINGXFORD client. This page demonstrates a proposed way of thinking; it does not report completed work or results.
          </div>
          <MediaFrame
            alt={projectAlt}
            badge={<><span>Fictional demonstration</span><strong>{project.idea}</strong></>}
            className="page-hero__visual"
            src={projectImage}
          />
        </div>
      </header>

      <section className="section">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">Hypothetical challenge</p>
            <h2 className="section-title">The business problem</h2>
            <p className="lede">{project.challenge}</p>
          </div>
          <div className={`media-frame stack case-field case-field--${project.palette}`}>
            <p className="eyebrow">Strategic platform</p>
            <p className="display">{project.idea}</p>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Proposed connected system</p>
          <h2 className="section-title">One idea, built to travel.</h2>
          <div className="page-grid">
            {project.system.map((item, index) => (
              <article className="card stack" key={item}>
                <span className="card__number">0{index + 1}</span>
                <h3>{item}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div className="stack">
            <p className="eyebrow">Measurement design</p>
            <h2 className="section-title">What we would agree before launch.</h2>
            <p>Because this is a concept, there are no invented results. A real engagement would establish baselines, data access, targets and decision rules with the client.</p>
          </div>
          <ul className="card list-clean">
            {project.measurement.map((measure, index) => <li key={measure}><span aria-hidden="true">M{index + 1}</span> {measure}</li>)}
          </ul>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">Your version starts here</p>
          <h2 className="section-title">Bring us a real constraint worth designing around.</h2>
          <div className="cluster">
            <Link className="button button--primary" href="/start-a-project">Start a project</Link>
            <Link className="button button--outline" href="/services">Explore capabilities</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
