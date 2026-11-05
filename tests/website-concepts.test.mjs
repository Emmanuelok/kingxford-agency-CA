import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import { conceptGroups, filterWebsiteConcepts, showcaseCollectionUrl, templateInquiryUrl, websiteConcepts } from "../lib/website-concepts.ts";

test("all twenty templates have unique Avalon-owned preview addresses and thumbnail files", async () => {
  assert.equal(websiteConcepts.length, 20);
  assert.equal(new Set(websiteConcepts.map((x) => x.slug)).size, 20);
  assert.equal(new Set(websiteConcepts.map((x) => x.url)).size, 20);
  assert.deepEqual(websiteConcepts.map((x) => x.number), Array.from({ length: 20 }, (_, i) => i + 1));
  assert.equal(showcaseCollectionUrl, "/projects#website-templates-title");
  for (const template of websiteConcepts) {
    assert.match(template.templateSlug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.equal(template.url, `/work/${template.templateSlug}`);
    assert.ok(template.name && template.sector && template.tagline);
    assert.ok(conceptGroups.includes(template.group));
    assert.ok((await stat(`public${template.image}`)).size > 0);
    const imageBytes = await readFile(`public${template.image}`);
    assert.equal(template.imageVersion, createHash("sha256").update(imageBytes).digest("hex").slice(0, 12));
    assert.ok(template.image.endsWith(`-${template.imageVersion}.jpg`));
    assert.ok(!template.image.includes("?"));
  }
  assert.equal(websiteConcepts.find((item) => item.slug === "dune-house").url, "/work/dune");
});

test("template selections carry a canonical route slug and readable name into the project brief", () => {
  for (const template of websiteConcepts) {
    const url = new URL(templateInquiryUrl(template), "https://avaloncreative.group");
    assert.equal(url.origin, "https://avaloncreative.group");
    assert.equal(url.pathname, "/start");
    assert.equal(url.searchParams.get("template"), template.templateSlug);
    assert.equal(url.searchParams.get("templateName"), template.name);
  }
});

test("filters combine with normalized multi-word searches", () => {
  assert.equal(filterWebsiteConcepts("All templates", "").length, 20);
  assert.equal(filterWebsiteConcepts("All templates", "  SLOW   FORM  ")[0].slug, "slow-form");
  assert.equal(filterWebsiteConcepts("Travel & places", "Dune")[0].slug, "dune-house");
  assert.equal(filterWebsiteConcepts("Industry & impact", "Dune").length, 0);
  assert.equal(filterWebsiteConcepts("All templates", "no-such-template").length, 0);
  assert.equal(filterWebsiteConcepts("All templates", "education").length, 2);
});

test("templates are added after the existing projects and remain in homepage Work", async () => {
  const [work, templates, completed, projectsPage] = await Promise.all([
    readFile("components/campaign-studies.tsx", "utf8"),
    readFile("components/website-concepts.tsx", "utf8"),
    readFile("lib/completed-projects.ts", "utf8"),
    readFile("app/projects/page.tsx", "utf8"),
  ]);
  assert.ok(work.includes('id="work"'));
  assert.ok(work.includes("<WebsiteConcepts />"));
  assert.ok(work.includes('href="/projects"'));
  assert.match(templates, /Preview interactions use sample data/);
  assert.doesNotMatch(templates, /fictional|github/i);
  assert.match(templates, /id="website-concepts-title"/);
  assert.match(templates, /id="website-templates-title"/);
  assert.match(projectsPage, /href="#website-templates-title"/);
  assert.match(projectsPage, /Explore 20 website templates/);
  assert.ok(projectsPage.indexOf('<WebsiteConcepts headingLevel={2} standalone />') > projectsPage.indexOf('aria-label="Completed project collection"'));
  assert.ok(projectsPage.indexOf('<WebsiteConcepts headingLevel={2} standalone />') < projectsPage.indexOf('aria-labelledby="next-project-title"'));
  for (const template of websiteConcepts) assert.ok(!completed.includes(template.url));
});
