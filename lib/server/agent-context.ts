import {
  AGENTS,
  briefSchema,
  campaignSchema,
  isRunCurrent,
  latestAgentRuns,
  uid,
  type AgentId,
  type Campaign,
  type Run,
} from "../campaign.ts";
import { AGENT_DEPENDENCIES } from "../orchestration.ts";
import { ApiError } from "./guards.ts";

/** These limits count JSON-encoded characters, including escaped input. */
export const AGENT_CONTEXT_LIMITS = {
  serializedCharacters: 48000,
  textCharacters: 34000,
  planningReference: 10000,
  upstreamOutputs: 8,
  upstreamText: 2200,
  upstreamTotalText: 10000,
  evidenceRecords: 12,
} as const;

type DependencyState = {
  agent: AgentId;
  status: "included" | "missing" | "stale" | "context_limit";
};
type UpstreamOutput = {
  runId: string;
  agent: AgentId;
  revision: number;
  mode: Run["mode"];
  approvedByUser: boolean;
  text: string;
  truncated: boolean;
};

/** A repeated nested handoff is available through its own source, not copied again. */
function ownOutputText(text: string) {
  const boundary = text.search(/\n## (?:Workflow handoff|Source handoffs)\b/);
  return boundary < 0 ? text : text.slice(0, boundary);
}

function encodedPrefix(value: string, limit: number) {
  if (JSON.stringify(value).length <= limit) return value;
  let low = 0;
  let high = value.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (JSON.stringify(value.slice(0, middle)).length <= limit) low = middle;
    else high = middle - 1;
  }
  // Do not split a surrogate pair at the excerpt boundary.
  if (low && /[\uD800-\uDBFF]/.test(value[low - 1])) low -= 1;
  return value.slice(0, low);
}

/** Framework-independent projection: never sends campaign IDs, history or account data. */
export function buildAgentContext(campaign: Campaign, agent: AgentId, planningReference: string) {
  const specialist = AGENTS.find((entry) => entry.id === agent);
  if (!specialist) throw new Error("Unknown specialist.");
  const latest = new Map(latestAgentRuns(campaign).map((run) => [run.agent, run]));
  const dependencies = [...new Set(AGENT_DEPENDENCIES[agent])];
  const dependencyStatus: DependencyState[] = [];
  const upstreamOutputs: UpstreamOutput[] = [];
  const truncatedFields: string[] = [];
  let textBudget: number = AGENT_CONTEXT_LIMITS.textCharacters;
  function bounded(value: string, limit: number, field: string) {
    const result = encodedPrefix(value, Math.max(2, Math.min(limit, textBudget)));
    textBudget = Math.max(0, textBudget - JSON.stringify(result).length);
    if (result !== value) truncatedFields.push(field);
    return result;
  }

  // Keep numeric commercial assumptions intact; string fields are untrusted context.
  const brief = Object.fromEntries(Object.entries(briefSchema.parse(campaign.brief)).map(([key, value]) => [
    key,
    typeof value === "string" ? bounded(value, 2100, `brief.${key}`) : value,
  ]));
  const reference = bounded(ownOutputText(planningReference), AGENT_CONTEXT_LIMITS.planningReference, "planningReference");
  let upstreamBudget: number = AGENT_CONTEXT_LIMITS.upstreamTotalText;
  for (const dependency of dependencies) {
    const source = latest.get(dependency);
    if (!source) {
      dependencyStatus.push({ agent: dependency, status: "missing" });
      continue;
    }
    if (!isRunCurrent(campaign, source)) {
      dependencyStatus.push({ agent: dependency, status: "stale" });
      continue;
    }
    if (upstreamOutputs.length >= AGENT_CONTEXT_LIMITS.upstreamOutputs || upstreamBudget < 200 || textBudget < 200) {
      dependencyStatus.push({ agent: dependency, status: "context_limit" });
      continue;
    }
    const ownText = ownOutputText(source.text);
    const excerpt = bounded(ownText, Math.min(AGENT_CONTEXT_LIMITS.upstreamText, upstreamBudget), `upstream.${dependency}`);
    upstreamBudget -= JSON.stringify(excerpt).length;
    upstreamOutputs.push({
      runId: source.id,
      agent: source.agent,
      revision: source.revision,
      mode: source.mode,
      approvedByUser: source.approved,
      text: excerpt,
      truncated: excerpt !== source.text,
    });
    dependencyStatus.push({ agent: dependency, status: "included" });
  }

  const evidence = campaign.evidence.slice(0, AGENT_CONTEXT_LIMITS.evidenceRecords).map((record, index) => ({
    claim: bounded(record.claim, 650, `evidence.${index}.claim`),
    source: bounded(record.source, 650, `evidence.${index}.source`),
    owner: bounded(record.owner, 120, `evidence.${index}.owner`),
    verifiedByUser: record.verified,
  }));
  const payload = {
    task: specialist.role,
    revision: campaign.revision,
    brief,
    planningReference: reference,
    dependencies: dependencyStatus,
    upstreamOutputs,
    evidence,
    contextLimits: {
      truncatedFields,
      evidenceRecordsOmitted: Math.max(0, campaign.evidence.length - evidence.length),
      note: "Only current direct prerequisite outputs are supplied. Missing, stale or omitted outputs are unavailable, not approvals. Excerpts may be incomplete. Verification and approval flags are user-recorded, not independently verified. Do not infer absent decisions or evidence.",
    },
  };
  const serialized = JSON.stringify(payload);
  // A final envelope guard also protects future additions to the projection.
  if (serialized.length > AGENT_CONTEXT_LIMITS.serializedCharacters)
    throw new ApiError(413, "The specialist context is too large. Shorten the brief or upstream drafts and try again.");
  return { payload, serialized, inputRunIds: upstreamOutputs.map((run) => run.runId) };
}

/** Provider text cannot set identity, lineage, revision, mode or human approval. */
export function validatedAgentDraft(
  campaign: Campaign,
  reference: Run,
  context: ReturnType<typeof buildAgentContext>,
  output: string,
  model: string,
): Run {
  const specialist = AGENTS.find((entry) => entry.id === reference.agent);
  if (!specialist) throw new ApiError(502, "The specialist draft could not be validated. No draft was saved.");
  const result = campaignSchema.safeParse({
    ...campaign,
    runs: [{
      id: uid(),
      agent: reference.agent,
      title: `${specialist.name} · AI draft`,
      text: output,
      mode: "AI draft",
      model,
      revision: campaign.revision,
      createdAt: new Date().toISOString(),
      approved: false,
      sourceFingerprint: reference.sourceFingerprint,
      inputRunIds: [...context.inputRunIds],
    }],
  });
  if (!result.success)
    throw new ApiError(502, "The specialist draft could not be validated. No draft was saved.");
  return result.data.runs[0];
}
