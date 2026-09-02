import type { Metadata } from "next";
import Link from "next/link";
import { MediaFrame } from "@/components/MediaFrame";

export const metadata: Metadata = {
  title: "Approach | KINGXFORD",
  description: "A senior-led, evidence-based operating model from alignment and discovery through launch, learning and scale.",
};

const phases = [
  { number: "01", title: "Align", text: "Define the business decision, audiences, evidence, constraints, owners and success measures before choosing deliverables.", output: "Shared brief + measurement frame" },
  { number: "02", title: "Discover", text: "Listen to customers and frontline teams, study behaviour and context, audit the current experience and separate signal from assumption.", output: "Opportunity map + strategic choice" },
  { number: "03", title: "Create", text: "Develop a small number of differentiated territories, stress-test them against the brief and turn the strongest into a connected system.", output: "Creative platform + prototype" },
  { number: "04", title: "Make", text: "Produce the complete experience with accessibility, rights, versioning, provenance and channel requirements designed in from the start.", output: "Launch-ready system" },
  { number: "05", title: "Move", text: "Launch, distribute and activate the work around the moments most likely to change audience behaviour.", output: "Coordinated market release" },
  { number: "06", title: "Learn", text: "Read performance in context, document what changed, improve the work and move investment toward the strongest evidence.", output: "Decision narrative + next move" },
];

export default function ApproachPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Approach / from fog to focus</p>
          <h1 className="display">One senior team. One business objective. No strategic telephone game.</h1>
          <p className="lede">The people shaping the strategy stay close to the making, launch and learning. That continuity protects the idea and speeds up decisions.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">The operating system</p>
          <h2 className="section-title">Six moves, scaled to the assignment.</h2>
          <MediaFrame
            alt="Overhead creative operating system connecting strategy, production, digital design and measurement"
            badge={<><span>From fog to focus</span><strong>Every phase protects one commercial thread.</strong></>}
            src="/media/kingxford-production-system.webp"
          />
          <div className="page-grid">
            {phases.map((phase) => (
              <article className="card stack" key={phase.number}>
                <span className="card__number">{phase.number}</span>
                <h3>{phase.title}</h3>
                <p>{phase.text}</p>
                <span className="tag">Output / {phase.output}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell split">
          <div className="media-frame stack">
            <p className="eyebrow">The core team</p>
            <h2 className="section-title">Small at the centre. Deep when needed.</h2>
            <p className="lede">A senior lead holds the commercial thread. Strategy, creative and delivery leads stay accountable. Specialists join when the problem calls for them.</p>
          </div>
          <div className="stack">
            {["One accountable engagement lead", "Direct access to the people doing the work", "A visible roadmap, decisions and dependencies", "Specialists selected for the brief—not the bench"].map((item, index) => (
              <div className="card" key={item}><span className="card__number">0{index + 1}</span><h3>{item}</h3></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell stack">
          <p className="eyebrow">Working principles</p>
          <div className="page-grid">
            <article className="card stack"><h3>Evidence over theatre</h3><p>Research must change a decision. Reporting must explain the next move.</p></article>
            <article className="card stack"><h3>Access over ceremony</h3><p>Clear owners, direct conversation and written decisions keep momentum high.</p></article>
            <article className="card stack"><h3>Originality with a job</h3><p>Distinctive work should make a choice easier, a memory stronger or an action more likely.</p></article>
            <article className="card stack"><h3>Proof by design</h3><p>Claims, rights, disclosure, AI provenance and accessibility are creative inputs.</p></article>
          </div>
          <Link className="button button--primary" href="/start-a-project">Start with alignment</Link>
        </div>
      </section>
    </main>
  );
}
