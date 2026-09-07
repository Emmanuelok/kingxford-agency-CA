import {
  AGENTS,
  CHECKS,
  auditWeb,
  campaignSchema,
  changed,
  experimentMath,
  forecast,
  latestAgentRuns,
  isRunCurrent,
  readiness,
  runAgent,
  safeUrl,
  validDate,
  type AgentId,
  type Campaign,
  type Run,
} from "./campaign.ts";

export const AGENT_DEPENDENCIES: Record<AgentId, readonly AgentId[]> = {
  strategy: [],
  brand: ["strategy"],
  creative: ["brand"],
  content: ["creative"],
  production: ["creative", "brand"],
  conversion: ["strategy", "brand"],
  lifecycle: ["conversion"],
  media: ["strategy", "conversion"],
  search: ["conversion"],
  accessibility: ["content", "conversion"],
  measurement: ["media", "conversion"],
  performance: ["measurement", "lifecycle"],
  expansion: ["performance", "search"],
  delivery: ["production", "content", "lifecycle", "accessibility"],
  review: ["delivery", "measurement", "brand"],
};

export const PIPELINES = [
  { id: "full-launch", name: "Campaign launch", description: "Connect strategy, creative, conversion, media and delivery in one reviewed launch plan.", agents: ["performance", "search", "review"] },
  { id: "creative-system", name: "Creative & content", description: "Turn the shared brief into a consistent brand direction, editorial plan and production handoff.", agents: ["production", "content", "accessibility"] },
  { id: "growth-loop", name: "Growth & lifecycle", description: "Connect acquisition assumptions to conversion, qualified leads and a measurable testing protocol.", agents: ["performance", "search"] },
  { id: "market-entry", name: "Market entry", description: "Prepare a bounded expansion test with local research requirements and commercial decision gates.", agents: ["expansion", "review"] },
] as const satisfies readonly { id: string; name: string; description: string; agents: readonly AgentId[] }[];

export type PipelineId = (typeof PIPELINES)[number]["id"];
export type PipelineOptions = { reuseCurrent?: boolean; requireApprovedDependencies?: boolean };
export type PipelineStep = {
  agent: AgentId;
  name: string;
  dependencies: readonly AgentId[];
  status: "ready" | "reuse" | "blocked";
  reason: string;
  outputId?: string;
};
export type PipelinePlan = {
  pipeline: (typeof PIPELINES)[number];
  revision: number;
  steps: PipelineStep[];
  ready: boolean;
  blockers: string[];
};

/** All dependencies are included once, before their consumers. */
export function resolvePipelineAgents(id: PipelineId): AgentId[] {
  const pipeline = PIPELINES.find((item) => item.id === id);
  if (!pipeline) throw new Error("Unknown workflow. Select an available workflow.");
  const done = new Set<AgentId>();
  const visiting = new Set<AgentId>();
  const ordered: AgentId[] = [];
  function visit(agent: AgentId) {
    if (done.has(agent)) return;
    if (visiting.has(agent)) throw new Error(`Circular workflow dependency at ${agent}.`);
    visiting.add(agent);
    for (const dependency of AGENT_DEPENDENCIES[agent]) visit(dependency);
    visiting.delete(agent);
    done.add(agent);
    ordered.push(agent);
  }
  pipeline.agents.forEach(visit);
  return ordered;
}

export function planPipeline(c: Campaign, id: PipelineId, options: PipelineOptions = {}): PipelinePlan {
  const pipeline = PIPELINES.find((item) => item.id === id);
  if (!pipeline) throw new Error("Unknown workflow. Select an available workflow.");
  const reuse = options.reuseCurrent !== false;
  const current = new Map(latestAgentRuns(c).filter((r) => isRunCurrent(c, r)).map((r) => [r.agent, r]));
  const steps: PipelineStep[] = [];
  const missing = (["brand", "audience", "offer"] as const).filter((key) => !c.brief[key].trim());
  for (const agent of resolvePipelineAgents(id)) {
    const existing = current.get(agent);
    const dependencies = AGENT_DEPENDENCIES[agent];
    const step: PipelineStep = { agent, name: AGENTS.find((a) => a.id === agent)!.name, dependencies, status: "ready", reason: "Generate a reviewable planning draft from the shared campaign." };
    if (missing.length) {
      step.status = "blocked";
      step.reason = `Complete the shared brief: ${missing.join(", ")}.`;
    } else if (dependencies.some((dependency) => steps.find((s) => s.agent === dependency)?.status === "blocked")) {
      step.status = "blocked";
      step.reason = "An upstream specialist needs attention before this handoff.";
    } else if (reuse && existing) {
      // Regenerating any prerequisite also regenerates its downstream consumers,
      // even if the brief revision is unchanged. This prevents stale handoffs.
      const dependenciesReused = dependencies.every((dependency) => steps.find((s) => s.agent === dependency)?.status === "reuse");
      if (dependenciesReused) {
        step.status = "reuse";
        step.outputId = existing.id;
        step.reason = existing.approved ? "Reuse the approved output at this brief revision." : "Reuse the current draft; human approval is still required.";
      }
    }
    if (step.status !== "blocked" && options.requireApprovedDependencies) {
      const pending = dependencies.filter((dependency) => {
        const previous = steps.find((s) => s.agent === dependency);
        return previous?.status !== "reuse" || !current.get(dependency)?.approved;
      });
      if (pending.length) {
        step.status = "blocked";
        step.reason = `Approve current upstream outputs first: ${pending.map((dependency) => AGENTS.find((a) => a.id === dependency)!.name).join(", ")}.`;
      }
    }
    steps.push(step);
  }
  return { pipeline, revision: c.revision, steps, ready: steps.some((s) => s.status === "ready"), blockers: [...new Set(steps.filter((s) => s.status === "blocked").map((s) => s.reason))] };
}

