import { z } from "zod";
import { performanceSchema, performanceSummary } from "./performance.ts";
import { deliveryStateSchema, deliveryLaunchBlockers } from "./production-assets.ts";

export const CHANNELS = [
  "Search",
  "Meta",
  "LinkedIn",
  "YouTube",
  "Organic",
  "Email",
] as const;
export const AGENTS = [
  {
    id: "strategy",
    name: "Strategy director",
    role: "Positioning, audience tension and a 90-day route",
    room: "Strategy",
  },
  {
    id: "creative",
    name: "Creative partner",
    role: "Three creative territories and testable hooks",
    room: "Creative",
  },
  {
    id: "content",
    name: "Editorial planner",
    role: "Channel-native stories from one proposition",
    room: "Content",
  },
  {
    id: "production",
    name: "Production producer",
    role: "Shot list, adaptations and delivery dependencies",
    room: "Production",
  },
  {
    id: "media",
    name: "Media analyst",
    role: "Unit economics, scenarios and decision thresholds",
    room: "Media",
  },
  {
    id: "search",
    name: "Search architect",
    role: "Search intent, page structure and answer visibility",
    room: "Search & web",
  },
  {
    id: "measurement",
    name: "Experiment designer",
    role: "A measurable hypothesis and stopping rules",
    room: "Measurement",
  },
  {
    id: "review",
    name: "Proof reviewer",
    role: "Claims, consent, rights and launch blockers",
    room: "Proof",
  },
  {
    id: "brand",
    name: "Brand guardian",
    role: "Voice, claim consistency and creative acceptance criteria",
    room: "Brand",
  },
  {
    id: "conversion",
    name: "Conversion architect",
    role: "Page hierarchy, offer friction and measurable conversion routes",
    room: "Conversion",
  },
  {
    id: "lifecycle",
    name: "Lifecycle planner",
    role: "Lead qualification, ownership, nurture and retention handoffs",
    room: "Lifecycle",
  },
  {
    id: "accessibility",
    name: "Accessibility reviewer",
    role: "Inclusive content and a practical manual verification protocol",
    room: "Accessibility",
  },
  {
    id: "delivery",
    name: "Delivery coordinator",
    role: "Dependencies, accountable owners and release handover",
    room: "Delivery",
  },
  {
    id: "performance",
    name: "Performance analyst",
    role: "Scenario sensitivity, contribution thresholds and experiment decisions",
    room: "Performance",
  },
  {
    id: "expansion",
    name: "Market planner",
    role: "A city-entry test with evidence requirements",
    room: "Markets",
  },
  {
    id: "research",
    name: "Research planner",
    role: "Evidence gaps, primary research questions and an accountable source plan",
    room: "Research",
  },
  {
    id: "risk",
    name: "Release risk reviewer",
    role: "Claims, budget exposure, unresolved dependencies and release decisions",
    room: "Risk",
  },
  {
    id: "operations",
    name: "Operations planner",
    role: "Delivery capacity, accountable ownership and service recovery",
    room: "Operations",
  },
] as const;
export type AgentId = (typeof AGENTS)[number]["id"];
const text = (max = 2000) => z.string().max(max);
const number = (max = 10000000) => z.number().finite().min(0).max(max);
const dateField = z
  .string()
  .refine((v) => !v || validDate(v), "Use a valid date");
export const briefSchema = z.object({
  brand: text(120),
  sector: text(120),
  market: text(120),
  audience: text(),
  objective: z.enum([
    "leads",
    "sales",
    "launch",
    "local",
    "content",
    "expansion",
  ]),
  offer: text(),
  proof: text(),
  voice: text(300),
  website: text(500),
  budget: number(),
  agencyFee: number(),
  productionCost: number(),
  weeks: z.number().int().min(1).max(52),
  revenuePerCustomer: number(),
  margin: number(100),
  leadToSale: number(100),
  launchDate: z
    .string()
    .refine(
      (v) => !v || (validDate(v) && v <= "2099-12-31"),
      "Use a valid planning date through 2099",
    ),
});
export const mediaSchema = z.object({
  channel: z.enum(CHANNELS),
  weight: number(100),
  cpc: z.number().finite().min(0.01).max(10000),
  cvr: number(100),
});
const status = z.enum(["Draft", "In review", "Approved"]);
export const campaignSchema = z
  .object({
    id: z.string().uuid(),
    name: text(120),
    revision: z.number().int().min(1).max(1000000000),
    updatedAt: z.string().datetime(),
    brief: briefSchema,
    media: z.array(mediaSchema).min(1).max(12),
    content: z
      .array(
        z.object({
          id: z.string().uuid(),
          date: dateField,
          channel: z.enum(CHANNELS),
          title: text(180),
          copy: text(5000),
          status,
          revision: z.number().int().min(1).max(1000000000),
        }),
      )
      .max(200),
    tasks: z
      .array(
        z.object({
          id: z.string().uuid(),
          title: text(300),
          owner: text(100),
          due: dateField,
          done: z.boolean(),
        }),
      )
      .max(200),
    evidence: z
      .array(
        z.object({
          id: z.string().uuid(),
          claim: text(1000),
          source: text(1000),
          owner: text(100),
          verified: z.boolean(),
        }),
      )
      .max(100),
    runs: z
      .array(
        z.object({
          id: z.string().uuid(),
          agent: z.enum(AGENTS.map((a) => a.id) as [AgentId, ...AgentId[]]),
          title: text(200),
          text: text(20000),
          mode: z.enum(["Planning engine", "AI draft"]),
          revision: z.number().int().min(1).max(1000000000),
          createdAt: z.string().datetime(),
          approved: z.boolean(),
          model: text(200).optional(),
          editedByUser: z.boolean().optional(),
          sourceRunId: z.string().uuid().optional(),
          sourceFingerprint: text(100).optional(),
          inputRunIds: z.array(z.string().uuid()).max(30).refine(
            (ids) => new Set(ids).size === ids.length,
            "Duplicate handoff references are not allowed",
          ).optional(),
        }),
      )
      .max(100),
    checks: z.record(z.boolean()),
    performance: performanceSchema.optional(),
    delivery: deliveryStateSchema.optional(),
    experiment: z.object({
      hypothesis: text(2000),
      baseline: z.number().finite().min(0.01).max(99),
      lift: z.number().finite().min(1).max(500),
      dailyVisitors: z.number().int().min(1).max(10000000),
      controlVisitors: number().int(),
      controlConversions: number().int(),
      variantVisitors: number().int(),
      variantConversions: number().int(),
    }),
    web: z.object({
      title: text(500),
      description: text(2000),
      heading: text(1000),
      body: text(20000),
      alt: text(1000),
      cta: text(500),
    }),
    activity: z
      .array(
        z.object({
          id: z.string().uuid(),
          at: z.string().datetime(),
          action: text(300),
        }),
      )
      .max(200),
  })
  .superRefine((c, ctx) => {
    for (const key of ["content", "runs"] as const) {
      if (c[key].some((record) => record.revision > c.revision))
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Output revisions cannot be newer than the campaign",
        });
    }
    for (const key of [
      "content",
      "tasks",
      "evidence",
      "runs",
      "activity",
    ] as const) {
      if (new Set(c[key].map((x) => x.id)).size !== c[key].length)
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Duplicate record IDs are not allowed",
        });
    }
  });
