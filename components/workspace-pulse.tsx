"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CheckCheck, Clock3, FolderOpen, ListChecks, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid, validDate, type Campaign, type Workspace } from "@/lib/campaign";
import { campaignIntelligence } from "@/lib/orchestration";
import { campaignAttention, localPlanningDate, type WorkspaceTarget } from "./workspace-model";
import styles from "./workspace-upgrade.module.css";

export function WorkspacePulse({ workspace, c, navigate, add, update, notify }: {
  workspace: Workspace;
  c: Campaign;
  navigate: (target: WorkspaceTarget) => void;
  add: () => void;
  update: (patch: Partial<Campaign>, action: string) => void;
  notify: (message: string) => void;
}) {
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [task, setTask] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const today = localPlanningDate();
  const items = useMemo(() => campaignAttention(c, today), [c, today]);
  const filtered = items.filter((item) => filter === "All" || item.category === filter);
  const visible = showAll ? filtered : filtered.slice(0, 6);
  const portfolio = useMemo(() => workspace.campaigns.map((campaign) => ({ campaign, health: campaignIntelligence(campaign), attention: campaignAttention(campaign, today).length })).sort((a, b) => Number(b.campaign.id === workspace.activeId) - Number(a.campaign.id === workspace.activeId) || b.campaign.updatedAt.localeCompare(a.campaign.updatedAt)), [workspace, today]);
  const upcoming = c.content.filter((item) => item.date && item.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  function createTask(event: React.FormEvent) {
    event.preventDefault();
    if (!task.trim()) return;
    if (due && !validDate(due)) { notify("Choose a real due date before adding this task."); return; }
    if (c.tasks.length >= 200) { notify("This campaign has 200 tasks. Export and remove completed tasks before adding more."); return; }
    update({ tasks: [...c.tasks, { id: uid(), title: task.trim(), owner: owner.trim(), due, done: false }] }, "Added task from campaign overview");
    setTask(""); setOwner(""); setDue(""); setTaskOpen(false); setFilter("Delivery");
    notify("Task added to the campaign inbox and production delivery board.");
  }
  return <div className={styles.pulseGrid}>
    <section className={styles.inbox} aria-labelledby="campaign-inbox-title">
      <header className={styles.sectionHeading}><div><span className={styles.eyebrow}>YOUR CAMPAIGN INBOX</span><h2 id="campaign-inbox-title">Turn attention into action.</h2></div><span className={styles.count}>{items.length}</span></header>
      <p className={styles.intro}>Reviews, outdated work and delivery responsibilities, together. Dates use your device’s local calendar.</p>
      <div className={styles.inboxFilters} role="group" aria-label="Filter campaign attention">
        {["All", "Refresh", "Review", "Delivery", "Evidence"].map((value) => <button type="button" aria-pressed={filter === value} key={value} onClick={() => { setFilter(value); setShowAll(false); }}>{value}{value !== "All" && <span>{items.filter((item) => item.category === value).length}</span>}</button>)}
      </div>
      <div className={styles.attentionList}>
        {visible.map((item) => <button type="button" key={item.id} onClick={() => navigate(item)} className={styles.attentionItem}><span className={item.priority === 0 ? styles.urgent : styles.category}>{item.category}</span><div><b>{item.title}</b><p>{item.detail}</p></div><ArrowUpRight /></button>)}
        {!visible.length && <div className={styles.empty}><CheckCheck /><b>{items.length ? "No items in this category." : "Your working queue is clear."}</b><p>{items.length ? "Choose another filter to see what needs attention." : "Create work or review the launch checks to find the next step."}</p><button type="button" onClick={() => navigate({ campaignId: c.id, view: items.length ? "workflows" : "proof" })}>Open campaign checks <ArrowRight /></button></div>}
      </div>
      <div className={styles.inboxFoot}>
        <button type="button" aria-expanded={taskOpen} onClick={() => setTaskOpen(!taskOpen)}><Plus />Add a task</button>
        {filtered.length > 6 && <button type="button" onClick={() => setShowAll(!showAll)}>{showAll ? "Show fewer" : `See all ${filtered.length} items`} <ArrowRight /></button>}
      </div>
      {taskOpen && <form className={styles.quickTask} onSubmit={createTask} aria-label="Add a campaign task"><label>What needs to happen?<Input required maxLength={300} value={task} onChange={(event) => setTask(event.target.value)} placeholder="e.g. Review the launch page on mobile" /></label><div><label>Owner<Input maxLength={100} value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Assign a person" /></label><label>Due date<Input type="date" value={due} onChange={(event) => setDue(event.target.value)} /></label></div><Button type="submit"><Plus />Add to delivery board</Button></form>}
    </section>
    <aside className={styles.portfolio} aria-labelledby="campaign-portfolio-title">
      <header className={styles.sectionHeading}><div><span className={styles.eyebrow}>ACROSS YOUR WORKSPACE</span><h2 id="campaign-portfolio-title">Every campaign. In view.</h2></div><FolderOpen /></header>
      <p className={styles.intro}>{workspace.campaigns.length} of 12 campaign spaces in use. Open a campaign to continue with its own brief and records.</p>
      <div className={styles.portfolioList}>{portfolio.map(({ campaign, health, attention }) => <button type="button" key={campaign.id} onClick={() => navigate({ campaignId: campaign.id, view: "overview" })} className={styles.portfolioCard} aria-current={campaign.id === workspace.activeId ? "true" : undefined}><div><span>{campaign.id === workspace.activeId ? "ACTIVE CAMPAIGN" : campaign.brief.market || "CAMPAIGN"}</span><ArrowUpRight /></div><h3>{campaign.name}</h3><p>{campaign.brief.offer || "Build a shared brief to set the direction."}</p><div className={styles.portfolioStats}><span><b>{attention}</b> attention items</span><span><b>{health.blockers.length}</b> blocked checks</span></div><small>{campaign.brief.launchDate ? `Launch planned ${campaign.brief.launchDate}` : "Launch date to be set"}</small></button>)}</div>
      <button className={styles.addCampaign} type="button" disabled={workspace.campaigns.length >= 12} onClick={add}><Plus />New campaign <span>{12 - workspace.campaigns.length} spaces left</span></button>
      {!!upcoming.length && <section className={styles.upcoming} aria-label="Upcoming content"><h3><Clock3 />Next on the calendar</h3>{upcoming.map((item) => <button type="button" key={item.id} onClick={() => navigate({ campaignId: c.id, view: "content", record: { kind: "content", id: item.id } })}><span>{item.date}<small>{item.channel}</small></span><b>{item.title}</b><ArrowUpRight /></button>)}<p>Planned dates. Publishing is handled separately.</p></section>}
    </aside>
  </div>;
}

export function WorkspaceActivity({ workspace, navigate }: { workspace: Workspace; navigate: (target: WorkspaceTarget) => void }) {
  const [allCampaigns, setAllCampaigns] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const records = useMemo(() => workspace.campaigns.filter((c) => allCampaigns || c.id === workspace.activeId).flatMap((c) => c.activity.map((event) => ({ ...event, campaignId: c.id, campaignName: c.name }))).filter((event) => `${event.action} ${event.campaignName}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => b.at.localeCompare(a.at)), [workspace, allCampaigns, query]);
  return <section className={styles.activity} aria-labelledby="workspace-activity-title"><header className={styles.sectionHeading}><div><span className={styles.eyebrow}>THE DECISION RECORD</span><h2 id="workspace-activity-title">A trail you can follow.</h2></div><ListChecks /></header><div className={styles.activityTools}><Input aria-label="Search decision history" value={query} onChange={(event) => { setQuery(event.target.value); setExpanded(false); }} placeholder="Search decisions and changes…" /><label><input type="checkbox" checked={allCampaigns} onChange={(event) => { setAllCampaigns(event.target.checked); setExpanded(false); }} />All campaigns</label></div><ol className={styles.activityList}>{records.slice(0, expanded ? 100 : 8).map((event) => <li key={`${event.campaignId}:${event.id}`}><time dateTime={event.at}>{new Date(event.at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</time><div><b>{event.action}</b>{allCampaigns && <button type="button" onClick={() => navigate({ campaignId: event.campaignId, view: "overview" })}>{event.campaignName}<ArrowUpRight /></button>}</div></li>)}</ol>{!records.length && <p className={styles.intro}>{query ? "No matching decisions. Try another phrase." : "Your history begins when you edit the brief or create campaign work."}</p>}{records.length > 8 && <button type="button" className={styles.textButton} onClick={() => setExpanded(!expanded)}>{expanded ? "Show recent decisions" : `Show more decisions (${records.length})`}<ArrowRight /></button>}{expanded && records.length > 100 && <p className={styles.intro}>Showing the latest 100 matching records. Search to narrow the history.</p>}</section>;
}
