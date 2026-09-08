"use client";
import Image from "next/image";

import { ArrowRight, ArrowUpRight, BarChart3, Check, ChevronRight, Clapperboard, FileText, Layers3, Network, Sparkles } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

function moveTab(
  event: KeyboardEvent<HTMLButtonElement>,
  index: number,
  count: number,
  select: (index: number) => void,
) {
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? count - 1
        : ["ArrowRight", "ArrowDown"].includes(event.key)
          ? (index + 1) % count
          : ["ArrowLeft", "ArrowUp"].includes(event.key)
            ? (index + count - 1) % count
            : null;
  if (next === null) return;
  event.preventDefault();
  select(next);
  event.currentTarget
    .closest('[role="tablist"]')
    ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    [next]?.focus();
}

const workspacePaths = [
  { number: "01", icon: FileText, title: "The shared brief", detail: "Put your audience, objective, offer and evidence in one place. Every studio starts here.", label: "Shape your campaign", view: "brief" },
  { number: "02", icon: Network, title: "Campaign workflows", detail: "Preview a connected sequence of specialists, then run the work from one campaign.", label: "Build a workflow", view: "workflows" },
  { number: "03", icon: Sparkles, title: "Specialist agents", detail: "Develop strategy, creative direction, content, media plans and review recommendations.", label: "Meet your specialists", view: "agents" },
  { number: "04", icon: Clapperboard, title: "Creative production", detail: "Turn your brief into shot lists, channel formats, production tasks and delivery checklists.", label: "Enter the studio", view: "production" },
  { number: "05", icon: BarChart3, title: "Performance & learning", detail: "Import campaign results, compare channels and use the evidence to plan the next test.", label: "Explore performance", view: "performance" },
  { number: "06", icon: Layers3, title: "Your output library", detail: "Keep draft work, revisions and exports together so the next decision starts with context.", label: "Open the library", view: "library" },
] as const;

export function WorkspaceLaunchpad({ compact = false }: { compact?: boolean }) {
  return <section className={`avalon-launchpad${compact ? " is-compact" : ""}`} id="workspace" aria-labelledby="workspace-launchpad-title">
    <div className="avalon-launchpad-head">
      <div><span className="avalon-eyebrow"><i aria-hidden="true" /> THE AVALON WORKSPACE</span><h2 id="workspace-launchpad-title">One place to turn<br />ambition into <em>action.</em></h2></div>
      <div><p>Your thinking, your studios and your next decision, connected. Start with a brief and carry it through planning, production and performance.</p><a href="/platform">Open the workspace <ArrowUpRight /></a></div>
    </div>
    <div className="avalon-launchpad-grid">
      {workspacePaths.filter((_, index) => !compact || [0, 3, 5].includes(index)).map(({ number, icon: Icon, title, detail, label, view }) => <a href={`/platform?view=${view}`} className="avalon-launch-card" key={view}>
        <div className="avalon-launch-card-top"><Icon strokeWidth={1.5} /><span>{number}</span></div>
        <h3>{title}</h3><p>{detail}</p><span className="avalon-launch-card-action">{label}<ArrowUpRight size={18}/></span>
      </a>)}
    </div>
    <div className="avalon-launchpad-foot"><span>Start in your browser. Keep control of every draft.</span><a href="/platform?view=proof">Review campaign readiness <ArrowRight size={17}/></a></div>
  </section>;
}

const problems = [
  {
    id: "launch",
    label: "Launch",
    title: "Make the market understand something new.",
    outcome: "A launch people can explain, remember and act on.",
    path: [
      "Evidence",
      "Positioning",
      "Campaign platform",
      "Production",
      "Media",
      "Readout",
    ],
    services: "Research · Strategy · Identity · Campaigns · Film · Web · Media",
  },
  {
    id: "grow",
    label: "Grow",
    title: "Turn scattered attention into steady demand.",
    outcome:
      "A connected acquisition system with a clearer offer and less wasted motion.",
    path: [
      "Offer",
      "Journey",
      "Content engine",
      "Search + social",
      "Conversion",
      "Optimization",
    ],
    services:
      "Growth strategy · Content · Paid media · SEO · CRM · CRO · Analytics",
  },
  {
    id: "clarify",
    label: "Clarify",
    title: "Make a complex company easier to choose.",
    outcome:
      "A sharper story without losing the intelligence that makes the business credible.",
    path: [
      "Interviews",
      "Narrative",
      "Identity system",
      "Sales story",
      "Product web",
      "Enablement",
    ],
    services:
      "Research · Brand strategy · Verbal identity · Design · Film · Digital",
  },
  {
    id: "enter",
    label: "Expand",
    title: "Enter a new market without becoming generic.",
    outcome:
      "A repeatable national system with evidence and adaptation built into every city.",
    path: [
      "Market signal",
      "Local tension",
      "Core platform",
      "Adaptation",
      "Launch",
      "Learning",
    ],
    services:
      "Market intelligence · Creative adaptation · Partnerships · Media · Measurement",
  },
] as const;

