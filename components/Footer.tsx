import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const serviceLinks = [
  ["Brand strategy", "/services/brand-strategy"],
  ["Campaigns + creative", "/services/campaigns-advertising"],
  ["Film + content", "/services/film-content-production"],
  ["Media + performance", "/services/media-growth"],
  ["Web + digital products", "/services/web-digital-products"],
];

const studioLinks = [
  ["Work", "/work"],
  ["Approach", "/approach"],
  ["Production studio", "/studio"],
  ["Insights", "/insights"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Accessibility", "/accessibility"],
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Cookies", "/cookies"],
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__top">
        <div className="site-footer__statement">
          <BrandMark />
          <p>Strategy with a spine. Creative with a pulse. Growth you can see.</p>
        </div>
        <div className="site-footer__links">
          <div>
            <p className="footer-label">Capabilities</p>
            {serviceLinks.map(([label, href]) => (
              <Link href={href} key={href}>{label}</Link>
            ))}
          </div>
          <div>
            <p className="footer-label">Studio</p>
            {studioLinks.map(([label, href]) => (
              <Link href={href} key={href}>{label}</Link>
            ))}
          </div>
        </div>
      </div>
      <div className="shell site-footer__base">
        <p>Launching in St. John’s, Newfoundland and Labrador · Built for work across Canada</p>
        <p>© {new Date().getFullYear()} KINGXFORD</p>
      </div>
    </footer>
  );
}
