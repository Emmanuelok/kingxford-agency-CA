"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, CheckCheck, ChevronDown, CircleAlert, GitBranch, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AGENTS, type Campaign, type Run } from "@/lib/campaign";
import { PIPELINES, campaignIntelligence, executePipeline, planPipeline, type PipelineId } from "@/lib/orchestration";

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
  const options = { reuseCurrent, requireApprovedDependencies };
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
  return <>
    <div className="ws-panel-head"><div><span className="ws-eyebrow">CONNECTED WORKFLOWS</span><h2>Great work needs<br />a thoughtful sequence.</h2><p>Choose an outcome. Preview the specialist handoffs, resolve prerequisites and run a connected planning workflow. Every output stays linked to the current brief.</p></div><span className="ws-workflow-badge"><GitBranch /> BRIEF V{c.revision}</span></div>
    <div className="ws-pipeline-grid" role="group" aria-label="Choose a workflow">
      {PIPELINES.map((pipeline, index) => <button key={pipeline.id} aria-pressed={pipelineId === pipeline.id} className={pipelineId === pipeline.id ? "is-selected" : ""} onClick={() => setPipelineId(pipeline.id)}><span>0{index + 1}<GitBranch /></span><h3>{pipeline.name}</h3><p>{pipeline.description}</p><b>{pipelineId === pipeline.id ? "Selected workflow" : "Preview workflow"}<ArrowRight /></b></button>)}
    </div>
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
          return <li key={step.agent} className={`ws-step-${step.status}`}><span className="ws-pipeline-number">{step.status === "reuse" ? <Check /> : String(index + 1).padStart(2, "0")}</span><div><h4>{step.name}<span className={`ws-status ${step.status === "blocked" ? "ws-stale" : ""}`}>{step.status === "reuse" ? "Current output" : step.status === "blocked" ? "Waiting" : "Ready to run"}</span></h4><p>{step.reason}</p><small>{step.dependencies.length ? `Receives: ${step.dependencies.map((id) => AGENTS.find((agent) => agent.id === id)!.name).join(" · ")}` : "Starts with your shared campaign brief"}</small></div>{output && <Button variant="outline" onClick={() => setSelected(output)}>Read <ArrowUpRight /></Button>}</li>;
        })}
      </ol>
      <div className="ws-mode-note"><ShieldCheck /><p><b>Transparent planning engines.</b> Workflows run explicit rules and calculations on your supplied campaign. Every result is a draft. Review and publication remain separate decisions; no paid AI call, message, ad or external publication is triggered.</p></div>
    </section>
    <section className="ws-card">
      <div className="ws-panel-head"><div><span className="ws-eyebrow">CAMPAIGN HEALTH</span><h3>{intelligence.score}% of supplied-data checks satisfied</h3><p>{intelligence.blockers.length} blockers · {intelligence.warnings.length} warnings. These checks examine the campaign records and planning assumptions.</p></div><Button variant="outline" onClick={() => setShowAllChecks(!showAllChecks)}>{showAllChecks ? "Show attention items" : "Show all checks"}<ChevronDown /></Button></div>
      <div className="ws-quality-grid">{visibleChecks.map((check) => <article key={check.id} className={check.passed ? "is-passed" : ""}><div><span className={`ws-status ${!check.passed ? "ws-stale" : ""}`}>{check.passed ? "Satisfied" : check.severity === "blocker" ? "Needs resolution" : "Review assumption"}</span>{check.passed ? <CheckCheck /> : <CircleAlert />}</div><h4>{check.title}</h4><p>{check.detail}</p>{!check.passed && <><small>{check.action}</small><button className="ws-text-button" onClick={() => go(destinations[check.room] || "proof")}>Open related studio <ArrowUpRight /></button></>}</article>)}</div>
      {!visibleChecks.length && <div className="ws-empty"><CheckCheck /><h3>Every supplied-data check is satisfied.</h3><p>Complete a final human review before publication or spend.</p><Button onClick={() => go("proof")}>Open launch review <ArrowRight /></Button></div>}
    </section>
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="ws-dialog ws-output-dialog"><DialogHeader><DialogTitle>{selected?.title}</DialogTitle><DialogDescription>{selected?.mode} · Brief v{selected?.revision} · {selected?.approved ? "Approved by user" : "Awaiting review"}</DialogDescription></DialogHeader><pre>{selected?.text}</pre><Button onClick={() => { setSelected(null); go("library"); }}>Review in output library <ArrowRight /></Button></DialogContent></Dialog>
  </>;
}
