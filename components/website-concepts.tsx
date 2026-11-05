"use client";

import Image from "next/image";
import { ArrowUpRight, Search } from "lucide-react";
import { useRef, useState } from "react";
import {
  conceptGroups,
  filterWebsiteConcepts,
  showcaseCollectionUrl,
  templateInquiryUrl,
  type ConceptGroup,
  websiteConcepts,
} from "@/lib/website-concepts";
import styles from "./website-concepts.module.css";

export function WebsiteConcepts({ headingLevel = 3, standalone = false }: { headingLevel?: 2 | 3; standalone?: boolean }) {
  const searchInput = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<ConceptGroup>("All templates");
  const [query, setQuery] = useState("");
  const templates = filterWebsiteConcepts(group, query);
  const filtered = group !== "All templates" || query.trim().length > 0;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const CardHeading = headingLevel === 2 ? "h3" : "h4";

  function reset() {
    setGroup("All templates");
    setQuery("");
    searchInput.current?.focus();
  }

  return (
    <section className={`${styles.collection} ${standalone ? styles.standalone : ""}`} aria-labelledby="website-templates-title">
      <span id="website-concepts-title" className={styles.legacyAnchor} aria-hidden="true" />
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>AVALON / WEBSITE TEMPLATES / 01–20</p>
          <Heading id="website-templates-title" className={styles.title}>Find your starting point.<br /><em>Make it your own.</em></Heading>
        </div>
        <div className={styles.introduction}>
          <p>Explore {websiteConcepts.length} website templates and let Avalon tailor your choice to your brand, content and business.</p>
          {!standalone && <a className={styles.collectionLink} href={showcaseCollectionUrl}>View templates with our work <ArrowUpRight aria-hidden="true" size={20} /></a>}
        </div>
      </header>

      <p className={styles.disclosure} id="website-templates-disclosure"><strong>Preview it. Choose it. Shape it with Avalon.</strong> Each template shows a different design and set of interactions. Preview interactions use sample data; bookings, purchases and submissions are demonstrations.</p>

      <div className={styles.tools}>
        <fieldset className={styles.filters}>
          <legend className={styles.srOnly}>Filter website templates by industry group</legend>
          {conceptGroups.map((item) => <button key={item} type="button" aria-pressed={group === item} onClick={() => setGroup(item)}>{item}</button>)}
        </fieldset>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search website templates</span>
          <Search size={20} aria-hidden="true" />
          <input ref={searchInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name or industry" />
        </label>
      </div>

      <div className={styles.results}>
        <p role="status" aria-live="polite" aria-atomic="true">{templates.length} of {websiteConcepts.length} templates</p>
        {filtered && <button type="button" onClick={reset}>Clear filters</button>}
      </div>

      <ol className={styles.grid} role="list" aria-describedby="website-templates-disclosure">
        {templates.map((template) => <li key={template.slug} className={styles.card}>
          <a className={styles.previewImage} href={template.url} aria-label={`Preview ${template.name}, ${template.sector.toLowerCase()} website template`}>
            <Image src={template.image} alt={`${template.name} website template preview`} width={1440} height={1000} sizes="(max-width: 620px) 90vw, (max-width: 1000px) 45vw, 30vw" />
            <span className={styles.previewBadge}>Explore the website <ArrowUpRight aria-hidden="true" size={18} /></span>
          </a>
          <div className={styles.cardBody}>
            <div className={styles.cardTop}><span>{String(template.number).padStart(2, "0")}</span><span>{template.sector}</span></div>
            <CardHeading className={styles.cardTitle}>{template.name}</CardHeading>
            <p>{template.tagline}</p>
            <div className={styles.cardActions}>
              <a className={styles.previewAction} href={template.url}>Preview template <ArrowUpRight aria-hidden="true" size={18} /><span className={styles.srOnly}>: {template.name}</span></a>
              <a className={styles.chooseAction} href={templateInquiryUrl(template)}>Choose this template<span className={styles.srOnly}>: {template.name}</span></a>
            </div>
          </div>
        </li>)}
      </ol>

      {!templates.length && <div className={styles.empty}><p>No templates match those filters.</p><button type="button" onClick={reset}>Show all {websiteConcepts.length} templates</button></div>}
    </section>
  );
}
