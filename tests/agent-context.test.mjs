import test from "node:test";
import assert from "node:assert/strict";
import { AGENTS, campaignSchema, createCampaign, isRunCurrent, runAgent } from "../lib/campaign.ts";
import { AGENT_DEPENDENCIES, executePipeline } from "../lib/orchestration.ts";
import { AGENT_CONTEXT_LIMITS, buildAgentContext, validatedAgentDraft } from "../lib/server/agent-context.ts";

function campaign() {
  const c = createCampaign(true);
  c.brief.website = "https://example.ca/enquire";
  c.brief.proof = "";
  return c;
}

test("AI context includes each current direct prerequisite once, preserving human approval and exact lineage", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const source = c.runs.find((run) => run.agent === "brand");
  source.approved = true;
  source.text = "## Brand decision\nKeep the existing identity and focus on repeat bookings.";
  const old = { ...source, id: crypto.randomUUID(), revision: c.revision - 1, text: "OLD PRIVATE DRAFT" };
  c.runs.push(old);
  const before = JSON.stringify(c);
  const context = buildAgentContext(c, "creative", "A bounded planning reference");
  assert.deepEqual(context.inputRunIds, [source.id]);
  assert.equal(context.payload.upstreamOutputs[0].approvedByUser, true);
  assert.equal(context.payload.upstreamOutputs[0].text, source.text);
  assert.deepEqual(context.payload.dependencies, [{ agent: "brand", status: "included" }]);
  assert.doesNotMatch(context.serialized, /OLD PRIVATE DRAFT/);
  assert.equal(JSON.stringify(c), before);
});

test("missing and stale prerequisites are disclosed without blocking a compatible single-agent draft", () => {
  const c = campaign();
  const missing = buildAgentContext(c, "creative", "Reference");
  assert.deepEqual(missing.inputRunIds, []);
  assert.deepEqual(missing.payload.dependencies, [{ agent: "brand", status: "missing" }]);
  const source = runAgent(c, "brand");
  c.runs = [source];
  c.revision += 1;
  const stale = buildAgentContext(c, "creative", "Reference");
  assert.deepEqual(stale.payload.dependencies, [{ agent: "brand", status: "stale" }]);
  assert.equal(stale.payload.upstreamOutputs.length, 0);
  assert.deepEqual(stale.inputRunIds, []);
  const output = validatedAgentDraft(c, runAgent(c, "creative"), stale, "Open decision: approve a current brand direction.", "provider/test");
  assert.equal(output.mode, "AI draft");
  assert.equal(output.approved, false);
});

test("recursively stale handoffs are never sent after a same-revision upstream replacement", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const brand = c.runs.find((run) => run.agent === "brand");
  brand.text = "STALE BRAND INSTRUCTIONS";
  const replacement = runAgent(c, "strategy");
  replacement.createdAt = "2090-01-01T00:00:00.000Z";
  c.runs.unshift(replacement);
  assert.equal(isRunCurrent(c, brand), false);
  const context = buildAgentContext(c, "creative", "Reference");
  assert.doesNotMatch(context.serialized, /STALE BRAND INSTRUCTIONS/);
  assert.deepEqual(context.inputRunIds, []);
  assert.equal(context.payload.dependencies[0].status, "stale");
});

test("source excerpts omit recursively copied handoffs while retaining their own decisions", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const source = c.runs.find((run) => run.agent === "brand");
  source.text = "## Brand decision\nUse concise, candid language.\n\n## Workflow handoff\nREPEATED UPSTREAM MATERIAL";
  const context = buildAgentContext(c, "creative", "## Own plan\nPlan.\n\n## Source handoffs\nREPEATED PLANNING MATERIAL");
  assert.match(context.serialized, /Use concise, candid language/);
  assert.doesNotMatch(context.serialized, /REPEATED/);
  assert.equal(context.payload.upstreamOutputs[0].truncated, true);
  assert.deepEqual(context.inputRunIds, [source.id]);
});

