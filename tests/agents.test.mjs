import test from "node:test";
import assert from "node:assert/strict";
import {
  AGENTS, CHECKS, campaignSchema, workspaceSchema, createCampaign, changed,
  runAgent, approveRun, isRunCurrent, latestAgentRuns, readiness, forecast, contentCalendar,
} from "../lib/campaign.ts";
import {
  AGENT_DEPENDENCIES, PIPELINES, resolvePipelineAgents, planPipeline,
  executePipeline, qualityChecks, campaignIntelligence,
} from "../lib/orchestration.ts";

function campaign() {
  const c = createCampaign(true);
  c.brief.website = "https://example.ca/enquire";
  c.brief.launchDate = "2026-10-01";
  c.brief.proof = "";
  return c;
}

test("every selected workflow includes all prerequisites exactly once in dependency order", () => {
  for (const pipeline of PIPELINES) {
    const ids = resolvePipelineAgents(pipeline.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) {
      assert.ok(AGENTS.some((agent) => agent.id === id));
      for (const dep of AGENT_DEPENDENCIES[id]) {
        assert.ok(ids.indexOf(dep) >= 0 && ids.indexOf(dep) < ids.indexOf(id), `${dep} must precede ${id}`);
      }
    }
  }
  assert.ok(!resolvePipelineAgents("creative-system").includes("media"));
  assert.equal(resolvePipelineAgents("market-entry").length, AGENTS.length);
});

test("workflow preview is pure and incomplete briefs cannot generate context-free drafts", () => {
  const c = createCampaign();
  const before = JSON.stringify(c);
  const plan = planPipeline(c, "full-launch");
  assert.equal(plan.ready, false);
  assert.ok(plan.steps.every((step) => step.status === "blocked"));
  assert.match(plan.blockers[0], /brand, audience, offer/);
  assert.equal(JSON.stringify(c), before);
  const result = executePipeline(c, "full-launch");
  assert.equal(result.runs.length, 0);
  assert.equal(result.campaign, c);
});

test("workflow execution persists valid drafts and explicit dependency lineage without approval", () => {
  const c = campaign();
  c.checks = { signoff: true };
  const original = JSON.stringify(c);
  const result = executePipeline(c, "full-launch");
  assert.equal(JSON.stringify(c), original);
  assert.equal(result.runs.length, resolvePipelineAgents("full-launch").length);
  assert.equal(result.campaign.revision, c.revision);
  assert.equal(result.campaign.checks.signoff, false);
  assert.equal(result.campaign.activity.length, 1);
  assert.ok(campaignSchema.safeParse(result.campaign).success);
  for (const output of result.runs) {
    assert.equal(output.mode, "Planning engine");
    assert.equal(output.approved, false);
    assert.equal(output.inputRunIds.length, AGENT_DEPENDENCIES[output.agent].length);
    assert.equal(isRunCurrent(result.campaign, output), true);
    for (const input of output.inputRunIds) {
      assert.ok(result.runs.findIndex((r) => r.id === input) < result.runs.indexOf(output));
      assert.ok(output.text.includes(input));
    }
  }
});

test("unchanged workflow reuses current drafts and produces no duplicate activity", () => {
  const first = executePipeline(campaign(), "creative-system");
  const second = executePipeline(first.campaign, "creative-system");
  assert.equal(second.runs.length, 0);
  assert.equal(second.reused.length, first.runs.length);
  assert.equal(second.campaign, first.campaign);
});

test("forced regeneration replaces all downstream handoffs while retaining bounded history", () => {
  const first = executePipeline(campaign(), "full-launch");
  const second = executePipeline(first.campaign, "full-launch", { reuseCurrent: false });
  assert.equal(second.runs.length, first.runs.length);
  assert.equal(second.reused.length, 0);
  assert.equal(second.campaign.revision, first.campaign.revision);
  assert.ok(second.runs.every((run) => !first.runs.some((old) => old.id === run.id)));
  assert.equal(readiness(second.campaign).stale, 0);
  assert.ok(second.runs.every((run) => isRunCurrent(second.campaign, run)));
});

test("approval-gated workflows stop at the next dependency barrier", () => {
  const first = executePipeline(campaign(), "full-launch", { requireApprovedDependencies: true });
  assert.deepEqual(first.runs.map((r) => r.agent), ["strategy"]);
  assert.ok(first.blocked.length > 0);
  const stillPending = executePipeline(first.campaign, "full-launch", { requireApprovedDependencies: true });
  assert.equal(stillPending.runs.length, 0);
  const approved = approveRun(first.campaign, first.runs[0].id);
  const second = executePipeline(approved, "full-launch", { requireApprovedDependencies: true });
  assert.deepEqual(second.runs.map((r) => r.agent), ["brand"]);
  assert.ok(second.reused.includes("strategy"));
});

