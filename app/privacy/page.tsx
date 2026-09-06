import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
export const metadata: Metadata = {
  title: "Privacy & Data",
  description:
    "How KINGXFORD handles device-local campaign drafts, optional cloud snapshots, AI requests and project inquiries.",
  alternates: { canonical: "/privacy" },
};
export default function PrivacyPage() {
  return (
    <div className="site-shell">
      <SiteNav />
      <main>
        <PageHero
          index="P1"
          eyebrow="TRUST CENTRE"
          title="Your work."
          accent="Your choices."
          description="Know what stays on your device, what you choose to send, and which connections are active."
        />
        <article className="policy-page content-section">
          <p className="policy-updated">Workspace notice · 6 September 2026</p>
          <h2>Device-local workspace</h2>
          <p>
            The campaign workspace saves briefs, draft content, planning
            outputs, tasks, evidence records and decision history in this
            browser’s local storage. This is device-local storage, not a team
            account or encrypted vault. Anyone with access to this browser
            profile may be able to read it. Avoid sensitive personal
            information, credentials and confidential third-party data. Export
            backups regularly. Deleting browser site data removes the device
            copy.
          </p>
          <h2>Optional cloud snapshots</h2>
          <p>
            When an agency-provisioned cloud connection is active, signed-in
            users may explicitly save a private snapshot to the configured
            Supabase service. It is associated with the account ID and protected
            by account-ownership policies. Cloud saves are manual snapshots, not
            continuous collaboration. Deleting a device campaign does not delete
            its cloud snapshot. Contact KINGXFORD for cloud deletion, access or
            correction requests.
          </p>
          <h2>Optional AI drafts</h2>
          <p>
            Planning engines execute in your browser and do not require an AI
            provider. Selecting “Send brief for AI draft” sends your brief,
            selected evidence and relevant planning context to KINGXFORD’s
            server and configured model through Vercel AI Gateway. Do not
            include secrets or unnecessary personal information. Provider
            processing and usage charges may apply. Outputs are unverified
            drafts, not independently researched facts. No request automatically
            publishes content, sends messages, changes advertising accounts or
            spends a campaign budget.
          </p>
          <h2>Accounts and service activation</h2>
          <p>
            Cloud and AI features are unavailable until configured by the owner.
            Before inviting clients, the owner must confirm processing
            locations, subprocessors, retention periods, support and deletion
            procedures, provider data-use settings, contractual safeguards and
            the applicable privacy requirements. Do not treat this
            implementation notice as a completed legal or privacy assessment.
          </p>
          <h2>Project inquiries</h2>
          <p>
            The inquiry builder prepares an email for you to review and send
            using your own mail application; opening that application does not
            send the email. Copy and download alternatives are available. The
            workspace handoff stores organization, objective and challenge—not
            contact details. An inquiry does not subscribe you to marketing;
            that choice is separate and optional.
          </p>
          <h2>Technical information</h2>
          <p>
            Hosting and security services may process request information
            necessary to deliver and protect the platform. The site does not
            intentionally activate non-essential advertising pixels or session
            replay. Authentication uses essential session cookies when cloud
            accounts are active. Application error logs are designed not to
            include submitted briefs, passwords, tokens or AI prompt bodies.
          </p>
          <h2>Your choices</h2>
          <p>
            Use Storage & connections to export data, sign out or delete the
            active device campaign. Device copies remain after sign-out, so
            remove them on shared devices. For questions, access, correction or
            cloud deletion, contact{" "}
            <a href="mailto:hello@kingxford.co?subject=Privacy%20request">
              hello@kingxford.co
            </a>
            . Retention and legal obligations may affect deletion of business
            records.
          </p>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}
