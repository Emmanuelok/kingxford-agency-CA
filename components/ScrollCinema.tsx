"use client";

import Link from "next/link";
import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

type ScrollCinemaProps = {
  mobileVideoUrl?: string;
  posterUrl: string;
  videoUrl?: string;
};

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return true;
}

export function ScrollCinema({ mobileVideoUrl, posterUrl, videoUrl }: ScrollCinemaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const durationRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const reduceMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduceMotion) return;

    const update = () => {
      frameRef.current = null;
      const distance = Math.max(section.offsetHeight - window.innerHeight, 1);
      const nextProgress = Math.min(Math.max(-section.getBoundingClientRect().top / distance, 0), 1);
      setProgress(nextProgress);

      const video = videoRef.current;
      if (video && durationRef.current > 0) {
        const target = nextProgress * Math.max(durationRef.current - 0.06, 0);
        if (Math.abs(video.currentTime - target) > 0.025) video.currentTime = target;
      }
    };

    const requestUpdate = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [reduceMotion]);

  const stage = reduceMotion ? 0 : progress < 0.36 ? 0 : progress < 0.72 ? 1 : 2;

  return (
    <section className="cinema" ref={sectionRef} aria-label="KINGXFORD introduction">
      <div className="cinema__sticky">
        <div className="cinema__media" style={{ backgroundImage: `url(${posterUrl})` }}>
          {videoUrl && !reduceMotion ? (
            <video
              aria-hidden="true"
              className={videoReady ? "is-ready" : ""}
              muted
              playsInline
              poster={posterUrl}
              preload="auto"
              ref={videoRef}
              onLoadedMetadata={(event) => {
                durationRef.current = event.currentTarget.duration;
                setVideoReady(true);
              }}
            >
              {mobileVideoUrl ? <source media="(max-width: 767px)" src={mobileVideoUrl} type="video/mp4" /> : null}
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : null}
        </div>
        <div className="cinema__veil" />
        <div className="cinema__grain" aria-hidden="true" />
        <div className="cinema__signal" aria-hidden="true" style={{ transform: `scaleX(${Math.max(progress, 0.02)})` }} />

        <div className="shell cinema__content">
          <div className="cinema__location">
            <span aria-hidden="true" />
            Independent creative and growth agency
          </div>

          <div className="cinema__stages">
            <div className={`cinema__stage ${stage === 0 ? "is-active" : ""}`} aria-hidden={stage !== 0}>
              <p className="cinema__kicker">St. John’s · Newfoundland and Labrador</p>
              <h1>Make the market<br />feel you.</h1>
              <p className="cinema__intro">
                Strategy, cinematic production, digital products, media and search—built as one accountable growth system.
              </p>
            </div>
            <div className={`cinema__stage cinema__stage--middle ${stage === 1 ? "is-active" : ""}`} aria-hidden={stage !== 1}>
              <p className="cinema__kicker">One connected operating system</p>
              <h2>From first signal<br />to lasting demand.</h2>
              <div className="cinema__disciplines">
                <span>Strategy</span><span>Creative</span><span>Production</span><span>Growth</span>
              </div>
            </div>
            <div className={`cinema__stage cinema__stage--final ${stage === 2 ? "is-active" : ""}`} aria-hidden={stage !== 2}>
              <p className="cinema__kicker">Newfoundland-born · Canada-bound</p>
              <h2>Build something<br />impossible to ignore.</h2>
              <div className="cinema__actions">
                <Link className="button button--primary" href="/start-a-project">
                  Start a project <ArrowUpRight aria-hidden="true" />
                </Link>
                <Link className="button button--glass" href="/work">
                  <Play aria-hidden="true" /> Explore the work
                </Link>
              </div>
            </div>
          </div>

          <div className="cinema__footer">
            <div className="cinema__scroll">
              <ArrowDown aria-hidden="true" />
              <span>Scroll to direct</span>
            </div>
            <div className="cinema__counter">
              <small>AI-assisted film</small>
              <span>0{stage + 1}</span> / 03
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
