import { isRunCurrent, type Campaign } from "./campaign.ts";

export type DeliveryTask = Campaign["tasks"][number];
export type DeliveryFilter = "all" | "open" | "complete" | "overdue" | "unassigned" | "unscheduled";
export type DeliveryPresetId = "campaign" | "film" | "website" | "content";

export const DELIVERY_PRESETS: {
  id: DeliveryPresetId;
  label: string;
  description: string;
  steps: { title: string; days: number }[];
}[] = [
  {
    id: "campaign", label: "Campaign launch", description: "From agreed brief to the first performance review.",
    steps: [
      { title: "Agree audience, offer, objectives and accountable owner", days: -21 },
      { title: "Confirm channel plan, investment and success measures", days: -18 },
      { title: "Approve creative route and production scope", days: -14 },
      { title: "Verify evidence, rights and claims", days: -10 },
      { title: "Deliver channel variants, captions and destination copy", days: -7 },
      { title: "Test forms, analytics, consent and lead routing", days: -5 },
      { title: "Complete brand and accessibility review", days: -3 },
      { title: "Record final client sign-off and pause procedure", days: -1 },
      { title: "Release approved assets and verify live placements", days: 0 },
      { title: "Review qualified outcomes and document next decisions", days: 7 },
    ],
  },
  {
    id: "film", label: "Film & photography", description: "A practical path from treatment to mastered deliverables.",
    steps: [
      { title: "Approve treatment, shot list and production budget", days: -21 },
      { title: "Book crew, equipment and locations", days: -18 },
      { title: "Clear talent, location, music and image usage", days: -14 },
      { title: "Confirm call sheet, schedule and weather contingency", days: -12 },
      { title: "Capture footage, stills and clean audio", days: -10 },
      { title: "Review first edit against approved treatment", days: -7 },
      { title: "Complete colour, sound, captions and transcript", days: -4 },
      { title: "Check format variants, rights records and client sign-off", days: -2 },
      { title: "Deliver source masters and approved channel exports", days: 0 },
    ],
  },
  {
    id: "website", label: "Website release", description: "Content, conversion, access and release preparation.",
    steps: [
      { title: "Agree site scope, user journeys and conversion goals", days: -28 },
      { title: "Approve sitemap, content inventory and responsibilities", days: -21 },
      { title: "Review responsive designs and component behaviour", days: -14 },
      { title: "Complete page copy, images and search metadata", days: -10 },
      { title: "Test primary conversion journey and error recovery", days: -7 },
      { title: "Review keyboard access, contrast and mobile layouts", days: -5 },
      { title: "Verify data handling, consent, forms and analytics", days: -3 },
      { title: "Confirm domain, backup, rollback and release approval", days: -1 },
      { title: "Publish approved release and complete live smoke check", days: 0 },
      { title: "Review real enquiries, errors and conversion friction", days: 7 },
    ],
  },
  {
    id: "content", label: "Content programme", description: "A repeatable editorial cycle with explicit review.",
    steps: [
      { title: "Agree editorial pillars and audience needs", days: -14 },
      { title: "Plan channel mix, publishing dates and production owners", days: -12 },
      { title: "Collect approved source material and evidence", days: -10 },
      { title: "Draft copy, visual treatments and channel variants", days: -7 },
      { title: "Review brand voice, claims, rights and accessibility", days: -4 },
      { title: "Approve final content and destination links", days: -2 },
      { title: "Publish approved content and check presentation", days: 0 },
      { title: "Review engagement quality and feed insights into next cycle", days: 7 },
    ],
  },
];

export function localCalendarDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isCalendarDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
}

