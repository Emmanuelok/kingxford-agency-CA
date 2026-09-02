import {
  BarChart3,
  Captions,
  CircleCheckBig,
  FileCheck2,
  Film,
  Fingerprint,
  Gauge,
  Megaphone,
  MousePointerClick,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const serviceNodes = [
  ["01", "Insight", Search],
  ["02", "Identity", Fingerprint],
  ["03", "Campaign", Megaphone],
  ["04", "Production", Film],
  ["05", "Experience", MousePointerClick],
  ["06", "Growth", BarChart3],
] as const;

export function ServicesVisual() {
  return (
    <section className="editorial-visual services-visual" aria-labelledby="services-system-title">
      <div className="editorial-image-panel">
        <img
          src="/images/services-constellation.webp"
          alt="Concept image of an integrated creative operations table where strategy, production, design and media converge"
        />
        <div className="editorial-image-grade" aria-hidden="true" />
        <div className="editorial-image-copy">
          <span>KX / CONNECTED CAPABILITIES / CONCEPT VISUAL</span>
          <h2 id="services-system-title">Twelve disciplines.<br />One commercial signal.</h2>
          <p>Specialists enter through different doors. The brief, decision trail and measure of success stay shared.</p>
        </div>
      </div>
      <figure className="service-system-figure">
        <figcaption>
          <span>THE CONNECTED AGENCY MODEL</span>
          <p>Every discipline orbits the same business objective—so the campaign, website, media and measurement do not contradict one another.</p>
        </figcaption>
        <div className="service-orbit" aria-label="Six connected agency disciplines surrounding one business objective">
          <div className="service-orbit-core"><small>ONE</small><strong>Business<br />objective</strong><i>Measured end to end</i></div>
          <ol>
            {serviceNodes.map(([number, label, Icon]) => (
              <li key={label}><span>{number}</span><Icon aria-hidden="true" /><b>{label}</b></li>
            ))}
          </ol>
        </div>
      </figure>
    </section>
  );
}

export function SolutionsVisual() {
  const steps = [
    ["01", "Signal", "What is changing in the market?"],
    ["02", "Choice", "What must the organization decide?"],
    ["03", "System", "What combination of work will move it?"],
    ["04", "Evidence", "What will prove that it moved?"],
  ];

  return (
    <section className="editorial-visual solutions-visual" aria-labelledby="solutions-route-title">
      <div className="editorial-image-panel editorial-image-panel-light">
        <img
          src="/images/solutions-signal.webp"
          alt="Concept image showing scattered market signals resolving into a clear path toward action"
        />
        <div className="editorial-image-grade" aria-hidden="true" />
        <div className="editorial-image-copy">
          <span>KX / FROM SIGNAL TO RESULT / CONCEPT VISUAL</span>
          <h2 id="solutions-route-title">Do not buy activity.<br />Build movement.</h2>
        </div>
      </div>
      <figure className="outcome-route-figure">
        <figcaption><span>THE RESULT ROUTE</span><p>A clear commercial result determines the strategy, the creative system and the evidence required.</p></figcaption>
        <ol>{steps.map(([number, title, description]) => <li key={number}><span>{number}</span><b>{title}</b><p>{description}</p></li>)}</ol>
      </figure>
    </section>
  );
}

export function AboutVisual() {
  return (
    <figure className="about-atlantic-visual">
      <img
        src="/images/about-north-atlantic-studio.webp"
        alt="Architectural concept image of a North Atlantic creative studio in a contemporary St. John's heritage space"
      />
      <div className="editorial-image-grade" aria-hidden="true" />
      <figcaption>
        <span>KX / PLACE SHAPES PERSPECTIVE / CONCEPT VISUAL</span>
        <strong>47.5615° N<br />52.7126° W</strong>
        <p>Built with a Newfoundland point of view. Designed to work across Canada.</p>
      </figcaption>
    </figure>
  );
}

export function InvestmentFigure() {
  const layers = [
    ["01", "Thinking", "Research, diagnosis, strategy and senior direction"],
    ["02", "Making", "Creative development, design, copy and production"],
    ["03", "Reach", "Media, creators, distribution and amplification"],
    ["04", "Systems", "Web, commerce, CRM, software and integrations"],
    ["05", "Learning", "Measurement, optimization and reporting"],
  ];
  return (
    <figure className="investment-figure">
      <figcaption><span>THE INVESTMENT ARCHITECTURE</span><h2>Every dollar has a job.</h2><p>A proposal should separate the cost of thinking, making, reaching, operating and learning—then show how they work together.</p></figcaption>
      <ol>{layers.map(([number, title, description]) => <li key={number}><span>{number}</span><div><b>{title}</b><p>{description}</p></div></li>)}</ol>
    </figure>
  );
}

type TrustMapProps = {
  eyebrow: string;
  title: string;
  items: [string, string, "shield" | "check" | "caption" | "spark"][];
};

const trustIcons = {
  shield: ShieldCheck,
  check: FileCheck2,
  caption: Captions,
  spark: Sparkles,
};

export function TrustMap({ eyebrow, title, items }: TrustMapProps) {
  return (
    <section className="trust-map" aria-labelledby={`${eyebrow.toLowerCase().replaceAll(" ", "-")}-title`}>
      <header><span>{eyebrow}</span><h2 id={`${eyebrow.toLowerCase().replaceAll(" ", "-")}-title`}>{title}</h2></header>
      <div>{items.map(([name, description, icon]) => { const Icon = trustIcons[icon]; return <article key={name}><Icon aria-hidden="true" /><b>{name}</b><p>{description}</p><CircleCheckBig aria-hidden="true" className="trust-map-check" /></article>; })}</div>
    </section>
  );
}

export function PlatformSignalFigure() {
  return (
    <figure className="platform-signal-figure">
      <figcaption><span>ONE SOURCE OF TRUTH</span><h2>Brief → decision → delivery → result.</h2></figcaption>
      <div className="platform-signal-line" aria-label="Connected client workflow">
        {["Brief", "Decision", "Production", "Launch", "Learning"].map((item, index) => <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><Gauge aria-hidden="true" /><b>{item}</b></div>)}
      </div>
    </figure>
  );
}