const rooms = [
  {
    id: "briefing",
    room: "The Briefing Room",
    label: "Strategy & research",
    description:
      "Turn business priorities, audience evidence and category context into a brief clear enough to guide every decision.",
    detail:
      "Research · positioning · naming · audience · communications planning · workshops",
    href: "/services#strategy",
    image: "/images/services/strategy-v4.webp",
  },
  {
    id: "identity",
    room: "The Identity Room",
    label: "Brand systems",
    description:
      "Creates the language and visual system that make a company recognizable, usable and difficult to misapply.",
    detail:
      "Identity · verbal system · design language · toolkits · governance",
    href: "/services#brand",
    image: "/images/services/brand-v4.webp",
  },
  {
    id: "campaign",
    room: "The Campaign Room",
    label: "Advertising & creative",
    description:
      "Builds one campaign platform with enough range to carry a launch, a year of communication and the sales moments between them.",
    detail:
      "Concepts · art direction · copy · TV · OOH · audio · social · activation",
    href: "/services#campaigns",
    image: "/images/services/campaigns-v4.webp",
  },
  {
    id: "production",
    room: "The Production Floor",
    label: "Film, content & motion",
    description:
      "Turns the approved idea into finished film, photography, audio, motion and channel-ready content while the intent remains intact.",
    detail:
      "Direction · film · photography · motion · post · versioning · creator production",
    href: "/studio",
    image: "/images/services/production-v4.webp",
  },
  {
    id: "signal",
    room: "The Signal Room",
    label: "Digital, media & growth",
    description:
      "Routes the work through websites, search, social, media and CRM—then reads the response and improves the next move.",
    detail:
      "Web · product · social · SEO · paid media · CRM · analytics · optimization",
    href: "/services#digital",
    image: "/images/services/digital-v4.webp",
  },
  {
    id: "dispatch",
    room: "The Dispatch",
    label: "Client OS & delivery",
    description:
      "Keeps the objective, scope, owners, timing, approvals, spend and next decisions visible in one accountable record.",
    detail:
      "Briefs · plans · reviews · approvals · finance · reporting · next actions",
    href: "/platform",
    image: "/images/services/data-v4.webp",
  },
] as const;

const osViews = [
  {
    id: "brief",
    label: "Brief",
    eyebrow: "The agreed starting point",
    title: "A clear foundation for every decision.",
    copy: "The audience, required action, proposition and proof are agreed before making begins. Assumptions stay visible until evidence replaces them.",
    status: [
      "Business outcome",
      "Primary audience",
      "Proposition",
      "Evidence standard",
    ],
    note: "Brief locked · 4 owners signed",
  },
  {
    id: "plan",
    label: "Plan",
    eyebrow: "The working route",
    title: "Every dependency has an owner.",
    copy: "Deliverables, decisions, production windows, media dates and risks share one live plan, with the critical path visible to both teams.",
    status: [
      "Creative route",
      "Production window",
      "Channel plan",
      "Launch dependencies",
    ],
    note: "18 tasks · 3 decisions due",
  },
  {
    id: "review",
    label: "Review",
    eyebrow: "The decision record",
    title: "Feedback arrives once, clearly.",
    copy: "The right reviewers see the work in context. Notes are consolidated, decisions are recorded and approved changes become the next version.",
    status: ["Campaign film", "Launch page", "Paid social", "Outdoor system"],
    note: "Round 02 · comments consolidated",
  },
  {
    id: "ledger",
    label: "Ledger",
    eyebrow: "The commercial truth",
    title: "Scope and spend stay current.",
    copy: "Estimates, committed spend, media, changes and remaining capacity remain visible before a decision creates a surprise.",
    status: ["Agency scope", "Production", "Media", "Contingency"],
    note: "Forecast current · no hidden change",
  },
  {
    id: "readout",
    label: "Readout",
    eyebrow: "The next useful decision",
    title: "Evidence that informs your next move.",
    copy: "Performance returns to the original brief. The readout names what worked, what did not, what we learned and exactly what should happen next.",
    status: ["Attention", "Engagement", "Qualified action", "Next test"],
    note: "Decision memo ready",
  },
] as const;

