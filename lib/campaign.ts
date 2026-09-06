import { z } from "zod";

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
    id: "expansion",
    name: "Market planner",
    role: "A city-entry test with evidence requirements",
    room: "Markets",
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
        }),
      )
      .max(100),
    checks: z.record(z.boolean()),
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
      budget: 18000,
      agencyFee: 5000,
      productionCost: 4000,
      weeks: 10,
      revenuePerCustomer: 1200,
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
    !!patch.evidence;
  const checks = contextChanged
    ? {}
    : patch.content || patch.tasks || patch.runs
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
  const ordered = [...c.runs].sort(
    (a, b) => b.revision - a.revision || b.createdAt.localeCompare(a.createdAt),
  );
  const latestRuns = ordered.filter(
    (r, i) => ordered.findIndex((x) => x.agent === r.agent) === i,
  );
  const stale =
    latestRuns.filter((r) => r.revision !== c.revision).length +
    c.content.filter((r) => r.revision !== c.revision).length;
  if (c.brief.website && !safeUrl(c.brief.website))
    blockers.push("The shared brief contains an invalid website URL");
  if (stale) blockers.push(`${stale} outputs were created from an older brief`);
  if (c.content.some((x) => x.status !== "Approved"))
    blockers.push("Content drafts still need approval");
  if (latestRuns.some((x) => !x.approved))
    blockers.push("Current specialist outputs still need approval");
  if (c.tasks.some((t) => !t.done || !t.owner.trim()))
    blockers.push("Delivery tasks need completion and accountable owners");
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
  const channels = c.media.filter((r) => r.weight > 0).map((r) => r.channel);
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
    date.setUTCDate(start.getUTCDate() + i * 2);
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
    label = AGENTS.find((a) => a.id === id)!;
  const context = `${b.brand || "Unnamed brand"} · ${b.market}\nAudience: ${b.audience || "Not supplied"}\nOffer: ${b.offer || "Not supplied"}\nObjective: ${b.objective}\n`;
  const sections: Record<AgentId, string> = {
    strategy: `## Strategic decision\nMake ${b.brand || "the brand"} the useful choice for ${b.audience || "a clearly defined audience"}, through ${b.offer || "a specific offer"}.\n\n## Three horizons\n1. Weeks 1–2: validate audience interviews, competitor offers and conversion friction in ${b.market}.\n2. Weeks 3–4: test one offer, one conversion destination and three creative hooks.\n3. Remaining ${Math.max(0, b.weeks - 4)} weeks: review qualified outcomes weekly; scale only when contribution and delivery capacity support it.\n\n## Evidence to collect\n${b.proof || "Customer interviews, dated first-party analytics and permissioned proof."}\n\n## Open decision\nWho owns the commercial result and how will it be measured?`,
    creative: `## Territory 1 — Show the difference\nHook: “A closer look at ${b.brand || "the offer"}.”\nExecution: a real demonstration of ${b.offer || "the product benefit"}.\n\n## Territory 2 — Start with the person\nHook: “For ${b.audience || "the people this is for"}.”\nExecution: an authentic story that connects a human need to the offer.\n\n## Territory 3 — Make the choice clearer\nHook: “Your next step in ${b.market}.”\nExecution: a transparent explanation of value, process and next action.\n\n## Creative constraints\nVoice: ${b.voice}. No fabricated reviews, results or scarcity. Test hooks while keeping audience, spend and landing page constant.`,
    content: `## Editorial system\nPillars: customer problem, useful demonstration, human story, proof, frequently asked questions, invitation.\n\n## Channel adaptations\n${c.media
      .filter((r) => r.weight > 0)
      .map(
        (r) =>
          `- ${r.channel}: one native opening, one supported point, one clear action.`,
      )
      .join(
        "\n",
      )}\n\n## Cadence\nBuild 12 draft items over 24 days in Content Studio. Review tone, sources and rights before approval. Export the calendar for the publishing team. Nothing is automatically posted.`,
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
  };
}
