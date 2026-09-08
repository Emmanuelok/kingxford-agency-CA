"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { ArrowUpRight, Copy, Download, FlaskConical, Link2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CHANNELS, csv, experimentMath, uid, type Campaign } from "@/lib/campaign";
import { campaignTrackingUrl, growthTargetPlan } from "@/lib/growth";
import { performanceSummary } from "@/lib/performance";
import styles from "./growth-workbench.module.css";

const CampaignWorkspace = dynamic(() => import("@/components/campaign-workspace").then((module) => module.CampaignWorkspace));
/** Backwards-compatible entrypoint: all planning uses the shared campaign. */
export function GrowthSuite() { return <CampaignWorkspace initialView="media" />; }

type Props = {c: Campaign; update: (patch: Partial<Campaign>, action: string, brief?: boolean) => void; notify: (message: string) => void};
const money = (n: number | null) => n === null ? "—" : new Intl.NumberFormat("en-CA", {style: "currency", currency: "CAD", maximumFractionDigits: 0}).format(n);
function saveCsv(name: string, rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([csv(rows)], {type: "text/csv;charset=utf-8"}));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function GrowthWorkbench({c, update, notify}: Props) {
  const [target, setTarget] = useState("30");
  const [basis, setBasis] = useState<"plan" | "observed">("plan");
  const plan = growthTargetPlan(c, Number(target), basis);
  const [testChannel, setTestChannel] = useState<string>(c.media[0]?.channel ?? "Search");
  const [hypothesis, setHypothesis] = useState("");
  const [lift, setLift] = useState(String(c.experiment.lift));
  const [dailyVisitors, setDailyVisitors] = useState(String(c.experiment.dailyVisitors));
  const [baselineSource, setBaselineSource] = useState<"plan" | "observed">("plan");
  const observedRows = (c.performance?.rows ?? []).filter((row) => row.channel === testChannel);
  const observed = performanceSummary(c, observedRows);
  const plannedRate = c.media.find((row) => row.channel === testChannel)?.cvr ?? null;
  const baseline = baselineSource === "observed" ? observed.cvr : plannedRate;
  const draft = {...c.experiment, hypothesis: hypothesis.trim(), baseline: baseline ?? 0, lift: Number(lift), dailyVisitors: Number(dailyVisitors), controlVisitors: 0, controlConversions: 0, variantVisitors: 0, variantConversions: 0};
  const validDraft = !!draft.hypothesis && draft.hypothesis.length <= 2000 && draft.baseline >= 0.01 && draft.baseline <= 99 && draft.lift >= 1 && draft.lift <= 500 && Number.isInteger(draft.dailyVisitors) && draft.dailyVisitors >= 1 && draft.dailyVisitors <= 10_000_000;
  const sizing = validDraft ? experimentMath(draft) : null;
  const hasRecordedExperiment = c.experiment.controlVisitors > 0 || c.experiment.variantVisitors > 0 || c.experiment.controlConversions > 0 || c.experiment.variantConversions > 0;
  const testAlreadyApplied = c.experiment.hypothesis === draft.hypothesis && c.experiment.baseline === draft.baseline && c.experiment.lift === draft.lift && c.experiment.dailyVisitors === draft.dailyVisitors;
  const [tracking, setTracking] = useState({destination: c.brief.website, source: "", medium: "", campaign: c.name === "Untitled campaign" ? "" : c.name.toLowerCase().replace(/\s+/g, "-"), content: "", term: ""});
  const trackingResult = campaignTrackingUrl(tracking);
  const [showTrackingError, setShowTrackingError] = useState(false);

  function saveTestTask() {
    if (!validDraft || !sizing?.sample) {notify("Complete a valid hypothesis, baseline and traffic assumption first."); return;}
    if (c.tasks.length >= 200) {notify("Remove an old Delivery task before adding this test."); return;}
    const title = `Plan ${testChannel} test: ${draft.hypothesis}`.slice(0, 300);
    if (c.tasks.some((task) => task.title === title && !task.done)) {notify("This experiment task is already in Delivery."); return;}
    update({tasks: [...c.tasks, {id: uid(), title, owner: "", due: "", done: false}]}, "Added growth experiment planning task to Delivery.");
    notify("Experiment task added to Delivery. Export the full plan and assign an owner.");
  }
  function exportTest() {
    if (!validDraft || !sizing?.sample) return;
    saveCsv("avalon-growth-experiment.csv", [["Campaign", c.name], ["Brief revision", c.revision], ["Channel", testChannel], ["Hypothesis", draft.hypothesis], ["Baseline basis", baselineSource === "observed" ? `${observedRows.length} user-entered records; click-based rate, validate against eligible visitors` : "Channel planning assumption"], ["Baseline conversion %", draft.baseline], ["Minimum relative lift %", draft.lift], ["Eligible visitors per day, both arms", draft.dailyVisitors], ["Planned visitors per arm", sizing.sample], ["Estimated fixed-horizon days", sizing.days ?? "Unavailable"], ["Method", "Two-sided 95% confidence, 80% power, equal allocation; approximate two-proportion sizing"], ["Before starting", "Validate baseline against eligible visitors, choose one variable, assign an owner and precommit a fixed horizon. Avoid repeated significance checks."]]);
  }
  async function copyTracking() {
    setShowTrackingError(true);
    if (!trackingResult.url) return;
    try {await navigator.clipboard.writeText(trackingResult.url); notify("Campaign link copied.");} catch {notify("Clipboard is unavailable. Select and copy the generated link below.");}
  }

  return <section className={styles.workbench} aria-labelledby="growth-workbench-title">
    <div className={styles.heading}><span className="ws-eyebrow">GROWTH WORKBENCH / CONNECTED TO YOUR BRIEF</span><h3 id="growth-workbench-title">Give the next move a working plan.</h3><p>Work backwards from a customer goal, design a focused experiment, and keep campaign links consistent.</p></div>
    <div className={styles.grid}>
      <article className={`${styles.card} ${styles.targetCard}`}><div className={styles.icon}><Target /></div><span className="ws-eyebrow">01 / REVERSE THE MODEL</span><h4>What would the goal require?</h4><p>Uses your channel assumptions or the blended acquisition cost in recorded actuals. Customer value and margin always come from the shared brief.</p>
        <div className={styles.fields}><label><span>Customer goal</span><Input type="number" min={1} max={10_000_000} step={1} value={target} onChange={(e) => setTarget(e.target.value)} /></label><label><span>Acquisition basis</span><select value={basis} onChange={(e) => setBasis(e.target.value as typeof basis)}><option value="plan">Channel planning assumptions</option><option value="observed">All recorded actuals</option></select></label></div>
        {plan ? <><dl className={styles.ledger}><div><dt>Required media scenario</dt><dd>{money(plan.media)}</dd></div><div><dt>Fees + production</dt><dd>{money(plan.fixedCosts)}</dd></div><div className={styles.total}><dt>Total investment scenario</dt><dd>{money(plan.investment)}</dd></div><div><dt>Contribution at target</dt><dd>{money(plan.contribution)}</dd></div><div><dt>Customers to cover this investment</dt><dd>{plan.breakEvenCustomers?.toLocaleString("en-CA") ?? "Undefined at zero margin/value"}</dd></div></dl><p className={styles.note}>{money(plan.dailyMedia)} media per day over {c.brief.weeks} weeks. {plan.budgetGap > 0 ? `${money(plan.budgetGap)} above the current brief.` : `${money(-plan.budgetGap)} below the current brief.`} This assumes acquisition cost stays constant as spend changes.</p><div className={styles.actions}><Button variant="outline" onClick={() => saveCsv("avalon-customer-goal.csv", [["Campaign", c.name], ["Basis", basis], ["Customer target", plan.targetCustomers], ["Required media CAD", plan.media], ["Fees and production CAD", plan.fixedCosts], ["Total investment CAD", plan.investment], ["Scenario contribution CAD", plan.contribution], ["Assumption", "Constant acquisition cost; not a forecast guarantee"]])}><Download />Export scenario</Button><Button disabled={!plan.withinBudgetLimit} onClick={() => {update({brief: {...c.brief, budget: Math.ceil(plan.investment)}}, "Applied customer-goal investment scenario to shared budget.", true); notify("Shared budget updated. Review the new forecast and any outputs marked stale.");}}><ArrowUpRight />Use as shared budget</Button></div>{!plan.withinBudgetLimit && <p role="status" className={styles.note}>This scenario exceeds the supported CAD 10 million planning budget. Reduce the goal before applying it.</p>}</> : <p className={styles.empty} role="status">{basis === "observed" ? "Add actual spend and acquired customers in Performance to calculate this scenario." : "Enter a whole customer goal and positive channel weights, conversion rates and lead-to-sale assumptions."}</p>}
      </article>
      <article className={styles.card}><div className={styles.icon}><FlaskConical /></div><span className="ws-eyebrow">02 / MAKE THE TEST SPECIFIC</span><h4>One hypothesis. A measurable horizon.</h4><p>Prepare a test from the channel plan or reported click-to-outcome rate. Export a complete plan and send the action to Delivery.</p>
        <div className={styles.fields}><label><span>Test channel</span><select value={testChannel} onChange={(e) => setTestChannel(e.target.value)}>{CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select></label><label><span>Baseline source</span><select value={baselineSource} onChange={(e) => setBaselineSource(e.target.value as typeof baselineSource)}><option value="plan">Channel assumption</option><option value="observed">Recorded click-to-outcome rate</option></select></label></div>
        <p className={styles.baseline}>Baseline: <b>{baseline === null ? "Not available" : `${baseline.toFixed(2)}%`}</b> {baselineSource === "observed" ? `from ${observedRows.length} records. Clicks are not unique eligible visitors; validate the baseline before running the test.` : "from Media Lab. Replace assumptions with a validated baseline before running the test."}</p>
        <label><span>Testable hypothesis</span><Textarea maxLength={2000} rows={3} value={hypothesis} onChange={(e) => setHypothesis(e.target.value)} placeholder="If we make the offer inclusions visible before the form, more eligible visitors will complete an enquiry." /></label>
        <div className={styles.fields}><label><span>Minimum relative lift (%)</span><Input type="number" min={1} max={500} value={lift} onChange={(e) => setLift(e.target.value)} /></label><label><span>Eligible visitors / day, both arms</span><Input type="number" min={1} max={10_000_000} step={1} value={dailyVisitors} onChange={(e) => setDailyVisitors(e.target.value)} /></label></div>
        {sizing?.sample ? <div className={styles.sample}><strong>{sizing.sample.toLocaleString("en-CA")}</strong><span>visitors per arm · approximately {sizing.days} days<br />95% confidence · 80% power · equal split</span></div> : <p className={styles.note} role="status">{validDraft ? "The requested lift reaches an impossible conversion rate. Reduce the target lift." : "Complete the hypothesis and valid baseline, lift and traffic inputs to size the test."}</p>}
        <div className={styles.actions}><Button variant="outline" disabled={!sizing?.sample} onClick={exportTest}><Download />Export test plan</Button><Button disabled={!sizing?.sample || hasRecordedExperiment || testAlreadyApplied} onClick={() => {update({experiment: draft}, `Applied ${testChannel} growth test to Experiments.`); notify("Test plan saved in Experiments. Review the hypothesis and measurement setup before collecting results.");}}><FlaskConical />{testAlreadyApplied ? "Saved in Experiments" : "Use in Experiments"}</Button><Button disabled={!sizing?.sample} onClick={saveTestTask}><ArrowUpRight />Add to Delivery</Button></div>{hasRecordedExperiment && <p className={styles.note}>The current experiment already has observations. Export this new plan or add a Delivery task while the active experiment is reviewed.</p>}
      </article>
      <article className={`${styles.card} ${styles.trackingCard}`}><div><div className={styles.icon}><Link2 /></div><span className="ws-eyebrow">03 / TRACE THE CAMPAIGN</span><h4>A consistent link for every placement.</h4><p>Build UTM links while preserving the destination’s other query values and page anchor. Use campaign labels, never customer names or other personal information.</p></div><div>
        <div className={styles.fields}>{([['destination', 'Destination URL', 'https://your-site.com/offer'], ['source', 'Source', 'newsletter'], ['medium', 'Medium', 'email'], ['campaign', 'Campaign', 'autumn-launch'], ['content', 'Content variant (optional)', 'hero-offer-a'], ['term', 'Search term (optional)', 'seasonal-care']] as const).map(([key, label, placeholder]) => <label key={key}><span>{label}</span><Input maxLength={key === 'destination' ? 2000 : 200} type={key === 'destination' ? 'url' : 'text'} value={tracking[key]} placeholder={placeholder} onChange={(e) => setTracking({...tracking, [key]: e.target.value})} /></label>)}</div>
        <label><span>Generated campaign link</span><Textarea rows={3} readOnly value={trackingResult.url ?? ""} placeholder="Complete the destination, source, medium and campaign above." /></label>{showTrackingError && trackingResult.error && <p role="alert" className={styles.error}>{trackingResult.error}</p>}<div className={styles.actions}><Button variant="outline" onClick={copyTracking}><Copy />Copy campaign link</Button><Button disabled={!trackingResult.url} variant="outline" onClick={() => trackingResult.url && saveCsv("avalon-campaign-link.csv", [["Campaign", c.name], ["Destination", tracking.destination], ["Tracked URL", trackingResult.url], ["Source", tracking.source], ["Medium", tracking.medium], ["Campaign label", tracking.campaign], ["Content", tracking.content], ["Term", tracking.term]])}><Download />Export link</Button></div>
      </div></article>
    </div>
  </section>;
}