test("strict workflows cannot silently reuse a cached downstream draft with unapproved inputs", () => {
  const c = executePipeline(campaign(), "creative-system").campaign;
  const plan = planPipeline(c, "creative-system", { requireApprovedDependencies: true });
  assert.equal(plan.steps.find((step) => step.agent === "strategy").status, "reuse");
  assert.equal(plan.steps.find((step) => step.agent === "brand").status, "blocked");
});

test("brief mutations invalidate all workflow outputs, checks and cached handoffs", () => {
  const first = executePipeline(campaign(), "full-launch");
  const edited = changed(first.campaign, { brief: { ...first.campaign.brief, offer: "A newly priced offer" } }, "Changed offer");
  assert.equal(readiness(edited).stale, first.runs.length);
  assert.deepEqual(edited.checks, {});
  const plan = planPipeline(edited, "full-launch");
  assert.ok(plan.steps.every((step) => step.status === "ready"));
  const refreshed = executePipeline(edited, "full-launch");
  assert.equal(readiness(refreshed.campaign).stale, 0);
});

test("same-revision upstream replacement recursively invalidates dependent approvals", () => {
  let c = executePipeline(campaign(), "creative-system").campaign;
  const originalStrategy = latestAgentRuns(c).find((r) => r.agent === "strategy");
  const content = latestAgentRuns(c).find((r) => r.agent === "content");
  c = approveRun(c, content.id);
  const replacement = runAgent(c, "strategy");
  c = changed(c, { runs: [replacement, ...c.runs] }, "Regenerated strategy");
  assert.equal(c.revision, 1);
  assert.equal(isRunCurrent(c, replacement), true);
  assert.equal(isRunCurrent(c, originalStrategy), false);
  assert.equal(isRunCurrent(c, c.runs.find((r) => r.id === content.id)), false);
  assert.throws(() => approveRun(c, content.id), /current specialist output/);
  assert.ok(readiness(c).stale > 1);
  assert.ok(!qualityChecks(c).find((check) => check.id === "approvals").passed);
  const refresh = executePipeline(c, "creative-system");
  assert.deepEqual(refresh.reused, ["strategy"]);
  assert.equal(readiness(refresh.campaign).stale, 0);
});

test("broken or circular imported lineage is treated as stale without recursive failure", () => {
  const c = campaign();
  const a = runAgent(c, "strategy");
  const b = runAgent(c, "brand");
  a.inputRunIds = [b.id];
  b.inputRunIds = [a.id];
  c.runs = [a, b];
  assert.equal(isRunCurrent(c, a), false);
  assert.equal(isRunCurrent(c, b), false);
  b.inputRunIds = [crypto.randomUUID()];
  assert.equal(isRunCurrent(c, b), false);
  assert.throws(() => approveRun(c, b.id), /current specialist output/);
});

test("only the exact latest output can be approved and reopening invalidates final signoff", () => {
  let c = campaign();
  const old = runAgent(c, "strategy");
  const latest = runAgent(c, "strategy");
  c.runs = [latest, old];
  assert.throws(() => approveRun(c, old.id), /current specialist output/);
  assert.throws(() => approveRun(c, crypto.randomUUID()), /no longer exists/);
  c = approveRun(c, latest.id);
  c.checks.signoff = true;
  const next = approveRun(c, latest.id, false);
  assert.equal(next.runs.find((r) => r.id === latest.id).approved, false);
  assert.equal(next.checks.signoff, false);
});

test("history compaction retains all current specialist outputs within the v2 maximum", () => {
  let c = campaign();
  for (let iteration = 0; iteration < 8; iteration++) {
    c = executePipeline(c, "market-entry", { reuseCurrent: false }).campaign;
  }
  assert.equal(c.runs.length, 100);
  assert.equal(latestAgentRuns(c).length, AGENTS.length);
  assert.equal(readiness(c).stale, 0);
  assert.ok(campaignSchema.safeParse(c).success);
});

test("existing v2 exports without lineage or performance still roundtrip", () => {
  const c = campaign();
  c.runs = [runAgent(c, "strategy")];
  assert.equal(c.runs[0].inputRunIds, undefined);
  const workspace = { version: 2, activeId: c.id, campaigns: [c] };
  assert.ok(workspaceSchema.safeParse(JSON.parse(JSON.stringify(workspace))).success);
  assert.equal(isRunCurrent(c, c.runs[0]), true);
});

