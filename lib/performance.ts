import { z } from "zod";
import type { Campaign } from "./campaign.ts";

const channels = ["Search", "Meta", "LinkedIn", "YouTube", "Organic", "Email"] as const;
const amount = z.number().finite().min(0).max(1_000_000_000);
const date = z.string().refine((v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v, "Use a real date in YYYY-MM-DD format.");
export const performanceRowSchema = z.object({
  id: z.string().uuid(), date, channel: z.enum(channels), spend: amount,
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
  if (input.length > 500_000) throw new Error("Keep CSV files below 500 KB.");
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
  const rows = records.map((cells, i) => {
    if (cells.length !== header.length) throw new Error(`CSV row ${i + 2} has the wrong number of columns.`);
    const raw: Record<string, unknown> = {id: crypto.randomUUID()};
    header.forEach((h, j) => {
      const v = cells[j].trim();
      if (["date", "channel", "source"].includes(h)) raw[h] = h === "channel" ? channels.find((c) => c.toLowerCase() === v.toLowerCase()) ?? v : v;
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
  const result = new Map(existing.map((r) => [`${r.date}:${r.channel}`, r]));
  for (const row of incoming) {
    const key = `${row.date}:${row.channel}`;
    if (result.has(key) && !replace) throw new Error(`${row.date} · ${row.channel} already exists. Select replacement to correct this day's report.`);
    result.set(key, {...row, id: result.get(key)?.id ?? row.id});
  }
  return performanceSchema.parse({rows: [...result.values()].sort((a, b) => b.date.localeCompare(a.date) || a.channel.localeCompare(b.channel))}).rows;
}

export function performanceSummary(c: Campaign, rows: PerformanceRow[]) {
  const sum = (key: "spend" | "impressions" | "clicks" | "leads" | "customers" | "revenue") => rows.reduce((n, r) => n + r[key], 0);
  const spend = sum("spend"), impressions = sum("impressions"), clicks = sum("clicks"), leads = sum("leads"), customers = sum("customers"), revenue = sum("revenue");
  const divide = (a: number, b: number) => b > 0 ? a / b : null;
  const grossProfit = revenue * c.brief.margin / 100;
  return {spend, impressions, clicks, leads, customers, revenue,
    ctr: divide(clicks * 100, impressions), cpc: divide(spend, clicks), cpl: divide(spend, leads), cac: divide(spend, customers), roas: divide(revenue, spend),
    cvr: divide((c.brief.objective === "sales" ? customers : leads) * 100, clicks), grossProfit,
    mediaContribution: grossProfit - spend,
    byChannel: channels.map((channel) => ({channel, spend: rows.filter((r) => r.channel === channel).reduce((n, r) => n + r.spend, 0), revenue: rows.filter((r) => r.channel === channel).reduce((n, r) => n + r.revenue, 0)})).filter((r) => rows.some((x) => x.channel === r.channel)),
  };
}

export function pacing(c: Campaign, asOf: string) {
  const budget = Math.max(0, c.brief.budget - c.brief.agencyFee - c.brief.productionCost);
  const elapsed = c.brief.launchDate && date.safeParse(asOf).success ? Math.max(0, Math.min(c.brief.weeks * 7, Math.floor((Date.parse(asOf) - Date.parse(c.brief.launchDate)) / 86_400_000) + 1)) : null;
  const rows = (c.performance?.rows ?? []).filter((r) => r.date <= asOf && (!c.brief.launchDate || r.date >= c.brief.launchDate));
  const spent = rows.reduce((n, r) => n + r.spend, 0);
  const expected = elapsed === null ? null : budget * elapsed / (c.brief.weeks * 7);
  return {budget, elapsed, spent, expected, remaining: Math.max(0, budget - spent), variance: expected === null ? null : spent - expected, completeCoverage: elapsed !== null && new Set(rows.map((r) => r.date)).size >= elapsed};
}
