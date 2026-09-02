"use client";

import { ArrowRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import { useState } from "react";

const problems = [
  {
    id: "launch",
    label: "Launch",
    title: "Make the market understand something new.",
    outcome: "A launch people can explain, remember and act on.",
    path: ["Evidence", "Positioning", "Campaign platform", "Production", "Media", "Readout"],
    services: "Research · Strategy · Identity · Campaigns · Film · Web · Media",
  },
  {
    id: "grow",
    label: "Grow",
    title: "Turn scattered attention into steady demand.",
    outcome: "A connected acquisition system with a clearer offer and less wasted motion.",
    path: ["Offer", "Journey", "Content engine", "Search + social", "Conversion", "Optimization"],
    services: "Growth strategy · Content · Paid media · SEO · CRM · CRO · Analytics",
  },
  {
    id: "clarify",
    label: "Clarify",
    title: "Make a complex company easier to choose.",
    outcome: "A sharper story without losing the intelligence that makes the business credible.",
    path: ["Interviews", "Narrative", "Identity system", "Sales story", "Product web", "Enablement"],
    services: "Research · Brand strategy · Verbal identity · Design · Film · Digital",
  },
  {
    id: "enter",
    label: "Expand",
    title: "Enter a new market without becoming generic.",
    outcome: "A repeatable national system with evidence and adaptation built into every city.",
    path: ["Market signal", "Local tension", "Core platform", "Adaptation", "Launch", "Learning"],
    services: "Market intelligence · Creative adaptation · Partnerships · Media · Measurement",
  },
] as const;

const rooms = [
  {
    id: "briefing",
    room: "The Briefing Room",
    label: "Strategy & research",
    description: "Turns business pressure, audience evidence and category context into a brief clear enough to guide every decision.",
    detail: "Research · positioning · naming · audience · communications planning · workshops",
    href: "/services#strategy",
    image: "/images/hero-harbour.webp",
  },
  {
    id: "identity",
    room: "The Identity Room",
    label: "Brand systems",
    description: "Creates the language and visual system that make a company recognizable, usable and difficult to misapply.",
    detail: "Identity · verbal system · design language · toolkits · governance",
    href: "/services#brand",
    image: "/images/campaign-after-weather.webp",
  },
  {
    id: "campaign",
    room: "The Campaign Room",
    label: "Advertising & creative",
    description: "Builds one campaign platform with enough range to carry a launch, a year of communication and the sales moments between them.",
    detail: "Concepts · art direction · copy · TV · OOH · audio · social · activation",
    href: "/services#campaigns",
    image: "/images/campaign-deep-current.webp",
  },
  {
    id: "production",
    room: "The Production Floor",
    label: "Film, content & motion",
    description: "Turns the approved idea into finished film, photography, audio, motion and channel-ready content while the intent remains intact.",
    detail: "Direction · film · photography · motion · post · versioning · creator production",
    href: "/studio",
    image: "/images/commercial-production.webp",
  },
  {
    id: "signal",
    room: "The Signal Room",
    label: "Digital, media & growth",
    description: "Routes the work through websites, search, social, media and CRM—then reads the response and improves the next move.",
    detail: "Web · product · social · SEO · paid media · CRM · analytics · optimization",
    href: "/services#digital",
    image: "/images/sector-studio.webp",
  },
  {
    id: "dispatch",
    room: "The Dispatch",
    label: "Client OS & delivery",
    description: "Keeps the objective, scope, owners, timing, approvals, spend and next decisions visible in one accountable record.",
    detail: "Briefs · plans · reviews · approvals · finance · reporting · next actions",
    href: "/platform",
    image: "/images/campaign-open-table.webp",
  },
] as const;

const osViews = [
  {
    id: "brief",
    label: "Brief",
    eyebrow: "The agreed starting point",
    title: "One outcome. Four facts. No theatre.",
    copy: "The audience, required action, proposition and proof are agreed before making begins. Assumptions stay visible until evidence replaces them.",
    status: ["Business outcome", "Primary audience", "Proposition", "Evidence standard"],
    note: "Brief locked · 4 owners signed",
  },
  {
    id: "plan",
    label: "Plan",
    eyebrow: "The working route",
    title: "Every dependency has an owner.",
    copy: "Deliverables, decisions, production windows, media dates and risks share one live plan, with the critical path visible to both teams.",
    status: ["Creative route", "Production window", "Channel plan", "Launch dependencies"],
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
    title: "A recommendation, not a data dump.",
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
        <span className="kx5-overline">Start with the pressure, not a shopping list</span>
        <h2 id="switchboard-title">What has to move?</h2>
        <p>The answer changes the agency we assemble. Responsibility does not.</p>
      </header>
      <div className="kx5-switch-layout">
        <div className="kx5-switch-tabs" role="tablist" aria-label="Choose a business objective">
          {problems.map((item, index) => (
            <button
              id={`problem-tab-${item.id}`}
              role="tab"
              aria-selected={active === index}
              aria-controls="problem-panel"
              type="button"
              onClick={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              key={item.id}
            >
              <span>0{index + 1}</span>
              <b>{item.label}</b>
              <ChevronRight />
            </button>
          ))}
        </div>
        <div className="kx5-switch-panel" id="problem-panel" role="tabpanel" aria-labelledby={`problem-tab-${problem.id}`}>
          <div className="kx5-switch-answer">
            <span>Desired change</span>
            <h3>{problem.title}</h3>
            <p>{problem.outcome}</p>
          </div>
          <ol className="kx5-path">
            {problem.path.map((step, index) => <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><b>{step}</b><i /></li>)}
          </ol>
          <div className="kx5-switch-services">
            <span>Likely rooms</span>
            <p>{problem.services}</p>
            <a href="/solutions">Build the route <ArrowRight /></a>
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
    <section className="kx5-building" id="building" aria-labelledby="building-title">
      <header className="kx5-building-head">
        <div>
          <span className="kx5-overline">The working cutaway</span>
          <h2 id="building-title">Six rooms.<br />One brief.</h2>
        </div>
        <p>Enter through any room. The project docket moves between them; the objective and accountability stay in one place.</p>
      </header>
      <div className="kx5-building-shell">
        <div className="kx5-room-map" role="tablist" aria-label="Agency rooms">
          {rooms.map((item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={active === index}
              aria-controls="room-display"
              id={`room-tab-${item.id}`}
              key={item.id}
              onClick={() => setActive(index)}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
            >
              <span>0{index + 1}</span>
              <b>{item.room}</b>
              <small>{item.label}</small>
            </button>
          ))}
          <div className="kx5-building-route" aria-hidden="true"><i /><i /><i /></div>
        </div>
        <div className="kx5-room-display" id="room-display" role="tabpanel" aria-labelledby={`room-tab-${current.id}`}>
          <img key={current.image} src={current.image} alt="" />
          <div className="kx5-room-wash" aria-hidden="true" />
          <div className="kx5-room-copy">
            <span>{String(active + 1).padStart(2, "0")} / 06 · {current.label}</span>
            <h3>{current.room}</h3>
            <p>{current.description}</p>
            <small>{current.detail}</small>
            <a href={current.href}>Enter this room <ArrowUpRight /></a>
          </div>
          <div className="kx5-docket" aria-hidden="true"><span>KX</span><b>PROJECT / LIVE</b><i /></div>
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
        <span className="kx5-overline">KINGXFORD client operating system</span>
        <h2 id="os-title">One brief.<br />One plan.<br />One record.</h2>
        <p>Meetings are for decisions. Feedback is consolidated. Changes are priced before they move. Reports end with a recommendation.</p>
        <a href="/platform">Explore the platform <ArrowUpRight /></a>
      </div>
      <div className="kx5-os-interface">
        <header><b>KX / CAMPAIGN 024</b><span>Illustrative workspace</span></header>
        <nav role="tablist" aria-label="Client platform views">
          {osViews.map((item, index) => (
            <button key={item.id} type="button" role="tab" aria-selected={active === index} aria-controls="os-panel" onClick={() => setActive(index)}>
              <span>0{index + 1}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="kx5-os-panel" id="os-panel" role="tabpanel">
          <span>{view.eyebrow}</span>
          <h3>{view.title}</h3>
          <p>{view.copy}</p>
          <ul>
            {view.status.map((item, index) => <li key={item}><Check /><b>{item}</b><small>{index < 2 ? "Confirmed" : "In view"}</small></li>)}
          </ul>
          <footer><span>STATUS</span><b>{view.note}</b><i>Updated now</i></footer>
        </div>
      </div>
    </section>
  );
}