export function offsetCalendarDate(value: string, days: number): string {
  if (!isCalendarDate(value) || !Number.isInteger(days)) throw new Error("Choose a valid schedule anchor date.");
  const shifted = new Date(`${value}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  const result = shifted.toISOString().slice(0, 10);
  if (!isCalendarDate(result)) throw new Error("The schedule exceeds the supported date range.");
  return result;
}

export function taskStatus(task: DeliveryTask, today: string): string {
  if (task.done) return "Complete";
  if (!task.due) return "Unscheduled";
  if (task.due < today) return "Overdue";
  if (task.due === today) return "Due today";
  return "Upcoming";
}

export function filterDeliveryTasks(tasks: DeliveryTask[], options: {
  status?: DeliveryFilter; owner?: string; search?: string; dueBefore?: string; today: string;
}): DeliveryTask[] {
  const search = (options.search ?? "").trim().toLocaleLowerCase();
  return tasks.filter((task) => {
    if (options.status === "open" && task.done) return false;
    if (options.status === "complete" && !task.done) return false;
    if (options.status === "overdue" && (task.done || !task.due || task.due >= options.today)) return false;
    if (options.status === "unassigned" && task.owner.trim()) return false;
    if (options.status === "unscheduled" && task.due) return false;
    if (options.owner && task.owner.trim() !== options.owner) return false;
    if (options.dueBefore && (!task.due || task.due > options.dueBefore)) return false;
    return !search || `${task.title} ${task.owner}`.toLocaleLowerCase().includes(search);
  }).sort((a, b) => Number(a.done) - Number(b.done) ||
    (a.due || "9999-12-31").localeCompare(b.due || "9999-12-31") || a.title.localeCompare(b.title));
}

export function deliverySummary(campaign: Campaign, today: string) {
  const tasks = campaign.tasks;
  return {
    total: tasks.length,
    complete: tasks.filter((task) => task.done).length,
    overdue: tasks.filter((task) => !task.done && task.due && task.due < today).length,
    dueToday: tasks.filter((task) => !task.done && task.due === today).length,
    unassigned: tasks.filter((task) => !task.owner.trim()).length,
    unscheduled: tasks.filter((task) => !task.due).length,
    approvedContent: campaign.content.filter((item) => item.status === "Approved" && item.revision === campaign.revision).length,
    verifiedEvidence: campaign.evidence.filter((item) => item.verified && item.claim.trim() && item.source.trim() && item.owner.trim()).length,
  };
}

export function scheduleDeliveryPreset(tasks: DeliveryTask[], presetId: DeliveryPresetId, anchor: string, owner = "") {
  const preset = DELIVERY_PRESETS.find((item) => item.id === presetId);
  if (!preset) throw new Error("Choose a delivery plan.");
  if (!isCalendarDate(anchor) || anchor < "2000-01-01" || anchor > "2099-12-31")
    throw new Error("Choose a valid schedule anchor date between 2000 and 2099.");
  const existing = new Set(tasks.map((task) => task.title.trim().toLocaleLowerCase()));
  const candidates = preset.steps.filter((step) => !existing.has(step.title.toLocaleLowerCase()));
  const slots = Math.max(0, 200 - tasks.length);
  const additions = candidates.slice(0, slots).map((step) => ({
    id: crypto.randomUUID(), title: step.title, owner: owner.trim().slice(0, 100),
    due: offsetCalendarDate(anchor, step.days), done: false,
  }));
  return {
    tasks: [...tasks, ...additions],
    added: additions.length,
    duplicates: preset.steps.length - candidates.length,
    excluded: Math.max(0, candidates.length - slots),
  };
}

function escapeCsv(value: string): string {
  const protectedValue = /^\s*[=+\-@＝＋－＠]/u.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${protectedValue.replace(/"/g, '""')}"`;
}

export function deliveryCsv(tasks: DeliveryTask[], today: string): string {
  return [["Task", "Owner", "Due date", "Status", "Complete"], ...tasks.map((task) => [
    task.title, task.owner, task.due, taskStatus(task, today), task.done ? "Yes" : "No",
  ])].map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

const text = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cell = (value: string | number) => text(String(value)).replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
const block = (value: string) => text(value || "Not supplied.").split("\n").map((line) => `> ${line}`).join("\n");

export function buildLaunchPackage(c: Campaign, options: {
  today: string;
  generatedAt: string;
  review: { score: number; blockers: string[] };
  checks: readonly (readonly [string, string, boolean])[];
}): string {
  const summary = deliverySummary(c, options.today);
  const lines = [
    "# AVALON Creative Group · Campaign launch package", "",
    `Campaign: ${cell(c.name)}`, `Campaign ID: ${c.id}`, `Brief revision: ${c.revision}`,
    `Generated: ${cell(options.generatedAt)}`, `Date basis: ${options.today} (local calendar date)`, "",
    "This is an exported working record. It does not publish content, book media, notify owners or certify legal clearance.", "",
    "## Release review", "",
    `Checklist completion: ${options.review.score}%. ${options.review.blockers.length ? `${options.review.blockers.length} unresolved launch blockers.` : "No blockers found in the recorded checks. Final release remains a human decision."}`,
    ...options.review.blockers.map((issue) => `- ${cell(issue)}`), "",
    "## Shared brief", "",
    `- Brand: ${cell(c.brief.brand || "Not supplied")}`,
    `- Sector: ${cell(c.brief.sector || "Not supplied")}`,
    `- Market: ${cell(c.brief.market || "Not supplied")}`,
    `- Objective: ${cell(c.brief.objective)}`,
    `- Target launch: ${c.brief.launchDate || "Not scheduled"}`,
    `- Website: ${cell(c.brief.website || "Not supplied")}`,
    `- Total investment assumption: CAD ${c.brief.budget.toLocaleString("en-CA")}`,
    `- Agency allowance: CAD ${c.brief.agencyFee.toLocaleString("en-CA")}`,
    `- Production allowance: CAD ${c.brief.productionCost.toLocaleString("en-CA")}`,
    "", "### Audience", "", block(c.brief.audience), "", "### Offer / challenge", "", block(c.brief.offer),
    "", "### Voice", "", block(c.brief.voice), "", "### Supplied proof", "", block(c.brief.proof), "",
    "## Channel assumptions", "",
    "Weights and rates are planning inputs, not reported campaign performance.", "",
    "| Channel | Allocation weight | CPC assumption (CAD) | Conversion assumption |",
    "| --- | ---: | ---: | ---: |",
    ...c.media.map((row) => `| ${cell(row.channel)} | ${row.weight} | ${row.cpc} | ${row.cvr}% |`), "",
    "## Delivery register", "",
    `${summary.complete}/${summary.total} tasks complete · ${summary.overdue} overdue · ${summary.unassigned} without an owner · ${summary.unscheduled} without a due date.`, "",
    "| Task | Owner | Due date | Status |", "| --- | --- | --- | --- |",
    ...filterDeliveryTasks(c.tasks, { today: options.today }).map((task) => `| ${cell(task.title)} | ${cell(task.owner || "Unassigned")} | ${task.due || "Unscheduled"} | ${taskStatus(task, options.today)} |`),
    ...(!c.tasks.length ? ["No delivery tasks recorded."] : []), "",
    "## Content inventory", "",
    `${summary.approvedContent}/${c.content.length} content items approved against the current brief.`, "",
    ...c.content.flatMap((item) => [
      `### ${cell(item.title || "Untitled content")}`, "",
      `${cell(item.channel)} · ${item.date || "Unscheduled"} · ${item.revision !== c.revision ? `STALE — revision ${item.revision}; review required` : item.status} · Record ${item.id}`, "",
      block(item.copy), "",
    ]),
    "## Evidence register", "",
    "Verification reflects the status recorded by a workspace reviewer; sources have not been independently verified by this export.", "",
    "| Claim | Source | Owner | Recorded status |", "| --- | --- | --- | --- |",
    ...c.evidence.map((item) => `| ${cell(item.claim)} | ${cell(item.source)} | ${cell(item.owner || "Unassigned")} | ${item.verified && item.claim.trim() && item.source.trim() && item.owner.trim() ? "Verified and complete" : "Review required"} |`),
    ...(!c.evidence.length ? ["No evidence records supplied."] : []), "",
    "## Release checklist", "",
    ...options.checks.map(([id, label, required]) => `- [${c.checks[id] ? "x" : " "}] ${cell(label)}${required ? " (required)" : ""}`), "",
    "## Specialist output archive", "",
    ...c.runs.flatMap((run) => [
      `### ${cell(run.title)}`, "",
      `${cell(run.agent)} · ${cell(run.mode)} · ${run.createdAt} · ${!isRunCurrent(c, run) ? `STALE — revision ${run.revision}; inputs changed or output superseded` : run.approved ? "Approved for current brief" : "Review required"}`, "",
      block(run.text), "",
    ]),
    "## Handoff decisions", "",
    "- Release owner: ____________________",
    "- Client approval reference: ____________________",
    "- Live destination / placement record: ____________________",
    "- First review date and owner: ____________________",
    "- Pause / rollback contact: ____________________", "",
  ];
  return lines.join("\n");
}
