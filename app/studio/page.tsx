import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WORKSPACE_ENABLED } from "@/lib/release";
import {
  ArrowUpRight,
  Aperture,
  AudioLines,
  Box,
  Camera,
  Clapperboard,
  Mic2,
  Plane,
  RadioTower,
} from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { WorkspaceLaunchpad } from "@/components/agency-interface";

export const metadata: Metadata = {
  alternates: { canonical: "/studio" },
  robots: { index: WORKSPACE_ENABLED, follow: WORKSPACE_ENABLED },
  title: "Production Studio",
  description:
    "Campaign film, photography, motion, 3D, audio, live and high-volume content production—connected directly to strategy and media.",
};
const production = [
  [
    Clapperboard,
    "Commercial film",
    "TV, CTV, brand films, documentaries, testimonials and campaign video.",
  ],
  [
    Camera,
    "Photography",
    "Product, food, fashion, hospitality, property, portraits and campaign stills.",
  ],
  [
    Aperture,
    "Post-production",
    "Editing, colour, retouching, sound design, versioning and localization.",
  ],
  [
    Box,
    "Motion, CGI & 3D",
    "Animation, explainers, product visualization, VFX and virtual environments.",
  ],
  [
    Mic2,
    "Audio & voice",
    "Radio, podcast, voiceover, sonic identity, music supervision and mixing.",
  ],
  [
    Plane,
    "Aerial & location",
    "Drone through qualified operators, field units and province-wide production planning.",
  ],
  [
    RadioTower,
    "Live & experiential",
    "Livestreams, event coverage, screens, launches, activations and hybrid production.",
  ],
  [
    AudioLines,
    "Content supply",
    "One-day shoots, high-volume social assets, creator direction and channel adaptations.",
  ],
];
export default function StudioPage() {
  if (!WORKSPACE_ENABLED) notFound();
  return (
    <main className="site-shell">
      <SiteNav />
      <PageHero
        index="04"
        eyebrow="AVALON STUDIO / PRODUCTION & CRAFT"
        title="Put the idea"
        accent="in motion."
        description="Strategy and production should not live in different rooms. We develop the idea with the people who must eventually shoot, edit, adapt and distribute it."
      />
      <section className="workspace-entry">
        <div>
          <b>Production planning is now connected.</b>
          <p>
            Build your shot list, delivery formats and owned production
            checklist from one brief.
          </p>
        </div>
        <a href="/studio/workbench">
          Open production workbench <ArrowUpRight />
        </a>
      </section>
      <section className="cinema-frame">
        <Image
          width={1600}
          height={900}
          sizes="(max-width: 800px) 100vw, 60vw"
          src="/images/commercial-production.webp"
          alt="Concept image of a commercial production crew shaping light and product detail on set"
        />
        <div className="cinema-label">
          <span>AV / STUDIO / 001</span>
          <b>
            Made to stop the scroll.
            <br />
            Built to survive every format.
          </b>
        </div>
      </section>
      <section className="production-grid content-section">
        {production.map(([Icon, title, desc], i) => {
          const I = Icon as typeof Camera;
          return (
            <article key={String(title)}>
              <span>0{i + 1}</span>
              <I strokeWidth={1} />
              <h2>{String(title)}</h2>
              <p>{String(desc)}</p>
            </article>
          );
        })}
      </section>
      <WorkspaceLaunchpad compact />
      <section className="production-process content-section coral-block">
        <div className="section-kicker">
          <span>05</span> FROM BRIEF TO MASTER
        </div>
        <h2>
          No mystery
          <br />
          between idea and output.
        </h2>
        <div className="process-steps dark-text">
          {[
            "Treatment",
            "Pre-production",
            "Capture",
            "Post",
            "Adapt",
            "Deliver",
          ].map((x, i) => (
            <div key={x}>
              <span>0{i + 1}</span>
              <b>{x}</b>
            </div>
          ))}
        </div>
        <a className="button button-dark" href="/start">
          Scope a production <ArrowUpRight />
        </a>
      </section>
      <SiteFooter />
    </main>
  );
}
