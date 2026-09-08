"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown, CircleAlert, Download, GitBranch, ListChecks, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AGENTS, type AgentId, type Campaign, type Run } from "@/lib/campaign";
import { AGENT_DELIVERABLES, PIPELINES, campaignIntelligence, executePipeline, planPipeline, workflowTaskPlan, workflowManifest, type PipelineId } from "@/lib/orchestration";
import styles from "./workflow-studio.module.css";

type Destination = "brief" | "media" | "proof" | "agents" | "production" | "experiments" | "search" | "library";
type Props = {
  c: Campaign;
  update: (patch: Partial<Campaign>, action: string, brief?: boolean) => void;
  notify: (message: string) => void;
  go: (view: Destination) => void;
};
const destinations: Record<string, Destination> = { brief: "brief", media: "media", proof: "proof", agents: "library", production: "production", measurement: "experiments", search: "search" };

export function WorkflowStudio({ c, update, notify, go }: Props) {
  const [pipelineId, setPipelineId] = useState<PipelineId>("full-launch");
  const [reuseCurrent, setReuseCurrent] = useState(true);
  const [requireApprovedDependencies, setRequireApprovedDependencies] = useState(false);
  const [selected, setSelected] = useState<Run | null>(null);
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [targets, setTargets] = useState<AgentId[]>(["conversion"]);
  const [taskOwner, setTaskOwner] = useState("");
  const options = { reuseCurrent, requireApprovedDependencies, targets };
  const plan = planPipeline(c, pipelineId, options);
  const intelligence = campaignIntelligence(c);
  const ready = plan.steps.filter((step) => step.status === "ready").length;
  const reused = plan.steps.filter((step) => step.status === "reuse").length;
  const blocked = plan.steps.filter((step) => step.status === "blocked").length;
  const visibleChecks = showAllChecks ? intelligence.checks : intelligence.checks.filter((check) => !check.passed);
  function execute() {
    try {
      const result = executePipeline(c, pipelineId, options);
      if (!result.runs.length) {
        notify(result.blocked.length ? "Resolve the prerequisites shown in the workflow before continuing." : "All workflow outputs are current. Turn off reuse to create a new edition.");
        return;
      }
      update({ runs: result.campaign.runs }, `${plan.pipeline.name}: saved ${result.runs.length} connected specialist drafts`);
      notify(`${result.runs.length} planning drafts saved. ${result.reused.length} current outputs reused.${result.blocked.length ? ` ${result.blocked.length} stages await their prerequisites.` : " Open the library to review and approve."}`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "The workflow could not run. Your saved work is preserved.");
    }
  }
  function createTaskPlan() {
    try {
      const result = workflowTaskPlan(c, pipelineId, { ...options, owner: taskOwner });
      if (!result.added) {
        notify(result.excluded ? "The 200-task limit is reached. Review the delivery register before adding this plan." : "These deliverables are already in your production task register. Existing dates and owners were preserved.");
        return;
      }
      update({ tasks: result.tasks }, `${plan.pipeline.name}: added ${result.added} delivery tasks`);
      notify(`${result.added} tasks added to Production. ${result.duplicates} existing tasks preserved.${result.excluded ? ` ${result.excluded} tasks could not fit within the 200-task limit.` : ""} Review proposed dates and assign accountable owners.`);
    } catch (error) {
      notify(error instanceof Error ? error.message : "The delivery plan could not be created.");
    }
  }
  function exportManifest() {
    const url = URL.createObjectURL(new Blob([workflowManifest(c, pipelineId, options)], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `avalon-${pipelineId}-handoff-v${c.revision}.md`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify("Workflow handoff downloaded with stage dependencies and current output references.");
  }
  return <>
    <div className="ws-panel-head"><div><span className="ws-eyebrow">CONNECTED WORKFLOWS</span><h2>From the first question<br />to a considered launch.</h2><p>{AGENTS.length} specialists share one brief. Choose an outcome or compose your own workflow, carry decisions between stages, then turn the plan into accountable delivery tasks.</p></div><span className="ws-workflow-badge"><GitBranch /> BRIEF V{c.revision}</span></div>
    <div className="ws-pipeline-grid" role="group" aria-label="Choose a workflow">
      {PIPELINES.map((pipeline, index) => <button key={pipeline.id} aria-pressed={pipelineId === pipeline.id} className={pipelineId === pipeline.id ? "is-selected" : ""} onClick={() => setPipelineId(pipeline.id)}><span>0{index + 1}<GitBranch /></span><h3>{pipeline.name}</h3><p>{pipeline.description}</p><b>{pipelineId === pipeline.id ? "Selected workflow" : "Preview workflow"}<ArrowRight /></b></button>)}
    </div>
    {pipelineId === "custom" && <section className="ws-card"><div className="ws-panel-head"><div><span className="ws-eyebrow">YOUR SPECIALIST TEAM</span><h3>Which outputs do you need?</h3><p>Choose the final deliverables. Their prerequisites are included automatically, so no stage loses its context.</p></div><span className="ws-status">{targets.length} selected · {plan.steps.length} connected stages</span></div><div className={styles.targetGrid}>{AGENTS.map((agent) => <label key={agent.id} className={targets.includes(agent.id) ? styles.selectedTarget : ""}><Checkbox checked={targets.includes(agent.id)} onCheckedChange={(checked) => setTargets((current) => checked ? [...current, agent.id] : current.filter((id) => id !== agent.id))} /><span><b>{agent.name}</b><small>{AGENT_DELIVERABLES[agent.id]}</small></span></label>)}</div></section>}
    <section className="ws-card ws-workflow-plan">
      <div className="ws-panel-head"><div><span className="ws-eyebrow">YOUR EXECUTION PREVIEW</span><h3>{plan.pipeline.name}</h3><p>{plan.steps.length} specialist stages · {ready} to generate · {reused} to reuse · {blocked} waiting</p></div><Button disabled={!plan.ready} onClick={execute}><Play />{ready ? `Run ${ready} ready ${ready === 1 ? "stage" : "stages"}` : blocked ? "Prerequisites needed" : "All outputs current"}</Button></div>
      <div className="ws-workflow-options">
        <label><Checkbox checked={reuseCurrent} onCheckedChange={(v) => setReuseCurrent(v === true)} /><span><b>Reuse current outputs</b><small>Keep existing work when the brief and upstream context are current.</small></span></label>
        <label><Checkbox checked={requireApprovedDependencies} onCheckedChange={(v) => setRequireApprovedDependencies(v === true)} /><span><b>Require approval between stages</b><small>Pause each downstream handoff until its current prerequisites are approved.</small></span></label>
      </div>
      {plan.blockers.length > 0 && <div className="ws-workflow-warning"><CircleAlert /><div><b>{requireApprovedDependencies ? "Review gates are active." : "Some stages need attention."}</b><p>{plan.blockers[0]}</p><button className="ws-text-button" onClick={() => go(c.brief.brand.trim() && c.brief.audience.trim() && c.brief.offer.trim() ? "library" : "brief")}>Resolve prerequisites <ArrowRight /></button></div></div>}
      <ol className="ws-pipeline-steps">
        {plan.steps.map((step, index) => {
          const output = c.runs.find((run) => run.id === step.outputId);
          return <li key={step.agent} className={`ws-step-${step.status}`}><span className="ws-pipeline-number">{step.status === "reuse" ? <Check /> : String(index + 1).padStart(2, "0")}</span><div><h4>{step.name}<span className={`ws-status ${step.status === "blocked" ? "ws-stale" : ""}`}>{step.status === "reuse" ? "Current output" : step.status === "blocked" ? "Waiting" : "Ready to run"}</span></h4><p>{AGENT_DELIVERABLES[step.agent]}.</p><small>{step.reason}</small><small>{step.dependencies.length ? `Receives: ${step.dependencies.map((id) => AGENTS.find((agent) => agent.id === id)!.name).join(" · ")}` : "Starts with your shared campaign brief"}</small></div>{output && <Button variant="outline" onClick={() => setSelected(output)}>Read <ArrowUpRight /></Button>}</li>;
        })}
      </ol>
      <div className="ws-mode-note"><ShieldCheck /><p><b>Transparent planning engines.</b> Workflows run explicit rules and calculations on your supplied campaign. Every result is a draft. Review and publication remain separate decisions; no paid AI call, message, ad or external publication is triggered.</p></div>
    </section>
    <section className={`ws-card ${styles.handoff}`}><div><span className="ws-eyebrow">PUT THE PLAN TO WORK</span><h3>Give every deliverable an owner.</h3><p>Create a production task for each specialist stage. {c.brief.launchDate ? `Dates work backwards from ${c.brief.launchDate}, with one proposed review day per stage.` : "Tasks will remain unscheduled until you set a launch date in the shared brief."} Existing tasks keep their owners, dates and completion status.</p><label htmlFor="workflow-task-owner">Initial task owner <span>(optional)</span></label><Input id="workflow-task-owner" value={taskOwner} maxLength={100} onChange={(event) => setTaskOwner(event.target.value)} placeholder="Name of the accountable owner" /><small>These are human delivery tasks. A saved planning draft does not complete or approve the work.</small></div><div className={styles.handoffActions}><Button disabled={!plan.steps.length} onClick={createTaskPlan}><ListChecks />Create {plan.steps.length} delivery tasks</Button><Button variant="outline" disabled={!plan.steps.length} onClick={exportManifest}><Download />Export workflow handoff</Button><button className="ws-text-button" onClick={() => go("production")}>Open production register <ArrowUpRight /></button></div></section>
    <section className="ws-card">
      <div className="ws-panel-head"><div><span className="ws-eyebrow">CAMPAIGN HEALTH</span><h3>{intelligence.score}% of supplied-data checks satisfied</h3><p>{intelligence.blockers.length} blockers · {intelligence.warnings.length} warnings. These checks examine the campaign records and planning assumptions.</p></div><Button variant="outline" onClick={() => setShowAllChecks(!showAllChecks)}>{showAllChecks ? "Show attention items" : "Show all checks"}<ChevronDown /></Button></div>
      <div className="ws-quality-grid">{visibleChecks.map((check) => <article key={check.id} className={check.passed ? "is-passed" : ""}><div><span className={`ws-status ${!check.passed ? "ws-stale" : ""}`}>{check.passed ? "Satisfied" : check.severity === "blocker" ? "Needs resolution" : "Review assumption"}</span>{check.passed ? <CheckCheck /> : <CircleAlert />}</div><h4>{check.title}</h4><p>{check.detail}</p>{!check.passed && <><small>{check.action}</small><button className="ws-text-button" onClick={() => go(destinations[check.room] || "proof")}>Open related studio <ArrowUpRight /></button></>}</article>)}</div>
      {!visibleChecks.length && <div className="ws-empty"><CheckCheck /><h3>Every supplied-data check is satisfied.</h3><p>Complete a final human review before publication or spend.</p><Button onClick={() => go("proof")}>Open launch review <ArrowRight /></Button></div>}
    </section>
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="ws-dialog ws-output-dialog"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>{selected?.mode} · Brief v{selected?.revision} · {selected?.approved ? "Approved by user" : "Awaiting review"}</DialogDescription></DialogHeader><pre>{selected?.text}</pre><Button onClick={() => { setSelected(null); go("library"); }}>Review in output library <ArrowRight /></Button></DialogContent></Dialog>
  </>;
}
