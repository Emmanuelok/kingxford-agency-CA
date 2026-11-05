"use client";

import { ArrowUpRight, Search } from "lucide-react";
import { useRef, useState } from "react";
import {
  conceptGroups,
  filterWebsiteConcepts,
  showcaseCollectionUrl,
  type ConceptGroup,
  websiteConcepts,
} from "@/lib/website-concepts";
import styles from "./website-concepts.module.css";

export function WebsiteConcepts() {
  const searchInput = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<ConceptGroup>("All concepts");
  const [query, setQuery] = useState("");
  const concepts = filterWebsiteConcepts(group, query);
  const filtered = group !== "All concepts" || query.trim().length > 0;

  function reset() {
    setGroup("All concepts");
    setQuery("");
    searchInput.current?.focus();
  }

  return (
    <section className={styles.collection} aria-labelledby="website-concepts-title">
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>AVALON / WEBSITE CONCEPTS / 01–20</p>
          <h3 id="website-concepts-title">Twenty worlds.<br /><em>Your next possibility.</em></h3>
        </div>
        <div className={styles.introduction}>
          <p>Explore {websiteConcepts.length} original website concepts across different industries. Find a direction that speaks to your next brief.</p>
          <a className={styles.collectionLink} href={showcaseCollectionUrl}>Explore the full collection <ArrowUpRight aria-hidden="true" size={20} /></a>
        </div>
      </header>

      <p className={styles.disclosure} id="website-concepts-disclosure"><strong>Fictional brands. Demonstration experiences.</strong> These are self-initiated concepts, not commissioned client work. These fictional demonstrations are not intended for real bookings, purchases or enquiries.</p>

      <div className={styles.tools}>
        <fieldset className={styles.filters}>
          <legend className={styles.srOnly}>Filter website concepts by industry group</legend>
          {conceptGroups.map((item) => <button key={item} type="button" aria-pressed={group === item} onClick={() => setGroup(item)}>{item}</button>)}
        </fieldset>
        <label className={styles.search}>
          <span className={styles.srOnly}>Search website concepts</span>
          <Search size={20} aria-hidden="true" />
          <input ref={searchInput} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name or industry" />
        </label>
      </div>

      <div className={styles.results}>
        <p role="status" aria-live="polite" aria-atomic="true">{concepts.length} of {websiteConcepts.length} concepts</p>
        {filtered && <button type="button" onClick={reset}>Clear filters</button>}
      </div>

      <ol className={styles.grid} role="list" aria-describedby="website-concepts-disclosure">
        {concepts.map((concept) => <li key={concept.slug}>
          <a className={styles.card} href={concept.url} aria-label={`Explore ${concept.name}, a fictional ${concept.sector.toLowerCase()} website concept`}>
            <div className={styles.cardTop}><span>{String(concept.number).padStart(2, "0")}</span><span>{concept.sector}</span><ArrowUpRight size={23} aria-hidden="true" /></div>
            <h4>{concept.name}</h4>
            <p>{concept.tagline}</p>
            <span className={styles.cardFoot}>Explore concept <ArrowUpRight aria-hidden="true" size={18} /></span>
          </a>
        </li>)}
      </ol>

      {!concepts.length && <div className={styles.empty}><p>No concepts match those filters.</p><button type="button" onClick={reset}>Show all {websiteConcepts.length} concepts</button></div>}
    </section>
  );
}
