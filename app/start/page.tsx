import type { Metadata } from "next";
import { Clock3, MapPin, MessageSquareText } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ProjectBrief } from "@/components/project-brief";
export const metadata: Metadata = {
  alternates: { canonical: "/start" },
  title: "Start a Project",
  description: "Create your Avalon Creative Group project brief, prepare an inquiry or start a connected campaign workspace.",
};
export default function StartPage() {
  return (
    <main className="site-shell">
      <SiteNav />
      <PageHero index="09" eyebrow="START WITH A CONVERSATION" title="Your next chapter." accent="Let's make it matter." description="A new identity. A compelling campaign. A film worth watching. A better digital experience. Tell us what your business needs to achieve." />
      <section className="brief-section content-section">
        <div className="brief-aside">
          <div className="section-kicker"><span>01</span> PROJECT INTAKE</div>
          <h2>One clear brief.<br />A connected beginning.</h2>
          <p>Build your brief in four steps. Download a copy, prepare an email to our team, or carry the project into your own campaign workspace.</p>
          <div className="contact-facts">
            <span><Clock3 />About five minutes to define the essentials</span>
            <span><MapPin />Canada-wide creative collaboration</span>
            <span><MessageSquareText /><a href="mailto:hello@kingxford.co">hello@kingxford.co</a></span>
          </div>
          <p>Your answers stay in this page until you choose an action. Preparing a brief does not book work or send a message.</p>
        </div>
        <ProjectBrief />
      </section>
      <SiteFooter />
    </main>
  );
}
