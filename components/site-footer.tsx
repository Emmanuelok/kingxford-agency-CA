import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/site-nav";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-pitch">
        <div><span>KX / THE DISPATCH</span><h2>Bring us the thing that will not move.</h2></div>
        <a href="/start">Start the brief <ArrowUpRight /></a>
      </div>
      <div className="footer-directory">
        <div className="footer-identity">
          <BrandLockup footer />
          <p>One accountable advertising agency for strategy, identity, campaigns, production, media and digital—from St. John&apos;s to markets across Canada.</p>
        </div>
        <div className="footer-column">
          <b>Home base</b>
          <span>St. John&apos;s</span>
          <span>Newfoundland & Labrador</span>
          <span>Canada</span>
        </div>
        <div className="footer-column footer-links">
          <b>Explore</b>
          <Link href="/#work">Concept work</Link><a href="/solutions">Solutions</a><a href="/services">Services</a>
          <a href="/industries">Industries</a><a href="/studio">Studio</a>
          <a href="/platform">Platform</a><a href="/tools">Growth tools</a>
        </div>
        <div className="footer-column footer-links">
          <b>Agency</b>
          <a href="/about">About</a><a href="/pricing">Ways to work</a>
          <a href="/privacy">Privacy & data</a>
          <a href="/accessibility">Accessibility</a>
          <a href="/responsible-advertising">Responsible advertising</a>
          <a href="mailto:hello@kingxford.co">hello@kingxford.co <ArrowUpRight size={13} /></a>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 KINGXFORD Agency</span>
        <span>St. John&apos;s born · Canada ready</span>
        <a href="#main-content">Back to top ↑</a>
      </div>
    </footer>
  );
}
