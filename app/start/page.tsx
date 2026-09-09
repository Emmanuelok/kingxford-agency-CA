import type { Metadata } from "next";
import { Clock3, MapPin, MessageSquareText, Phone } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ProjectBrief } from "@/components/project-brief";
import { WORKSPACE_ENABLED } from "@/lib/release";
export const metadata: Metadata = {
  alternates: { canonical: "/start" },
  title: "Start a Project",
  description: "Prepare your Avalon Creative Group project brief and start a conversation about strategy, creative production, digital experiences or growth.",
};
const serviceScopes: Record<string, string[]> = {
  strategy: ["Strategy and research"],
  brand: ["Brand and design"],
  campaigns: ["Campaign creative"],
  content: ["Social and creators"],
  media: ["Media and performance"],
  search: ["Website or digital product", "Media and performance"],
  digital: ["Website or digital product"],
  commerce: ["Website or digital product", "CRM and automation"],
  production: ["Film and photography"],
  pr: ["PR or experience"],
  data: ["Media and performance"],
  ai: ["CRM and automation"],
};
export default async function StartPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const { service } = await searchParams;
  const initialScopes = typeof service === "string" && Object.hasOwn(serviceScopes, service) ? serviceScopes[service] : [];
  return (
    <main className="site-shell">
      <SiteNav />
      <PageHero index="09" eyebrow="START WITH A CONVERSATION" title="Your next chapter." accent="Let's make it matter." description="A new identity. A compelling campaign. A film worth watching. A better digital experience. Tell us what your business needs to achieve." />
      <section className="brief-section content-section">
        <div className="brief-aside">
          <div className="section-kicker"><span>01</span> PROJECT INTAKE</div>
          <h2>One clear brief.<br />A connected beginning.</h2>
          <p>{WORKSPACE_ENABLED ? "Build your brief in four steps. Download a copy, prepare an email to our team, or carry the project into your own campaign workspace." : "Build your brief in four steps. Review the details, download a copy and prepare an email to our team when you are ready."}</p>
          <div className="contact-facts">
            <span><Clock3 />About five minutes to define the essentials</span>
            <span><MapPin />Canada-wide creative collaboration</span>
            <span><MessageSquareText /><a href="mailto:avalon@veridanth.com">avalon@veridanth.com</a></span>
            <span><Phone aria-hidden="true" /><a href="tel:+15878374472">+1 (587) 837-4472</a></span>
          </div>
          <p>Your answers stay in this page until you choose an action. Preparing a brief does not book work or send a message.</p>
        </div>
        <ProjectBrief initialScopes={initialScopes} />
      </section>
      <SiteFooter />
    </main>
  );
}
