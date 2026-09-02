import type { Metadata } from "next";
import { BriefBuilder } from "../../components/brief/BriefBuilder";
import styles from "../../components/brief/WorkflowPage.module.css";

export const metadata: Metadata = {
  title: "Start a project | KINGXFORD",
  description:
    "Build a focused project brief for KINGXFORD across brand, campaigns, media, social, digital products and production.",
};

export default function StartAProjectPage() {
  const deliveryConfigured = Boolean(
    (process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) ||
      process.env.CRM_WEBHOOK_URL,
  );

  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Start a project</p>
          <h1 className={styles.title}>Bring us the real ambition.</h1>
          <p className={styles.lead}>
            Four focused steps. About five minutes. The result is a sharper first conversation—and a brief you can
            keep, even if you are not ready to send it.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <h2>Signal before scope.</h2>
            <div>
              <p>
                We do not need a finished answer. We need the business context, the change you want to create and the
                constraints that are already real. KINGXFORD will shape the route from there.
              </p>
              <ul className={styles.facts}>
                <li>
                  <strong>Private draft</strong>
                  Saved only in this browser for up to seven days, until you clear it or successfully submit it.
                </li>
                <li>
                  <strong>Portable</strong>
                  Copy or download the full brief at any point.
                </li>
                <li>
                  <strong>Human review</strong>
                  Every delivered brief is read before a response.
                </li>
              </ul>
            </div>
          </div>
          <BriefBuilder deliveryConfigured={deliveryConfigured} />
        </div>
      </section>
    </main>
  );
}
