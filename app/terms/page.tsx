import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Website terms | KINGXFORD",
  description: "Terms governing access to and use of the KINGXFORD public website.",
};

export default function TermsPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Website terms / effective September 2, 2026</p>
          <h1 className="display">Clear terms for a public website.</h1>
          <p className="lede">By using this site, you agree to the terms below. Project work is governed by a separate written agreement.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell rich-copy">
          <h2>1. Informational purpose</h2>
          <p>This website describes KINGXFORD’s intended services, approach and market focus. Content is general information, not legal, financial, regulatory or other professional advice. Submitting a form does not create an agency-client, confidential or fiduciary relationship.</p>

          <h2>2. Launch-stage representations</h2>
          <p>KINGXFORD is a launch-stage agency. Work labelled “concept demonstration” is fictional and does not represent a completed client engagement, endorsement or result. St. John’s is the launch base. Other locations described as service markets or future markets are not represented as permanent offices.</p>

          <h2>3. Estimates and availability</h2>
          <p>Any website estimate, budget range, timing indication or scope suggestion is preliminary and non-binding. A project begins only after due diligence, availability confirmation and a signed agreement defining scope, fees, expenses, rights, responsibilities and payment terms.</p>

          <h2>4. Intellectual property</h2>
          <p>Unless otherwise stated, the site’s copy, design, graphics, code, brand elements and original media are owned by or licensed to KINGXFORD and protected by applicable law. You may view and share links to public pages for personal or internal business evaluation. Reproduction, commercial reuse, scraping for redistribution or creation of misleading derivative material requires written permission.</p>

          <h2>5. Acceptable use</h2>
          <p>Do not attempt to disrupt, probe or bypass site security; introduce malicious code; submit unlawful, deceptive or infringing material; impersonate another person; overload forms; or use automated systems in a way that harms the service or other users.</p>

          <h2>6. Third-party services and links</h2>
          <p>The site may link to or depend on third-party hosting, media, mapping, scheduling or other services. KINGXFORD does not control third-party content, availability or privacy practices. A link is not necessarily an endorsement.</p>

          <h2>7. No warranty</h2>
          <p>The site is provided on an “as available” basis. While we aim for accurate, accessible and secure information, we do not promise uninterrupted availability, error-free operation or that all content will remain current. Nothing in these terms excludes warranties or rights that cannot legally be excluded.</p>

          <h2>8. Limitation</h2>
          <p>To the extent permitted by law, KINGXFORD is not liable for indirect, incidental or consequential loss arising solely from use of or inability to use this public website. Applicable law may give you rights that override part of this section.</p>

          <h2>9. Governing law</h2>
          <p>These website terms are governed by the laws of Newfoundland and Labrador and the federal laws of Canada applicable there, without limiting mandatory consumer or privacy rights that apply in another jurisdiction.</p>

          <h2>10. Changes and contact</h2>
          <p>We may update these terms and will change the effective date when we do. Questions can be sent through the <Link href="/contact">contact page</Link>.</p>
        </div>
      </section>
    </main>
  );
}