test("duplicate dependency references are rejected at the import boundary", () => {
  const c = campaign();
  const input = crypto.randomUUID();
  c.runs = [{ ...runAgent(c, "brand"), inputRunIds: [input, input] }];
  assert.equal(campaignSchema.safeParse(c).success, false);
});

test("quality rules never equate all human checkbox marks to launch readiness", () => {
  const c = createCampaign();
  c.checks = Object.fromEntries(CHECKS.map(([id]) => [id, true]));
  const intelligence = campaignIntelligence(c);
  assert.equal(intelligence.status, "Needs attention");
  assert.ok(intelligence.blockers.some((check) => check.id === "brief"));
  assert.ok(intelligence.blockers.some((check) => check.id === "deliverables"));
  assert.ok(intelligence.blockers.some((check) => check.id === "destination"));
  assert.equal(intelligence.nextActions[0].severity, "blocker");
});

test("zero media allocation and infeasible budgets produce explicit decision blockers", () => {
  const c = campaign();
  c.media = c.media.map((row) => ({ ...row, weight: 0 }));
  assert.ok(qualityChecks(c).some((check) => check.id === "allocation" && !check.passed));
  c.brief.budget = 1;
  assert.ok(qualityChecks(c).some((check) => check.id === "budget" && !check.passed));
  const report = runAgent(c, "performance").text;
  assert.match(report, /Budget is infeasible/);
  assert.doesNotMatch(report, /Base: .*modelled customers/);
});

test("media allocation reconciles exact fractional weights and all acquisition costs stay null at zero conversions", () => {
  const c = campaign();
  c.brief.budget = 1234.56;
  c.brief.agencyFee = 100.01;
  c.brief.productionCost = 200.02;
  c.media = [0.25, 1.5, 2.25].map((weight) => ({ channel: "Search", weight, cpc: 2, cvr: 0 }));
  const f = forecast(c);
  assert.ok(Math.abs(f.allocated - 934.53) < 1e-9);
  assert.equal(f.unallocated, 0);
  assert.equal(f.cpa, null);
  assert.equal(f.fullyLoadedCac, null);
  assert.equal(f.contribution, -1234.56);
});

test("small campaigns receive content and strategy horizons within their actual duration", () => {
  const c = campaign();
  c.brief.weeks = 1;
  const items = contentCalendar(c);
  assert.equal(items.length, 12);
  assert.equal(items[0].date, "2026-10-01");
  assert.equal(items.at(-1).date, "2026-10-07");
  const report = runAgent(c, "strategy").text;
  assert.match(report, /Discovery \(1 planned days\)/);
  assert.doesNotMatch(report, /Weeks 3–4/);
});

test("maximum imported fields and evidence ledgers produce schema-safe specialist outputs", () => {
  const c = campaign();
  c.brief.audience = "a".repeat(2000);
  c.brief.offer = "o".repeat(2000);
  c.brief.proof = "p".repeat(2000);
  c.brief.voice = "v".repeat(300);
  c.evidence = Array.from({ length: 100 }, () => ({ id: crypto.randomUUID(), claim: "c".repeat(1000), source: "s".repeat(1000), owner: "x".repeat(100), verified: true }));
  c.tasks = Array.from({ length: 200 }, () => ({ id: crypto.randomUUID(), title: "t".repeat(300), owner: "o".repeat(100), due: "2026-10-01", done: false }));
  const result = executePipeline(c, "market-entry");
  assert.ok(result.runs.every((run) => run.text.length <= 20000));
  assert.ok(campaignSchema.safeParse(result.campaign).success);
});

test("performance specialist distinguishes observed media contribution from total campaign contribution", () => {
  const c = campaign();
  assert.match(runAgent(c, "performance").text, /No observed performance has been supplied/);
  c.performance = { rows: [{ id: crypto.randomUUID(), date: "2026-10-01", channel: "Search", spend: 100, impressions: 1000, clicks: 100, leads: 10, customers: 2, revenue: 1000, source: "Account export" }] };
  const report = runAgent(c, "performance").text;
  assert.match(report, /Reported results/);
  assert.match(report, /Media contribution: CAD 350.00/);
  assert.match(report, /excludes agency fees and production/);
  assert.doesNotMatch(report, /No observed performance/);
});

test("performance imports invalidate stale analysis and clear release checks", () => {
  const c = executePipeline(campaign(), "growth-loop").campaign;
  c.checks = { signoff: true };
  const next = changed(c, { performance: { rows: [] } }, "Changed observations");
  assert.equal(next.revision, c.revision + 1);
  assert.deepEqual(next.checks, {});
  assert.ok(readiness(next).stale > 0);
});

