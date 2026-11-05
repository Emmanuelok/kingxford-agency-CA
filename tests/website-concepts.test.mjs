import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { conceptGroups, filterWebsiteConcepts, showcaseCollectionUrl, websiteConcepts } from "../lib/website-concepts.ts";

test("all twenty fictional website destinations are unique and bounded", () => {
  assert.equal(websiteConcepts.length, 20);
  assert.equal(new Set(websiteConcepts.map((x) => x.slug)).size, 20);
  assert.deepEqual(websiteConcepts.map((x) => x.number), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal(showcaseCollectionUrl, "https://emmanuelok.github.io/avalon-showcase/review-2026-11-05/");
  for (const concept of websiteConcepts) {
    assert.equal(concept.url, `https://emmanuelok.github.io/avalon-showcase/review-2026-11-05/concepts/${concept.slug}/index.html`);
    assert.ok(concept.name && concept.sector && concept.tagline);
    assert.ok(conceptGroups.includes(concept.group));
  }
});

test("filters combine with normalized multi-word searches", () => {
  assert.equal(filterWebsiteConcepts("All concepts", "").length, 20);
  assert.equal(filterWebsiteConcepts("All concepts", "  SLOW   FORM  ")[0].slug, "slow-form");
  assert.equal(filterWebsiteConcepts("Travel & places", "Dune")[0].slug, "dune-house");
  assert.equal(filterWebsiteConcepts("Industry & impact", "Dune").length, 0);
  assert.equal(filterWebsiteConcepts("All concepts", "no-such-concept").length, 0);
  assert.equal(filterWebsiteConcepts("All concepts", "education").length, 2);
});

test("concept collection stays within Work, separate from completed projects", async () => {
  const [work, concepts, completed, projectsPage] = await Promise.all([
    readFile("components/campaign-studies.tsx", "utf8"),
    readFile("components/website-concepts.tsx", "utf8"),
    readFile("lib/completed-projects.ts", "utf8"),
    readFile("app/projects/page.tsx", "utf8"),
  ]);
  assert.ok(work.includes('id="work"'));
  assert.ok(work.includes("<WebsiteConcepts />"));
  assert.ok(work.includes('href="/projects"'));
  assert.match(concepts, /Fictional brands\. Demonstration experiences\./);
  assert.match(concepts, /not commissioned client work/);
  assert.match(concepts, /not intended for real bookings, purchases or enquiries/);
  assert.match(concepts, /role="list"/);
  assert.match(projectsPage, /href="\/#website-concepts-title"/);
  assert.match(projectsPage, /Explore 20 fictional website concepts/);
  for (const concept of websiteConcepts) assert.ok(!completed.includes(concept.url));
});
