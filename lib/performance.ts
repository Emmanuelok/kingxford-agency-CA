import { z } from "zod";
import type { Campaign } from "./campaign.ts";

export const RESULT_CHANNELS = ["Search", "Meta", "LinkedIn", "YouTube", "Organic", "Email"] as const;
const amount = z.number().finite().min(0).max(1_000_000_000);
const date = z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use a real date in YYYY-MM-DD format.");
export const performanceRowSchema = z.object({
  id: z.string().uuid(), date, channel: z.enum(RESULT_CHANNELS), spend: amount,
  impressions: amount.int(), clicks: amount.int(), leads: amount.int(), customers: amount.int(), revenue: amount,
  source: z.string().trim().min(1, "Record the source of these results.").max(300),
}).superRefine((r, ctx) => {
  if (r.clicks > r.impressions) ctx.addIssue({code: "custom", path: ["clicks"], message: "Clicks cannot exceed impressions in this daily report."});
});
export const performanceSchema = z.object({rows: z.array(performanceRowSchema).max(500)}).superRefine((p, ctx) => {
  if (new Set(p.rows.map((r) => `${r.date}:${r.channel}`)).size !== p.rows.length) ctx.addIssue({code: "custom", message: "Keep one report per channel per day. Edit the existing report to correct it."});
  if (new Set(p.rows.map((r) => r.id)).size !== p.rows.length) ctx.addIssue({code: "custom", message: "Duplicate result IDs are not allowed."});
});
export type PerformanceRow = z.infer<typeof performanceRowSchema>;
export const PERFORMANCE_HEADERS = ["date", "channel", "spend", "impressions", "clicks", "leads", "customers", "revenue", "source"] as const;

/** CSV parser accepts quoted commas, escaped quotes, CRLF, and multiline source notes. */
export function parseResultsCsv(input: string): PerformanceRow[] {
  if (new TextEncoder().encode(input).byteLength > 500_000) throw new Error("Keep CSV files below 500 KB.");
  const records: string[][] = []; let row: string[] = [], cell = "", quoted = false, closed = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') {cell += '"'; i++;}
      else if (ch === '"') {quoted = false; closed = true;}
      else cell += ch;
    } else if (ch === '"') {
      if (cell || closed) throw new Error("Unexpected quotation mark in CSV.");
      quoted = true;
    } else if (ch === ",") {row.push(cell); cell = ""; closed = false;}
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(cell); if (row.some((s) => s.trim())) records.push(row);
      row = []; cell = ""; closed = false;
    } else {if (closed) throw new Error("Unexpected text after a quoted CSV field."); cell += ch;}
  }
  if (quoted) throw new Error("Close the quoted CSV field before importing.");
  row.push(cell); if (row.some((s) => s.trim())) records.push(row);
  const header = records.shift()?.map((s) => s.replace(/^\uFEFF/, "").trim().toLowerCase());
  if (!header || header.length !== PERFORMANCE_HEADERS.length || new Set(header).size !== header.length || PERFORMANCE_HEADERS.some((s) => !header.includes(s))) throw new Error(`Use these CSV headers: ${PERFORMANCE_HEADERS.join(",")}`);
  if (!records.length) throw new Error("Add at least one result below the CSV headers.");
  if (records.length > 500) throw new Error("Import no more than 500 daily records at a time.");
  const rows = records.map((cells, i) => {
    if (cells.length !== header.length) throw new Error(`CSV row ${i + 2} has the wrong number of columns.`);
    const raw: Record<string, unknown> = {id: crypto.randomUUID()};
    header.forEach((h, j) => {
      const v = cells[j].trim();
      if (["date", "channel", "source"].includes(h)) raw[h] = h === "channel" ? RESULT_CHANNELS.find((c) => c.toLowerCase() === v.toLowerCase()) ?? v : v;
      else {
        if (!/^\d+(\.\d+)?$/.test(v)) throw new Error(`CSV row ${i + 2}: ${h} must be a non-negative number without currency signs or separators.`);
        raw[h] = Number(v);
      }
    });
    const parsed = performanceRowSchema.safeParse(raw);
    if (!parsed.success) throw new Error(`CSV row ${i + 2}: ${parsed.error.issues[0].message}`);
    return parsed.data;
  });
  const parsed = performanceSchema.safeParse({rows});
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  return parsed.data.rows;
}

export function mergeResults(existing: PerformanceRow[], incoming: PerformanceRow[], replace = false): PerformanceRow[] {
  performanceSchema.parse({rows: existing});
  performanceSchema.parse({rows: incoming});
  const result = new Map(existing.map((r) => [`${r.date}:${r.channel}`, r]));
  for (const row of incoming) {
    const key = `${row.date}:${row.channel}`;
    if (result.has(key) && !replace) throw new Error(`${row.date} · ${row.channel} already exists. Select replacement to correct this day's report.`);
    result.set(key, {...row, id: result.get(key)?.id ?? row.id});
  }
  return performanceSchema.parse({rows: [...result.values()].sort((a, b) => b.date.localeCompare(a.date) || a.channel.localeCompare(b.channel))}).rows;
}

