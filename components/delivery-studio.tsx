"use client";

import { useState } from "react";
import { CalendarDays, CheckCheck, Clipboard, Download, FileArchive, Plus, Search, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CHECKS, readiness, type Campaign } from "@/lib/campaign";
import {
  buildLaunchPackage, DELIVERY_PRESETS, deliveryCsv, deliverySummary,
  filterDeliveryTasks, isCalendarDate, localCalendarDate, offsetCalendarDate,
  scheduleDeliveryPreset, taskStatus, type DeliveryFilter, type DeliveryPresetId, type DeliveryTask,
} from "@/lib/deliverables";
import styles from "./delivery-studio.module.css";

type DeliveryActions = {
  c: Campaign;
  update: (patch: Partial<Campaign>, event: string, invalidate?: boolean) => void;
  notify: (message: string) => void;
};

function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function TaskCard({ task, today, onSave, onRemove, notify }: {
  task: DeliveryTask; today: string;
  onSave: (task: DeliveryTask) => void; onRemove: () => void; notify: (message: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [owner, setOwner] = useState(task.owner);
  const [due, setDue] = useState(task.due);
  const dirty = title !== task.title || owner !== task.owner || due !== task.due;
  const status = taskStatus(task, today);
  return (
    <form className={styles.task} onSubmit={(event) => {
      event.preventDefault();
      if (!title.trim()) { notify("Give the task a title before saving."); return; }
      if (due && !isCalendarDate(due)) { notify("Choose a valid due date or leave it unscheduled."); return; }
      onSave({ ...task, title: title.trim(), owner: owner.trim(), due });
      notify("Delivery task saved.");
    }}>
      <div className={styles.taskTop}>
        <label className={styles.completion}>
          <Checkbox checked={task.done} onCheckedChange={(checked) => onSave({ ...task, done: checked === true })} aria-label={`Mark ${task.title} ${task.done ? "open" : "complete"}`} />
          <span className={task.done ? styles.finished : ""}>{task.title}</span>
        </label>
        <span className={`${styles.status} ${status === "Overdue" ? styles.overdue : ""}`}>{status}</span>
      </div>
      <div className={styles.taskFields}>
        <label className="ws-field"><span>Task</span><Input maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} aria-label={`Task title: ${task.title}`} /></label>
        <label className="ws-field"><span>Accountable owner</span><Input maxLength={100} value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="Assign a person" aria-label={`Owner: ${task.title}`} /></label>
        <label className="ws-field"><span>Due date</span><Input type="date" min="2000-01-01" max="2099-12-31" value={due} onChange={(event) => setDue(event.target.value)} aria-label={`Due date: ${task.title}`} /></label>
      </div>
      <div className={styles.taskFoot}>
        <span>{!task.owner.trim() ? "Assign an owner before release." : task.done ? "Completion recorded in this campaign." : "Owner assignment does not send a notification."}</span>
        <div className="ws-actions">
          {dirty && <Button type="submit" size="sm">Save changes</Button>}
          <Button type="button" variant="outline" size="sm" onClick={onRemove} aria-label={`Remove ${task.title}`}><Trash2 /> Remove</Button>
        </div>
      </div>
    </form>
  );
}

export function DeliveryStudio({ c, update, notify }: DeliveryActions) {
  const [status, setStatus] = useState<DeliveryFilter>("all");
  const [owner, setOwner] = useState("");
  const [search, setSearch] = useState("");
  const [dueBefore, setDueBefore] = useState("");
  const [title, setTitle] = useState("");
  const [newOwner, setNewOwner] = useState("");
  const [due, setDue] = useState("");
  const [presetId, setPresetId] = useState<DeliveryPresetId>("campaign");
  const [anchor, setAnchor] = useState(c.brief.launchDate);
  const [planOwner, setPlanOwner] = useState("");
  const [removed, setRemoved] = useState<DeliveryTask | null>(null);
  const [preview, setPreview] = useState("");
  const today = localCalendarDate();
  const summary = deliverySummary(c, today);
  const filtered = filterDeliveryTasks(c.tasks, { status, owner, search, dueBefore, today });
  const owners = [...new Set(c.tasks.map((task) => task.owner.trim()).filter(Boolean))].sort();
  const preset = DELIVERY_PRESETS.find((item) => item.id === presetId)!;
  const validAnchor = isCalendarDate(anchor) && anchor >= "2000-01-01" && anchor <= "2099-12-31";
  const review = readiness(c);
  const packageText = () => buildLaunchPackage(c, { today, generatedAt: new Date().toISOString(), review, checks: CHECKS });
  const slug = c.name.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "campaign";

  function saveTask(task: DeliveryTask) {
    update({ tasks: c.tasks.map((item) => item.id === task.id ? task : item) }, "Updated delivery task");
  }

  return (
    <>
      <div className="ws-panel-head">
        <div><span className="ws-eyebrow">DELIVERY / THE WORK BEHIND THE LAUNCH</span><h2>From approved idea to finished work.</h2><p>Build a dated production plan, give every task an owner and assemble the campaign&apos;s complete handoff package.</p></div>
        <Button variant="outline" onClick={() => download(`avalon-${slug}-launch-package.md`, packageText(), "text/markdown;charset=utf-8")}><FileArchive /> Export launch package</Button>
      </div>
      <div className="ws-metrics">
        <div className="ws-metric"><span>Delivery progress</span><strong>{summary.complete}/{summary.total}</strong><small>Recorded tasks complete</small></div>
        <div className="ws-metric"><span>Needs attention</span><strong>{summary.overdue}</strong><small>{summary.dueToday} due today · {summary.unassigned} without owners</small></div>
        <div className="ws-metric"><span>Approved content</span><strong>{summary.approvedContent}/{c.content.length}</strong><small>Matches the current brief revision</small></div>
        <div className="ws-metric"><span>Evidence ready</span><strong>{summary.verifiedEvidence}/{c.evidence.length}</strong><small>Source, owner and verification recorded</small></div>
      </div>

      <div className="ws-two">
        <section className="ws-card">
          <span className="ws-eyebrow">01 / BUILD THE SCHEDULE</span>
          <h3>A practical production plan.</h3>
          <p>Choose the work, set its delivery day and review the dates before adding tasks.</p>
          <label className="ws-field"><span>Plan</span>
            <Select value={presetId} onValueChange={(value) => setPresetId(value as DeliveryPresetId)}><SelectTrigger aria-label="Production plan"><SelectValue /></SelectTrigger><SelectContent>{DELIVERY_PRESETS.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select>
            <small>{preset.description}</small>
          </label>
          <div className="ws-form-grid">
            <label className="ws-field"><span>Launch / delivery day</span><Input type="date" min="2000-01-01" max="2099-12-31" value={anchor} onChange={(event) => setAnchor(event.target.value)} /></label>
            <label className="ws-field"><span>Initial owner · optional</span><Input value={planOwner} maxLength={100} placeholder="Assign individually later" onChange={(event) => setPlanOwner(event.target.value)} /></label>
          </div>
          <p className="ws-note">Dates use calendar days, including weekends. Review past due dates and delivery capacity. Existing matching tasks keep their dates and owners.</p>
          <ol className={styles.plan}>
            {preset.steps.map((item) => <li key={item.title}><span>{item.title}</span><time>{validAnchor ? offsetCalendarDate(anchor, item.days) : item.days === 0 ? "Delivery day" : `${Math.abs(item.days)} days ${item.days < 0 ? "before" : "after"}`}</time></li>)}
          </ol>
          <Button disabled={!validAnchor || c.tasks.length >= 200} onClick={() => {
            try {
              const result = scheduleDeliveryPreset(c.tasks, presetId, anchor, planOwner);
              if (result.added) update({ tasks: result.tasks }, `Added ${preset.label.toLowerCase()} schedule`);
              notify(`${result.added} tasks added. ${result.duplicates} existing tasks kept.${result.excluded ? ` ${result.excluded} tasks could not be added because the 200-task limit was reached.` : ""}`);
            } catch (error) { notify(error instanceof Error ? error.message : "The schedule could not be created."); }
          }}><CalendarDays /> Add {preset.steps.length}-step plan</Button>
        </section>

        <section className="ws-card">
          <span className="ws-eyebrow">02 / PREPARE THE HANDOFF</span>
          <h3>One package. The complete context.</h3>
          <p>Your export brings together the shared brief, channel assumptions, delivery tasks, content, evidence and specialist outputs.</p>
          <div className={styles.releaseStatus}><CheckCheck /><div><strong>{review.blockers.length ? `${review.blockers.length} launch items need attention` : "Recorded launch checks are clear"}</strong><p>{review.blockers.length ? "You can export a working package while the team resolves the remaining items." : "Confirm the final release owner and client approval before publishing."}</p></div></div>
          <ul className={styles.packageList}>
            <li><span>Shared campaign brief</span><b>Revision {c.revision}</b></li>
            <li><span>Delivery register</span><b>{c.tasks.length} tasks</b></li>
            <li><span>Content inventory</span><b>{c.content.length} items</b></li>
            <li><span>Evidence register</span><b>{c.evidence.length} records</b></li>
            <li><span>Specialist archive</span><b>{c.runs.length} outputs</b></li>
          </ul>
          <div className="ws-actions">
            <Button onClick={() => download(`avalon-${slug}-launch-package.md`, packageText(), "text/markdown;charset=utf-8")}><Download /> Download package</Button>
            <Button variant="outline" onClick={() => setPreview(preview ? "" : packageText())}>{preview ? "Close preview" : "Preview package"}</Button>
            <Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(packageText()); notify("Launch package copied."); } catch { notify("Clipboard unavailable. Download the package instead."); } }}><Clipboard /> Copy</Button>
          </div>
          <p className="ws-note">The package labels stale drafts and unresolved checks. Exporting does not publish assets or send notifications.</p>
        </section>
      </div>

      {preview && <section className="ws-card"><h3>Package preview</h3><p className="ws-note">Snapshot captured when opened. Downloads always use the current campaign.</p><pre className={styles.preview} tabIndex={0}>{preview}</pre></section>}

      <section className="ws-card">
        <div className="ws-panel-head"><div><span className="ws-eyebrow">03 / THE DELIVERY REGISTER</span><h3>Every next step, accounted for.</h3><p>Tasks are shared with the production studio. Dates are evaluated using your local calendar.</p></div><Button variant="outline" disabled={!filtered.length} onClick={() => download(`avalon-${slug}-tasks.csv`, deliveryCsv(filtered, today), "text/csv;charset=utf-8")}><Download /> Export {filtered.length} shown tasks</Button></div>
        <form className={styles.addTask} onSubmit={(event) => {
          event.preventDefault();
          if (!title.trim()) { notify("Enter a task title."); return; }
          if (c.tasks.length >= 200) { notify("This campaign has reached 200 tasks. Export and remove completed tasks before adding more."); return; }
          if (due && !isCalendarDate(due)) { notify("Choose a valid due date."); return; }
          update({ tasks: [...c.tasks, { id: crypto.randomUUID(), title: title.trim(), owner: newOwner.trim(), due, done: false }] }, "Created delivery task");
          setTitle(""); setNewOwner(""); setDue(""); notify("Delivery task added.");
        }}>
          <label className="ws-field"><span>New task</span><Input maxLength={300} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What needs to happen next?" /></label>
          <label className="ws-field"><span>Owner</span><Input maxLength={100} value={newOwner} onChange={(event) => setNewOwner(event.target.value)} placeholder="Person responsible" /></label>
          <label className="ws-field"><span>Due date</span><Input type="date" min="2000-01-01" max="2099-12-31" value={due} onChange={(event) => setDue(event.target.value)} /></label>
          <Button type="submit" disabled={c.tasks.length >= 200}><Plus /> Add task</Button>
        </form>
        <div className={styles.filters}>
          <label className="ws-field"><span><Search size={15} /> Search</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Task or owner" /></label>
          <label className="ws-field"><span>Status</span><Select value={status} onValueChange={(value) => setStatus(value as DeliveryFilter)}><SelectTrigger aria-label="Filter tasks by status"><SelectValue /></SelectTrigger><SelectContent>{([ ["all", "All tasks"], ["open", "Open"], ["complete", "Complete"], ["overdue", "Overdue"], ["unassigned", "No owner"], ["unscheduled", "No due date"] ] as const).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
          <label className="ws-field"><span>Owner</span><Select value={owner || "__all__"} onValueChange={(value) => setOwner(value === "__all__" ? "" : value)}><SelectTrigger aria-label="Filter tasks by owner"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="__all__">All owners</SelectItem>{owners.map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></label>
          <label className="ws-field"><span>Due on or before</span><Input type="date" min="2000-01-01" max="2099-12-31" value={dueBefore} onChange={(event) => setDueBefore(event.target.value)} /></label>
        </div>
        <div className={styles.resultSummary}><span aria-live="polite">Showing {filtered.length} of {c.tasks.length} tasks · earliest due first</span>{(status !== "all" || owner || search || dueBefore) && <Button variant="outline" onClick={() => { setStatus("all"); setOwner(""); setSearch(""); setDueBefore(""); }}>Clear filters</Button>}</div>
        {removed && <div className={styles.restore}><span>Removed: {removed.title}</span><Button variant="outline" disabled={c.tasks.length >= 200} onClick={() => { if (c.tasks.length >= 200) return; update({ tasks: [...c.tasks, removed] }, "Restored delivery task"); setRemoved(null); notify("Task restored."); }}><Undo2 /> Undo removal</Button></div>}
        <div className={styles.tasks}>{filtered.map((task) => <TaskCard key={`${task.id}:${task.title}:${task.owner}:${task.due}`} task={task} today={today} onSave={saveTask} notify={notify} onRemove={() => { setRemoved(task); update({ tasks: c.tasks.filter((item) => item.id !== task.id) }, "Removed delivery task"); notify("Task removed. Use Undo removal to restore it."); }} />)}</div>
        {!filtered.length && <div className={styles.empty}><CalendarDays /><h4>{c.tasks.length ? "No tasks match these filters." : "Give the work a clear next step."}</h4><p>{c.tasks.length ? "Clear a filter to see more of your delivery plan." : "Add a task above or choose a dated production plan to get started."}</p></div>}
      </section>
    </>
  );
}