export function ProblemSwitchboard() {
  const [active, setActive] = useState(0);
  const problem = problems[active];

  return (
    <section className="kx5-switchboard" aria-labelledby="switchboard-title">
      <header>
        <span className="kx5-overline">
          A CLEAR STARTING POINT
        </span>
        <h2 id="switchboard-title">What comes next for you?</h2>
        <p>
          Choose your objective. We connect the disciplines around it.
        </p>
      </header>
      <div className="kx5-switch-layout">
        <div
          className="kx5-switch-tabs"
          role="tablist"
          aria-label="Choose a business objective"
        >
          {problems.map((item, index) => (
            <button
              id={`problem-tab-${item.id}`}
              role="tab"
              aria-selected={active === index}
              aria-controls="problem-panel"
              tabIndex={active === index ? 0 : -1}
              onKeyDown={(event) =>
                moveTab(event, index, problems.length, setActive)
              }
              type="button"
              onClick={() => setActive(index)}
              key={item.id}
            >
              <span>0{index + 1}</span>
              <b>{item.label}</b>
              <ChevronRight />
            </button>
          ))}
        </div>
        <div
          className="kx5-switch-panel"
          id="problem-panel"
          role="tabpanel"
          aria-labelledby={`problem-tab-${problem.id}`}
        >
          <div className="kx5-switch-answer">
            <span>Desired change</span>
            <h3>{problem.title}</h3>
            <p>{problem.outcome}</p>
          </div>
          <ol className="kx5-path">
            {problem.path.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <b>{step}</b>
                <i />
              </li>
            ))}
          </ol>
          <div className="kx5-switch-services">
            <span>Connected disciplines</span>
            <p>{problem.services}</p>
            <a href="/solutions">
              Build the route <ArrowRight />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AgencyUniverse() {
  const [active, setActive] = useState(0);
  const current = rooms[active];

  return (
    <section
      className="kx5-building"
      id="building"
      aria-labelledby="building-title"
    >
      <header className="kx5-building-head">
        <div>
          <span className="kx5-overline">A creative group, working as one</span>
          <h2 id="building-title">
            Different disciplines.
            <br />
            Shared ambition.
          </h2>
        </div>
        <p>
          A distinctive brand. A compelling campaign. A better digital
          experience. Explore the specialist disciplines that bring them together.
        </p>
      </header>
      <div className="kx5-building-shell">
        <div className="kx5-room-map" role="tablist" aria-label="Agency rooms">
          {rooms.map((item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls="room-display"
              tabIndex={active === index ? 0 : -1}
              onKeyDown={(event) =>
                moveTab(event, index, rooms.length, setActive)
              }
              id={`room-tab-${item.id}`}
              key={item.id}
              onClick={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span>0{index + 1}</span>
              <b>{item.room}</b>
              <small>{item.label}</small>
            </button>
          ))}
          <div className="kx5-building-route" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div
          className="kx5-room-display"
          id="room-display"
          role="tabpanel"
          aria-labelledby={`room-tab-${current.id}`}
        >
          <Image
            width={1600}
            height={900}
            sizes="(max-width: 800px) 100vw, 60vw"
            key={current.image}
            src={current.image}
            alt=""
          />
          <div className="kx5-room-wash" aria-hidden="true" />
          <div className="kx5-room-copy">
            <span>
              {String(active + 1).padStart(2, "0")} / 06 · {current.label}
            </span>
            <h3>{current.room}</h3>
            <p>{current.description}</p>
            <small>{current.detail}</small>
            <a href={current.href}>
              Explore this discipline <ArrowUpRight />
            </a>
          </div>
          <div className="kx5-docket" aria-hidden="true">
            <span>AV</span>
            <b>CONNECTED THINKING</b>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ClientOperatingSystem() {
  const [active, setActive] = useState(0);
  const view = osViews[active];

  return (
    <section className="kx5-os" aria-labelledby="os-title">
      <div className="kx5-os-copy">
        <span className="kx5-overline">The value of working together</span>
        <h2 id="os-title">
          One brief.
          <br />
          One plan.
          <br />
          One record.
        </h2>
        <p>
          Meetings are for decisions. Feedback is consolidated. Changes are
          priced before they move. Reports end with a recommendation.
        </p>
        <a href="/platform">
          Explore the platform <ArrowUpRight />
        </a>
      </div>
      <div className="kx5-os-interface">
        <header>
          <b>AV / CAMPAIGN 024</b>
          <span>Illustrative workspace</span>
        </header>
        <nav role="tablist" aria-label="Client platform views">
          {osViews.map((item, index) => (
            <button
              key={item.id}
              id={`os-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active === index}
              tabIndex={active === index ? 0 : -1}
              aria-controls="os-panel"
              onKeyDown={(event) =>
                moveTab(event, index, osViews.length, setActive)
              }
              onClick={() => setActive(index)}
            >
              <span>0{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div
          className="kx5-os-panel"
          id="os-panel"
          role="tabpanel"
          aria-labelledby={`os-tab-${view.id}`}
        >
          <span>{view.eyebrow}</span>
          <h3>{view.title}</h3>
          <p>{view.copy}</p>
          <ul>
            {view.status.map((item, index) => (
              <li key={item}>
                <Check />
                <b>{item}</b>
                <small>{index < 2 ? "Confirmed" : "In view"}</small>
              </li>
            ))}
          </ul>
          <footer>
            <span>EXAMPLE STATUS</span>
            <b>{view.note}</b>
            <i>Illustrative only</i>
          </footer>
        </div>
      </div>
    </section>
  );
}