const metricKeys = ["spend", "impressions", "clicks", "leads", "customers", "revenue"] as const;
const ratio = (a: number, b: number) => b > 0 ? a / b : null;
const DAY = 86_400_000;
const shiftDate = (value: string, days: number) => new Date(Date.parse(value) + days * DAY).toISOString().slice(0, 10);

function totals(rows: PerformanceRow[]) {
  const counts = {spend: 0, impressions: 0, clicks: 0, leads: 0, customers: 0, revenue: 0};
  for (const row of rows) for (const key of metricKeys) counts[key] += row[key];
  return {...counts, ctr: ratio(counts.clicks * 100, counts.impressions), cpc: ratio(counts.spend, counts.clicks), cpl: ratio(counts.spend, counts.leads), cac: ratio(counts.spend, counts.customers), roas: ratio(counts.revenue, counts.spend)};
}

export function performanceSummary(c: Campaign, rows: PerformanceRow[]) {
  const total = totals(rows);
  const grossProfit = total.revenue * c.brief.margin / 100;
  return {...total,
    cvr: ratio((c.brief.objective === "sales" ? total.customers : total.leads) * 100, total.clicks), grossProfit,
    mediaContribution: grossProfit - total.spend,
    byChannel: RESULT_CHANNELS.map((channel) => {
      const records = rows.filter((r) => r.channel === channel);
      const observed = totals(records);
      return {channel, ...observed, days: new Set(records.map((r) => r.date)).size,
        cvr: ratio((c.brief.objective === "sales" ? observed.customers : observed.leads) * 100, observed.clicks),
        contribution: observed.revenue * c.brief.margin / 100 - observed.spend};
    }).filter((r) => r.days > 0),
  };
}

