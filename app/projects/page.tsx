import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Plus } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { completedProjects } from "@/lib/completed-projects";
import styles from "./projects.module.css";

const description = "Explore completed websites by Avalon Creative Group, including Kingsford & Perla and Trios Snow and Mowing Inc. Visit the live projects and discover the details behind the work.";

export const metadata: Metadata = {
  title: "Completed projects",
  description,
  alternates: { canonical: "/projects" },
  openGraph: {
    title: "Completed projects | AVALON Creative Group",
    description,
    url: "/projects",
    type: "website",
    images: [{ url: "/images/projects/kings-perla-home.webp", width: 1348, height: 926, alt: "Kingsford & Perla, a completed website by Avalon Creative Group" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Completed projects | AVALON Creative Group",
    description,
    images: ["/images/projects/kings-perla-home.webp"],
  },
};

export default function ProjectsPage() {
  return (
    <main className={`site-shell ${styles.page}`}>
      <SiteNav />
      <section className={styles.hero} id="main-content" aria-labelledby="projects-title">
        <p className={styles.eyebrow}><span aria-hidden="true" /> AVALON / COMPLETED PROJECTS</p>
        <div className={styles.heroGrid}>
          <h1 id="projects-title">Good ideas.<br /><em>Out in the world.</em></h1>
          <div className={styles.heroCopy}>
            <p>Different ambitions. Distinctive experiences. A selection of websites we’ve brought to life, ready for you to explore.</p>
            <a className={styles.textLink} href="#project-collection">Explore the work <ArrowDown size={20} aria-hidden="true" /></a>
          </div>
        </div>
        <div className={styles.heroBottom}>
          <p><b>{String(completedProjects.length).padStart(2, "0")}</b> <span>completed {completedProjects.length === 1 ? "project" : "projects"}<br />and more to come</span></p>
          <nav aria-label="Completed project index" className={styles.projectIndex}>
            {completedProjects.map((project, index) => (
              <a href={`#${project.slug}`} key={project.slug}><span>{String(index + 1).padStart(2, "0")}</span>{project.shortName}<ArrowDown size={16} aria-hidden="true" /></a>
            ))}
          </nav>
        </div>
      </section>

      <section className={styles.collection} id="project-collection" aria-label="Completed project collection">
        {completedProjects.map((project, index) => (
          <article className={`${styles.project} ${styles[project.tone]}`} key={project.slug} id={project.slug} aria-labelledby={`${project.slug}-title`}>
            <header className={styles.projectHeader}>
              <div className={styles.projectLabel}><span>{String(index + 1).padStart(2, "0")}</span><p>{project.sector}</p></div>
              <h2 id={`${project.slug}-title`}>{project.name}</h2>
            </header>
            <div className={styles.projectBody}>
              <figure className={styles.showcase}>
                <a className={styles.previewLink} href={project.website} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${project.name} live website (opens in a new tab)`}>
                  <div className={styles.browserBar} aria-hidden="true"><span className={styles.browserDots}><i /><i /><i /></span><span className={styles.browserAddress}>{project.domain}</span><ArrowUpRight size={16} /></div>
                  <Image className={styles.projectImage} src={project.image.src} alt={project.image.alt} width={project.image.width} height={project.image.height} sizes="(max-width: 900px) 92vw, (max-width: 1600px) 59vw, 980px" priority={index === 0} />
                  <span className={styles.previewHint}>Explore the live website <ArrowUpRight size={17} aria-hidden="true" /></span>
                </a>
                <figcaption><span>Website preview</span><span>Design in its natural habitat.</span></figcaption>
              </figure>
              <div className={styles.projectCopy}>
                <p className={styles.liveLabel}><span aria-hidden="true" /> LIVE WEBSITE</p>
                <h3>{project.introduction}</h3>
                <p className={styles.description}>{project.description}</p>
                <ul className={styles.capabilities} aria-label="Project disciplines">{project.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
                <a className={styles.visitLink} href={project.website} target="_blank" rel="noopener noreferrer">Visit live website <ArrowUpRight size={20} aria-hidden="true" /><span className={styles.visuallyHidden}>: {project.name} (opens in a new tab)</span></a>
                <details className={styles.projectNotes}>
                  <summary>Inside the project <Plus size={20} aria-hidden="true" /></summary>
                  <dl>{project.highlights.map((highlight) => <div key={highlight.title}><dt>{highlight.title}</dt><dd>{highlight.description}</dd></div>)}</dl>
                  <a className={styles.detailLink} href={project.detail.website} target="_blank" rel="noopener noreferrer">
                    {project.detail.image && <Image src={project.detail.image.src} alt={project.detail.image.alt} width={project.detail.image.width} height={project.detail.image.height} sizes="(max-width: 900px) 90vw, 30vw" />}
                    <span>{project.detail.label}<ArrowUpRight size={18} aria-hidden="true" /><span className={styles.visuallyHidden}> (opens in a new tab)</span></span>
                  </a>
                </details>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.nextProject} aria-labelledby="next-project-title">
        <div><p className={styles.eyebrow}>THE NEXT CHAPTER</p><h2 id="next-project-title">Your ambition.<br /><em>Our next project.</em></h2></div>
        <div className={styles.nextCopy}><p>Have a website, brand or digital experience in mind? Let’s turn the first conversation into something people can use, explore and remember.</p><Link className={styles.startLink} href="/start">Let’s build something <ArrowUpRight size={22} aria-hidden="true" /></Link><Link className={styles.servicesLink} href="/services">Explore our capabilities <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
      </section>
      <SiteFooter />
    </main>
  );
}
