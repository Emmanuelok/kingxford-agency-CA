"use client";

import { ArrowDown, ArrowUpRight, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const mediaRoot =
  process.env.NEXT_PUBLIC_KINGXFORD_MEDIA_ROOT ??
  "https://raw.githubusercontent.com/Emmanuelok/kingxford-agency-CA/main/public/video";

const films = {
  desktop: `${mediaRoot}/kingxford-original-hero.mp4`,
  mobile: `${mediaRoot}/kingxford-original-hero-mobile.mp4`,
};

const beats = [
  ["01", "Find the reason", "Research / strategy"],
  ["02", "Build the idea", "Brand / campaigns"],
  ["03", "Make it physical", "Film / design / motion"],
  ["04", "Put it everywhere", "Media / social / web"],
  ["05", "See what moved", "Data / optimization"],
] as const;

export function ScrollCinema() {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const frozenRef = useRef(false);
  const [frozen, setFrozen] = useState(false);

  const toggleFrozen = () => {
    frozenRef.current = !frozenRef.current;
    setFrozen(frozenRef.current);
    if (!frozenRef.current) {
      window.requestAnimationFrame(() =>
        window.dispatchEvent(new Event("scroll")),
      );
    }
  };

  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!section || !sticky || !video || !progressBar) return;

    const reduceQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce), (max-height: 620px)",
    );
    const mobileQuery = window.matchMedia(
      "(max-width: 760px), (max-aspect-ratio: 3/4)",
    );
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;

    if (
      reduceQuery.matches ||
      connection?.saveData ||
      connection?.effectiveType?.includes("2g")
    ) {
      section.dataset.static = "true";
      return;
    }

    let sectionStart = 0;
    let travel = 1;
    let raf = 0;
    let visible = true;
    let progress = 0;
    let selectedFilm = "";

    const selectFilm = () => {
      const nextFilm = mobileQuery.matches ? films.mobile : films.desktop;
      if (nextFilm === selectedFilm) return;
      selectedFilm = nextFilm;
      video.dataset.ready = "false";
      video.src = nextFilm;
      video.load();
    };

    const measure = () => {
      const rect = section.getBoundingClientRect();
      sectionStart = window.scrollY + rect.top;
      travel = Math.max(1, section.offsetHeight - sticky.offsetHeight);
    };

    const seek = () => {
      if (
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !Number.isFinite(video.duration) ||
        video.duration <= 0
      ) {
        return;
      }
      const target = Math.min(
        Math.max(0, video.duration - 1 / 24),
        progress * video.duration,
      );
      if (Math.abs(video.currentTime - target) > 1 / 48) {
        video.currentTime = target;
      }
    };

    const render = () => {
      raf = 0;
      if (!visible || reduceQuery.matches || frozenRef.current) return;
      progress = Math.min(
        1,
        Math.max(0, (window.scrollY - sectionStart) / travel),
      );
      section.dataset.scene = String(Math.min(6, Math.floor(progress * 7)));
      progressBar.style.transform = `scaleX(${progress})`;
      seek();
    };

    const schedule = () => {
      if (!raf) raf = window.requestAnimationFrame(render);
    };

    const resize = () => {
      measure();
      selectFilm();
      schedule();
    };

    const ready = () => {
      video.dataset.ready = "true";
      video.pause();
      seek();
    };

    const failed = () => {
      section.dataset.loadError = "true";
      video.dataset.ready = "false";
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "80% 0px" },
    );

    video.addEventListener("loadeddata", ready);
    video.addEventListener("error", failed);
    observer.observe(section);
    measure();
    selectFilm();
    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    mobileQuery.addEventListener("change", resize);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", resize);
      mobileQuery.removeEventListener("change", resize);
      video.removeEventListener("loadeddata", ready);
      video.removeEventListener("error", failed);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      className="kx5-cinema"
      id="main-content"
      ref={sectionRef}
      data-scene="0"
      data-static="false"
      aria-describedby="cinema-description"
    >
      <p className="sr-only" id="cinema-description">
        Scroll controls an original synthetic campaign film. One red project
        signal travels from research through creative production, media, digital
        experience and measurement.
      </p>
      <div className="kx5-cinema-sticky" ref={stickyRef}>
        <img
          className="kx5-cinema-poster"
          src="/images/hero-research-wall.webp"
          alt=""
          decoding="async"
        />
        <video
          className="kx5-cinema-film"
          ref={videoRef}
          aria-hidden="true"
          muted
          playsInline
          preload="auto"
          poster="/images/hero-research-wall.webp"
          crossOrigin="anonymous"
        />
        <div className="kx5-cinema-grade" aria-hidden="true" />

        <div className="kx5-address">
          <span>KINGXFORD / ST. JOHN&apos;S, NL</span>
          <span>47.5615° N / 52.7126° W</span>
          <span>Independent integrated agency</span>
        </div>

        <div className="kx5-title-beat">
          <span className="kx5-overline">The whole agency, in motion</span>
          <h1>
            Move the thing
            <br />
            that matters.
          </h1>
          <p>
            Strategy, identity, campaigns, film, social, media and digital—built
            around one commercial outcome.
          </p>
          <div className="kx5-hero-actions">
            <a href="#building">
              Enter the agency <ArrowDown />
            </a>
            <a href="/start">
              Bring the brief <ArrowUpRight />
            </a>
          </div>
        </div>

        <div className="kx5-beat-stack" aria-live="polite">
          {beats.map(([number, title, label], index) => (
            <div className={`kx5-film-beat beat-${index + 1}`} key={number}>
              <span>{number} / 05</span>
              <h2>{title}</h2>
              <p>{label}</p>
            </div>
          ))}
        </div>

        <div className="kx5-final-beat">
          <span>One accountable system</span>
          <h2>
            Nothing gets
            <br />
            lost in the handoff.
          </h2>
          <a href="#building">
            See every room <ArrowDown />
          </a>
        </div>

        <ol className="kx5-route" aria-hidden="true">
          {beats.map(([number, , label], index) => (
            <li className={`route-${index + 1}`} key={number}>
              <i />
              {label.split(" / ")[0]}
            </li>
          ))}
        </ol>

        <div className="kx5-cinema-controls">
          <span>Scroll to operate the film</span>
          <button
            type="button"
            onClick={toggleFrozen}
            aria-pressed={frozen}
          >
            {frozen ? <Play /> : <Pause />} {frozen ? "Resume" : "Hold"}
          </button>
          <i aria-hidden="true">
            <span ref={progressRef} />
          </i>
          <a href="#building">Skip</a>
        </div>
      </div>
    </section>
  );
}
