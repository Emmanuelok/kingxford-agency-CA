"use client";

import { useMemo, useState } from "react";
import { BarChart3, Download, FileSpreadsheet, Plus, Save, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CHANNELS, csv, uid, type Campaign } from "@/lib/campaign";
import { mergeResults, pacing, parseResultsCsv, performanceRowSchema, performanceSummary, PERFORMANCE_HEADERS, type PerformanceRow } from "@/lib/performance";

type Props = {c: Campaign; update: (patch: Partial<Campaign>, action: string, brief?: boolean) => void; notify: (message: string) => void};
const money = (n: number | null) => n === null ? "—" : new Intl.NumberFormat("en-CA", {style: "currency", currency: "CAD", maximumFractionDigits: 0}).format(n);
const number = (n: number | null) => n === null ? "—" : new Intl.NumberFormat("en-CA", {maximumFractionDigits: 2}).format(n);
function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], {type: "text/csv;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const blank = () => ({date: new Date().toISOString().slice(0, 10), channel: "Search", spend: "", impressions: "", clicks: "", leads: "", customers: "", revenue: "", source: ""});
export function PerformanceStudio({c, update, notify}: Props) {
  const [draft, setDraft] = useState(blank), [editingId, setEditingId] = useState<string | null>(null), [error, setError] = useState("");
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [channel, setChannel] = useState("All channels");
  const [importText, setImportText] = useState(""), [preview, setPreview] = useState<PerformanceRow[]>([]), [replace, setReplace] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const allRows = c.performance?.rows ?? [];
  const rows = allRows.filter((r) => (!from || r.date >= from) && (!to || r.date <= to) && (channel === "All channels" || r.channel === channel));
  const report = performanceSummary(c, rows), today = new Date().toISOString().slice(0, 10), pace = pacing(c, today);
  const validRange = !from || !to || from <= to;
  const conflicts = useMemo(() => preview.filter((r) => (c.performance?.rows ?? []).some((e) => e.date === r.date && e.channel === r.channel)).length, [preview, c.performance]);
  function persist(next: PerformanceRow[], message: string) {
    update({performance: {rows: next}}, message); notify(message);
  }
  function save() {
    const raw = {...draft, id: editingId ?? uid()};
    const data = {...raw, ...Object.fromEntries(["spend", "impressions", "clicks", "leads", "customers", "revenue"].map((key) => [key, draft[key as keyof typeof draft].trim() ? Number(draft[key as keyof typeof draft]) : NaN]))};
    const parsed = performanceRowSchema.safeParse(data);
    if (!parsed.success) {setError(parsed.error.issues.map((i) => `${i.path.join(" ")}: ${i.message}`).join(" · ")); return;}
    if (parsed.data.date > today) {setError("Actual results cannot be recorded for a future date."); return;}
    try {
      persist(mergeResults(allRows.filter((r) => r.id !== editingId), [parsed.data]), editingId ? "Updated result record. Review outputs affected by these figures." : "Recorded actual campaign results.");
      setDraft(blank()); setEditingId(null); setError("");
    } catch (e) {setError(e instanceof Error ? e.message : "Unable to save results.");}
  }
  function edit(r: PerformanceRow) {
    setDraft({date: r.date, channel: r.channel, spend: String(r.spend), impressions: String(r.impressions), clicks: String(r.clicks), leads: String(r.leads), customers: String(r.customers), revenue: String(r.revenue), source: r.source}); setEditingId(r.id); setError("");
    document.getElementById("result-entry")?.scrollIntoView({behavior: "smooth", block: "center"});
  }
  function inspectImport() {
    try {const incoming = parseResultsCsv(importText); if (incoming.some((r) => r.date > today)) throw new Error("Actual results cannot contain future dates."); setPreview(incoming); setError("");} catch (e) {setPreview([]); setError(e instanceof Error ? e.message : "Check your CSV.");}
  }
  return <div className="ws-performance">
    <div className="ws-panel-head"><div><span className="ws-eyebrow">PERFORMANCE / ACTUAL RESULTS</span><h2>Turn results into decisions.</h2><p>Record sourced daily channel results, inspect cost and revenue, and compare spending with the campaign plan.</p></div><Button variant="outline" onClick={() => download("avalon-performance.csv", csv([Array.from(PERFORMANCE_HEADERS), ...rows.map((r) => PERFORMANCE_HEADERS.map((key) => r[key]))]))} disabled={!rows.length}><Download />Export results</Button></div>
    <div className="ws-callout"><BarChart3 /><p>Figures below come from your entries. They are separate from Media Lab projections. Revenue is attributed as reported by your sources; reconcile attribution windows and cross-channel duplicates before treating it as incremental revenue.</p></div>
    <div className="ws-performance-filters">
      <label className="ws-field"><span>From date</span><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label className="ws-field"><span>Through date</span><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      <label className="ws-field"><span>Result channel</span><select value={channel} onChange={(e) => setChannel(e.target.value)}><option>All channels</option>{CHANNELS.map((s) => <option key={s}>{s}</option>)}</select></label>
      <Button variant="outline" onClick={() => {setFrom(""); setTo(""); setChannel("All channels");}}>Reset filters</Button>
    </div>
    {!validRange && <p role="alert" className="ws-warning">The end date must be on or after the start date.</p>}
    <div className="ws-metrics">{[["Recorded media spend", money(report.spend)], ["Attributed revenue", money(report.revenue)], ["Reported customers", number(report.customers)], ["Media ROAS", report.roas === null ? "—" : `${number(report.roas)}×`]].map(([label, value]) => <div className="ws-metric" key={label}><span>{label}</span><strong>{value}</strong><small>{rows.length ? `${rows.length} records in this view` : "Awaiting actual results"}</small></div>)}</div>
    <div className="ws-performance-grid">
      <section className="ws-card"><span className="ws-eyebrow">CHANNEL COMPARISON</span><h3>Spend alongside revenue</h3>{!rows.length ? <p>No results match this view. Add a report below or adjust the date filters.</p> : <div className="ws-channel-chart">{report.byChannel.map((r) => {const max = Math.max(1, ...report.byChannel.flatMap((p) => [p.spend, p.revenue])); return <div key={r.channel}><b>{r.channel}</b><span>Spend {money(r.spend)} · revenue {money(r.revenue)}</span><div className="ws-data-bar" title={`Spend: ${money(r.spend)}`}><i style={{width: `${r.spend / max * 100}%`}} /></div><div className="ws-data-bar revenue" title={`Revenue: ${money(r.revenue)}`}><i style={{width: `${r.revenue / max * 100}%`}} /></div></div>;})}</div>}<small>Coral: media spend · Ink: attributed revenue. All amounts CAD.</small></section>
      <section className="ws-card"><span className="ws-eyebrow">UNIT ECONOMICS</span><h3>Cost of the response</h3><dl className="ws-performance-ledger">{[["Click-through rate", report.ctr === null ? "—" : `${number(report.ctr)}%`], ["Cost per click", money(report.cpc)], ["Cost per lead", money(report.cpl)], ["Media cost per customer", money(report.cac)], ["Gross profit less media", money(report.mediaContribution)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><p>Gross profit uses the shared brief’s {c.brief.margin}% margin assumption. Contribution shown excludes agency fees and production costs.</p></section>
      <section className="ws-card"><span className="ws-eyebrow">CAMPAIGN PACING / THROUGH {today}</span><h3>{pace.elapsed === null ? "Set a launch date to compare pacing." : `${pace.elapsed} of ${c.brief.weeks * 7} campaign days`}</h3><dl className="ws-performance-ledger"><div><dt>Planned media allowance</dt><dd>{money(pace.budget)}</dd></div><div><dt>Recorded spend since launch</dt><dd>{money(pace.spent)}</dd></div><div><dt>Even daily plan to date</dt><dd>{money(pace.expected)}</dd></div><div><dt>Unspent allowance</dt><dd>{money(pace.remaining)}</dd></div></dl><p>Uses all campaign channels, independent of filters. Missing reporting days make the recorded spend incomplete. {pace.spent > pace.budget ? "Recorded spend exceeds the planned allowance." : "Confirm account totals before changing budgets."}</p></section>
    </div>
    <section className="ws-card" id="result-entry"><span className="ws-eyebrow">SOURCE LEDGER</span><h3>{editingId ? "Correct a daily result" : "Record a daily result"}</h3><p>One entry per channel per day. Use 0 when a measured result is zero; enter every metric.</p>
      <form onSubmit={(e) => {e.preventDefault(); save();}}>
        <div className="ws-result-form"><label className="ws-field"><span>Result date</span><Input type="date" max={today} required value={draft.date} onChange={(e) => setDraft({...draft, date: e.target.value})} /></label><label className="ws-field"><span>Channel</span><select value={draft.channel} onChange={(e) => setDraft({...draft, channel: e.target.value})}>{CHANNELS.map((s) => <option key={s}>{s}</option>)}</select></label>
          {([['spend', 'Spend (CAD)'], ['impressions', 'Impressions'], ['clicks', 'Clicks'], ['leads', 'Leads'], ['customers', 'Customers'], ['revenue', 'Revenue (CAD)']] as const).map(([key, label]) => <label className="ws-field" key={key}><span>{label}</span><Input type="number" required min={0} max={1_000_000_000} step={key === 'spend' || key === 'revenue' ? '0.01' : '1'} value={draft[key]} onChange={(e) => setDraft({...draft, [key]: e.target.value})} /></label>)}
        </div><label className="ws-field"><span>Source / reporting window</span><Input required maxLength={300} value={draft.source} onChange={(e) => setDraft({...draft, source: e.target.value})} placeholder="e.g. Search account export, same-day click attribution" /></label>
        <div className="ws-actions"><Button type="submit"><Save />{editingId ? "Save correction" : "Save result"}</Button>{editingId && <Button type="button" variant="outline" onClick={() => {setEditingId(null); setDraft(blank());}}><X />Cancel edit</Button>}</div>
      </form>
    </section>
    {error && <p className="ws-warning" role="alert">{error}</p>}
    <details className="ws-card"><summary><FileSpreadsheet size={20} /> Import a results CSV</summary><p>Paste a CSV using the template headers. Preview validates every row before anything is saved.</p><Button variant="outline" onClick={() => download("avalon-results-template.csv", csv([Array.from(PERFORMANCE_HEADERS)]))}><Download />Download blank template</Button><label className="ws-field"><span>CSV results</span><Textarea rows={5} maxLength={500_000} value={importText} onChange={(e) => {setImportText(e.target.value); setPreview([]);}} placeholder={PERFORMANCE_HEADERS.join(",")} /></label><Button variant="outline" onClick={inspectImport}><Upload />Preview import</Button>
      {preview.length > 0 && <div className="ws-import-preview"><h4>{preview.length} valid records · {conflicts} existing day/channel matches</h4><p>Total imported spend: {money(preview.reduce((n, r) => n + r.spend, 0))}. Review the first five records:</p><ul>{preview.slice(0, 5).map((r) => <li key={r.id}>{r.date} · {r.channel} · {money(r.spend)} spend · {money(r.revenue)} revenue</li>)}</ul>{conflicts > 0 && <label><input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} /> Replace existing figures for matching channel/date records</label>}<Button disabled={conflicts > 0 && !replace} onClick={() => {try {persist(mergeResults(allRows, preview, replace), `Imported ${preview.length} performance records.`); setPreview([]); setImportText(""); setReplace(false); setError("");} catch (e) {setError(e instanceof Error ? e.message : "Unable to import results.");}}}><Plus />Import {preview.length} records</Button></div>}
    </details>
    <section className="ws-card"><span className="ws-eyebrow">RESULTS REGISTER</span><h3>{rows.length} daily records</h3><div className="ws-table-wrap"><table><thead><tr><th>Date / source</th><th>Channel</th><th>Spend</th><th>Clicks</th><th>Leads</th><th>Customers</th><th>Revenue</th><th>Actions</th></tr></thead><tbody>{rows.map((r) => <tr key={r.id}><td>{r.date}<small>{r.source}</small></td><td>{r.channel}</td><td>{money(r.spend)}</td><td>{number(r.clicks)}</td><td>{number(r.leads)}</td><td>{number(r.customers)}</td><td>{money(r.revenue)}</td><td><Button size="sm" variant="outline" onClick={() => edit(r)} aria-label={`Edit ${r.date} ${r.channel}`}>Edit</Button> {pendingDelete === r.id ? <><Button size="sm" variant="outline" onClick={() => {persist(allRows.filter((x) => x.id !== r.id), "Removed a result record."); setPendingDelete(null);}}>Confirm removal</Button><Button size="sm" variant="ghost" onClick={() => setPendingDelete(null)}>Keep</Button></> : <Button size="sm" variant="ghost" onClick={() => setPendingDelete(r.id)} aria-label={`Remove ${r.date} ${r.channel}`}>Remove</Button>}</td></tr>)}</tbody></table></div>{!rows.length && <p>No daily results yet. Your forecasts remain available in Media Lab.</p>}</section>
  </div>;
}
