import test from "node:test";
import assert from "node:assert/strict";
import {
  ApiError, integrationConfig, hasWorkspaceAccess,
  sameOrigin, readJson, ownerHeader, providerDraft,
} from "../lib/server/guards.ts";

const configured = {
  SUPABASE_URL: "https://agency.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
  AI_GATEWAY_API_KEY: "test-only-key",
  AVALON_AI_MODEL: "provider/example-model",
  AVALON_AI_ENABLED: "true",
};
const isStatus = (status) => (e) => e instanceof ApiError && e.status === status;
const jwt = (role) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;

test("cloud activation refuses privileged keys and insecure remote endpoints", () => {
  assert.equal(integrationConfig(configured).cloud, true);
  for (const key of ["sb_secret_do_not_accept", jwt("service_role"), jwt("authenticated"), "invalid"]) {
    assert.equal(integrationConfig({ ...configured, SUPABASE_PUBLISHABLE_KEY: key }).cloud, false);
  }
  assert.equal(integrationConfig({ ...configured, SUPABASE_PUBLISHABLE_KEY: jwt("anon") }).cloud, true);
  for (const url of ["http://agency.supabase.co", "https://user:password@agency.supabase.co", "not a URL"]) {
    assert.equal(integrationConfig({ ...configured, SUPABASE_URL: url }).cloud, false);
  }
});

test("Avalon AI settings retain legacy compatibility and explicit disable wins", () => {
  assert.equal(integrationConfig(configured).ai, true);
  assert.equal(integrationConfig({ ...configured, AVALON_AI_ENABLED: "false", KINGXFORD_AI_ENABLED: "true" }).ai, false);
  assert.equal(integrationConfig({ ...configured, AVALON_AI_MODEL: "", KINGXFORD_AI_MODEL: "provider/old" }).ai, false);
  assert.equal(integrationConfig({ ...configured, AVALON_AI_MODEL: undefined, AVALON_AI_ENABLED: undefined, KINGXFORD_AI_MODEL: "provider/old", KINGXFORD_AI_ENABLED: "true" }).ai, true);
  for (const model of ["no-provider", "provider/model\nInjected", "provider/" + "a".repeat(201)]) {
    assert.equal(integrationConfig({ ...configured, AVALON_AI_MODEL: model }).ai, false);
  }
  assert.equal(integrationConfig({ ...configured, SUPABASE_URL: "" }).ai, false);
});

test("entitlement only accepts invited non-anonymous app metadata", () => {
  assert.equal(hasWorkspaceAccess(null), false);
  assert.equal(hasWorkspaceAccess({ app_metadata: { kingxford_access: true } }), true);
  assert.equal(hasWorkspaceAccess({ app_metadata: { kingxford_access: "true" } }), false);
  assert.equal(hasWorkspaceAccess({ user_metadata: { kingxford_access: true } }), false);
  assert.equal(hasWorkspaceAccess({ is_anonymous: true, app_metadata: { kingxford_access: true } }), false);
});

test("write boundary enforces exact origin and JSON media type", () => {
  const req = (origin, contentType = "application/json") => new Request("https://avalon.example/api/agents", {
    method: "POST", headers: { ...(origin ? { Origin: origin } : {}), "Content-Type": contentType }, body: "{}",
  });
  sameOrigin(req("https://avalon.example"), "https://avalon.example");
  sameOrigin(req("https://avalon.example", "Application/JSON; charset=utf-8"), "https://avalon.example");
  for (const origin of [null, "null", "https://evil.example", "https://avalon.example.evil.example"]) {
    assert.throws(() => sameOrigin(req(origin), "https://avalon.example"), isStatus(403));
  }
  for (const type of ["text/plain", "text/application/json", "application/json-malicious"]) {
    assert.throws(() => sameOrigin(req("https://avalon.example", type), "https://avalon.example"), isStatus(415));
  }
  assert.throws(() => sameOrigin(req("https://avalon.example"), "broken config"), isStatus(503));
});

test("bounded JSON parsing counts bytes, checks declared size, and rejects invalid UTF-8", async () => {
  assert.deepEqual(await readJson(new Response('{"title":"Montréal"}')), { title: "Montréal" });
  await assert.rejects(() => readJson(new Response('"éé"'), 5), isStatus(413));
  await assert.rejects(() => readJson(new Response("{}", { headers: { "Content-Length": "1000" } }), 10), isStatus(413));
  await assert.rejects(() => readJson(new Response('{"broken":')), isStatus(400));
  await assert.rejects(() => readJson(new Response(new Uint8Array([34, 255, 34]))), isStatus(400));
  await assert.rejects(() => readJson(new Response(null)), isStatus(400));
});

test("streamed requests cannot evade body limit without Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(12)); },
    cancel() { cancelled = true; },
  });
  await assert.rejects(() => readJson(new Response(stream), 20), isStatus(413));
  assert.equal(cancelled, true);
});

test("owner headers preserve compatibility and new header has precedence", () => {
  assert.equal(ownerHeader(new Request("https://avalon.example", { headers: { "X-Kingxford-Owner": "legacy" } })), "legacy");
  assert.equal(ownerHeader(new Request("https://avalon.example", { headers: { "X-Kingxford-Owner": "legacy", "X-Avalon-Owner": "current" } })), "current");
});

test("provider drafts reject refusals, truncation, tools, empty and oversized output", () => {
  const response = (content, finish_reason = "stop", refusal = null) => ({ choices: [{ finish_reason, message: { content, refusal } }] });
  assert.equal(providerDraft(response("  A practical draft.  ")), "A practical draft.");
  assert.throws(() => providerDraft(response("partial", "length")), isStatus(502));
  assert.throws(() => providerDraft(response("", "content_filter")), isStatus(422));
  assert.throws(() => providerDraft(response("", "stop", "Cannot help")), isStatus(422));
  for (const bad of [null, {}, response(""), response("x".repeat(20001)), response([], "stop"), response("tools", "tool_calls"), response("text", null)]) {
    assert.throws(() => providerDraft(bad), isStatus(502));
  }
});