export type PipelineResult = {
  campaign: Campaign;
  runs: Run[];
  reused: AgentId[];
  blocked: { agent: AgentId; reason: string }[];
  plan: PipelinePlan;
};

/** Drafts are persisted in the existing version-2 run history. Nothing publishes. */
export function executePipeline(c: Campaign, id: PipelineId, options: PipelineOptions = {}): PipelineResult {
  campaignSchema.parse(c);
  const plan = planPipeline(c, id, options);
  const runs: Run[] = [];
  let context = c;
  for (const step of plan.steps) {
    if (step.status !== "ready") continue;
    const output = runAgent(context, step.agent);
    const upstream = latestAgentRuns(context).filter((r) => step.dependencies.includes(r.agent) && isRunCurrent(context, r));
    output.inputRunIds = upstream.map((r) => r.id);
    if (upstream.length) {
      const handoff = upstream.map((r) => {
        const start = r.text.indexOf("## ");
        const substantive = start >= 0 ? r.text.slice(start) : r.text;
        const nextSection = substantive.indexOf("\n## ", 3);
        const section = nextSection >= 0 ? substantive.slice(0, nextSection) : substantive;
        const excerpt = section.slice(0, 600).split("\n").map((line) => `> ${line}`).join("\n");
        return `- ${r.title}: ${r.approved ? "human approved" : "draft, approval pending"}; output ${r.id}; brief revision ${r.revision}.\nUser-supplied upstream output excerpt (retained verbatim, up to 600 characters):\n${excerpt}${section.length > 600 ? "\n> [Excerpt continues in the linked source output.]" : ""}`;
      }).join("\n\n");
      output.text = output.text.replace("\n\n---\nSource:", `\n\n## Workflow handoff\n${handoff}\nThe linked upstream outputs supply planning context. A draft handoff is not approval.\n\n---\nSource:`);
    }
    runs.push(output);
    context = { ...context, runs: [output, ...context.runs] };
  }
  // Keep the most recent result for each specialist before filling historical slots.
  if (runs.length) {
    const all = context.runs;
    const latest = latestAgentRuns(context);
    const latestIds = new Set(latest.map((r) => r.id));
    const history = [...latest, ...all.filter((r) => !latestIds.has(r.id))].slice(0, 100);
    context = changed(c, { runs: history }, `${plan.pipeline.name}: generated ${runs.length} specialist draft${runs.length === 1 ? "" : "s"} at revision ${c.revision}`);
    campaignSchema.parse(context);
  }
  return { campaign: context, runs, reused: plan.steps.filter((s) => s.status === "reuse").map((s) => s.agent), blocked: plan.steps.filter((s) => s.status === "blocked").map((s) => ({ agent: s.agent, reason: s.reason })), plan };
}

export type QualityCheck = {
  id: string;
  title: string;
  severity: "blocker" | "warning";
  passed: boolean;
  detail: string;
  action: string;
  room: string;
};

