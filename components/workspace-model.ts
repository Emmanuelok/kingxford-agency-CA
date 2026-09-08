import { AGENTS, isRunCurrent, latestAgentRuns, type Campaign, type Workspace } from "../lib/campaign.ts";

export type WorkspaceView = "overview" | "brief" | "workflows" | "agents" | "content" | "production" | "media" | "search" | "experiments" | "performance" | "delivery" | "proof" | "library";
export type WorkspaceTarget = {
  campaignId: string;
  view: WorkspaceView;
  record?: { kind: "run" | "content" | "task" | "evidence"; id: string };
};
export type WorkspaceResult = WorkspaceTarget & {
  id: string;
  kind: "Campaign" | "Output" | "Content" | "Task" | "Evidence";
  title: string;
  subtitle: string;
  search: string;
};

/** Search only persisted records. No external service receives the query or campaign. */
export function workspaceSearch(workspace: Workspace, query: string, activeOnly = false): WorkspaceResult[] {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results: WorkspaceResult[] = [];
  for (const c of workspace.campaigns) {
    if (activeOnly && c.id !== workspace.activeId) continue;
    const base = { campaignId: c.id };
    const add = (result: Omit<WorkspaceResult, "campaignId">) => results.push({ ...base, ...result });
    add({ id: `campaign:${c.id}`, kind: "Campaign", title: c.name, subtitle: c.brief.brand || "Campaign brief", view: "overview", search: `${c.name} ${c.brief.brand} ${c.brief.audience} ${c.brief.offer} ${c.brief.market}` });
    for (const r of c.runs) {
      const status = !isRunCurrent(c, r) ? "Needs refresh" : r.approved ? "Approved" : "Needs review";
      add({ id: `${c.id}:run:${r.id}`, kind: "Output", title: r.title, subtitle: `${c.name} · ${r.editedByUser ? "Human-edited · " : ""}${status} · v${r.revision}`, view: "library", record: { kind: "run", id: r.id }, search: `${r.title} ${r.text} ${r.mode} ${r.editedByUser ? "human edited revision" : ""} ${AGENTS.find((a) => a.id === r.agent)?.name} ${c.name} ${status}` });
    }
    for (const item of c.content) add({ id: `${c.id}:content:${item.id}`, kind: "Content", title: item.title || "Untitled content", subtitle: `${c.name} · ${item.channel} · ${item.status}`, view: "content", record: { kind: "content", id: item.id }, search: `${item.title} ${item.copy} ${item.channel} ${item.status} ${item.date} ${c.name}` });
    for (const t of c.tasks) add({ id: `${c.id}:task:${t.id}`, kind: "Task", title: t.title || "Untitled task", subtitle: `${c.name} · ${t.owner || "Unassigned"} · ${t.done ? "Complete" : t.due || "No due date"}`, view: "production", record: { kind: "task", id: t.id }, search: `${t.title} ${t.owner} ${t.due} ${t.done ? "complete" : "open"} ${c.name}` });
    for (const e of c.evidence) add({ id: `${c.id}:evidence:${e.id}`, kind: "Evidence", title: e.claim || "Untitled evidence", subtitle: `${c.name} · ${e.owner || "Unassigned"} · ${e.verified ? "Reviewed" : "Needs review"}`, view: "proof", record: { kind: "evidence", id: e.id }, search: `${e.claim} ${e.source} ${e.owner} ${c.name}` });
  }
  return results.filter((result) => terms.every((term) => result.search.toLocaleLowerCase().includes(term))).sort((a, b) => {
    const exactA = a.title.toLocaleLowerCase() === query.trim().toLocaleLowerCase();
    const exactB = b.title.toLocaleLowerCase() === query.trim().toLocaleLowerCase();
    return Number(exactB) - Number(exactA) || Number(b.campaignId === workspace.activeId) - Number(a.campaignId === workspace.activeId);
  });
}

export type AttentionItem = WorkspaceTarget & { id: string; title: string; detail: string; category: "Refresh" | "Review" | "Delivery" | "Evidence"; priority: number };
export function campaignAttention(c: Campaign, today: string): AttentionItem[] {
  const items: AttentionItem[] = [];
  const add = (item: Omit<AttentionItem, "campaignId">) => items.push({ ...item, campaignId: c.id });
  for (const run of latestAgentRuns(c)) {
    const stale = !isRunCurrent(c, run);
    if (stale || !run.approved) add({ id: `run:${run.id}`, title: run.title, detail: stale ? "Brief or upstream work changed. Refresh this output before approval." : "Read this specialist draft and record your decision.", category: stale ? "Refresh" : "Review", priority: stale ? 1 : 3, view: "library", record: { kind: "run", id: run.id } });
  }
  for (const item of c.content) {
    const stale = item.revision !== c.revision;
    if (stale || item.status !== "Approved") add({ id: `content:${item.id}`, title: item.title || "Untitled content", detail: `${item.channel} · ${item.date || "Unscheduled"} · ${stale ? "Needs current-brief review" : item.status}`, category: stale ? "Refresh" : "Review", priority: item.date && item.date <= today ? 1 : stale ? 2 : 4, view: "content", record: { kind: "content", id: item.id } });
  }
  for (const task of c.tasks) {
    if (task.done && task.owner.trim()) continue;
    const overdue = !task.done && !!task.due && task.due < today;
    add({ id: `task:${task.id}`, title: task.title || "Untitled task", detail: `${task.owner || "Assign an owner"} · ${overdue ? `Overdue since ${task.due}` : task.due ? `Due ${task.due}` : "Set a due date"}${task.done ? " · Completion needs an owner" : ""}`, category: "Delivery", priority: overdue ? 0 : !task.owner.trim() ? 2 : 4, view: "production", record: { kind: "task", id: task.id } });
  }
  for (const evidence of c.evidence) {
    if (evidence.verified && evidence.claim.trim() && evidence.source.trim() && evidence.owner.trim()) continue;
    add({ id: `evidence:${evidence.id}`, title: evidence.claim || "Complete this evidence record", detail: `${evidence.owner || "No review owner"} · ${evidence.source || "Source required"}`, category: "Evidence", priority: 2, view: "proof", record: { kind: "evidence", id: evidence.id } });
  }
  return items.sort((a, b) => a.priority - b.priority);
}

export function localPlanningDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}
