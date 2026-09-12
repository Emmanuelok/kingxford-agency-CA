import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/site-nav";
import { AvalonWordmark } from "@/components/avalon-wordmark";
import { WORKSPACE_ENABLED } from "@/lib/release";
import styles from "@/components/site-footer.module.css";

export function SiteFooter() {
  return (
    <footer id="footer" className={styles.footer} role="contentinfo">
      <div className={styles.content}>
        <div className={styles.pitch}>
          <div>
            <span className={styles.eyebrow}>YOUR AMBITION. OUR NEXT CONVERSATION.</span>
            <h2>Good things start<br />with <em>a conversation.</em></h2>
          </div>
          <Link className={styles.startLink} href="/start">
            <span className={styles.startArrow} aria-hidden="true"><ArrowUpRight /></span>
            <span>Tell us what<br />you have in mind</span>
          </Link>
        </div>
        <div className={styles.directory}>
          <div className={styles.identity}>
            <BrandLockup footer />
            <p>Independent thinking. Exceptional craft. Connected delivery. Strategy, brand, film, digital and growth, from St. John&apos;s to markets across Canada.</p>
            <a className={styles.contact} href="mailto:avalon@veridanth.com">Let&apos;s talk <ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
          <nav className={styles.column} aria-label="Explore Avalon">
            <b>The group</b>
            <Link href="/services">Our capabilities</Link><Link href="/solutions">Your next move</Link>
            <Link href="/projects">Completed projects</Link>
            <a href="/print">Avalon Print</a>
            <Link href="/#work">Creative explorations</Link><Link href="/industries">Industries</Link>
            <Link href="/about">About Avalon</Link><Link href="/pricing">Ways to work</Link>
          </nav>
          {WORKSPACE_ENABLED ? <nav className={styles.column} aria-label="Avalon workspace">
            <b>The workspace</b>
            <Link href="/platform">Campaign workspace</Link><Link href="/platform?view=workflows">Campaign workflows</Link>
            <Link href="/platform?view=agents">Specialist agents</Link><Link href="/studio">Production studio</Link>
            <Link href="/platform?view=performance">Performance & learning</Link><Link href="/platform?view=delivery">Project delivery</Link><Link href="/tools">Growth tools</Link>
          </nav> : <nav className={styles.column} aria-label="Avalon services">
            <b>Our disciplines</b>
            <Link href="/services#strategy">Strategy & research</Link>
            <Link href="/services#brand">Brand & identity</Link>
            <Link href="/services#campaigns">Campaigns & creative</Link>
            <Link href="/services#production">Film & production</Link>
            <Link href="/services#digital">Web & digital</Link>
            <Link href="/services#media">Media & growth</Link>
            <Link href="/start">Start a project</Link>
          </nav>}
          <nav className={styles.column} aria-label="Our commitments and contact">
            <b>Our commitments</b>
            <Link href="/privacy">Privacy & data</Link><Link href="/accessibility">Accessibility</Link>
            <Link href="/responsible-advertising">Responsible advertising</Link>
            <span className={styles.location}>St. John&apos;s, Newfoundland<br />& Labrador, Canada</span>
            <a href="mailto:avalon@veridanth.com">avalon@veridanth.com <ArrowUpRight size={16} aria-hidden="true" /></a>
            <a href="tel:+15878374472">+1 (587) 837-4472</a>
          </nav>
        </div>
      </div>
      <div className={styles.signature} aria-hidden="true">
        <div className={styles.signatureCaption}>
          <span>Independent minds. Shared ambition.</span>
          <span>Made of many talents.</span>
        </div>
        <AvalonWordmark className={styles.wordmark} />
      </div>
      <div className={styles.bottom}>
        <span>© 2026 Avalon Creative Group</span>
        <span>Ideas with vision. Work with impact.</span>
        <a href="#main-content">Back to top ↑</a>
      </div>
    </footer>
  );
}
