"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BUDGET_OPTIONS,
  SERVICE_OPTIONS,
  TIMELINE_OPTIONS,
  inquiryToText,
  type InquiryPayload,
} from "../../lib/inquiry";
import {
  EMPTY_PROJECT_BRIEF,
  briefFromEstimate,
  parseSavedBrief,
} from "../../lib/briefDraft";
import styles from "./BriefBuilder.module.css";

const STORAGE_KEY = "kingxford-project-brief-v1";
const STEP_NAMES = ["Ambition", "Scope", "Parameters", "Contact"];
const ERROR_TARGETS: Record<string, string> = {
  organization: "brief-organization",
  projectSummary: "brief-summary",
  services: "brief-service-0",
  budget: "brief-budget",
  timeline: "brief-timeline",
  name: "brief-name",
  email: "brief-email",
  consent: "brief-consent",
};

function ErrorMessage({ message, id }: { message?: string; id: string }) {
  return message ? (
    <p className={styles.error} id={id} role="alert">
      {message}
    </p>
  ) : null;
}

export function BriefBuilder({ deliveryConfigured }: { deliveryConfigured: boolean }) {
  const [step, setStep] = useState(0);
  const [brief, setBrief] = useState<InquiryPayload>(EMPTY_PROJECT_BRIEF);
  const [ready, setReady] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [estimateLoaded, setEstimateLoaded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        const imported = briefFromEstimate(new URLSearchParams(window.location.search));
        let storedBrief: InquiryPayload | null = null;
        if (saved) {
          storedBrief = parseSavedBrief(saved);
          if (!storedBrief) {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        }
        if (imported) {
          setBrief({
            ...imported,
            name: storedBrief?.name ?? imported.name,
            email: storedBrief?.email ?? imported.email,
            phone: storedBrief?.phone ?? imported.phone,
            organization: storedBrief?.organization ?? imported.organization,
            role: storedBrief?.role ?? imported.role,
            sector: storedBrief?.sector ?? imported.sector,
            location: storedBrief?.location ?? imported.location,
          });
          setEstimateLoaded(true);
        } else if (storedBrief) {
          setBrief(storedBrief);
          setResumed(true);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setReady(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || success) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), brief }));
    } catch {
      // The form remains fully usable when storage is blocked; export controls preserve the draft.
    }
  }, [brief, ready, success]);

  const percent = ((step + 1) / STEP_NAMES.length) * 100;
  const selectedSummary = useMemo(
    () => brief.services.length ? brief.services.join(", ") : "No capabilities selected yet",
    [brief.services],
  );

  function focusFirstError(nextErrors: Record<string, string>) {
    const targetId = Object.keys(nextErrors).map((field) => ERROR_TARGETS[field]).find(Boolean);
    if (!targetId) return false;
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
    return true;
  }

  function update<K extends keyof InquiryPayload>(field: K, value: InquiryPayload[K]) {
    setBrief((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function toggleService(service: string) {
    update(
      "services",
      brief.services.includes(service)
        ? brief.services.filter((item) => item !== service)
        : [...brief.services, service],
    );
  }

  function validateStep(currentStep: number): boolean {
    const nextErrors: Record<string, string> = {};
    if (currentStep === 0) {
      if (!brief.organization.trim()) nextErrors.organization = "Enter your organization name.";
      if (brief.projectSummary.trim().length < 30) {
        nextErrors.projectSummary = "Give us at least 30 characters of context.";
      }
    }
    if (currentStep === 1 && brief.services.length === 0) {
      nextErrors.services = "Choose at least one capability—or select the closest fit.";
    }
    if (currentStep === 2) {
      if (!brief.budget) nextErrors.budget = "Select the closest planning range.";
      if (!brief.timeline) nextErrors.timeline = "Select the closest timeline.";
    }
    if (currentStep === 3) {
      if (!brief.name.trim()) nextErrors.name = "Tell us who we should speak with.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(brief.email)) {
        nextErrors.email = "Enter a valid work email address.";
      }
      if (!brief.consent) nextErrors.consent = "Consent is required so we can respond.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setStatus("There are a few details to complete before continuing.");
      focusFirstError(nextErrors);
      return false;
    }
    setStatus("");
    return true;
  }

  function nextStep() {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(STEP_NAMES.length - 1, current + 1));
    window.scrollTo({ top: Math.max(0, window.scrollY - 120), behavior: "smooth" });
  }

  function previousStep() {
    setErrors({});
    setStatus("");
    setStep((current) => Math.max(0, current - 1));
  }

  function clearDraft() {
    window.localStorage.removeItem(STORAGE_KEY);
    setBrief(EMPTY_PROJECT_BRIEF);
    setStep(0);
    setErrors({});
    setResumed(false);
    setEstimateLoaded(false);
    setStatus("Saved draft cleared from this browser.");
    setSuccess(false);
  }

  async function copyBrief() {
    const text = inquiryToText(brief);
    try {
      await navigator.clipboard.writeText(text);
      setStatus("Brief copied to your clipboard.");
    } catch {
      setStatus("Copy was blocked by your browser. Download the text file instead.");
    }
  }

  function downloadBrief() {
    const blob = new Blob([inquiryToText(brief)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "kingxford-project-brief.txt";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("A copy of your brief has been downloaded.");
  }

  async function submitBrief(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliveryConfigured) {
      setStatus("Online delivery is not enabled yet. Download or copy the brief so no work is lost.");
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    if (!validateStep(3)) return;
    setSubmitting(true);
    setStatus("Sending your brief securely…");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(brief),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setStatus(
          result.message ?? "The brief could not be delivered. Download a copy so no work is lost.",
        );
        setSuccess(false);
        if (result.errors && focusFirstError(result.errors)) return;
      } else {
        setStatus(result.message ?? "Your brief has been received.");
        setSuccess(true);
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      setStatus("The connection failed. Your draft is still saved; download a copy or try again.");
      setSuccess(false);
    } finally {
      setSubmitting(false);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.rail} aria-label="Brief progress">
        <p className={styles.railTitle}>Project brief</p>
        <progress className={styles.progress} max="100" value={percent}>
          {percent}% complete
        </progress>
        <ol className={styles.steps}>
          {STEP_NAMES.map((name, index) => (
            <li
              className={`${styles.step} ${index === step ? styles.stepActive : ""}`}
              aria-current={index === step ? "step" : undefined}
              key={name}
            >
              <span className={styles.stepNumber}>{index + 1}</span>
              <span>{name}</span>
            </li>
          ))}
        </ol>
        <p className={styles.saveNote}>
          {resumed
            ? "Draft restored on this device."
            : estimateLoaded
              ? "Your estimator choices are loaded and remain editable."
              : "Your draft saves in this browser for up to seven days."}
        </p>
      </aside>

      <form className={styles.form} onSubmit={submitBrief} noValidate>
        <div className={styles.panel}>
          {step === 0 ? (
            <>
              <p className={styles.kicker}>01 / The ambition</p>
              <h2 className={styles.heading}>What are we trying to change?</h2>
              <p className={styles.description}>
                Start with the business reality. A sharp brief gives us more room to think, make and move.
              </p>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="brief-organization">Organization</label>
                  <input
                    className={styles.input}
                    id="brief-organization"
                    value={brief.organization}
                    onChange={(event) => update("organization", event.target.value)}
                    aria-describedby={errors.organization ? "brief-organization-error" : undefined}
                    aria-invalid={Boolean(errors.organization)}
                    autoComplete="organization"
                    required
                  />
                  <ErrorMessage id="brief-organization-error" message={errors.organization} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-sector">
                    Sector <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    className={styles.input}
                    id="brief-sector"
                    value={brief.sector}
                    onChange={(event) => update("sector", event.target.value)}
                    placeholder="Ocean tech, tourism, retail…"
                  />
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="brief-summary">Project context</label>
                  <textarea
                    className={styles.textarea}
                    id="brief-summary"
                    value={brief.projectSummary}
                    onChange={(event) => update("projectSummary", event.target.value)}
                    placeholder="What is happening, what is not working, and why now?"
                    aria-describedby={`brief-summary-help${errors.projectSummary ? " brief-summary-error" : ""}`}
                    aria-invalid={Boolean(errors.projectSummary)}
                    required
                  />
                  <p className={styles.help} id="brief-summary-help">
                    Include any launch, market, sales, recruitment or reputation context that matters.
                  </p>
                  <ErrorMessage id="brief-summary-error" message={errors.projectSummary} />
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="brief-outcome">
                    One outcome that would make this a win <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="brief-outcome"
                    value={brief.outcome}
                    onChange={(event) => update("outcome", event.target.value)}
                    placeholder="For example: qualified pipeline, bookings, market entry, talent applications…"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className={styles.kicker}>02 / The scope</p>
              <h2 className={styles.heading}>Build the right operating team.</h2>
              <p className={styles.description}>
                Choose every capability that may be useful. We will recommend what belongs in phase one.
              </p>
              <fieldset
                aria-describedby={errors.services ? "brief-services-error" : undefined}
                aria-invalid={Boolean(errors.services)}
                aria-required="true"
                className={styles.field}
              >
                <legend className={styles.legend}>Capabilities</legend>
                <div className={styles.checkboxGrid}>
                  {SERVICE_OPTIONS.map((service, index) => (
                    <label className={styles.checkCard} key={service}>
                      <input
                        id={`brief-service-${index}`}
                        name="services"
                        type="checkbox"
                        checked={brief.services.includes(service)}
                        onChange={() => toggleService(service)}
                      />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
                <ErrorMessage id="brief-services-error" message={errors.services} />
              </fieldset>
              <div className={styles.grid} style={{ marginTop: "1.5rem" }}>
                <div className={`${styles.field} ${styles.full}`}>
                  <label htmlFor="brief-audience">
                    Priority audience <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="brief-audience"
                    value={brief.audience}
                    onChange={(event) => update("audience", event.target.value)}
                    placeholder="Who needs to notice, believe or act?"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-deliverables">
                    Known deliverables <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="brief-deliverables"
                    value={brief.deliverables}
                    onChange={(event) => update("deliverables", event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-channels">
                    Priority channels <span className={styles.optional}>optional</span>
                  </label>
                  <textarea
                    className={styles.textarea}
                    id="brief-channels"
                    value={brief.channels}
                    onChange={(event) => update("channels", event.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className={styles.kicker}>03 / The parameters</p>
              <h2 className={styles.heading}>Give ambition a useful frame.</h2>
              <p className={styles.description}>
                These are planning inputs, not commitments. Candour helps us shape the strongest route.
              </p>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="brief-budget">Indicative budget in CAD</label>
                  <select
                    className={styles.select}
                    id="brief-budget"
                    value={brief.budget}
                    onChange={(event) => update("budget", event.target.value)}
                    aria-describedby={errors.budget ? "brief-budget-error" : undefined}
                    aria-invalid={Boolean(errors.budget)}
                    required
                  >
                    <option value="">Select a range</option>
                    {BUDGET_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <ErrorMessage id="brief-budget-error" message={errors.budget} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-timeline">Decision or launch horizon</label>
                  <select
                    className={styles.select}
                    id="brief-timeline"
                    value={brief.timeline}
                    onChange={(event) => update("timeline", event.target.value)}
                    aria-describedby={errors.timeline ? "brief-timeline-error" : undefined}
                    aria-invalid={Boolean(errors.timeline)}
                    required
                  >
                    <option value="">Select a timeline</option>
                    {TIMELINE_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                  <ErrorMessage id="brief-timeline-error" message={errors.timeline} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-start">
                    Preferred start <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    className={styles.input}
                    id="brief-start"
                    type="date"
                    value={brief.startDate}
                    onChange={(event) => update("startDate", event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-location">
                    Market or location <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    className={styles.input}
                    id="brief-location"
                    value={brief.location}
                    onChange={(event) => update("location", event.target.value)}
                    placeholder="St. John’s, Atlantic Canada, national…"
                  />
                </div>
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className={styles.kicker}>04 / The handoff</p>
              <h2 className={styles.heading}>Who should we build this with?</h2>
              <p className={styles.description}>
                You selected: {selectedSummary}. We will review the whole brief before responding.
              </p>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label htmlFor="brief-name">Your name</label>
                  <input
                    className={styles.input}
                    id="brief-name"
                    value={brief.name}
                    onChange={(event) => update("name", event.target.value)}
                    autoComplete="name"
                    aria-describedby={errors.name ? "brief-name-error" : undefined}
                    aria-invalid={Boolean(errors.name)}
                    required
                  />
                  <ErrorMessage id="brief-name-error" message={errors.name} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-role">
                    Role <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    className={styles.input}
                    id="brief-role"
                    value={brief.role}
                    onChange={(event) => update("role", event.target.value)}
                    autoComplete="organization-title"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-email">Work email</label>
                  <input
                    className={styles.input}
                    id="brief-email"
                    type="email"
                    value={brief.email}
                    onChange={(event) => update("email", event.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    aria-describedby={errors.email ? "brief-email-error" : undefined}
                    aria-invalid={Boolean(errors.email)}
                    required
                  />
                  <ErrorMessage id="brief-email-error" message={errors.email} />
                </div>
                <div className={styles.field}>
                  <label htmlFor="brief-phone">
                    Phone <span className={styles.optional}>optional</span>
                  </label>
                  <input
                    className={styles.input}
                    id="brief-phone"
                    type="tel"
                    value={brief.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    autoComplete="tel"
                  />
                </div>
                <div className={`${styles.field} ${styles.full}`}>
                  <label className={styles.consent}>
                    <input
                      aria-describedby={errors.consent ? "brief-consent-error" : undefined}
                      aria-invalid={Boolean(errors.consent)}
                      id="brief-consent"
                      required
                      type="checkbox"
                      checked={brief.consent}
                      onChange={(event) => update("consent", event.target.checked)}
                    />
                    <span>
                      I agree that KINGXFORD may use this information to assess my inquiry and contact me about it.
                    </span>
                  </label>
                  <ErrorMessage id="brief-consent-error" message={errors.consent} />
                </div>
                <div className={styles.honeypot} aria-hidden="true">
                  <label htmlFor="brief-website">Leave this field empty</label>
                  <input
                    id="brief-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={brief.website}
                    onChange={(event) => update("website", event.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        {!deliveryConfigured ? (
          <div className={styles.status} role="note">
            Online delivery is not configured on this deployment. You can complete the brief privately, then download
            or copy it without transmitting it to KINGXFORD.
          </div>
        ) : null}

        <div className={styles.actions}>
          <div className={styles.actionGroup}>
            {step > 0 ? (
              <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={previousStep}>
                Back
              </button>
            ) : null}
            <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={downloadBrief}>
              Download draft
            </button>
            <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={copyBrief}>
              Copy
            </button>
            <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={clearDraft}>
              Clear saved draft
            </button>
          </div>
          {step < STEP_NAMES.length - 1 ? (
            <button className={`${styles.button} ${styles.primary}`} type="button" onClick={nextStep}>
              Continue
            </button>
          ) : (
            <button
              className={`${styles.button} ${styles.primary}`}
              type="submit"
              disabled={submitting || success || !deliveryConfigured}
            >
              {submitting
                ? "Sending…"
                : success
                  ? "Brief received"
                  : deliveryConfigured
                    ? "Send project brief"
                    : "Online delivery not yet enabled"}
            </button>
          )}
        </div>

        {status ? (
          <div
            className={`${styles.status} ${success ? styles.success : ""}`}
            role="status"
            aria-live="polite"
            tabIndex={-1}
            ref={statusRef}
          >
            {status}
          </div>
        ) : null}
      </form>
    </div>
  );
}
