"use client";
import Image from "next/image";
import Link from "next/link";

import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

const studies = [
  {
    id: "after-weather",
    number: "01",
    title: "After Weather",
    sector: "Place + tourism",
    image: "/images/campaign-after-weather.webp",
    alt: "A rain-washed St. John's street at blue hour, created as an original tourism campaign concept",
    brief:
      "Make a remarkable place desirable beyond the predictable summer postcard.",
    platform: "The weather is not the obstacle. It is the invitation.",
    line: "Come for what the forecast cannot promise.",
    outputs: [
      "Launch film",
      "Street-scale outdoor",
      "Itinerary experience",
      "Search + partner media",
    ],
    measure: "Qualified visits · itinerary saves · partner referrals",
  },
  {
    id: "deep-current",
    number: "02",
    title: "Deep Current",
    sector: "Ocean technology",
    image: "/images/campaign-deep-current.webp",
    alt: "An engineer adjusting an autonomous ocean instrument, created as an original technology campaign concept",
    brief:
      "Make complex ocean capability clear enough for a buyer to remember and specific enough to trust.",
    platform: "Make the unseen capability feel physical, decisive and ready.",
    line: "Built for what the ocean does next.",
    outputs: [
      "Technical launch film",
      "Product story",
      "Account media",
      "Event + sales system",
    ],
    measure: "Demo intent · engaged accounts · specification downloads",
  },
  {
    id: "open-table",
    number: "03",
    title: "Open Table",
    sector: "Hospitality + culture",
    image: "/images/campaign-open-table.webp",
    alt: "A contemporary Newfoundland restaurant preparing for service, created as an original hospitality campaign concept",
    brief:
      "Make a distinctive experience visible without producing another interchangeable plate-and-caption feed.",
    platform: "Show the choreography before the doors open.",
    line: "The city gathers here first.",
    outputs: [
      "Brand story",
      "Short-form film",
      "Reservation journey",
      "Creator + local media",
    ],
    measure: "Reservation quality · return visits · earned reach",
  },
] as const;

export function CampaignStudies() {
  const [active, setActive] = useState(0);
  const study = studies[active];
  const move = (direction: number) =>
    setActive(
      (current) => (current + direction + studies.length) % studies.length,
    );
  const handleTabKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = (index + 1) % studies.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      next = (index - 1 + studies.length) % studies.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = studies.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    document.getElementById(`study-tab-${studies[next].id}`)?.focus();
  };

  return (
    <section className="kx5-studies" id="work" aria-labelledby="work-title">
      <header className="kx5-studies-head">
        <div>
          <span className="kx5-overline">
            SELECTED CREATIVE EXPLORATIONS
          </span>
          <h2 id="work-title">
            A point of view.
            <br />
            <em>A world of possibility.</em>
          </h2>
        </div>
        <p>
          Self-initiated campaign concepts exploring how strategy becomes
          visual storytelling. These are independent capability studies,
          not commissioned client work or reported campaign results.
          <Link className="button button-dark" href="/projects" style={{ marginTop: 24 }}>
            View completed projects <ArrowUpRight size={18} aria-hidden="true" />
          </Link>
        </p>
      </header>

      <div className="kx5-study">
        <div
          className="kx5-study-image"
          role="tabpanel"
          id="study-panel"
          aria-labelledby={`study-tab-${study.id}`}
        >
          <Image
            width={1600}
            height={900}
            sizes="(max-width: 800px) 100vw, 60vw"
            key={study.image}
            src={study.image}
            alt={study.alt}
          />
          <div className="kx5-study-image-caption">
            <span>AV / CONCEPT {study.number}</span>
            <strong>{study.line}</strong>
            <small>Synthetic visual · Independent capability study</small>
          </div>
          <div className="kx5-study-format" aria-hidden="true">
            <span>FILM</span>
            <span>STREET</span>
            <span>SOCIAL</span>
            <span>DIGITAL</span>
          </div>
        </div>

        <aside className="kx5-study-brief">
          <header>
            <span>
              {study.number} / 03 · {study.sector}
            </span>
            <div>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous concept"
              >
                <ArrowLeft />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next concept"
              >
                <ArrowRight />
              </button>
            </div>
          </header>
          <h3>{study.title}</h3>
          <dl>
            <div>
              <dt>The brief</dt>
              <dd>{study.brief}</dd>
            </div>
            <div>
              <dt>The platform</dt>
              <dd>{study.platform}</dd>
            </div>
            <div>
              <dt>The system</dt>
              <dd>
                <ol>
                  {study.outputs.map((output) => (
                    <li key={output}>{output}</li>
                  ))}
                </ol>
              </dd>
            </div>
            <div>
              <dt>We would measure</dt>
              <dd>{study.measure}</dd>
            </div>
          </dl>
          <a href="/start">
            Build the real brief <ArrowUpRight />
          </a>
        </aside>
      </div>

      <div
        className="kx5-study-tabs"
        role="tablist"
        aria-label="Concept studies"
      >
        {studies.map((item, index) => (
          <button
            id={`study-tab-${item.id}`}
            type="button"
            role="tab"
            aria-selected={index === active}
            aria-controls="study-panel"
            tabIndex={index === active ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => handleTabKey(event, index)}
            key={item.id}
          >
            <span>{item.number}</span>
            <b>{item.title}</b>
            <small>{item.sector}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
