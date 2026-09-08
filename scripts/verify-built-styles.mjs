import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Check the assets linked by the rendered page, not an unused chunk or source
// file. A restored build cache previously shipped the new HTML with old CSS.
const origin = process.argv[2];
const workspaceEnabled = process.env.NEXT_PUBLIC_AVALON_WORKSPACE_ENABLED === "true";
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
  ".avalon-nav", ".avalon-discipline-strip",
  ...(workspaceEnabled ? [".avalon-launchpad-head"] : []),
  ".avalon-service-entry",
  ".avalon-footer", ".avalon-footer-wordmark",
]) {
  assert.ok(css.includes(selector), `Built homepage CSS is missing ${selector}`);
}
assert.match(css, /\.avalon-discipline-strip\s*\{[^{}]*display:\s*flex\b/,
  "Discipline strip must retain its flex layout");

// Resolve module class names from the actual rendered elements. A stale global
// launchpad rule cannot make this check pass after the interactive replacement.
function journeyDeclarations(part) {
  const tag = html.match(new RegExp(`<[^>]+\\bdata-journey="${part}"[^>]*>`))?.[0];
  assert.ok(tag, `Homepage must render the journey ${part}`);
  const classes = tag.match(/class="([^"]+)"/)?.[1].split(/\s+/).filter(Boolean) ?? [];
  assert.ok(classes.length && !classes.includes("undefined"), `Journey ${part} needs valid module classes`);
  return classes.flatMap((className) => {
    const escaped = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return [...css.matchAll(new RegExp(`\\.${escaped}\\s*\\{([^{}]*)\\}`, "g"))].map((match) => match[1]);
  }).join(";");
}
if (workspaceEnabled) {
const explorer = journeyDeclarations("explorer");
assert.match(explorer, /background(?:-color)?:\s*[^;}]+/, "Journey explorer must retain its visible surface");
assert.match(explorer, /(?:^|;)\s*color:\s*[^;}]+/, "Journey explorer must retain its foreground colour");
for (const part of ["tabs", "canvas"]) {
  const declarations = journeyDeclarations(part);
  assert.match(declarations, /display:\s*grid\b/, `Journey ${part} must retain grid layout`);
  assert.match(declarations, /grid-template-columns:\s*[^;}]+/, `Journey ${part} must retain responsive columns`);
}
} else {
  assert.doesNotMatch(html, /data-journey="explorer"/, "Unpublished workspace explorer must not render");
  assert.doesNotMatch(html, /href="\/(?:platform|tools|studio)(?:[/?#"])/, "Unpublished tools must not have public entry links");
}
console.log(`PASS built homepage styles: identity, ${workspaceEnabled ? "rendered journey explorer" : "agency-only navigation"}, services and footer`);

const servicesHtml = origin
  ? await fetchText("/services")
  : await readFile(".next/server/app/services.html", "utf8");
const serviceImages = ["strategy", "brand", "campaigns", "content", "media", "search",
  "digital", "commerce", "production", "pr", "data", "ai"];
await Promise.all(serviceImages.map(async (id) => {
  const pathname = `/images/services/${id}-v4.webp`;
  assert.ok(servicesHtml.includes(`${id}-v4.webp`), `Services must render ${id} imagery`);
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
