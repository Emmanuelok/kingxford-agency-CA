import type { Metadata } from "next";
import Link from "next/link";
import { InquiryForm } from "../../components/forms/InquiryForm";
import styles from "../../components/brief/WorkflowPage.module.css";

export const metadata: Metadata = {
  title: "Contact | KINGXFORD",
  description:
    "Talk to KINGXFORD about brand, marketing, media, production, social, web and growth work from St. John’s across Canada.",
};

export default function ContactPage() {
  const deliveryConfigured = Boolean(
    (process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) ||
      process.env.CRM_WEBHOOK_URL,
  );

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Contact · St. John’s / Canada</p>
          <h1 className={styles.title}>Let’s find the strongest route.</h1>
          <p className={styles.lead}>
            Share the opportunity, the pressure and what success needs to do. We will come back with useful questions,
            not a generic sales sequence.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <h2>Start where you are.</h2>
            <div>
              <p>
                A short note is enough for an initial conversation. If the work spans multiple teams, markets or
                deliverables, use the guided brief to capture the context once and keep a copy for your own team.
              </p>
              <p>
                Prefer more structure? <Link href="/start-a-project">Build a guided project brief</Link>. Need an early
                investment frame? <Link href="/estimate">Use the CAD range estimator</Link>.
              </p>
              <ul className={styles.facts}>
                <li>
                  <strong>Best fit</strong>
                  Ambitious organizations ready to connect strategy and execution.
                </li>
                <li>
                  <strong>Home base</strong>
                  St. John’s, Newfoundland and Labrador.
                </li>
                <li>
                  <strong>Reach</strong>
                  Atlantic-first, built to work across Canada.
                </li>
              </ul>
            </div>
          </div>
          <InquiryForm deliveryConfigured={deliveryConfigured} />
        </div>
      </section>
    </main>
  );
}