/** Coverage is channel-days, not just days; a partial day never implies all channels reported. */
export function reportingCoverage(c: Campaign, rows: PerformanceRow[], from: string, to: string, channel = "All channels") {
  if (!date.safeParse(from).success || !date.safeParse(to).success || from > to) return null;
  const relevant = rows.filter((r) => r.date >= from && r.date <= to && (channel === "All channels" || r.channel === channel));
  const expectedChannels = channel === "All channels"
    ? [...new Set([...c.media.filter((r) => r.weight > 0).map((r) => r.channel), ...relevant.map((r) => r.channel)])]
    : RESULT_CHANNELS.filter((r) => r === channel);
  const days = Math.floor((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  const expected = days * expectedChannels.length;
  const recorded = new Set(relevant.map((r) => `${r.date}:${r.channel}`)).size;
  return {days, expectedChannels, expected, recorded, missing: Math.max(0, expected - recorded), percentage: expected ? Math.min(100, recorded / expected * 100) : null};
}

/** Equal-length comparison with explicit windows. No division by a zero or absent baseline. */
export function comparePerformance(c: Campaign, allRows: PerformanceRow[], from: string, to: string, channel = "All channels") {
  if (!date.safeParse(from).success || !date.safeParse(to).success || from > to) return null;
  const days = Math.floor((Date.parse(to) - Date.parse(from)) / DAY) + 1;
  const previousTo = shiftDate(from, -1), previousFrom = shiftDate(from, -days);
  const forWindow = (start: string, end: string) => allRows.filter((r) => r.date >= start && r.date <= end && (channel === "All channels" || r.channel === channel));
  const currentRows = forWindow(from, to), previousRows = forWindow(previousFrom, previousTo);
  const current = performanceSummary(c, currentRows), previous = performanceSummary(c, previousRows);
  return {from, to, previousFrom, previousTo, days, current, previous, currentRecords: currentRows.length, previousRecords: previousRows.length,
    changes: Object.fromEntries(metricKeys.map((key) => [key, previousRows.length && currentRows.length && previous[key] > 0 ? (current[key] - previous[key]) / previous[key] * 100 : null])) as Record<typeof metricKeys[number], number | null>,
  };
}

export type PerformanceInsight = {id: string; channel: string; level: "review" | "watch" | "opportunity"; title: string; evidence: string; action: string; task: string};
/** Explicit operational rules, not causal inference or statistical winner declarations. */
export function performanceInsights(c: Campaign, rows: PerformanceRow[]): PerformanceInsight[] {
  const report = performanceSummary(c, rows);
  const format = (n: number) => new Intl.NumberFormat("en-CA", {maximumFractionDigits: 2}).format(n);
  return report.byChannel.map((r) => {
    const base = {id: `performance-${r.channel.toLowerCase()}`, channel: r.channel};
    const evidence = `${r.days} reporting days; CAD ${format(r.spend)} spend; ${r.customers} customers; CAD ${format(r.revenue)} attributed revenue.`;
    if (rows.some((row) => row.channel === r.channel && (row.leads > row.clicks || row.customers > row.clicks || (row.revenue > 0 && row.customers === 0))))
      return {...base, level: "review", title: "Reconcile the conversion source", evidence, action: "Outcome counts or revenue do not line up with same-day clicks/customers. Check view-through attribution, delayed conversions and deduplication before comparing efficiency.", task: `Reconcile ${r.channel} attribution windows and conversion counts`};
    if (r.spend > 0 && r.clicks === 0)
      return {...base, level: "review", title: "Check delivery and event capture", evidence, action: "Spend is recorded without clicks. Inspect placement delivery, the reporting export and click measurement before making a budget decision.", task: `Review ${r.channel} delivery and click tracking`};
    if (r.days < 7 || r.customers < 10)
      return {...base, level: "watch", title: "Build a fuller evidence window", evidence, action: "Keep collecting sourced results and review lead quality. Fewer than seven reported days or ten customers trigger this review rule; these thresholds do not establish statistical confidence.", task: `Collect a fuller ${r.channel} performance window and assess lead quality`};
    if (r.contribution < 0)
      return {...base, level: "review", title: "Investigate acquisition economics", evidence, action: `Attributed revenue at the brief’s ${c.brief.margin}% margin does not cover recorded media spend. Review the offer, conversion route, lead quality and attribution before committing more budget.`, task: `Review ${r.channel} offer and conversion economics`};
    return {...base, level: "opportunity", title: "Consider a bounded follow-up test", evidence, action: `Attributed gross profit exceeds media spend by CAD ${format(r.contribution)}, using the ${c.brief.margin}% margin assumption. Verify completeness and fulfilment capacity, then test one change with a fixed spend limit; this does not prove incremental lift.`, task: `Design a bounded ${r.channel} follow-up test with an owner and spend limit`};
  });
}

export function pacing(c: Campaign, asOf: string) {
  const budget = Math.max(0, c.brief.budget - c.brief.agencyFee - c.brief.productionCost);
  const duration = c.brief.weeks * 7;
  const valid = date.safeParse(asOf).success;
  const end = c.brief.launchDate ? shiftDate(c.brief.launchDate, duration - 1) : null;
  const through = end && end < asOf ? end : asOf;
  const elapsed = c.brief.launchDate && valid ? Math.max(0, Math.min(duration, Math.floor((Date.parse(asOf) - Date.parse(c.brief.launchDate)) / DAY) + 1)) : null;
  const rows = (c.performance?.rows ?? []).filter((r) => valid && r.date <= through && (!c.brief.launchDate || r.date >= c.brief.launchDate));
  const spent = rows.reduce((n, r) => n + r.spend, 0);
  const expected = elapsed === null ? null : budget * elapsed / duration;
  const coverage = c.brief.launchDate && elapsed && valid ? reportingCoverage(c, rows, c.brief.launchDate, through) : null;
  const daysLeft = elapsed === null ? null : Math.max(0, duration - elapsed);
  const remaining = Math.max(0, budget - spent);
  return {budget, elapsed, spent, expected, remaining, variance: expected === null ? null : spent - expected,
    end, daysLeft, dailyRemaining: daysLeft ? remaining / daysLeft : null, coverage,
    completeCoverage: !!coverage && coverage.expected > 0 && coverage.missing === 0};
}

export function performanceDecisionBrief(c: Campaign, rows: PerformanceRow[], from: string, to: string, channel = "All channels") {
  const r = performanceSummary(c, rows), coverage = reportingCoverage(c, rows, from, to, channel);
  const insights = performanceInsights(c, rows);
  const value = (n: number | null) => n === null ? "Not available" : n.toFixed(2);
  return `# ${c.name} — performance review\n\nWindow: ${from} through ${to} · ${channel}\nShared brief revision: ${c.revision}\nRecords: ${rows.length}; channel-day coverage: ${coverage ? `${coverage.recorded}/${coverage.expected}` : "not available"}\n\n## Reported results\nSpend: CAD ${value(r.spend)}\nAttributed revenue: CAD ${value(r.revenue)}\nLeads: ${r.leads}\nCustomers: ${r.customers}\nMedia ROAS: ${value(r.roas)}\nMedia CAC: CAD ${value(r.cac)}\nGross profit less media: CAD ${value(r.mediaContribution)} at ${c.brief.margin}% assumed margin; excludes fees and production.\n\n## Next actions\n${insights.map((i) => `### ${i.channel}: ${i.title}\n${i.evidence}\n${i.action}`).join("\n\n") || "Collect actual results before recommending changes."}\n\n## Source notes\n${[...new Set(rows.map((row) => row.source))].map((source) => `- ${source}`).join("\n")}\n\nAttribution is supplied by the reporting sources. Reconcile overlaps, reporting windows and missing days. Observational results do not establish causal lift. No budgets or campaigns were changed.\n`;
}