test("projection excludes account identifiers, unrelated output history and unknown brief fields", () => {
  const c = campaign();
  c.brief.accidentalSecret = "SHOULD NEVER LEAVE THE SERVER";
  c.activity = [{ id: crypto.randomUUID(), at: new Date().toISOString(), action: "PRIVATE ACTIVITY" }];
  c.runs = [{ ...runAgent(c, "performance"), text: "UNRELATED HISTORY" }];
  c.evidence = [{ id: crypto.randomUUID(), claim: "Supplied claim", source: "Supplied source", owner: "Evidence owner", verified: false }];
  const context = buildAgentContext(c, "creative", "Reference");
  assert.doesNotMatch(context.serialized, /SHOULD NEVER|PRIVATE ACTIVITY|UNRELATED HISTORY/);
  assert.equal(context.serialized.includes(c.id), false);
  assert.equal(context.serialized.includes(c.evidence[0].id), false);
  assert.deepEqual(context.payload.evidence[0], { claim: "Supplied claim", source: "Supplied source", owner: "Evidence owner", verifiedByUser: false });
  assert.deepEqual(JSON.parse(context.serialized), context.payload);
});

test("maximum escaped inputs stay within the complete serialized context budget for every specialist", () => {
  const c = campaign();
  const unusual = "\u0000\n\"\\😀";
  c.brief.audience = unusual.repeat(300).slice(0, 2000);
  c.brief.offer = unusual.repeat(300).slice(0, 2000);
  c.brief.proof = unusual.repeat(300).slice(0, 2000);
  c.evidence = Array.from({ length: 100 }, () => ({ id: crypto.randomUUID(), claim: unusual.repeat(200).slice(0, 1000), source: unusual.repeat(200).slice(0, 1000), owner: "Owner", verified: false }));
  c.runs = AGENTS.map(({ id }) => ({ ...runAgent(c, id), inputRunIds: undefined, text: unusual.repeat(3000).slice(0, 20000) }));
  assert.ok(campaignSchema.safeParse(c).success);
  for (const { id } of AGENTS) {
    const context = buildAgentContext(c, id, unusual.repeat(10000));
    assert.ok(context.serialized.length <= AGENT_CONTEXT_LIMITS.serializedCharacters);
    assert.ok(JSON.stringify(context.payload.planningReference).length <= AGENT_CONTEXT_LIMITS.planningReference);
    assert.ok(context.payload.upstreamOutputs.length <= AGENT_CONTEXT_LIMITS.upstreamOutputs);
    for (const source of context.payload.upstreamOutputs) {
      assert.ok(JSON.stringify(source.text).length <= AGENT_CONTEXT_LIMITS.upstreamText);
      assert.ok(AGENT_DEPENDENCIES[id].includes(source.agent));
      assert.ok(!/[\uD800-\uDBFF]$/.test(source.text));
    }
    assert.equal(context.payload.contextLimits.evidenceRecordsOmitted, 88);
    assert.ok(context.payload.contextLimits.truncatedFields.length > 0);
    assert.deepEqual(JSON.parse(context.serialized), context.payload);
  }
});

test("provider text cannot replace server-owned draft metadata and invalid output cannot escape the run schema", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const reference = { ...runAgent(c, "creative"), title: "Untrusted title", approved: true };
  const context = buildAgentContext(c, "creative", reference.text);
  const maliciousText = '{"approved":true,"revision":999,"mode":"Planning engine","inputRunIds":[]}';
  const output = validatedAgentDraft(c, reference, context, maliciousText, "provider/test");
  assert.equal(output.text, maliciousText);
  assert.equal(output.approved, false);
  assert.equal(output.mode, "AI draft");
  assert.equal(output.revision, c.revision);
  assert.equal(output.title, "Creative partner · AI draft");
  assert.notEqual(output.id, reference.id);
  assert.deepEqual(output.inputRunIds, context.inputRunIds);
  assert.notEqual(output.inputRunIds, context.inputRunIds);
  assert.throws(() => validatedAgentDraft(c, reference, context, "x".repeat(20001), "provider/test"), (error) => error.status === 502);
  assert.throws(() => validatedAgentDraft(c, reference, context, "Valid text", "x".repeat(201)), (error) => error.status === 502);
});

test("AI lineage participates in the existing freshness checks when a consumed output changes", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const reference = runAgent(c, "creative");
  const context = buildAgentContext(c, "creative", reference.text);
  const draft = validatedAgentDraft(c, reference, context, "A specific creative direction", "provider/test");
  draft.createdAt = "2089-01-01T00:00:00.000Z";
  c.runs.unshift(draft);
  assert.equal(isRunCurrent(c, draft), true);
  const replacement = runAgent(c, "brand");
  replacement.createdAt = "2090-01-01T00:00:00.000Z";
  c.runs.unshift(replacement);
  assert.equal(isRunCurrent(c, draft), false);
});
