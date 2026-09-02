"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ESTIMATE_SERVICES,
  calculateEstimate,
  formatCad,
  type EstimateComplexity,
  type EstimatePace,
} from "../../lib/inquiry";
import styles from "./EstimateCalculator.module.css";

const COMPLEXITY_CHOICES: Array<{ value: EstimateComplexity; label: string; detail: string }> = [
  { value: "lean", label: "Focused", detail: "Tight scope, one primary audience" },
  { value: "standard", label: "Integrated", detail: "Multiple assets or touchpoints" },
  { value: "flagship", label: "Flagship", detail: "Original production, deeper rollout" },
];

const PACE_CHOICES: Array<{ value: EstimatePace; label: string; detail: string }> = [
  { value: "flexible", label: "Flexible", detail: "12+ weeks" },
  { value: "standard", label: "Standard", detail: "6–12 weeks" },
  { value: "accelerated", label: "Accelerated", detail: "Under 6 weeks" },
];

const ESTIMATE_STORAGE_KEY = "kingxford-project-estimate-v1";

export function EstimateCalculator() {
  const [selected, setSelected] = useState<string[]>(["brand", "campaign"]);
  const [complexity, setComplexity] = useState<EstimateComplexity>("standard");
  const [pace, setPace] = useState<EstimatePace>("standard");
  const [ready, setReady] = useState(false);
  const estimate = useMemo(
    () => calculateEstimate(selected, complexity, pace),
    [selected, complexity, pace],
  );
  const briefHref = useMemo(() => {
    const query = new URLSearchParams({
      from: "estimate",
      services: selected.join(","),
      complexity,
      pace,
    });
    return `/start-a-project?${query.toString()}`;
  }, [complexity, pace, selected]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(ESTIMATE_STORAGE_KEY);
        if (raw) {
          const stored = JSON.parse(raw) as {
            selected?: unknown;
            complexity?: unknown;
            pace?: unknown;
          };
          if (Array.isArray(stored.selected)) {
            const allowed = new Set<string>(ESTIMATE_SERVICES.map((service) => service.id));
            const restored = stored.selected.filter(
              (service): service is string => typeof service === "string" && allowed.has(service),
            );
            if (restored.length) setSelected(restored);
          }
          if (stored.complexity === "lean" || stored.complexity === "standard" || stored.complexity === "flagship") {
            setComplexity(stored.complexity);
          }
          if (stored.pace === "flexible" || stored.pace === "standard" || stored.pace === "accelerated") {
            setPace(stored.pace);
          }
        }
      } catch {
        window.localStorage.removeItem(ESTIMATE_STORAGE_KEY);
      } finally {
        setReady(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        ESTIMATE_STORAGE_KEY,
        JSON.stringify({ selected, complexity, pace }),
      );
    } catch {
      // Estimation still works when browser storage is unavailable.
    }
  }, [complexity, pace, ready, selected]);

  function toggle(service: string) {
    setSelected((current) =>
      current.includes(service) ? current.filter((item) => item !== service) : [...current, service],
    );
  }

  return (
    <div className={styles.calculator}>
      <div className={styles.controls}>
        <fieldset className={styles.section}>
          <legend className={styles.legend}>1. What needs to move together?</legend>
          <p className={styles.hint}>Select every workstream you expect to need. We remove overlap in a formal scope.</p>
          <div className={styles.serviceList}>
            {ESTIMATE_SERVICES.map((service) => (
              <label className={styles.choice} key={service.id}>
                <input
                  type="checkbox"
                  checked={selected.includes(service.id)}
                  onChange={() => toggle(service.id)}
                />
                <span>{service.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>2. How ambitious is the build?</legend>
          <div className={styles.choiceRow}>
            {COMPLEXITY_CHOICES.map((choice) => (
              <label className={styles.choice} key={choice.value}>
                <input
                  type="radio"
                  name="complexity"
                  value={choice.value}
                  checked={complexity === choice.value}
                  onChange={() => setComplexity(choice.value)}
                />
                <span>
                  <strong>{choice.label}</strong>
                  <br />
                  {choice.detail}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend className={styles.legend}>3. What is the working pace?</legend>
          <div className={styles.choiceRow}>
            {PACE_CHOICES.map((choice) => (
              <label className={styles.choice} key={choice.value}>
                <input
                  type="radio"
                  name="pace"
                  value={choice.value}
                  checked={pace === choice.value}
                  onChange={() => setPace(choice.value)}
                />
                <span>
                  <strong>{choice.label}</strong>
                  <br />
                  {choice.detail}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <aside className={styles.result} aria-live="polite">
        <p className={styles.resultKicker}>Indicative planning range</p>
        {estimate.services.length ? (
          <>
            <output className={styles.range}>
              {formatCad(estimate.low)}
              <br />– {formatCad(estimate.high)}
            </output>
            <span className={styles.currency}>CAD · PROJECT RANGE</span>
            <p className={styles.explanation}>
              A useful starting range for {estimate.services.length} connected workstream
              {estimate.services.length === 1 ? "" : "s"}. A discovery conversation turns this into a phased scope.
            </p>
            <ul className={styles.breakdown}>
              <li>
                <span>Selected scope</span>
                <strong>{estimate.services.length} workstreams</strong>
              </li>
              <li>
                <span>Build level</span>
                <strong>{COMPLEXITY_CHOICES.find((item) => item.value === complexity)?.label}</strong>
              </li>
              <li>
                <span>Pace</span>
                <strong>{PACE_CHOICES.find((item) => item.value === pace)?.label}</strong>
              </li>
            </ul>
          </>
        ) : (
          <>
            <output className={styles.range}>Select a scope</output>
            <p className={styles.explanation}>Choose at least one workstream to create an indicative range.</p>
          </>
        )}
        <Link
          aria-disabled={!estimate.services.length}
          className={styles.button}
          href={estimate.services.length ? briefHref : "/estimate"}
          onClick={(event) => {
            if (!estimate.services.length) event.preventDefault();
          }}
        >
          Turn this into a brief
        </Link>
        <p className={styles.disclaimer}>
          Planning guidance only—not a quote, offer or commitment. Taxes, paid media, talent, travel, licensing,
          third-party technology and unusually complex accessibility or localization may be additional. Final scope
          follows discovery.
        </p>
        <button
          className={styles.resetButton}
          type="button"
          onClick={() => {
            setSelected(["brand", "campaign"]);
            setComplexity("standard");
            setPace("standard");
            window.localStorage.removeItem(ESTIMATE_STORAGE_KEY);
          }}
        >
          Reset estimator
        </button>
      </aside>
    </div>
  );
}