test("invalid experiment targets and impossible observed counts cannot pass quality gates", () => {
  const c = campaign();
  c.experiment.baseline = 60;
  c.experiment.lift = 100;
  assert.equal(qualityChecks(c).find((check) => check.id === "experiment").passed, false);
  c.experiment = { ...c.experiment, baseline: 3, lift: 20, controlVisitors: 4, controlConversions: 5 };
  assert.equal(qualityChecks(c).find((check) => check.id === "experiment").passed, false);
  assert.match(runAgent(c, "performance").text, /conversions exceed visitors/);
});

test("unknown workflow or specialist requests fail explicitly", () => {
  assert.throws(() => planPipeline(campaign(), "unknown"), /Unknown workflow/);
  assert.throws(() => executePipeline(campaign(), "unknown"), /Unknown workflow/);
  assert.throws(() => runAgent(campaign(), "unknown"), /Unknown specialist/);
});

test("delivery and release outputs become stale after mutable task or content changes", () => {
  let c = executePipeline(campaign(), "full-launch").campaign;
  const delivery = latestAgentRuns(c).find((r) => r.agent === "delivery");
  const review = latestAgentRuns(c).find((r) => r.agent === "review");
  c = approveRun(c, delivery.id);
  const next = changed(c, { tasks: [{ id: crypto.randomUUID(), title: "Test booking confirmation", owner: "", due: "2026-10-01", done: false }] }, "Added release task");
  assert.equal(next.revision, c.revision);
  assert.equal(isRunCurrent(next, delivery), false);
  assert.equal(isRunCurrent(next, review), false);
  assert.throws(() => approveRun(next, delivery.id), /current specialist output/);
  const refreshed = executePipeline(next, "full-launch");
  assert.ok(refreshed.runs.some((run) => run.agent === "delivery"));
  assert.ok(refreshed.runs.some((run) => run.agent === "review"));
  assert.ok(refreshed.reused.includes("creative"));
  const edited = changed(refreshed.campaign, { content: contentCalendar(refreshed.campaign) }, "Created content drafts");
  assert.equal(isRunCurrent(edited, latestAgentRuns(refreshed.campaign).find((r) => r.agent === "delivery")), false);
});

test("review fingerprints track non-signoff human checks without an approval cycle", () => {
  let c = executePipeline(campaign(), "full-launch").campaign;
  const review = latestAgentRuns(c).find((r) => r.agent === "review");
  c = approveRun(c, review.id);
  assert.equal(isRunCurrent(c, c.runs.find((r) => r.id === review.id)), true);
  const signed = changed(c, { checks: { ...c.checks, signoff: true } }, "Client signed off");
  assert.equal(isRunCurrent(signed, signed.runs.find((r) => r.id === review.id)), true);
  const checked = changed(signed, { checks: { ...signed.checks, rights: true } }, "Verified usage rights");
  assert.equal(isRunCurrent(checked, checked.runs.find((r) => r.id === review.id)), false);
  const currentDelivery = latestAgentRuns(checked).find((r) => r.agent === "delivery");
  assert.equal(isRunCurrent(checked, currentDelivery), true);
});

test("approval changes and task reordering alone do not create false source changes", () => {
  let c = campaign();
  c.tasks = ["Review booking", "Test events"].map((title) => ({ id: crypto.randomUUID(), title, owner: "Account owner", due: "2026-10-01", done: false }));
  c = executePipeline(c, "full-launch").campaign;
  const delivery = latestAgentRuns(c).find((r) => r.agent === "delivery");
  const strategy = latestAgentRuns(c).find((r) => r.agent === "strategy");
  c = approveRun(c, strategy.id);
  const reordered = changed(c, { tasks: [...c.tasks].reverse() }, "Reordered tasks");
  assert.equal(isRunCurrent(reordered, delivery), true);
});

test("downstream workflow reports retain substantive upstream decisions and review runs last", () => {
  const c = campaign();
  const strategy = runAgent(c, "strategy");
  strategy.text = "# Strategy\n\n## Strategic decision\nPrioritise repeat bookings from existing customers before expanding paid acquisition.\n\n## Constraints\nA named owner must approve the first test.";
  strategy.approved = true;
  c.runs = [strategy];
  const result = executePipeline(c, "full-launch");
  const brand = result.runs.find((run) => run.agent === "brand");
  assert.match(brand.text, /Prioritise repeat bookings from existing customers/);
  assert.match(brand.text, /upstream output excerpt/);
  assert.equal(result.runs.at(-1).agent, "review");
  assert.ok(result.runs.every((run) => run.text.length <= 20000));
});
