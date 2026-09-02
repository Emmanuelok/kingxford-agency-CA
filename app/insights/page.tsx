import type { Metadata } from "next";
import Link from "next/link";
import { insights } from "@/lib/content";

export const metadata: Metadata = {
  title: "Insights | KINGXFORD",
  description: "Practical thinking on discoverability, production, responsible growth and building connected marketing systems.",
};

export default function InsightsPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Field notes / useful signals</p>
          <h1 className="display">Read what is changing. Decide what to do next.</h1>
          <p className="lede">Practical perspectives for leaders building brands, demand and customer experiences in a fast-moving Canadian market.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">Starting points</p>
          <div className="page-grid">
            {insights.map((insight, index) => (
              <article className="card stack" key={insight.slug}>
                <div className="cluster"><span className="card__number">0{index + 1}</span><span className="tag">{insight.category}</span></div>
                <h2>{insight.title}</h2>
                <p>{insight.deck}</p>
                <p className="eyebrow">{insight.published} / {insight.readTime}</p>
                <Link className="text-link" href={`/insights/${insight.slug}`}>Read the field note <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell split">
          <div className="stack"><p className="eyebrow">Briefings for your team</p><h2 className="section-title">Turn a market signal into a working session.</h2></div>
          <div className="stack"><p className="lede">KINGXFORD can adapt these frameworks to your category, customer journey and operating constraints—then leave your team with a decision and a practical next move.</p><Link className="button button--primary" href="/start-a-project">Request a working session</Link></div>
        </div>
      </section>
    </main>
  );
}