export const workspaceSchema = z
  .object({
    version: z.literal(2),
    activeId: z.string().uuid(),
    campaigns: z.array(campaignSchema).min(1).max(12),
  })
  .refine(
    (s) =>
      s.campaigns.some((c) => c.id === s.activeId) &&
      new Set(s.campaigns.map((c) => c.id)).size === s.campaigns.length,
    "Invalid or duplicate campaign IDs",
  );
export type Campaign = z.infer<typeof campaignSchema>;
export type Brief = z.infer<typeof briefSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type Run = Campaign["runs"][number];
export const CHECKS = [
  ["objective", "Commercial objective and accountable owner agreed", true],
  ["destination", "Conversion destination and form tested", true],
  ["measurement", "Events, consent controls and attribution checked", true],
  ["rights", "Talent, music, footage and image usage cleared", true],
  ["claims", "Advertising claims substantiated by evidence", true],
  ["accessibility", "Keyboard, contrast, captions and alt text reviewed", true],
  ["budget", "Media, production and fees approved separately", true],
  ["privacy", "Data collection, privacy notice and retention approved", true],
  ["localization", "Regional language and cultural review complete", false],
  ["followup", "Lead routing and response ownership tested", true],
  ["rollback", "Campaign pause and incident response prepared", false],
  ["signoff", "Client has signed off the final deliverables", true],
] as const;
export function safeUrl(input: string): string | null {
  try {
    const u = new URL(input);
    return ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export function validDate(input: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(input) &&
    !Number.isNaN(Date.parse(input)) &&
    new Date(input).toISOString().slice(0, 10) === input
  );
}
export function uid() {
  return crypto.randomUUID();
}
export function createCampaign(sample = false): Campaign {
  return {
    id: uid(),
    name: sample ? "Atlantic launch · example" : "Untitled campaign",
    revision: 1,
    updatedAt: new Date().toISOString(),
    brief: {
      brand: sample ? "North Atlantic stays" : "",
      sector: "Tourism & hospitality",
      market: "St. John's, NL",
      audience: sample
        ? "Atlantic Canadian couples planning a three-night autumn getaway"
        : "",
      objective: "leads",
      offer: sample
        ? "A locally hosted autumn stay with a flexible three-night itinerary"
        : "",
      proof: sample
        ? "Example only. Replace with verified guest reviews and actual booking terms."
        : "",
      voice: "Confident, warm, specific. No superlatives without proof.",
      website: "",
      budget: sample ? 18000 : 0,
      agencyFee: sample ? 5000 : 0,
      productionCost: sample ? 4000 : 0,
      weeks: 10,
      revenuePerCustomer: sample ? 1200 : 0,
      margin: 45,
      leadToSale: 20,
      launchDate: "",
    },
    media: [
      { channel: "Search", weight: 45, cpc: 3.5, cvr: 4 },
      { channel: "Meta", weight: 35, cpc: 1.8, cvr: 2 },
      { channel: "LinkedIn", weight: 20, cpc: 7, cvr: 3 },
    ],
    content: [],
    tasks: [],
    evidence: [],
    runs: [],
    checks: {},
    activity: [],
    experiment: {
      hypothesis: "",
      baseline: 3,
      lift: 20,
      dailyVisitors: 300,
      controlVisitors: 0,
      controlConversions: 0,
      variantVisitors: 0,
      variantConversions: 0,
    },
    web: {
      title: "",
      description: "",
      heading: "",
      body: "",
      alt: "",
      cta: "",
    },
  };
}
export function newWorkspace(): Workspace {
  const c = createCampaign();
  return { version: 2, activeId: c.id, campaigns: [c] };
}
export function changed(
  c: Campaign,
  patch: Partial<Campaign>,
  action: string,
  changesBrief = false,
): Campaign {
  const at = new Date().toISOString();
  const contextChanged =
    changesBrief ||
    !!patch.brief ||
    !!patch.media ||
    !!patch.experiment ||
    !!patch.web ||
    !!patch.evidence ||
    !!patch.performance;
  const checks = contextChanged
    ? {}
    : patch.content || patch.tasks || patch.runs || patch.delivery
      ? { ...(patch.checks ?? c.checks), signoff: false }
      : (patch.checks ?? c.checks);
  return {
    ...c,
    ...patch,
    revision: c.revision + (contextChanged ? 1 : 0),
    updatedAt: at,
    checks,
    activity: [
      { id: uid(), at, action: action.slice(0, 300) },
      ...c.activity,
    ].slice(0, 200),
  };
}
export function latestAgentRuns(c: Campaign): Run[] {
  const ordered = [...c.runs].sort(
    (a, b) => b.revision - a.revision || b.createdAt.localeCompare(a.createdAt),
  );
  return ordered.filter(
    (r, i) => ordered.findIndex((x) => x.agent === r.agent) === i,
  );
}

/** A compact change detector for inputs that can change without a brief revision.
 * This is a freshness marker, not a cryptographic signature or proof of integrity.
 */
export function agentSourceFingerprint(c: Campaign, agent: AgentId): string | undefined {
  if (!["delivery", "review", "operations", "risk"].includes(agent)) return undefined;
  const source = JSON.stringify({
    tasks: [...c.tasks].sort((a, b) => a.id.localeCompare(b.id)),
    content: [...c.content].sort((a, b) => a.id.localeCompare(b.id)),
    checks: agent === "review" || agent === "risk" ? CHECKS.filter(([id]) => id !== "signoff").map(([id]) => [id, !!c.checks[id]]) : undefined,
    delivery: c.delivery,
  });
  let first = 2166136261;
  let second = 5381;
  for (let index = 0; index < source.length; index++) {
    const code = source.charCodeAt(index);
    first = Math.imul(first ^ code, 16777619);
    second = Math.imul(second, 33) ^ code;
  }
  return `${source.length.toString(16)}:${(first >>> 0).toString(16)}:${(second >>> 0).toString(16)}`;
}

/** Both the brief and every recorded upstream handoff must still be current. */
export function isRunCurrent(c: Campaign, run: Run): boolean {
  const latest = new Map(latestAgentRuns(c).map((item) => [item.id, item]));
  const visiting = new Set<string>();
  const memo = new Map<string, boolean>();
  function current(item: Run): boolean {
    if (memo.has(item.id)) return memo.get(item.id)!;
    if (item.revision !== c.revision || !latest.has(item.id) || visiting.has(item.id)) return false;
    if (item.sourceFingerprint !== undefined && item.sourceFingerprint !== agentSourceFingerprint(c, item.agent)) return false;
    visiting.add(item.id);
    const valid = (item.inputRunIds ?? []).every((id) => {
      const source = latest.get(id);
      return source ? current(source) : false;
    });
    visiting.delete(item.id);
    memo.set(item.id, valid);
    return valid;
  }
  return current(run);
}

/** Approvals apply to an exact output and revision, never to stale history. */
export function approveRun(c: Campaign, runId: string, approved = true): Campaign {
  const run = c.runs.find((item) => item.id === runId);
  if (!run) throw new Error("The selected output no longer exists.");
  if (approved && !isRunCurrent(c, run)) {
    throw new Error("Regenerate and review the current specialist output before approval.");
  }
  return changed(c, {
    runs: c.runs.map((item) => item.id === runId ? { ...item, approved } : item),
  }, `${approved ? "Approved" : "Reopened"} ${run.title}`);
}

export function readiness(c: Campaign) {
  const blockers: string[] = CHECKS.filter(
    ([id, , critical]) => critical && !c.checks[id],
  ).map(([, label]) => label);
  if (c.brief.agencyFee + c.brief.productionCost > c.brief.budget)
    blockers.push("Costs exceed the total campaign budget");
  if (
    !c.brief.brand.trim() ||
    !c.brief.audience.trim() ||
    !c.brief.offer.trim()
  )
    blockers.push("Complete the brand, audience and offer in the shared brief");
  const evidenceGaps = c.evidence.filter(
    (e) =>
      !e.verified || !e.claim.trim() || !e.source.trim() || !e.owner.trim(),
  );
  if (evidenceGaps.length)
    blockers.push(
      `${evidenceGaps.length} evidence records need source, owner or verification`,
    );
  const latestRuns = latestAgentRuns(c);
  const stale =
    latestRuns.filter((r) => !isRunCurrent(c, r)).length +
    c.content.filter((r) => r.revision !== c.revision).length;
  if (c.brief.website && !safeUrl(c.brief.website))
    blockers.push("The shared brief contains an invalid website URL");
  if (stale) blockers.push(`${stale} outputs need refresh after a brief or upstream handoff changed`);
  if (c.content.some((x) => x.status !== "Approved"))
    blockers.push("Content drafts still need approval");
  if (latestRuns.some((x) => !x.approved))
    blockers.push("Current specialist outputs still need approval");
  if (c.tasks.some((t) => !t.done || !t.owner.trim()))
    blockers.push("Delivery tasks need completion and accountable owners");
  if (forecast(c).unallocated > 0)
    blockers.push("Media budget remains unallocated; assign positive channel weights");
  if (!c.runs.length && !c.content.length)
    blockers.push("Create and review campaign deliverables before final release");
  if (c.brief.proof.trim() && !c.evidence.some(
    (e) => e.verified && e.claim.trim() && e.source.trim() && e.owner.trim(),
  ))
    blockers.push("The supplied proof needs at least one complete verified evidence record");
  if (!experimentMath(c.experiment).valid)
    blockers.push("Experiment conversions cannot exceed the observed visitor counts");
  blockers.push(...deliveryLaunchBlockers(c));
  return {
    score: Math.round(
      (CHECKS.filter(([id]) => c.checks[id]).length / CHECKS.length) * 100,
    ),
    blockers,
    stale,
  };
}
export function forecast(
  c: Campaign,
  scenario: "conservative" | "base" | "upside" = "base",
) {
  const b = c.brief,
    spend = Math.max(0, b.budget - b.agencyFee - b.productionCost);
  const totalWeight = c.media.reduce((n, row) => n + row.weight, 0);
  const factor =
    scenario === "conservative"
      ? { cpc: 1.25, cvr: 0.75 }
      : scenario === "upside"
        ? { cpc: 0.8, cvr: 1.25 }
        : { cpc: 1, cvr: 1 };
  const rows = c.media.map((row) => {
    const allocation = totalWeight ? (spend * row.weight) / totalWeight : 0;
    const clicks = allocation / (row.cpc * factor.cpc);
    const conversions = (clicks * Math.min(100, row.cvr * factor.cvr)) / 100;
    const customers =
      conversions * (b.objective === "sales" ? 1 : b.leadToSale / 100);
    return {
      ...row,
      allocation,
      clicks,
      conversions,
      customers,
      revenue: customers * b.revenuePerCustomer,
    };
  });
  const sum = (key: "clicks" | "conversions" | "customers" | "revenue") =>
    rows.reduce((n, row) => n + row[key], 0);
  const revenue = sum("revenue"),
    customers = sum("customers"),
    allocated = rows.reduce((n, r) => n + r.allocation, 0);
  return {
    rows,
    spend,
    allocated,
    unallocated: totalWeight > 0 ? 0 : spend,
    clicks: sum("clicks"),
    conversions: sum("conversions"),
    customers,
    revenue,
    grossProfit: (revenue * b.margin) / 100,
    contribution: (revenue * b.margin) / 100 - b.budget,
    cpa: customers ? allocated / customers : null,
    fullyLoadedCac: customers ? b.budget / customers : null,
    roas: allocated ? revenue / allocated : null,
    breakEvenCustomers:
      b.revenuePerCustomer * b.margin > 0
        ? b.budget / ((b.revenuePerCustomer * b.margin) / 100)
        : null,
    dailySpend: allocated / (b.weeks * 7),
    invalidBudget: b.agencyFee + b.productionCost > b.budget,
  };
}
export function experimentMath(e: Campaign["experiment"]) {
  const p1 = e.baseline / 100,
    p2 = p1 * (1 + e.lift / 100),
    mean = (p1 + p2) / 2;
  const sample =
    p2 >= 1
      ? null
      : Math.ceil(
          Math.pow(
            1.959963984540054 * Math.sqrt(2 * mean * (1 - mean)) +
              0.8416212335729143 * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)),
            2,
          ) / Math.pow(p2 - p1, 2),
        );
  const valid =
    e.controlConversions <= e.controlVisitors &&
    e.variantConversions <= e.variantVisitors;
  const rateA = e.controlVisitors
      ? e.controlConversions / e.controlVisitors
      : null,
    rateB = e.variantVisitors ? e.variantConversions / e.variantVisitors : null;
  const difference =
    valid && rateA !== null && rateB !== null ? rateB - rateA : null;
  const se =
    valid && rateA !== null && rateB !== null
      ? Math.sqrt(
          (rateA * (1 - rateA)) / e.controlVisitors +
            (rateB * (1 - rateB)) / e.variantVisitors,
        )
      : null;
  return {
    sample,
    days: sample ? Math.ceil((sample * 2) / e.dailyVisitors) : null,
    valid,
    rateA,
    rateB,
    difference,
    interval:
      difference !== null && se !== null
        ? [difference - 1.96 * se, difference + 1.96 * se]
        : null,
    sufficient:
      valid &&
      !!sample &&
      e.controlVisitors >= sample &&
      e.variantVisitors >= sample &&
      e.controlConversions >= 10 &&
      e.variantConversions >= 10 &&
      e.controlVisitors - e.controlConversions >= 10 &&
      e.variantVisitors - e.variantConversions >= 10,
  };
}
export function auditWeb(web: Campaign["web"]) {
  const words = web.body.trim().split(/\s+/).filter(Boolean).length;
  return [
    {
      title: "Page title",
      passed: web.title.length >= 20 && web.title.length <= 65,
      note: `${web.title.length} characters. A practical 20–65 character editorial target, not a ranking rule.`,
    },
    {
      title: "Search description",
      passed: web.description.length >= 70 && web.description.length <= 170,
      note: `${web.description.length} characters. Describe the page specifically; display lengths vary.`,
    },
    {
      title: "One clear page promise",
      passed: web.heading.trim().length >= 10,
      note: "A descriptive heading should match the visitor's intent.",
    },
    {
      title: "Useful source copy",
      passed: words >= 100,
      note: `${words} words supplied. Length alone does not establish quality or search visibility.`,
    },
    {
      title: "Image alternative",
      passed: web.alt.trim().length >= 8,
      note: "Describe the meaningful image, or use an empty alt attribute for decorative images.",
    },
    {
      title: "Specific next action",
      passed:
        web.cta.trim().length >= 4 &&
        !/^(click here|submit|learn more)$/i.test(web.cta.trim()),
      note: "State what the visitor can do next.",
    },
    {
      title: "Claims review",
      passed:
        !/\b(guaranteed|best in|number one|risk.free|cure|carbon.neutral)\b|100%/i.test(
          [web.title, web.description, web.heading, web.body, web.cta].join(
            " ",
          ),
        ),
      note: "Heuristic flags only. Every material claim still needs human review and substantiation.",
    },
  ];
}
export function buildUtm(
  base: string,
  source: string,
  medium: string,
  campaign: string,
  content = "",
) {
  const safe = safeUrl(base);
  if (!safe || !source.trim() || !medium.trim() || !campaign.trim())
    return null;
  const url = new URL(safe);
  for (const [k, v] of Object.entries({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: content,
  })) {
    if (v.trim())
      url.searchParams.set(k, v.trim().toLowerCase().replace(/\s+/g, "_"));
    else url.searchParams.delete(k);
  }
  return url.href;
}
export function csv(rows: (string | number | boolean)[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const raw = String(cell);
          const safe =
            typeof cell === "string" &&
            (/^\s*[=+\-@＝＋－＠]/u.test(raw) || /^[\t\r\n]/.test(raw))
              ? `'${raw}`
              : raw;
          return `"${safe.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
}
export function contentCalendar(c: Campaign): Campaign["content"] {
  const b = c.brief,
    start =
      validDate(b.launchDate) && b.launchDate <= "2099-12-31"
        ? new Date(`${b.launchDate}T12:00:00Z`)
        : new Date();
  const channels = [...new Set(c.media.filter((r) => r.weight > 0).map((r) => r.channel))];
  const selected = channels.length ? channels : ["Organic" as const];
  const excerpt = (v: string) =>
    v.length > 650 ? `${v.slice(0, 650)}… [See the full shared brief]` : v;
  const angles = [
    "The customer problem",
    "The offer explained",
    "A useful demonstration",
    "A question answered",
    "The evidence behind the promise",
    "A clear invitation",
  ];
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(start);
    const horizonDays = Math.min(23, b.weeks * 7);
    date.setUTCDate(start.getUTCDate() + Math.floor(i * (horizonDays - 1) / 11));
    const title = angles[i % angles.length];
    return {
      id: uid(),
      date: date.toISOString().slice(0, 10),
      channel: selected[i % selected.length],
      title,
      copy: `${title}: ${b.brand || "Your brand"}\n\nFor ${excerpt(b.audience) || "your priority audience"}: ${excerpt(b.offer) || "describe the specific offer"}.\n\n${i % 6 === 4 ? `Evidence to verify: ${excerpt(b.proof) || "Add an approved source before publication."}` : "Draft the specific story and substantiate every material claim."}\n\nNext action: ${b.objective === "sales" ? "Explore the offer" : "Start a conversation"}.${b.website ? `\n${b.website}` : ""}`,
      status: "Draft",
      revision: c.revision,
    };
  });
}
export const SHOTS = [
  {
    title: "The tension",
    seconds: 5,
    direction:
      "Show the customer's real situation before introducing the offer.",
    deliverables: "Hero opener · vertical hook · still",
  },
  {
    title: "The human perspective",
    seconds: 8,
    direction:
      "Capture an authentic interview answer. Obtain a signed release.",
    deliverables: "Testimonial · quote card · audio cut",
  },
  {
    title: "The offer in use",
    seconds: 10,
    direction:
      "Demonstrate the experience or product truth, not an unsupported promise.",
    deliverables: "Product sequence · carousel · short video",
  },
  {
    title: "The proof",
    seconds: 7,
    direction:
      "Capture a verifiable detail. Record the source and permitted usage.",
    deliverables: "Proof cutdown · case-study still",
  },
  {
    title: "The invitation",
    seconds: 5,
    direction:
      "Leave safe space for an accessible end card and specific next action.",
    deliverables: "End card · 16:9 master · 9:16 adaptation",
  },
];
export function runAgent(c: Campaign, id: AgentId): Run {
  const b = c.brief,
    f = forecast(c),
    label = AGENTS.find((a) => a.id === id);
  if (!label) throw new Error("Unknown specialist. Select an available planning agent.");
  const money = (value: number | null) => value === null ? "Unavailable with these assumptions" : `CAD ${value.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const conservative = forecast(c, "conservative");
  const upside = forecast(c, "upside");
  const experiment = experimentMath(c.experiment);
  const destination = safeUrl(b.website);
  const action = b.objective === "sales" ? "Review the offer and purchase" : b.objective === "content" ? "Read the complete guide" : "Request a conversation";
  const event = b.objective === "sales" ? "purchase" : b.objective === "content" ? "qualified_content_engagement" : "qualified_enquiry";
  const verifiedEvidence = c.evidence.filter((e) => e.verified && e.claim.trim() && e.source.trim() && e.owner.trim());
  const pendingTasks = c.tasks.filter((t) => !t.done || !t.owner.trim());
  const observations = c.performance?.rows.length ? performanceSummary(c, c.performance.rows) : null;
  const activeChannels = [...new Set(c.media.filter((row) => row.weight > 0).map((row) => row.channel))];
  const sourceCopyChecks = auditWeb(c.web);
  const taskSummary = c.tasks.slice(0, 12).map((task) => `- ${task.done ? "Done" : "Open"}: ${task.title.slice(0, 160)}; owner: ${task.owner.trim() || "unassigned"}; due: ${task.due || "unscheduled"}.`).join("\n");
  const context = `${b.brand || "Unnamed brand"} · ${b.market}\nAudience: ${b.audience || "Not supplied"}\nOffer: ${b.offer || "Not supplied"}\nObjective: ${b.objective}\n`;
  const sections: Record<AgentId, string> = {
    research: `## Research decision\nEstablish whether ${b.audience.slice(0, 650) || "the priority audience"} needs ${b.offer.slice(0, 650) || "the proposed offer"} in ${b.market}. This is a research plan based on supplied information; no interviews, browsing or independent verification have been performed.\n\n## Evidence coverage\n${verifiedEvidence.length} of ${c.evidence.length} evidence records have a claim, source, owner and verification recorded by a user.\n${c.evidence.filter((e) => !e.verified || !e.claim.trim() || !e.source.trim() || !e.owner.trim()).slice(0, 8).map((e) => `- ${e.claim.slice(0, 180) || "Unnamed claim"}: ${[!e.source.trim() ? "source missing" : "source supplied", !e.owner.trim() ? "owner missing" : `owner ${e.owner.slice(0, 80)}`, !e.verified ? "verification pending" : "verification recorded"].join("; ")}.`).join("\n") || "No incomplete records are currently listed. An empty ledger does not establish demand or substantiate future claims."}\n\n## Primary research guide\n1. Ask the intended customer about the last time this problem occurred, what they did and what it cost in time or money.\n2. Ask what prevented a purchase or enquiry and which alternatives they considered.\n3. Show the proposed offer without promising outcomes; ask what is unclear or missing.\n4. Record exact permissioned observations, recruitment criteria, interview date and sample limitations. Do not label a convenience sample representative.\n\n## Desk research handoff\nCollect dated local offer pages, first-party performance exports and delivery cost evidence. For each finding record its source URL or file, observation date, geography, limitation and accountable reviewer in the evidence ledger. Separate a competitor's claim from a verified fact.\n\n## Decision gate\nBefore approving the positioning, record which audience problem is supported, which assumption remains open, and the smallest test that would change the decision. Customer data should be minimised and stored only in an approved system.`,
    operations: `## Capacity and ownership review\n${c.tasks.length} delivery tasks recorded; ${c.tasks.filter((t) => !t.owner.trim()).length} without an owner; ${c.tasks.filter((t) => !t.due).length} without a date; ${c.tasks.filter((t) => !t.done).length} still open. These counts do not measure staff capacity or supplier availability.\n${taskSummary || "Create a delivery plan before assigning operational commitments."}\n\n## Workback contract\nTarget launch: ${b.launchDate || "not scheduled"}. Assign a named accountable owner for brief approval, production, conversion testing, customer response, release and the first performance review. Check the actual staffing calendar before committing to turnaround times.\n\n## Demand and fulfilment\n${f.invalidBudget ? "Resolve the infeasible budget before using demand scenarios." : `Base case: ${f.customers.toFixed(1)} modelled customers across ${b.weeks} campaign weeks. Compare this assumption with actual available appointments, inventory or service hours; no operating capacity is supplied in the brief.`}\nObtain real unit delivery time, capacity per week, supplier lead time and cancellation constraints. Identify the first constraint before increasing acquisition spend.\n\n## Service recovery playbook\n- Delayed delivery: owner updates the affected customer through the approved channel and records a revised commitment.\n- Incorrect asset or offer: stop the affected placement, retain evidence and restore the approved version.\n- Broken conversion route: pause the affected spend and test recovery before reactivation.\n- Data incident: limit access, preserve an incident record and involve the authorised privacy/security owner.\n\n## Handover\n${c.delivery?.assets.length ? `${c.delivery.assets.length} production assets are recorded. Review their current versions, rights, accessibility checks and approval references in the asset desk.` : "No production asset manifest is recorded. Add final files, specifications, owners and approval evidence in the asset desk."}\nNo calendar booking, staff assignment notification or operational change is executed by this planner.`,
    risk: `## Release risk register\nThe findings below are rule-based observations of supplied records, not a live security, legal or compliance audit.\n\n${readiness(c).blockers.slice(0, 20).map((issue, index) => `${index + 1}. Open: ${issue}. Assign a named owner, mitigation and review evidence before closure.`).join("\n") || "No current recorded launch blockers. Obtain the final accountable release decision and verify the actual live journey."}\n\n## Commercial exposure\n${f.invalidBudget ? `Costs exceed approved investment by ${money(b.agencyFee + b.productionCost - b.budget)}. Hold activation until the budget is reconciled.` : `Conservative contribution: ${money(conservative.contribution)} using user-entered assumptions. ${conservative.contribution < 0 ? "The conservative case loses contribution; approve an explicit learning budget and stopping condition before testing." : "A positive scenario does not establish observed profitability. Verify actual costs, attribution and fulfilment before scaling."}`}\n\n## Claims and rights\n${c.evidence.length - verifiedEvidence.length} evidence records require a source, owner or recorded verification. Review every material claim against the permitted source, context and usage rights. Supplied verification is not independent clearance.\n\n## Decision and recovery record\nFor each accepted residual risk capture the decision owner, rationale, affected assets, review date and reversal trigger. Keep a named launch operator and rollback contact. Reopen release review when a brief, asset, destination, right or dependency changes.\n\n## Release boundary\nThis specialist cannot approve a campaign, accept a risk on a person's behalf, publish content or activate spend. Final release belongs to the authorised human owner.`,
    strategy: `## Strategic decision\nMake ${b.brand || "the brand"} the useful choice for ${b.audience || "a clearly defined audience"}, through ${b.offer || "a specific offer"}.\n\n## Three horizons\n1. Discovery (${Math.max(1, Math.round(b.weeks * 7 * 0.2))} planned days): validate audience interviews, competitor offers and conversion friction in ${b.market}.\n2. Controlled test (${Math.max(1, Math.round(b.weeks * 7 * 0.3))} planned days): test one offer, one conversion destination and three creative hooks.\n3. Review and iteration (${b.weeks * 7 - Math.max(1, Math.round(b.weeks * 7 * 0.2)) - Math.max(1, Math.round(b.weeks * 7 * 0.3))} planned days): review qualified outcomes; scale only when contribution and delivery capacity support it.\n\n## Evidence to collect\n${b.proof || "Customer interviews, dated first-party analytics and permissioned proof."}\n\n## Open decision\nWho owns the commercial result and how will it be measured?`,
    creative: `## Territory 1 — Show the difference\nHook: “A closer look at ${b.brand || "the offer"}.”\nExecution: a real demonstration of ${b.offer || "the product benefit"}.\n\n## Territory 2 — Start with the person\nHook: “For ${b.audience || "the people this is for"}.”\nExecution: an authentic story that connects a human need to the offer.\n\n## Territory 3 — Make the choice clearer\nHook: “Your next step in ${b.market}.”\nExecution: a transparent explanation of value, process and next action.\n\n## Creative constraints\nVoice: ${b.voice}. No fabricated reviews, results or scarcity. Test hooks while keeping audience, spend and landing page constant.`,
    content: `## Editorial system\nPillars: customer problem, useful demonstration, human story, proof, frequently asked questions, invitation.\n\n## Channel adaptations\n${activeChannels
      .map(
        (channel) =>
          `- ${channel}: ${channel === "Search" ? "Intent-led headline, explicit offer terms and a matching conversion page" : channel === "Meta" ? "Visual opening, one customer tension, a demonstration and a short action" : channel === "LinkedIn" ? "A professional problem, practical insight and evidence-led invitation" : channel === "YouTube" ? "Spoken hook, demonstration, reviewed captions and an accessible end card" : channel === "Email" ? "A specific subject, useful answer, one primary action and permission-aware footer" : "An answer-led story, useful detail and a relevant next step"}.`,
      )
      .join(
        "\n",
      )}\n\n## Cadence\nBuild 12 draft items over ${Math.min(23, b.weeks * 7)} days in Content Studio. Review tone, sources and rights before approval. Export the calendar for the publishing team. Nothing is automatically posted.`,
    production: `## ${SHOTS.reduce((n, s) => n + s.seconds, 0)}-second master treatment\n${SHOTS.map((s, i) => `${i + 1}. ${s.title} (${s.seconds}s): ${s.direction}\nDeliver: ${s.deliverables}`).join("\n\n")}\n\n## Budget and dependencies\nProduction allowance: CAD ${b.productionCost.toLocaleString("en-CA")}. Obtain actual supplier quotes. Confirm location, releases, weather, safety, crew, captions, music and usage territory before capture.`,
    media: `## Base planning case — not a forecast guarantee\nAvailable media: CAD ${f.spend.toFixed(0)}\n${f.rows.map((r) => `- ${r.channel}: CAD ${r.allocation.toFixed(0)}; assumed CPC ${r.cpc.toFixed(2)}; conversion rate ${r.cvr}%.`).join("\n")}\n\nModelled conversions: ${f.conversions.toFixed(1)}\nModelled customers: ${f.customers.toFixed(1)}\nModelled revenue: CAD ${f.revenue.toFixed(0)}\nContribution after all planned campaign costs: CAD ${f.contribution.toFixed(0)}\n\n## Decision rule\nValidate CPC, conversion rate and lead quality using account evidence. Compare conservative and upside scenarios. Do not scale on ROAS alone; review gross margin and full acquisition cost.`,
    search: `## Search intent map\n1. Discovery: what problem does ${b.offer || "the offer"} solve?\n2. Comparison: how should ${b.audience || "the customer"} evaluate available choices?\n3. Local action: availability, location and next steps in ${b.market}.\n\n## Page architecture\nA specific title and H1; useful answer early; supported proof; transparent offer; FAQ sourced from real questions; one conversion route.\n\n## Technical handoff\nCheck indexing, canonicals, mobile usability, headings, keyboard access, performance and valid structured data. The workbench audits supplied copy only; it does not crawl websites or promise AI-search rankings.`,
    measurement: `## Hypothesis\n${c.experiment.hypothesis || `A clearer explanation of ${b.offer || "the offer"} will increase qualified responses without reducing lead quality.`}\n\n## Test design\nControl: existing page. Variant: one changed message. Primary metric: conversion rate; guardrails: lead quality, cost and accessibility.\nBaseline assumption: ${c.experiment.baseline}%; target relative lift: ${c.experiment.lift}%.\nPlanned sample per arm: ${experimentMath(c.experiment).sample?.toLocaleString("en-CA") || "Invalid target; revise assumptions"}.\n\n## Protocol\nUse a 50/50 random split and a pre-agreed fixed horizon. Do not stop on a daily significance spike. Record the actual result and implementation decision.`,
    review: `## Launch review\nChecklist completion: ${readiness(c).score}% (self-reported, not certification).\n\n## Open blockers\n${
      readiness(c)
        .blockers.map((s) => `- ${s}`)
        .join("\n") ||
      "No checklist blockers; obtain final human release authorization."
    }\n\n## Claims ledger\n${
      c.evidence.length
        ? c.evidence
            .slice(0, 12)
            .map(
              (e) =>
                `- ${e.claim.slice(0, 300)}: ${e.verified && e.claim.trim() && e.source.trim() && e.owner.trim() ? "Marked verified by user" : "Needs review"}; source: ${(e.source.trim() || "Missing").slice(0, 300)}`,
            )
            .join("\n") +
          (c.evidence.length > 12
            ? "\nAdditional evidence is retained in the full ledger; this review shows the first 12 records."
            : "")
        : "No evidence records supplied. Add sources for material claims."
    }\n\nThis is an operational review, not legal advice or automated compliance certification.`,
    brand: `## Brand contract\nBrand: ${b.brand || "Define the brand"}. Audience: ${b.audience || "Define the priority audience"}.\nPromise to develop: ${b.offer || "Define a tangible offer"}.\nVoice direction: ${b.voice || "Agree a voice before content production"}.\n\n## Message hierarchy\n1. Lead with the customer's relevant problem and a concrete offer.\n2. Explain how the offer works, what is included and who it suits.\n3. Support material claims with named evidence; place limitations beside the claim.\n4. Close with one consistent action: ${action}.\n\n## Evidence boundary\n${verifiedEvidence.length} complete evidence records are marked verified by the user. ${c.evidence.length - verifiedEvidence.length} records need review.\n${verifiedEvidence.slice(0, 5).map((e) => `- Permitted review candidate: ${e.claim.slice(0, 240)}; source: ${e.source.slice(0, 180)}; owner: ${e.owner.slice(0, 80)}.`).join("\n") || "No verified evidence is available. Use process and offer facts; hold testimonials, performance claims and comparative superiority for substantiation."}\n\n## Acceptance criteria\n- Use the same brand name, offer terms and destination across every asset.\n- Check tone against the agreed voice; remove vague superlatives and invented urgency.\n- Keep an approved logo, colour palette, type scale and usage rules in the production handoff. These visual assets have not been inspected by this engine.\n- Have a human reviewer compare final copy, design and evidence side by side before approval.`,
    conversion: `## Conversion route\nObjective: ${b.objective}; primary event: ${event}.\nDestination: ${destination || "Missing valid destination — add and test a website or booking route"}.\nProposed action: ${action}.\n\n## Page blueprint\n1. Hero: a specific statement of ${b.offer || "the offer"}, written for ${b.audience || "the priority audience"}.\n2. Fit: who the offer serves and who should choose another route.\n3. Value: inclusions, process, price or quotation terms, availability and limitations.\n4. Proof: ${verifiedEvidence.length ? "select a relevant verified claim and display its permitted source" : "collect approved proof; do not publish fabricated results"}.\n5. Friction: answer timing, eligibility, fulfilment and cancellation questions.\n6. Action: repeat the same action label and explain what happens after completion.\n\n## Form and checkout specification\nRequest only fields needed to deliver the stated purpose. Preserve entered data after validation errors, focus the first error and show an accessible completion state. Avoid duplicate submissions and confirm receipt.\n\n## Measurement handoff\nRecord landing_view → primary_action_click → form_start → ${event}. Keep personal data out of analytics events and URLs. Distinguish button clicks from completed outcomes; deduplicate conversions.\n\n## Test backlog\nTest one variable at a time: offer clarity, proof placement, then field friction. Current baseline assumption: ${c.experiment.baseline}%. Do not treat the supplied baseline as measured performance.`,
    lifecycle: `## Qualification and routing contract\nCampaign audience: ${b.audience || "not yet defined"}. Offer: ${b.offer || "not yet defined"}.\nPipeline: new enquiry → contactable → qualified → appointment/proposal → won or lost → follow-up permitted. Define the entry and exit criteria for each stage before importing records.\n\n## Ownership and service levels\nAssign one accountable response owner and an escalation backup. Agree an acknowledgement target and a first-human-response target based on actual staffing; no response promise is confirmed here. Store the original campaign source, permission record, arrival time, owner and next action.\n\n## Draft follow-up sequence\n1. At enquiry: confirm receipt, restate the requested service and explain the next step.\n2. After owner review: answer the customer's specific question and offer a suitable next action.\n3. If unanswered: send a relevant reminder only where permission and local requirements allow; stop on opt-out, invalid contact or an agreed limit.\n4. After delivery: request feedback, address unresolved issues and offer relevant ongoing support with permission.\n\n## Commercial handoff\n${b.objective === "sales" ? "Sales forecasting uses customers directly; do not multiply completed purchases by the lead-to-sale rate again." : `Planning lead-to-sale assumption: ${b.leadToSale}%. Modelled ${f.conversions.toFixed(1)} enquiries → ${f.customers.toFixed(1)} customers. Validate with joined campaign and CRM records.`}\nTrack qualified rate, time to first response, stage conversion, loss reason and acquired-customer contribution.\n\n## Data controls\nSeparate essential service communication from optional marketing consent. Test duplicate handling, suppression, deletion, retention and access before activation. No CRM connection or message sending is performed by this engine.`,
    accessibility: `## Review scope\nThis is a manual verification plan plus supplied-copy heuristics. It does not inspect a rendered page, video, assistive technology or certify accessibility.\n\n## Copy findings\n${sourceCopyChecks.filter((check) => ["One clear page promise", "Image alternative", "Specific next action"].includes(check.title)).map((check) => `- ${check.title}: ${check.passed ? "passes the text heuristic" : "requires review"}. ${check.note}`).join("\n")}\n\n## Interaction protocol\n1. Use the whole conversion route by keyboard: visible focus, logical order, operable menus and dialogs, no traps.\n2. Test zoom, narrow screens and text resizing; check reading order, descriptive headings and persistent form labels.\n3. Check form instructions, accessible error announcements and confirmation states with a screen reader.\n4. Measure actual text and control contrast in every state; do not infer contrast from a colour name.\n5. Respect reduced motion, supply playback controls for distracting motion and test the experience without animation.\n\n## Creative delivery protocol\nProvide reviewed captions and transcripts for spoken content. Give meaningful images informative alternatives; decorative imagery should be hidden appropriately. Do not place essential information only inside images, colour, audio or motion.\n\n## Handoff evidence\nFor every issue record the asset/URL, steps to reproduce, expected result, severity, owner and retest evidence. Block release on issues that prevent understanding or completing ${action.toLowerCase()}.`,
    delivery: `## Delivery status\nLaunch date: ${b.launchDate || "not scheduled"}. Planned campaign duration: ${b.weeks} weeks.\n${pendingTasks.length} of ${c.tasks.length} delivery tasks need completion or an accountable owner.\n${taskSummary || "No delivery tasks are recorded. Create the workback schedule and assign real owners."}\n\n## Dependency sequence\n1. Commercial owner approves the shared brief and total investment (${money(b.budget)}).\n2. Brand and creative owners approve message, evidence and treatment.\n3. Producer confirms supplier quotes, releases and the ${money(b.productionCost)} production allowance.\n4. Content, web and lifecycle owners deliver drafts, destination and response routing.\n5. Accessibility and measurement reviewers verify the actual user journey and test events.\n6. Client release owner signs off final assets, placements, schedule and pause procedure.\n\n## Handover manifest\nFor each final asset record filename/version, channel, dimensions, duration, captions/alternative, rights territory/expiry, destination, tracking parameters and approver. Keep editable masters with approved exports.\n\n## Release and rollback\nConfirm named launch operator and backup; record activation time and first checks. Define who may pause spend, disable an incorrect asset or restore the previous destination. A workflow draft does not publish, book media or constitute client signoff.`,
    performance: `## ${observations ? "Reported results" : "Planning scenario comparison"}\n${observations ? `${c.performance!.rows.length} user-supplied daily channel records. Reported spend: ${money(observations.spend)}; revenue: ${money(observations.revenue)}; customers: ${observations.customers}.\nReported media CAC: ${money(observations.cac)}. Media contribution: ${money(observations.mediaContribution)} using the brief's ${b.margin}% margin assumption; excludes agency fees and production. Data completeness and attribution still need validation.` : "No observed performance has been supplied. The figures below are scenarios derived from user-entered assumptions, not actual account results."}\n\n## Sensitivity analysis\n${f.invalidBudget ? "Budget is infeasible; contribution and scaling decisions are withheld until fees and production fit within total investment." : `Conservative: ${conservative.customers.toFixed(1)} modelled customers; contribution ${money(conservative.contribution)}.\nBase: ${f.customers.toFixed(1)} modelled customers; contribution ${money(f.contribution)}.\nUpside: ${upside.customers.toFixed(1)} modelled customers; contribution ${money(upside.contribution)}.\nConservative assumes 25% higher CPC and 25% lower conversion; upside assumes 20% lower CPC and 25% higher conversion, capped at 100%.`}\n\n## Commercial thresholds\nGross profit per customer before acquisition: ${money(b.revenuePerCustomer * b.margin / 100)}.\n${f.invalidBudget ? "Resolve the budget before setting acquisition thresholds." : `Fully loaded modelled CAC: ${money(f.fullyLoadedCac)}. Break-even customers across the full campaign investment: ${f.breakEvenCustomers === null ? "undefined at zero margin or customer value" : Math.ceil(f.breakEvenCustomers).toLocaleString("en-CA")}.`}\n\n## Experiment decision\n${!experiment.valid ? "Observed conversions exceed visitors. Correct the experiment records before interpreting results." : experiment.sample === null ? "The requested lift produces an impossible conversion rate. Revise the experiment target." : experiment.sufficient ? `The supplied sample meets the planned count and minimum cell-count checks. Observed absolute difference: ${((experiment.difference ?? 0) * 100).toFixed(2)} percentage points. Review the fixed-horizon interval, assignment quality and business impact; this is not an automatic winner declaration.` : `Evidence is not yet sufficient for a result decision. Planned sample: ${experiment.sample.toLocaleString("en-CA")} visitors per arm; estimated duration: ${experiment.days} days at the entered traffic assumption.`}\n\n## Weekly decision record\nRecord data range and source, qualified outcomes, contribution, delivery capacity, uncertainty, one next action and the accountable owner. Scale only after observed unit economics and fulfilment support it; no budget change is executed.`,
    expansion: `## ${b.market}: controlled entry plan\nStart with one audience, one locally relevant offer and one conversion route.\n\n## Evidence before commitment\n- Local demand, seasonal patterns and competitor offers with dates and sources.\n- Language, cultural context and appropriate accessibility review.\n- Fulfilment capacity, service radius and realistic local operating costs.\n\n## Test gate\nAllocate an explicitly approved portion of the CAD ${f.spend.toFixed(0)} media allowance. Compare contribution and qualified outcomes against the founding market before opening a new city.\n\nNo live market research is included in this planning engine.`,
  };
  const section =
    id === "media" && f.invalidBudget
      ? `## Infeasible budget — resolve before forecasting\nAgency fees and production/other costs exceed the total investment by CAD ${(b.agencyFee + b.productionCost - b.budget).toFixed(0)}.\nIncrease the approved investment or revise these costs. Media activation and contribution forecasts are withheld until the budget is feasible.`
      : sections[id];
  return {
    id: uid(),
    agent: id,
    title: label.name,
    text: `# ${label.name}\n\n${context}\n${section}\n\n---\nSource: shared brief revision ${c.revision}; user-entered assumptions. Deterministic planning engine, not a live AI response. Human review required.`,
    mode: "Planning engine",
    revision: c.revision,
    createdAt: new Date().toISOString(),
    approved: false,
    sourceFingerprint: agentSourceFingerprint(c, id),
  };
}
