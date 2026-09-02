import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy | KINGXFORD",
  description: "How KINGXFORD handles personal information submitted through this website and its project inquiry tools.",
};

export default function PrivacyPage() {
  const deliveryConfigured = Boolean(
    (process.env.RESEND_API_KEY && process.env.CONTACT_TO_EMAIL && process.env.CONTACT_FROM_EMAIL) ||
      process.env.CRM_WEBHOOK_URL,
  );

  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Privacy notice / effective September 2, 2026</p>
          <h1 className="display">Your information should have a clear job.</h1>
          <p className="lede">This notice explains what KINGXFORD may collect through this website, why it is used and the choices available to you.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell rich-copy">
          <h2>1. Scope and accountability</h2>
          <p>This notice applies to personal information processed through KINGXFORD’s public website, inquiry forms and estimate tools. It does not replace a project-specific agreement or privacy notice. KINGXFORD is the operating name used for this launch-stage agency. The agency owner must publish verified legal-identity and privacy-contact details before online inquiry delivery is activated.</p>
          {!deliveryConfigured ? <p><strong>Launch safeguard:</strong> online form delivery is currently disabled. Information entered in the short contact form remains in the current page unless you download or copy it; guided-brief drafts remain in your browser for up to seven days. The server does not accept either form for delivery in this configuration.</p> : null}

          <h2>2. Information we may collect</h2>
          <p>When you contact us, we may receive your name, work email, telephone number, organization, role, project details, budget range, timing, service interests and anything else you choose to include. The guided brief can save a draft in your browser’s local storage until you clear it. Technical systems may also process IP address, browser and device information, request timing, security signals and essential preferences required to deliver and protect the site.</p>

          <h2>3. How we use information</h2>
          <ul>
            <li>Respond to inquiries and assess project fit.</li>
            <li>Prepare an estimate, proposal or requested communication.</li>
            <li>Operate, secure, troubleshoot and improve the website.</li>
            <li>Meet legal, accounting, contractual and fraud-prevention obligations.</li>
            <li>Send marketing communication only where permitted and with an available unsubscribe path.</li>
          </ul>

          <h2>4. Consent and appropriate purposes</h2>
          <p>We collect, use and disclose personal information with consent or another lawful basis available under applicable Canadian law. Providing an inquiry authorizes us to use the information to respond. Do not submit sensitive personal information, confidential client data or materials you are not authorized to share through a public form.</p>

          <h2>5. Service providers and transfers</h2>
          <p>Vercel hosts the website and, when enabled for the deployment, receives privacy-oriented Web Analytics events and browser performance metrics through Vercel Analytics and Speed Insights. A configured email provider or CRM webhook may receive inquiry data for delivery. These providers process information for defined services and may operate outside your province or Canada, where information can be subject to local law. We do not sell personal information.</p>

          <h2>6. Retention and security</h2>
          <p>We retain information only as long as reasonably required for the stated purpose, a continuing business relationship or legal obligations, then delete or anonymize it where practical. We use administrative and technical safeguards proportionate to the information, but no internet transmission or storage system can be guaranteed completely secure.</p>

          <h2>7. Your choices and rights</h2>
          <p>You may ask to access or correct personal information under our control, withdraw consent where applicable, or ask a question about our practices. Some information may need to be retained or withheld where law permits. You may also complain to the appropriate Canadian privacy regulator.</p>

          <h2>8. Cookies and measurement</h2>
          <p>See our <Link href="/cookies">cookie notice</Link> for information about local draft storage and measurement technologies. Vercel states that its Web Analytics product uses anonymized data without cookies; Speed Insights reports web-performance events. Browser controls can restrict local storage, although saved-draft behaviour may no longer work as intended.</p>

          <h2>9. Changes</h2>
          <p>We may update this notice as services, providers or legal requirements change. The effective date above identifies the current version. Material changes will be presented appropriately on the site.</p>

          <h2>10. Contact</h2>
          {deliveryConfigured ? (
            <p>Use the <Link href="/contact">KINGXFORD contact page</Link> for privacy questions or requests and choose “Privacy or accessibility request.” We may need to verify identity before completing an access or correction request.</p>
          ) : (
            <p>A verified privacy-request channel has not yet been supplied by the agency owner, so online collection remains disabled. Do not submit personal information until that channel appears here.</p>
          )}
        </div>
      </section>
    </main>
  );
}
