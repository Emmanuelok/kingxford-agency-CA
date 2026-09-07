import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Check the assets linked by the rendered page, not an unused chunk or source
// file. A restored build cache previously shipped the new HTML with old CSS.
const origin = process.argv[2];
async function fetchText(pathname) {
  const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `Expected deployed asset ${pathname}`);
  return response.text();
}
const html = origin
  ? await fetchText("/")
  : await readFile(".next/server/app/index.html", "utf8");
const stylesheets = [...html.matchAll(/<link\b[^>]*>/g)]
  .map(([tag]) => tag)
  .filter((tag) => /rel="stylesheet"/.test(tag))
  .map((tag) => tag.match(/href="([^"]+)"/)?.[1]);
assert.ok(stylesheets.length > 0, "Homepage must link its stylesheets");
const css = (await Promise.all(stylesheets.map((href) => {
  assert.ok(href?.startsWith("/_next/static/"), "Expected a local Next.js stylesheet");
  const pathname = new URL(href, "https://avalon.invalid").pathname;
  if (origin) return fetchText(pathname);
  return readFile(join(".next", pathname.replace(/^\/_next\//, "")), "utf8");
}))).join("\n");

for (const selector of [
  ".avalon-nav", ".avalon-discipline-strip", ".avalon-launchpad-head",
  ".avalon-launchpad-grid", ".avalon-launch-card", ".avalon-service-entry",
  ".avalon-footer", ".avalon-footer-wordmark",
]) {
  assert.ok(css.includes(selector), `Built homepage CSS is missing ${selector}`);
}
assert.match(css, /\.avalon-launchpad-grid\s*\{[^{}]*display:\s*grid\b/,
  "Workspace launchpad must retain its grid layout");
assert.match(css, /\.avalon-discipline-strip\s*\{[^{}]*display:\s*flex\b/,
  "Discipline strip must retain its flex layout");
console.log("PASS built homepage styles: identity, launchpad, services and footer");

const servicesHtml = origin
  ? await fetchText("/services")
  : await readFile(".next/server/app/services.html", "utf8");
const serviceImages = ["strategy", "brand", "campaigns", "content", "media", "search",
  "digital", "commerce", "production", "pr", "data", "ai"];
await Promise.all(serviceImages.map(async (id) => {
  const pathname = `/images/services/${id}.webp`;
  assert.ok(servicesHtml.includes(`${id}.webp`), `Services must render ${id} imagery`);
  let bytes;
  if (origin) {
    const response = await fetch(new URL(pathname, origin), { signal: AbortSignal.timeout(15000) });
    assert.equal(response.status, 200, `Expected service image ${id}`);
    bytes = Buffer.from(await response.arrayBuffer());
  } else {
    bytes = await readFile(join("public", pathname));
  }
  assert.ok(bytes.length > 512, `Service image ${id} must not be empty or truncated`);
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF", `Service image ${id} must be WebP`);
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP", `Service image ${id} must be WebP`);
}));
console.log("PASS all 12 rendered service images are present WebP assets");
