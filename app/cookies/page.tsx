import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie notice | KINGXFORD",
  description: "Information about essential storage, optional analytics and browser choices on the KINGXFORD website.",
};

export default function CookiesPage() {
  return (
    <main>
      <header className="page-hero">
        <div className="shell stack">
          <p className="eyebrow">Cookie notice / effective September 2, 2026</p>
          <h1 className="display">Small files. Specific purposes.</h1>
          <p className="lede">This notice explains how the KINGXFORD website may use cookies and similar browser technologies.</p>
        </div>
      </header>

      <section className="section">
        <div className="shell rich-copy">
          <h2>What these technologies do</h2>
          <p>Cookies are small values stored by a browser. Similar technologies can remember a preference, protect a form, balance traffic or help understand whether a page works. Some are set by the website; others may be provided by an integrated service.</p>

          <h2>Essential technology</h2>
          <p>The guided project brief uses browser local storage to autosave the draft you enter, including any contact and project details. That draft stays on the device and browser you use until you clear site data or use the brief’s clear action. Essential platform technology may also be used to deliver pages, preserve security, prevent form abuse or remember a privacy choice.</p>

          <h2>Analytics and performance</h2>
          <p>This launch includes Vercel Analytics and Vercel Speed Insights. Vercel states that Web Analytics stores anonymized data and does not use cookies; Speed Insights sends web-performance events such as loading, responsiveness and layout-stability measurements to Vercel. These tools are used to understand page use and improve performance, not for cross-site advertising.</p>

          <h2>Advertising and cross-site tracking</h2>
          <p>KINGXFORD does not intend to activate cross-site advertising trackers on this launch website without first updating this notice and implementing an appropriate consent mechanism. A future campaign landing page may have different technology and will provide relevant notice.</p>

          <h2>Your controls</h2>
          <p>You can delete or block cookies through browser settings. Privacy extensions and device controls may also limit tracking. Blocking essential storage can affect preferences or form protection. Where a site preference control is available, it should be used in addition to—not instead of—browser controls.</p>

          <h2>Changes and questions</h2>
          <p>We will update this notice if the technologies or purposes materially change. For questions, use the <Link href="/contact">contact page</Link> and label the message “Privacy.” Read the full <Link href="/privacy">privacy notice</Link> for broader information-handling practices.</p>
        </div>
      </section>
    </main>
  );
}
