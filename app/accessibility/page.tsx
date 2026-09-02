import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility | KINGXFORD",
  description: "KINGXFORD’s commitment to accessible digital experiences, content and production.",
};

export default function AccessibilityPage() {
  const deliveryConfigured = Boolean(
    (process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) ||
      process.env.CRM_WEBHOOK_URL,
  );

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Accessibility / access is part of the idea</p>
          <h1 className="display">Creative should invite people in.</h1>
          <p className="lede">KINGXFORD designs toward WCAG 2.2 Level AA and treats accessibility as an ongoing product and production responsibility—not a final checklist.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell split">
          <div className="stack"><p className="eyebrow">Our website standard</p><h2 className="section-title">Legible, navigable and resilient.</h2></div>
          <div className="rich-copy">
            <p>We aim to support keyboard navigation, visible focus, semantic structure, sufficient colour contrast, responsive text, descriptive links, alternative text and reduced-motion preferences.</p>
            <p>The cinematic opening is intended to provide a non-essential visual experience. Core information and actions remain available without motion, and reduced-motion settings should receive a calmer alternative.</p>
          </div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack">
          <p className="eyebrow">The production standard</p>
          <div className="page-grid">
            <article className="card stack"><span className="card__number">01</span><h3>Readable by design</h3><p>Clear hierarchy, strong contrast, generous type and plain language appropriate to the audience.</p></article>
            <article className="card stack"><span className="card__number">02</span><h3>Perceivable alternatives</h3><p>Captions, transcripts, alt text and audio-description planning when the communication requires it.</p></article>
            <article className="card stack"><span className="card__number">03</span><h3>Operable experiences</h3><p>Keyboard and touch support, useful focus states, adequate targets and no essential interaction that depends on a single input.</p></article>
            <article className="card stack"><span className="card__number">04</span><h3>Tested in context</h3><p>Automated checks, manual review and assistive-technology testing scaled to the risk and reach of the work.</p></article>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell split">
          <div className="media-frame stack"><p className="eyebrow">Status</p><h2 className="section-title">A target, not a certification claim.</h2></div>
          <div className="rich-copy"><p>Technology, content and standards change. We do not claim this launch site is free of every barrier. We review key journeys and prioritize fixes according to user impact.</p><p>If anything prevents you from accessing information or completing a task, tell us what page, device and assistive technology were involved if you are comfortable doing so. We will provide the information in another format and investigate the barrier.</p></div>
        </div>
      </section>

      <section className="section section--compact">
        <div className="shell stack"><p className="eyebrow">Accessibility feedback</p><h2 className="section-title">Tell us where access breaks down.</h2>{deliveryConfigured ? <><p>Use our contact form and choose “Privacy or accessibility request.” Please do not include sensitive personal or medical information.</p><Link className="button button--primary" href="/contact">Contact KINGXFORD</Link></> : <p>Online feedback delivery is not enabled on this deployment. A verified accessibility-feedback channel must be published by the agency owner before public launch.</p>}<p className="eyebrow">Statement last reviewed: September 2, 2026</p></div>
      </section>
    </main>
  );
}