/** Rules inspect supplied workspace data; they are not certification or a live audit. */
export function qualityChecks(c: Campaign): QualityCheck[] {
  const f = forecast(c);
  const r = readiness(c);
  const latest = latestAgentRuns(c);
  const completeEvidence = c.evidence.filter((e) => e.verified && e.claim.trim() && e.source.trim() && e.owner.trim());
  const pendingTasks = c.tasks.filter((t) => !t.done || !t.owner.trim());
  const webSupplied = Object.values(c.web).some((value) => value.trim());
  const webIssues = auditWeb(c.web).filter((check) => !check.passed);
  const required = CHECKS.filter(([, , critical]) => critical);
  const pendingChecks = required.filter(([id]) => !c.checks[id]);
  const exp = experimentMath(c.experiment);
  return [
    { id: "brief", title: "Shared brief", severity: "blocker", passed: !!(c.brief.brand.trim() && c.brief.audience.trim() && c.brief.offer.trim()), detail: "Brand, audience and offer anchor every specialist handoff.", action: "Complete the brand, priority audience and concrete offer.", room: "brief" },
    { id: "budget", title: "Budget feasibility", severity: "blocker", passed: !f.invalidBudget, detail: f.invalidBudget ? `Fees and production exceed the budget by CAD ${(c.brief.agencyFee + c.brief.productionCost - c.brief.budget).toFixed(2)}.` : `CAD ${f.spend.toFixed(2)} remains after fees and production.`, action: "Reconcile the total investment, agency fee and production cost.", room: "media" },
    { id: "allocation", title: "Media allocation", severity: "blocker", passed: f.unallocated === 0, detail: `CAD ${f.unallocated.toFixed(2)} has no channel allocation.`, action: "Give at least one media channel a positive allocation weight.", room: "media" },
    { id: "economics", title: "Contribution outlook", severity: "warning", passed: !f.invalidBudget && f.contribution >= 0, detail: `Base-case contribution is CAD ${f.contribution.toFixed(2)} under user-entered assumptions.`, action: "Review margin, acquisition cost and conservative-case exposure before scaling.", room: "media" },
    { id: "destination", title: "Conversion destination", severity: "blocker", passed: !!safeUrl(c.brief.website), detail: "A syntactically valid destination is required; this check does not visit or test the website.", action: "Add the destination URL and manually test the complete conversion route.", room: "brief" },
    { id: "evidence", title: "Evidence integrity", severity: "blocker", passed: completeEvidence.length === c.evidence.length && (!c.brief.proof.trim() || completeEvidence.length > 0), detail: `${completeEvidence.length} of ${c.evidence.length} records have a claim, source, owner and recorded verification.`, action: "Substantiate supplied proof and complete every evidence record.", room: "proof" },
    { id: "freshness", title: "Output freshness", severity: "blocker", passed: r.stale === 0, detail: `${r.stale} current deliverables need refresh after a brief or upstream handoff changed.`, action: "Regenerate stale specialist outputs and refresh content against the latest brief.", room: "agents" },
    { id: "deliverables", title: "Reviewable work", severity: "blocker", passed: !!(latest.length || c.content.length), detail: `${latest.length} specialist outputs and ${c.content.length} content items are available.`, action: "Run a workflow or create content for review before release.", room: "agents" },
    { id: "approvals", title: "Deliverable approvals", severity: "blocker", passed: latest.every((output) => output.approved && isRunCurrent(c, output)) && c.content.every((item) => item.status === "Approved" && item.revision === c.revision), detail: `${latest.filter((output) => !output.approved).length} specialist outputs and ${c.content.filter((item) => item.status !== "Approved").length} content items need approval.`, action: "Review and explicitly approve the current versions of campaign deliverables.", room: "agents" },
    { id: "delivery", title: "Delivery ownership", severity: "blocker", passed: !pendingTasks.length, detail: `${pendingTasks.length} delivery tasks need completion or an accountable owner.`, action: "Assign owners and finish delivery tasks before launch.", room: "production" },
    { id: "schedule", title: "Campaign schedule", severity: "warning", passed: validDate(c.brief.launchDate), detail: c.brief.launchDate ? `Planned launch: ${c.brief.launchDate}.` : "No launch date is recorded.", action: "Set the launch date so content and production can share a schedule.", room: "brief" },
    { id: "experiment", title: "Experiment integrity", severity: "blocker", passed: exp.valid && exp.sample !== null, detail: exp.valid && exp.sample !== null ? `Planned sample: ${exp.sample.toLocaleString("en-CA")} visitors per arm.` : "Observed counts or the target conversion rate are invalid.", action: "Keep conversions within visitor counts and the target conversion rate below 100%.", room: "measurement" },
    { id: "test-duration", title: "Experiment feasibility", severity: "warning", passed: exp.days !== null && exp.days <= c.brief.weeks * 7, detail: exp.days === null ? "A feasible sample estimate is unavailable." : `${exp.days} modelled days of traffic versus ${c.brief.weeks * 7} campaign days.`, action: "Align the test horizon, minimum detectable effect and available traffic.", room: "measurement" },
    { id: "web-copy", title: "Page copy review", severity: "warning", passed: webSupplied && !webIssues.length, detail: webSupplied ? `${webIssues.length} supplied-copy checks need editorial review.` : "No page copy has been provided for review.", action: "Add page copy and review the search, action, imagery and claims checks.", room: "search" },
    { id: "human-gates", title: "Human launch checks", severity: "blocker", passed: !pendingChecks.length, detail: `${required.length - pendingChecks.length} of ${required.length} critical checks are confirmed by the user.`, action: "Complete the critical launch checklist with accountable human review.", room: "proof" },
  ];
}

export function campaignIntelligence(c: Campaign) {
  const checks = qualityChecks(c);
  const blockers = checks.filter((check) => !check.passed && check.severity === "blocker");
  const warnings = checks.filter((check) => !check.passed && check.severity === "warning");
  const latest = latestAgentRuns(c);
  return {
    score: Math.round(checks.filter((check) => check.passed).length / checks.length * 100),
    status: blockers.length ? "Needs attention" as const : "Ready for human release" as const,
    blockers,
    warnings,
    nextActions: [...blockers, ...warnings].slice(0, 6),
    checks,
    economics: { conservative: forecast(c, "conservative"), base: forecast(c), upside: forecast(c, "upside") },
    specialists: { total: AGENTS.length, current: latest.filter((r) => isRunCurrent(c, r)).length, approved: latest.filter((r) => isRunCurrent(c, r) && r.approved).length, stale: latest.filter((r) => !isRunCurrent(c, r)).length },
  };
}
