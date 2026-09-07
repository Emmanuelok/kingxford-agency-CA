import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { BrandLockup } from "@/components/site-nav";

export function SiteFooter() {
  return (
    <footer className="site-footer avalon-footer" role="contentinfo">
      <div className="footer-pitch">
        <div><span>YOUR AMBITION. OUR NEXT CONVERSATION.</span><h2>Good things start<br/>with <em>a conversation.</em></h2></div>
        <Link href="/start">Tell us what you have in mind <ArrowUpRight /></Link>
      </div>
      <div className="footer-directory">
        <div className="footer-identity">
          <BrandLockup footer />
          <p>Independent thinking. Exceptional craft. Connected delivery. Strategy, brand, film, digital and growth, from St. John&apos;s to markets across Canada.</p>
          <a className="footer-contact" href="mailto:hello@kingxford.co">Let&apos;s talk <ArrowUpRight size={18}/></a>
        </div>
        <div className="footer-column footer-links">
          <b>The group</b>
          <Link href="/services">Our capabilities</Link><Link href="/solutions">Your next move</Link>
          <Link href="/#work">Creative explorations</Link><Link href="/industries">Industries</Link>
          <Link href="/about">About Avalon</Link><Link href="/pricing">Ways to work</Link>
        </div>
        <div className="footer-column footer-links">
          <b>The workspace</b>
          <Link href="/platform">Campaign workspace</Link><Link href="/platform?view=workflows">Campaign workflows</Link>
          <Link href="/platform?view=agents">Specialist agents</Link><Link href="/studio">Production studio</Link>
          <Link href="/platform?view=performance">Performance & learning</Link><Link href="/platform?view=delivery">Project delivery</Link><Link href="/tools">Growth tools</Link>
        </div>
        <div className="footer-column footer-links">
          <b>Our commitments</b>
          <Link href="/privacy">Privacy & data</Link><Link href="/accessibility">Accessibility</Link>
          <Link href="/responsible-advertising">Responsible advertising</Link>
          <span className="footer-location">St. John&apos;s, Newfoundland<br/>& Labrador, Canada</span>
          <a href="mailto:hello@kingxford.co">hello@kingxford.co <ArrowUpRight size={15} /></a>
        </div>
      </div>
      <div className="avalon-footer-wordmark" aria-hidden="true">AVALON</div>
      <div className="footer-bottom">
        <span>© 2026 Avalon Creative Group</span>
        <span>Ideas with vision. Work with impact.</span>
        <a href="#main-content">Back to top ↑</a>
      </div>
    </footer>
  );
}
