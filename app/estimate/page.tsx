import type { Metadata } from "next";
import { EstimateCalculator } from "../../components/brief/EstimateCalculator";
import styles from "../../components/brief/WorkflowPage.module.css";

export const metadata: Metadata = {
  title: "Project range estimator | KINGXFORD",
  description:
    "Create an indicative Canadian-dollar planning range for connected brand, campaign, web, media and production work.",
};

export default function EstimatePage() {
  return (
    <main className={styles.main}>
      <header className={styles.hero}>
        <div className={styles.container}>
          <p className={styles.eyebrow}>Planning range · CAD</p>
          <h1 className={styles.title}>Make the investment visible.</h1>
          <p className={styles.lead}>
            Choose the connected workstreams, ambition and pace. Get a transparent indicative range before the first
            call—without pretending that complex work has a one-size-fits-all price.
          </p>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.introGrid}>
            <h2>A useful range. Not a bait price.</h2>
            <div>
              <p>
                The calculator starts with visible baseline ranges for each workstream, then adjusts for build level
                and pace. It is intended for early planning; a proposal follows discovery, dependencies and a proper
                delivery plan.
              </p>
              <ul className={styles.facts}>
                <li>
                  <strong>Canadian dollars</strong>
                  All figures are indicative CAD before tax.
                </li>
                <li>
                  <strong>Scope-led</strong>
                  Connected services can be phased after discovery.
                </li>
                <li>
                  <strong>No hidden media</strong>
                  Paid media, talent and third-party costs are excluded.
                </li>
              </ul>
            </div>
          </div>
          <EstimateCalculator />
        </div>
      </section>
    </main>
  );
}
