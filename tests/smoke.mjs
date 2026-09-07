import { spawn } from "node:child_process";
import { createServer } from "node:net";
import assert from "node:assert/strict";
const port = await new Promise((resolve) => {
  const s = createServer();
  s.listen(0, "127.0.0.1", () => {
    const p = s.address().port;
    s.close(() => resolve(p));
  });
});
const origin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: origin,
      SUPABASE_URL: "",
      SUPABASE_PUBLISHABLE_KEY: "",
      AI_GATEWAY_API_KEY: "",
      KINGXFORD_AI_ENABLED: "false",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let output = "";
server.stdout.on("data", (v) => (output += v));
server.stderr.on("data", (v) => (output += v));
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(origin + "/api/health");
      if (r.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(ready, "Production server did not start");
  const routes = [
    "/",
    "/platform",
    "/tools",
    "/studio",
    "/studio/workbench",
    "/services",
    "/solutions",
    "/industries",
    "/about",
    "/pricing",
    "/start",
    "/privacy",
    "/accessibility",
    "/responsible-advertising",
    "/robots.txt",
    "/sitemap.xml",
    "/favicon.svg",
    "/video/kingxford-original-hero.mp4",
    "/video/kingxford-original-hero-mobile.mp4",
  ];
  for (const route of routes) {
    const r = await fetch(origin + route);
    assert.equal(r.status, 200, route);
    if (route === "/") {
      const html = await r.text();
      assert.ok(html.includes("AVALON"), "Avalon identity is rendered");
      assert.ok(html.includes("/platform?view=workflows"), "Workflow entry is rendered");
    }
    console.log("PASS", route);
  }
  const optimizedImage = await fetch(origin + "/_next/image?url=%2Fimages%2Fhero-research-wall.webp&w=640&q=75");
  assert.equal(optimizedImage.status, 200, "Optimized hero poster");
  assert.ok(optimizedImage.headers.get("content-type")?.startsWith("image/"));
  console.log("PASS optimized original hero poster");
  const status = await fetch(origin + "/api/workspace/status");
  const state = await status.json();
  assert.equal(state.cloud, false);
  assert.equal(state.ai, false);
  assert.equal(state.email, null);
  assert.equal((await fetch(origin + "/api/workspace")).status, 503);
  const denied = await fetch(origin + "/api/agents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://untrusted.invalid",
    },
    body: "{}",
  });
  assert.equal(denied.status, 403);
  const disabled = await fetch(origin + "/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: "{}",
  });
  assert.equal(disabled.status, 503);
  const badLogin = await fetch(origin + "/api/workspace/session", {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: '{"email":"not-email","password":""}',
  });
  assert.equal(badLogin.status, 400);
  assert.equal((await fetch(origin + "/missing-page")).status, 404);
  const secure = await fetch(origin + "/services");
  assert.equal(secure.headers.get("x-content-type-options"), "nosniff");
  assert.equal(secure.headers.get("x-powered-by"), null);
  console.log(
    "PASS disabled integration boundaries, CSRF, validation, security headers, branded 404",
  );
} catch (e) {
  console.error(output);
  throw e;
} finally {
  server.kill("SIGTERM");
}
