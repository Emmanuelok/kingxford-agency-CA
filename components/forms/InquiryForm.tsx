"use client";

import { useRef, useState } from "react";
import {
  BUDGET_OPTIONS,
  CONTACT_REASON_OPTIONS,
  TIMELINE_OPTIONS,
  inquiryToText,
  type InquiryPayload,
} from "../../lib/inquiry";
import styles from "./InquiryForm.module.css";

const INITIAL: InquiryPayload = {
  name: "",
  email: "",
  organization: "",
  projectSummary: "",
  services: [],
  budget: "",
  timeline: "",
  consent: false,
  website: "",
  source: "contact-page",
};

const ERROR_TARGETS: Record<string, string> = {
  name: "contact-name",
  email: "contact-email",
  organization: "contact-organization",
  projectSummary: "contact-summary",
  consent: "contact-consent",
};

export function InquiryForm({ deliveryConfigured }: { deliveryConfigured: boolean }) {
  const [form, setForm] = useState<InquiryPayload>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  function focusFirstError(nextErrors: Record<string, string>) {
    const targetId = Object.keys(nextErrors).map((field) => ERROR_TARGETS[field]).find(Boolean);
    if (!targetId) return false;
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
    return true;
  }

  function update<K extends keyof InquiryPayload>(field: K, value: InquiryPayload[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function copyInquiry() {
    try {
      await navigator.clipboard.writeText(inquiryToText(form));
      setStatus("Inquiry copied to your clipboard.");
    } catch {
      setStatus("Copy was blocked by your browser. Download the inquiry instead.");
    }
  }

  function downloadInquiry() {
    const blob = new Blob([inquiryToText(form)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kingxford-inquiry.txt";
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("A copy of your inquiry has been downloaded.");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deliveryConfigured) {
      setStatus("Online delivery is not enabled yet. Download or copy the inquiry so no work is lost.");
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    setSending(true);
    setStatus("Sending your inquiry…");
    setErrors({});

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };
      if (!response.ok || !result.ok) {
        setErrors(result.errors ?? {});
        setStatus(result.message ?? "The inquiry was not delivered. Download a copy and try again.");
        setSuccess(false);
        if (result.errors && focusFirstError(result.errors)) return;
      } else {
        setStatus(result.message ?? "Your inquiry has been received.");
        setSuccess(true);
      }
    } catch {
      setStatus("The connection failed. Download a copy so no work is lost, then try again.");
      setSuccess(false);
    } finally {
      setSending(false);
      requestAnimationFrame(() => statusRef.current?.focus());
    }
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <div className={styles.grid}>
        <div className={styles.field}>
          <label htmlFor="contact-name">Name</label>
          <input
            className={styles.input}
            id="contact-name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            required
          />
          {errors.name ? <p className={styles.error} id="contact-name-error">{errors.name}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-email">Work email</label>
          <input
            className={styles.input}
            id="contact-email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
            inputMode="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            required
          />
          {errors.email ? <p className={styles.error} id="contact-email-error">{errors.email}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-organization">Organization</label>
          <input
            className={styles.input}
            id="contact-organization"
            value={form.organization}
            onChange={(event) => update("organization", event.target.value)}
            autoComplete="organization"
            aria-invalid={Boolean(errors.organization)}
            aria-describedby={errors.organization ? "contact-organization-error" : undefined}
            required
          />
          {errors.organization ? <p className={styles.error} id="contact-organization-error">{errors.organization}</p> : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-service">
            Closest fit or reason <span className={styles.optional}>optional</span>
          </label>
          <select
            className={styles.select}
            id="contact-service"
            value={form.services[0] ?? ""}
            onChange={(event) => update("services", event.target.value ? [event.target.value] : [])}
          >
            <option value="">Select a capability</option>
            {CONTACT_REASON_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-budget">
            Indicative budget in CAD <span className={styles.optional}>optional</span>
          </label>
          <select
            className={styles.select}
            id="contact-budget"
            value={form.budget}
            onChange={(event) => update("budget", event.target.value)}
          >
            <option value="">Select a range</option>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-timeline">
            Timeline <span className={styles.optional}>optional</span>
          </label>
          <select
            className={styles.select}
            id="contact-timeline"
            value={form.timeline}
            onChange={(event) => update("timeline", event.target.value)}
          >
            <option value="">Select a timeline</option>
            {TIMELINE_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className={`${styles.field} ${styles.full}`}>
          <label htmlFor="contact-summary">What are you building?</label>
          <textarea
            className={styles.textarea}
            id="contact-summary"
            value={form.projectSummary}
            onChange={(event) => update("projectSummary", event.target.value)}
            placeholder="The opportunity, the problem and what a useful outcome looks like."
            aria-invalid={Boolean(errors.projectSummary)}
            aria-describedby={errors.projectSummary ? "contact-summary-error" : undefined}
            required
          />
          {errors.projectSummary ? <p className={styles.error} id="contact-summary-error">{errors.projectSummary}</p> : null}
        </div>
        <label className={`${styles.consent} ${styles.full}`}>
          <input
            id="contact-consent"
            type="checkbox"
            checked={form.consent}
            onChange={(event) => update("consent", event.target.checked)}
            aria-invalid={Boolean(errors.consent)}
            aria-describedby={errors.consent ? "contact-consent-error" : undefined}
            required
          />
          <span>I agree that KINGXFORD may use this information to assess my inquiry and contact me about it.</span>
        </label>
        {errors.consent ? <p className={`${styles.error} ${styles.full}`} id="contact-consent-error">{errors.consent}</p> : null}
        <div className={styles.honeypot} aria-hidden="true">
          <label htmlFor="contact-website">Leave empty</label>
          <input
            id="contact-website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update("website", event.target.value)}
          />
        </div>
      </div>
      {!deliveryConfigured ? (
        <div className={styles.status} role="note">
          Online delivery is not configured on this deployment. You can prepare the inquiry here, then download or
          copy it without transmitting it to KINGXFORD.
        </div>
      ) : null}
      <div className={styles.actions}>
        <button
          className={`${styles.button} ${styles.primary}`}
          type="submit"
          disabled={sending || success || !deliveryConfigured}
        >
          {sending
            ? "Sending…"
            : success
              ? "Inquiry received"
              : deliveryConfigured
                ? "Send inquiry"
                : "Online delivery not yet enabled"}
        </button>
        <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={downloadInquiry}>
          Download copy
        </button>
        <button className={`${styles.button} ${styles.secondary}`} type="button" onClick={copyInquiry}>
          Copy
        </button>
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
  );
}
