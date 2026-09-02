import { ArrowRight, ArrowUpRight, Clapperboard, Code2, Gauge, Megaphone, PenTool, Search } from "lucide-react";
import { AgencyUniverse, ClientOperatingSystem, ProblemSwitchboard } from "@/components/agency-interface";
import { CampaignStudies } from "@/components/campaign-studies";
import { ScrollCinema } from "@/components/scroll-cinema";
import { SiteFooter } from "@/components/site-footer";
import { SiteNav } from "@/components/site-nav";

const system = [
  [Search, "01", "Find", "Research the tension, the audience and the commercial edge."],
  [PenTool, "02", "Frame", "Turn the evidence into one useful campaign idea."],
  [Clapperboard, "03", "Make", "Produce the film, design, content and experience."],
  [Megaphone, "04", "Move", "Place the work where attention becomes action."],
  [Gauge, "05", "Improve", "Read the response and make the next decision."],
] as const;

export default function Home() {
  return (
    <main className="site-shell kx5-home">
      <SiteNav />
      <ScrollCinema />
      <AgencyUniverse />
      <ProblemSwitchboard />
      <CampaignStudies />

      <section className="kx5-production" aria-labelledby="production-title">
        <div className="kx5-production-image">
          <img src="/images/commercial-production.webp" alt="A commercial production crew shaping camera and light around a campaign set" />
          <span>KX / PRODUCTION FLOOR / FRAME 024</span>
        </div>
        <div className="kx5-production-copy">
          <span className="kx5-overline">The work leaves the deck</span>
          <h2 id="production-title">The strategist sits beside the camera.</h2>
          <p>The idea survives production because the people who found it remain close to the people who make it. Senior creative, film, design, development and media work from the same brief.</p>
          <div className="kx5-production-ledger">
            <span><b>Film</b>TV · CTV · brand · documentary · short form</span>
            <span><b>Image</b>Campaign · product · people · place · editorial</span>
            <span><b>Motion</b>Identity · titles · explainers · social systems</span>
            <span><b>Audio</b>Radio · streaming · sonic systems · podcasts</span>
          </div>
          <a href="/studio">Enter the production floor <ArrowUpRight /></a>
        </div>
      </section>

      <section className="kx5-system" aria-labelledby="system-title">
        <header>
          <div><span className="kx5-overline">One accountable route</span><h2 id="system-title">From first truth<br />to next decision.</h2></div>
          <p>A senior lead owns the through-line. Specialists join where the brief needs them. The client sees the work, the spend and the decision record in one place.</p>
        </header>
        <div className="kx5-system-track">
          {system.map(([Icon, number, title, copy]) => (
            <article key={number}>
              <span>{number}</span><Icon aria-hidden="true" /><h3>{title}</h3><p>{copy}</p><i aria-hidden="true" />
            </article>
          ))}
        </div>
        <a href="/services">Inspect every capability <ArrowRight /></a>
      </section>

      <ClientOperatingSystem />

      <section className="kx5-canada" aria-labelledby="canada-title">
        <div className="kx5-canada-map" aria-hidden="true">
          <span className="kx5-map-ring ring-one" /><span className="kx5-map-ring ring-two" /><span className="kx5-map-ring ring-three" />
          <i className="kx5-map-origin">ST. JOHN&apos;S</i>
          <b>47.5615° N</b>
        </div>
        <div className="kx5-canada-copy">
          <span className="kx5-overline">Canada, market by market</span>
          <h2 id="canada-title">Our address is St. John&apos;s.<br />Our market is Canada.</h2>
          <p>St. John&apos;s is our first office and the place our standard is set. We will add teams market by market as client demand grows—one operating system, with people who know the region, category and customer firsthand.</p>
          <ol>
            <li><span>Now</span><b>St. John&apos;s</b><small>Founding market / full agency</small></li>
            <li><span>Next</span><b>Atlantic Canada</b><small>Regional collaborators / local evidence</small></li>
            <li><span>Then</span><b>Canada, city by city</b><small>Real presence when the work calls for it</small></li>
          </ol>
          <a href="/industries">Explore markets and sectors <ArrowUpRight /></a>
        </div>
      </section>

      <section className="kx5-close" aria-labelledby="close-title">
        <span>KX / THE DISPATCH</span>
        <h2 id="close-title">Bring us the thing<br />that will not move.</h2>
        <p>Tell us what needs to change, who needs to act and what is standing in the way. We will identify the right starting point, the right rooms and the next useful decision.</p>
        <div>
          <a href="/start">Start the brief <ArrowUpRight /></a>
          <a href="mailto:hello@kingxford.co">Talk to KINGXFORD</a>
        </div>
        <Code2 className="kx5-close-mark" aria-hidden="true" />
      </section>

      <SiteFooter />
    </main>
  );
}
