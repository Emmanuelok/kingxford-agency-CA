"use client";
import Image from "next/image";
import dynamic from "next/dynamic";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  Copy,
  GitBranch,
  Gauge,
  Activity,
  Clock3,
  CircleCheck,
  Clapperboard,
  Clipboard,
  Download,
  FileText,
  FlaskConical,
  Layers3,
  LayoutDashboard,
  Loader2,
  Megaphone,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AGENTS,
  CHANNELS,
  CHECKS,
  SHOTS,
  auditWeb,
  isRunCurrent,
  approveRun,
  latestAgentRuns,
  buildUtm,
  changed,
  contentCalendar,
  createCampaign,
  csv,
  experimentMath,
  forecast,
  newWorkspace,
  readiness,
  runAgent,
  safeUrl,
  uid,
  validDate,
  workspaceSchema,
  type AgentId,
  type Brief,
  type Campaign,
  type Run,
  type Workspace,
} from "@/lib/campaign";

const studioLoading = () => <div className="ws-loading" role="status"><Loader2 className="ws-spin" /><p>Opening your studio…</p></div>;
const WorkflowStudio = dynamic(() => import("@/components/workflow-studio").then((module) => module.WorkflowStudio), { loading: studioLoading });
const DeliveryStudio = dynamic(() => import("@/components/delivery-studio").then((module) => module.DeliveryStudio), { loading: studioLoading });
const PerformanceStudio = dynamic(() => import("@/components/performance-studio").then((module) => module.PerformanceStudio), { loading: studioLoading });
import { qualityChecks } from "@/lib/orchestration";

const STORAGE = "kingxford-workspace-v2";
const views = [
  ["overview", "Overview", LayoutDashboard],
  ["brief", "Shared brief", FileText],
  ["workflows", "Workflows", GitBranch],
  ["agents", "Specialists", Sparkles],
  ["content", "Content studio", BookOpen],
  ["production", "Production", Clapperboard],
  ["media", "Media lab", Megaphone],
  ["search", "Search & web", Search],
  ["experiments", "Experiments", FlaskConical],
  ["performance", "Performance", Gauge],
  ["delivery", "Delivery", CheckCheck],
  ["proof", "Proof & launch", ShieldCheck],
  ["library", "Output library", Layers3],
] as const;
type View = (typeof views)[number][0];
const money = (n: number | null) =>
  n === null
    ? "—"
    : new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
      }).format(n);
const num = (n: number | null, d = 0) =>
  n === null ? "—" : n.toLocaleString("en-CA", { maximumFractionDigits: d });
type Actions = {
  c: Campaign;
  update: (patch: Partial<Campaign>, action: string, brief?: boolean) => void;
  notify: (s: string) => void;
  go: (v: View) => void;
};
function saveFile(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function copy(content: string, notify: (s: string) => void) {
  try {
    if (!navigator.clipboard) throw new Error();
    await navigator.clipboard.writeText(content);
    notify("Copied to clipboard.");
  } catch {
    notify("Clipboard is unavailable. Use Download to keep a copy.");
  }
}
function Field({
  label,
  children,
  note,
}: {
  label: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <label className="ws-field">
      <span>{label}</span>
      {children}
      {note && <small>{note}</small>}
    </label>
  );
}
function Pick({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[] | { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem
            key={typeof o === "string" ? o : o.value}
            value={typeof o === "string" ? o : o.value}
          >
            {typeof o === "string" ? o : o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 10000000,
  step = 1,
  note,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  note?: string;
}) {
  return (
    <Field label={label} note={note}>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        key={value}
        defaultValue={value}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
        onBlur={(e) => {
          const n = e.target.valueAsNumber;
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
          else e.currentTarget.value = String(value);
        }}
      />
    </Field>
  );
}
function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ws-empty">
      <Layers3 />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function PanelHead({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="ws-panel-head">
      <div>
        <span className="ws-eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

export function CampaignWorkspace({
  initialView = "overview",
}: {
  initialView?: View;
}) {
  const [state, setState] = useState<Workspace | null>(null),
    [view, setView] = useState<View>(initialView),
    [notice, setNotice] = useState(""),
    [warning, setWarning] = useState(""),
    [settings, setSettings] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false),
    [duplicateOpen, setDuplicateOpen] = useState(false),
    [search, setSearch] = useState("");
  const importRef = useRef<HTMLInputElement>(null),
    latestStorage = useRef<string | null>(null),
    storageBlocked = useRef(false),
    stateRef = useRef<Workspace | null>(null);
  const [capabilities, setCapabilities] = useState({
    cloud: false,
    ai: false,
    email: null as string | null,
    userId: null as string | null,
    cloudState: "checking", cloudMessage: "Checking cloud availability…",
    aiState: "checking", aiMessage: "Checking drafting availability…",
  });
  const [cloudRevision, setCloudRevision] = useState<number | null>(null),
    [cloudBusy, setCloudBusy] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  useEffect(() => {
    // Hydrate browser-owned storage after SSR; the server cannot read this external state.
    try {
      const raw = localStorage.getItem(STORAGE);
      latestStorage.current = raw;
      if (raw) {
        const parsed = workspaceSchema.safeParse(JSON.parse(raw));
        if (parsed.success) setState(parsed.data);
        else {
          storageBlocked.current = true;
          setWarning(
            "Your saved data uses an unsupported format. Download it before starting a new workspace.",
          );
          setState(newWorkspace());
        }
      } else setState(newWorkspace());
    } catch {
      storageBlocked.current = true;
      setWarning(
        "Device storage is unavailable or unreadable. Download backups to preserve your work.",
      );
      setState(newWorkspace());
    }
    const requested = new URLSearchParams(window.location.search).get("view");
    if (views.some(([id]) => id === requested)) setView(requested as View);
    fetch("/api/workspace/status")
      .then((r) => r.json())
      .then((d) =>
        setCapabilities({
          cloud: !!d.cloud,
          ai: !!d.ai,
          email: d.email ?? null,
          userId: d.userId ?? null,
          cloudState: d.capabilities?.cloud?.state ?? (d.cloud ? "sign-in-required" : "not-configured"),
          cloudMessage: d.capabilities?.cloud?.message ?? "Cloud availability has not been verified.",
          aiState: d.capabilities?.ai?.state ?? (d.ai ? "configured" : "not-configured"),
          aiMessage: d.capabilities?.ai?.message ?? "AI availability has not been verified.",
        }),
      )
      .catch(() => setCapabilities((current) => ({ ...current, cloudState: "unavailable", cloudMessage: "Cloud status could not be checked. Device planning remains available.", aiState: "unavailable", aiMessage: "AI status could not be checked. Planning engines remain available." })));
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE && e.newValue !== latestStorage.current) {
        storageBlocked.current = true;
        setWarning(
          "This workspace changed in another tab. Download your current work, then reload to use the newer version.",
        );
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  // Report external storage failures after persisting; warning is not an effect dependency.
  useEffect(() => {
    stateRef.current = state;
    if (!state || storageBlocked.current) return;
    const parsed = workspaceSchema.safeParse(state);
    if (!parsed.success) {
      setWarning(
        "A field is invalid. Correct it before leaving this page; the last valid device backup has been preserved.",
      );
      return;
    }
    try {
      const json = JSON.stringify(parsed.data);
      localStorage.setItem(STORAGE, json);
      latestStorage.current = json;
      setWarning("");
    } catch {
      storageBlocked.current = true;
      setWarning(
        "Device storage is full or unavailable. Your changes are in memory only; download a backup now.",
      );
    }
  }, [state]);
  function notify(message: string) {
    setNotice(message);
  }
  function go(v: View) {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set("view", v);
    window.history.replaceState(null, "", url);
  }
  function update(patch: Partial<Campaign>, action: string, brief = false) {
    const targetId = state?.activeId;
    setState((s) =>
      s
        ? {
            ...s,
            campaigns: s.campaigns.map((c) =>
              c.id === targetId
                ? changed(
                    c,
                    action.startsWith("Requested AI") && patch.runs
                      ? {
                          ...patch,
                          runs: [patch.runs[0], ...c.runs].slice(0, 100),
                        }
                      : patch,
                    action,
                    brief,
                  )
                : c,
            ),
          }
        : s,
    );
  }
  function add(sample = false) {
    if (!state) return;
    if (state.campaigns.length >= 12) {
      notify(
        "You can keep 12 campaigns on this device. Export and remove an old campaign first.",
      );
      return;
    }
    const c = createCampaign(sample);
    setState({ ...state, activeId: c.id, campaigns: [...state.campaigns, c] });
    go("brief");
    notify(
      sample
        ? "Example campaign created. Its assumptions are illustrative, not client results."
        : "New campaign created. Start with your shared brief.",
    );
  }
  function duplicate(keepWork: boolean) {
    if (!state) return;
    if (state.campaigns.length >= 12) {
      notify("Your device holds 12 campaigns. Export a campaign before removing it to make room.");
      return;
    }
    const source = state.campaigns.find((x) => x.id === state.activeId)!;
    const base = keepWork ? structuredClone(source) : {
      ...createCampaign(), brief: { ...source.brief }, media: source.media.map((x) => ({ ...x })),
      web: { ...source.web },
    };
    const runIdMap = new Map(base.runs.map((run) => [run.id, uid()]));
    const duplicate: Campaign = {
      ...base, id: uid(), name: `${source.name} · ${keepWork ? "copy" : "new edition"}`.slice(0, 120),
      checks: {}, updatedAt: new Date().toISOString(),
      runs: base.runs.map((run) => ({ ...run, id: runIdMap.get(run.id)!, approved: false, ...(run.inputRunIds ? { inputRunIds: run.inputRunIds.map((id) => runIdMap.get(id) ?? id) } : {}) })),
      content: base.content.map((item) => ({ ...item, id: uid(), status: "Draft" })),
      tasks: base.tasks.map((task) => ({ ...task, id: uid(), done: false })),
      evidence: base.evidence.map((item) => ({ ...item, id: uid(), verified: false })),
      activity: [{ id: uid(), at: new Date().toISOString(), action: `Created ${keepWork ? "working copy" : "fresh edition"} from ${source.name}`.slice(0, 300) }],
    };
    setState({ ...state, activeId: duplicate.id, campaigns: [...state.campaigns, duplicate] });
    setDuplicateOpen(false);
    go("brief");
    notify("Campaign copied. The original is preserved; approvals and completed tasks are reset in the new edition.");
  }
  async function importBackup(file: File) {
    try {
      if (file.size > 50000000)
        throw new Error("Backup must be smaller than 50 MB.");
      const value = workspaceSchema.safeParse(JSON.parse(await file.text()));
      if (!value.success)
        throw new Error("This file is not a valid AVALON / legacy KINGXFORD v2 backup.");
      const current = stateRef.current;
      if (!current) return;
      const incoming = value.data.campaigns.map((c) => ({
        ...c,
        id: uid(),
        name: `${c.name} · imported`.slice(0, 120),
      }));
      if (current.campaigns.length + incoming.length > 12)
        throw new Error(
          "Import would exceed 12 campaigns. Remove an exported campaign first.",
        );
      setState({
        ...current,
        activeId: incoming[0].id,
        campaigns: [...current.campaigns, ...incoming],
      });
      notify(
        `Imported ${incoming.length} campaigns without overwriting existing work.`,
      );
    } catch (e) {
      notify(e instanceof Error ? e.message : "Import failed.");
    }
  }
  async function cloud(action: "login" | "logout" | "load" | "save") {
    if (!state) return;
    const before = JSON.stringify(state);
    setCloudBusy(true);
    try {
      const r = await fetch(
        action === "login" || action === "logout"
          ? "/api/workspace/session"
          : "/api/workspace",
        {
          method:
            action === "load"
              ? "GET"
              : action === "logout"
                ? "DELETE"
                : action === "save"
                  ? "PUT"
                  : "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Kingxford-Owner": capabilities.userId ?? "",
          },
          ...(action === "login"
            ? { body: JSON.stringify({ email, password }) }
            : action === "save"
              ? {
                  body: JSON.stringify({
                    workspace: state,
                    revision: cloudRevision,
                    expectedOwnerId: capabilities.userId,
                  }),
                }
              : {}),
        },
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Request could not be completed.");
      if (action === "login") {
        setCapabilities((s) => ({ ...s, email: d.email, userId: d.userId }));
        setCloudRevision(null);
        setPassword("");
        notify(
          "Signed in. Load your cloud snapshot or save your current device workspace.",
        );
      }
      if (action === "logout") {
        setCapabilities((s) => ({ ...s, email: null, userId: null }));
        setCloudRevision(null);
        notify(
          "Signed out. Device drafts remain; export and delete them on a shared device.",
        );
      }
      if (action === "save") {
        setCloudRevision(d.revision);
        notify(
          "Private cloud snapshot saved. New edits remain on this device until you save again.",
        );
      }
      if (action === "load") {
        if (d.ownerId !== capabilities.userId)
          throw new Error(
            "Cloud account changed. Reload the page before continuing.",
          );
        if (JSON.stringify(stateRef.current) !== before)
          throw new Error(
            "Your device work changed while cloud was loading. No local work was replaced. Try loading again when current work is finished.",
          );
        if (d.workspace) {
          const parsed = workspaceSchema.parse(d.workspace);
          saveFile(
            "avalon-before-cloud-load.json",
            JSON.stringify(stateRef.current, null, 2),
            "application/json",
          );
          setState(parsed);
          setCloudRevision(d.revision);
          notify(
            "Cloud snapshot loaded. Your previous device work was downloaded as a backup.",
          );
        } else {
          setCloudRevision(null);
          notify(
            "No cloud snapshot yet. Save your current workspace to create one.",
          );
        }
      }
      try {
        const statusResponse = await fetch("/api/workspace/status");
        if (statusResponse.ok) {
          const status = await statusResponse.json();
          setCapabilities((current) => ({ ...current, cloudState: status.capabilities?.cloud?.state ?? current.cloudState, cloudMessage: status.capabilities?.cloud?.message ?? current.cloudMessage, aiState: status.capabilities?.ai?.state ?? current.aiState, aiMessage: status.capabilities?.ai?.message ?? current.aiMessage }));
        }
      } catch {
        // A verification refresh must not misreport a completed save or load as failed.
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "Cloud request failed.");
    } finally {
      setCloudBusy(false);
    }
  }
  if (!state)
    return (
      <section className="ws-loading" aria-busy="true">
        <Loader2 className="ws-spin" />
        <h1>Opening your workspace</h1>
        <p>Preparing your saved campaigns.</p>
      </section>
    );
  const c = state.campaigns.find((c) => c.id === state.activeId)!;
  const actions = { c, update, notify, go };
  const health = readiness(c);
  return (
    <section
      className="ws"
      id="main-content"
      aria-label="AVALON Creative Group campaign workspace"
    >
      <Tabs
        orientation="vertical"
        value={view}
        onValueChange={(v) => go(v as View)}
        className="ws-layout"
      >
        <aside className="ws-sidebar">
          <a href="/platform" className="ws-wordmark">
            <span>A.</span>
            <div>
              AVALON<small>One brief. Every discipline.</small>
            </div>
          </a>
          <div className="ws-campaign-pick">
            <span className="ws-eyebrow">ACTIVE CAMPAIGN</span>
            <Pick
              label="Active campaign"
              value={c.id}
              options={state.campaigns.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
              onChange={(id) => setState({ ...state, activeId: id })}
            />
            <div className="ws-campaign-actions">
              <Button variant="outline" onClick={() => add()}><Plus /> New</Button>
              <Button variant="outline" onClick={() => setDuplicateOpen(true)}><Copy /> Duplicate</Button>
            </div>
          </div>
          <div className="ws-nav-search">
            <Search />
            <Input
              aria-label="Find a studio"
              placeholder="Find a studio…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="ws-mobile-studio-pick"><Pick label="Open a campaign studio" value={view} options={views.map(([value, label]) => ({ value, label }))} onChange={(value) => go(value as View)} /></div>
          <TabsList className="ws-nav" aria-label="Campaign studios">
            {views
              .filter(([, label]) =>
                label.toLowerCase().includes(search.toLowerCase()),
              )
              .map(([id, label, Icon]) => (
                <TabsTrigger value={id} key={id}>
                  <Icon />
                  <span>{label}</span>
                  {id === "proof" && health.blockers.length > 0 && (
                    <b>{health.blockers.length}</b>
                  )}
                </TabsTrigger>
              ))}
          </TabsList>
          {search &&
            !views.some(([, label]) =>
              label.toLowerCase().includes(search.toLowerCase()),
            ) && (
              <p className="ws-no-results">
                No studio matches. Try “media” or “content”.
              </p>
            )}
          <div className="ws-sidebar-foot">
            <button onClick={() => setSettings(true)}>
              <Settings2 /> Storage & connections
            </button>
            <span>Device-local drafts · CAD · en-CA</span>
            <a href="/privacy">
              Privacy and data handling <ArrowUpRight />
            </a>
          </div>
        </aside>
        <div className="ws-main">
          <header className="ws-topbar">
            <div>
              <span>AVALON CREATIVE GROUP / {views.find(([id]) => id === view)?.[1]}</span>
              <b>{c.brief.brand || "Your next campaign"}</b>
            </div>
            <div className="ws-top-actions">
              <span className="ws-save-state"><i className={warning ? "attention" : ""} />{warning ? "Save needs attention" : "Saved on device"}</span>
              <span className="ws-revision">Brief v{c.revision}</span>
              <Button
                variant="outline"
                onClick={() =>
                  saveFile(
                    "avalon-workspace.json",
                    JSON.stringify(state, null, 2),
                    "application/json",
                  )
                }
              >
                <Download /> <span>Backup</span>
              </Button>
              <Button onClick={() => setSettings(true)}>
                <Settings2 />
                <span>Connections</span>
              </Button>
            </div>
          </header>
          {warning && (
            <div className="ws-alert" role="alert">
              {warning}
              <Button
                variant="outline"
                onClick={() =>
                  saveFile(
                    "avalon-recovery.json",
                    latestStorage.current || JSON.stringify(state),
                    "application/json",
                  )
                }
              >
                Download saved copy
              </Button>
            </div>
          )}
          {notice && (
            <div className="ws-toast" role="status">
              <Check />
              {notice}
              <button
                aria-label="Dismiss message"
                onClick={() => setNotice("")}
              >
                <X />
              </button>
            </div>
          )}
          <div className="ws-body" key={c.id}>
            <TabsContent value="overview">
              <Overview {...actions} />
            </TabsContent>
            <TabsContent value="brief">
              <BriefEditor {...actions} />
            </TabsContent>
            <TabsContent value="workflows"><WorkflowStudio {...actions} /></TabsContent>
            <TabsContent value="performance"><PerformanceStudio {...actions} /></TabsContent>
            <TabsContent value="delivery"><DeliveryStudio {...actions} /></TabsContent>
            <TabsContent value="agents">
              <Agents
                {...actions}
                ai={capabilities.ai && !!capabilities.email}
                ownerId={capabilities.userId}
              />
            </TabsContent>
            <TabsContent value="content">
              <ContentStudio {...actions} />
            </TabsContent>
            <TabsContent value="production">
              <Production {...actions} />
            </TabsContent>
            <TabsContent value="media">
              <MediaLab {...actions} />
            </TabsContent>
            <TabsContent value="search">
              <SearchStudio {...actions} />
            </TabsContent>
            <TabsContent value="experiments">
              <Experiments {...actions} />
            </TabsContent>
            <TabsContent value="proof">
              <Proof {...actions} />
            </TabsContent>
            <TabsContent value="library">
              <Library {...actions} />
            </TabsContent>
          </div>
          <footer className="ws-footnote">
            Your work stays on this device unless you explicitly save to cloud
            or request an AI draft. Planning scenarios are not guaranteed
            results. No ads, messages or content are automatically published.
          </footer>
        </div>
      </Tabs>
      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="ws-dialog">
          <DialogHeader>
            <DialogTitle>Storage & connections</DialogTitle>
            <DialogDescription>
              Start privately on this device. Cloud storage and AI require an
              agency-provisioned account.
            </DialogDescription>
          </DialogHeader>
          <div className="ws-dialog-body">
            <div className="ws-connection">
              <b>Device workspace</b>
              <span>{warning ? "Needs attention" : "Autosaving locally"}</span>
              <p>
                {state.campaigns.length} campaigns. Browser storage is not
                encrypted and is not a team workspace. Keep regular backups.
              </p>
              <div className="ws-actions">
                <Button
                  variant="outline"
                  onClick={() =>
                    saveFile(
                      "avalon-workspace.json",
                      JSON.stringify(state, null, 2),
                      "application/json",
                    )
                  }
                >
                  <Download /> Export all
                </Button>
                <Button
                  variant="outline"
                  onClick={() => importRef.current?.click()}
                >
                  <Upload /> Import backup
                </Button>
                <Button variant="outline" onClick={() => add(true)}>Add example</Button>
                <Button variant="outline" onClick={() => { setSettings(false); setDuplicateOpen(true); }}><Copy /> Duplicate campaign</Button>
              </div>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) void importBackup(e.target.files[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <div className="ws-connection">
              <b>Private cloud snapshot</b>
              <span>
                {capabilities.cloud
                  ? capabilities.email ? `${capabilities.email} · ${capabilities.cloudState === "connected" ? "Storage verified" : "Verification needed"}` : "Sign-in required"
                  : capabilities.cloudState === "checking" ? "Checking availability" : "Not connected"}
              </span>
              <p>{capabilities.cloudMessage}</p>
              {capabilities.cloud ? (
                capabilities.email ? (
                  <>
                    <p>
                      Cloud saves are explicit snapshots of up to 2 MB,
                      protected by account ownership. Load first to edit an
                      existing snapshot; conflicts never overwrite newer cloud
                      data.
                    </p>
                    <div className="ws-actions">
                      <Button
                        disabled={cloudBusy}
                        onClick={() => void cloud("load")}
                      >
                        Load cloud
                      </Button>
                      <Button
                        disabled={cloudBusy}
                        onClick={() => void cloud("save")}
                      >
                        Save to cloud
                      </Button>
                      <Button
                        variant="outline"
                        disabled={cloudBusy}
                        onClick={() => void cloud("logout")}
                      >
                        Sign out
                      </Button>
                    </div>
                  </>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void cloud("login");
                    }}
                  >
                    <Field label="Account email">
                      <Input
                        type="email"
                        required
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </Field>
                    <Field label="Password">
                      <Input
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </Field>
                    <Button disabled={cloudBusy} type="submit">
                      {cloudBusy ? <Loader2 className="ws-spin" /> : null} Sign
                      in
                    </Button>
                    <p>
                      Use an invited AVALON account. Contact the agency to
                      obtain or recover access.
                    </p>
                  </form>
                )
              ) : (
                <p>
                  The owner must connect a dedicated Supabase project and
                  install the protected workspace schema. Local planning remains
                  available.
                </p>
              )}
            </div>
            <div className="ws-connection">
              <b>AI specialists</b>
              <span>
                {capabilities.ai
                  ? `Configured · ${capabilities.email ? "Account signed in" : "Sign-in required"}`
                  : capabilities.aiState === "checking" ? "Checking availability" : "Not connected"}
              </span>
              <p>{capabilities.aiMessage}</p>
              <p>
                AI drafts use your brief, selected evidence and the relevant
                planning context only when requested. Provider processing and
                usage charges may apply. All outputs remain drafts for human
                review. Planning engines work without AI.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 /> Delete active device campaign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
        <DialogContent className="ws-dialog">
          <DialogHeader>
            <DialogTitle>A new edition, with a head start.</DialogTitle>
            <DialogDescription>Choose what to carry from “{c.name}”. Your original campaign stays intact. Every new edition starts with fresh approvals.</DialogDescription>
          </DialogHeader>
          <div className="ws-duplicate-options">
            <button onClick={() => duplicate(false)}><FileText /><b>Start from the brief</b><span>Keep the brief, media assumptions and page copy. Begin with empty outputs, content, production and evidence.</span><ArrowRight /></button>
            <button onClick={() => duplicate(true)}><Copy /><b>Copy the entire campaign</b><span>Bring all working material into a separate campaign. Reset approvals, evidence verification and completed tasks for review.</span><ArrowRight /></button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="ws-dialog">
          <DialogHeader>
            <DialogTitle>Delete this device campaign?</DialogTitle>
            <DialogDescription>
              This removes “{c.name}” from this browser. A full backup will download before removal.
              Cloud snapshots are not deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="ws-actions">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Keep campaign
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                saveFile("avalon-before-campaign-delete.json", JSON.stringify(state, null, 2), "application/json");
                const campaigns = state.campaigns.filter((x) => x.id !== c.id);
                if (!campaigns.length) campaigns.push(createCampaign());
                setState({ ...state, activeId: campaigns[0].id, campaigns });
                setConfirmDelete(false);
                notify(
                  storageBlocked.current
                    ? "Removed from memory only: device storage is blocked. Reload or clear browser site data to remove the saved copy."
                    : "Device campaign removed. A backup was downloaded before removal.",
                );
              }}
            >
              Download backup & delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

const roomDescriptions: Record<View, string> = {
  overview: "Your campaign, at a glance", brief: "The context behind every decision",
  workflows: "Sequence specialists with shared context", agents: "Accountable expertise, on demand",
  content: "Draft, adapt and schedule", production: "Plan the capture and delivery",
  media: "Model economics and scenarios", search: "Improve copy and campaign tracking",
  experiments: "Size a test and interpret results", performance: "Import actuals and find the next move",
  delivery: "Turn the plan into accountable delivery",
  proof: "Connect every claim to evidence", library: "Review, approve and export your work",
};
function campaignReport(c: Campaign) {
  const f = forecast(c), r = readiness(c);
  return `# AVALON Creative Group · Campaign review

## ${c.name}
Prepared ${new Date().toISOString()} · Brief v${c.revision}

## Campaign brief
Brand: ${c.brief.brand || "Not supplied"}
Objective: ${c.brief.objective}
Audience: ${c.brief.audience || "Not supplied"}
Market: ${c.brief.market || "Not supplied"}
Offer: ${c.brief.offer || "Not supplied"}
Voice: ${c.brief.voice}
Website: ${c.brief.website || "Not supplied"}
Launch: ${c.brief.launchDate || "Not scheduled"} · ${c.brief.weeks} weeks

## Economics · working assumptions in CAD
Investment: ${money(c.brief.budget)}
Agency: ${money(c.brief.agencyFee)} · Production: ${money(c.brief.productionCost)}
Modelled media: ${money(f.spend)} · Customers: ${num(f.customers, 1)}
Modelled revenue: ${money(f.revenue)} · All-in CAC: ${money(f.fullyLoadedCac)}
These are planning scenarios, not observed results or guaranteed returns.

## Launch review
Self-reported checklist: ${r.score}%
${r.blockers.length ? r.blockers.map((x) => `- ${x}`).join("\n") : "No current checklist blockers. Final authorization and publication are separate actions."}

## Evidence ledger
${c.evidence.length ? c.evidence.map((x) => `- ${x.claim || "Untitled claim"}\n  Source: ${x.source || "Missing"} · Owner: ${x.owner || "Missing"} · ${x.verified ? "Owner reviewed" : "Needs review"}`).join("\n") : "No evidence recorded."}

## Content calendar
${c.content.length ? c.content.map((x) => `### ${x.title}\n${x.date || "Unscheduled"} · ${x.channel} · ${x.status} · Brief v${x.revision}${x.revision !== c.revision ? " (older brief)" : ""}\n\n${x.copy}`).join("\n\n") : "No content planned."}

## Production tasks
${c.tasks.length ? c.tasks.map((x) => `- [${x.done ? "x" : " "}] ${x.title} · ${x.owner || "Unassigned"} · ${x.due || "No due date"}`).join("\n") : "No tasks recorded."}

## Specialist outputs
${c.runs.length ? c.runs.map((x) => `### ${x.title}\n${x.mode} · ${x.createdAt} · Brief v${x.revision} · ${!isRunCurrent(c, x) ? "Superseded context / review again" : x.approved ? "Approved by user" : "Draft / needs review"}\n\n${x.text}`).join("\n\n---\n\n") : "No outputs saved."}

## Observed performance · supplied records
${c.performance?.rows.length ? `${c.performance.rows.length} daily channel records. These results were supplied by the user and have not been independently verified.\nTotal reported spend: ${money(c.performance.rows.reduce((sum, row) => sum + row.spend, 0))} · Reported revenue: ${money(c.performance.rows.reduce((sum, row) => sum + row.revenue, 0))}\n\n${c.performance.rows.map((row) => `- ${row.date} · ${row.channel} · Spend ${money(row.spend)} · Impressions ${num(row.impressions)} · Clicks ${num(row.clicks)} · Leads ${num(row.leads)} · Customers ${num(row.customers)} · Revenue ${money(row.revenue)}\n  Source: ${row.source}`).join("\n")}` : "No observed results supplied. Modelled economics above are planning assumptions only."}

## Decision history
${c.activity.map((x) => `- ${x.at} · ${x.action}`).join("\n")}

Prepared from user-supplied inputs. Planning engines use explicit rules. AI drafts require human verification. No export publishes content, sends communications or authorizes spend.
`;
}
function Overview({ c, go, notify }: Actions) {
  const f = forecast(c), r = readiness(c);
  const current = latestAgentRuns(c).filter((x) => isRunCurrent(c, x));
  const approved = current.filter((x) => x.approved).length;
  const checks = qualityChecks(c);
  const contextFields = [c.brief.brand, c.brief.audience, c.brief.offer, c.brief.proof, c.brief.website, c.brief.launchDate];
  const contextScore = Math.round(contextFields.filter((x) => x.trim()).length / contextFields.length * 100);
  const next: { view: View; title: string; description: string; tag: string }[] = [];
  if (!c.brief.brand.trim() || !c.brief.audience.trim() || !c.brief.offer.trim()) next.push({ view: "brief", title: "Give the campaign a clear starting point", description: "Define the brand, audience and offer so every specialist works from the same context.", tag: "Start here" });
  if (f.invalidBudget) next.push({ view: "media", title: "Resolve the investment shortfall", description: "Production and agency fees exceed the campaign budget. Rebalance before planning media.", tag: "Budget" });
  if (!current.length) next.push({ view: "workflows", title: "Build a connected campaign plan", description: "Preview a specialist workflow, check its prerequisites and create the working outputs.", tag: "Create" });
  if (r.stale) next.push({ view: "library", title: `Review ${r.stale} outputs from an older brief`, description: "Preserve the history, then refresh work against the latest campaign revision.", tag: "Refresh" });
  if (current.some((x) => !x.approved)) next.push({ view: "library", title: "Review your current specialist drafts", description: "Read the assumptions and approve the outputs that are ready to guide production.", tag: "Review" });
  if (!c.content.length) next.push({ view: "content", title: "Turn the plan into a publishing calendar", description: "Create editable channel drafts, assign dates and track review status.", tag: "Content" });
  if (r.blockers.length) next.push({ view: "proof", title: `Resolve ${r.blockers.length} launch blockers`, description: "Confirm the destination, evidence, permissions and accountable owners.", tag: "Launch" });
  if (!next.length) next.push({ view: "performance", title: "Close the loop with actual results", description: "Bring in campaign observations and use them to guide the next decision.", tag: "Measure" });
  const stages: { name: string; note: string; percent: number; view: View }[] = [
    { name: "Direction", note: "Brief completeness", percent: contextScore, view: "brief" },
    { name: "Development", note: "Specialist coverage", percent: Math.round(new Set(current.map((x) => x.agent)).size / AGENTS.length * 100), view: "workflows" },
    { name: "Review", note: "Current outputs approved", percent: current.length ? Math.round(approved / current.length * 100) : 0, view: "library" },
    { name: "Release", note: "Self-reported checklist", percent: r.score, view: "proof" },
  ];
  return <>
    <div className="ws-hero ws-mission-hero">
      <div>
        <span className="ws-eyebrow"><span className="ws-live-dot" /> YOUR CONNECTED CREATIVE WORKSPACE</span>
        <h1>Every discipline.<br /><em>One direction.</em></h1>
        <p>Give your best ideas the whole agency. Strategy, creative, production and performance share one brief, one library and a clear next move.</p>
        <div className="ws-actions">
          <Button onClick={() => go(next[0].view)}>{next[0].view === "brief" ? "Shape your campaign" : "Make your next move"}<ArrowRight /></Button>
          <button className="ws-text-button" onClick={() => go("workflows")}>Explore workflows <ArrowUpRight /></button>
        </div>
        <div className="ws-hero-caption"><span>{AGENTS.length} specialist engines</span><i /><span>{views.length} connected studios</span><i /><span>Your review, every step</span></div>
      </div>
      <div className="ws-mission-card">
        <div className="ws-mission-card-top"><span>ACTIVE CAMPAIGN</span><Activity /></div>
        <h2>{c.brief.brand || "Your next great idea."}</h2>
        <p>{c.brief.offer || "Start with the opportunity. Build the brief. Bring every discipline into the same conversation."}</p>
        <div className="ws-mission-detail"><span>Market</span><b>{c.brief.market || "To be defined"}</b></div>
        <div className="ws-mission-detail"><span>Launch window</span><b>{c.brief.launchDate || "Set your date"} · {c.brief.weeks} weeks</b></div>
        <div className="ws-mission-bottom"><span className="ws-status">BRIEF V{c.revision}</span><button onClick={() => go("brief")}>Refine brief <ArrowUpRight /></button></div>
      </div>
    </div>
    <div className="ws-metrics">
      <Metric label="Campaign investment" value={money(c.brief.budget)} note="Working budget · CAD, before tax" />
      <Metric label="Available media" value={money(f.spend)} note={f.invalidBudget ? "Costs exceed the campaign budget" : "After agency and production"} />
      <Metric label="Approved current outputs" value={`${approved} / ${current.length}`} note={`${c.runs.length} outputs retained with brief lineage`} />
      <Metric label="Launch review" value={`${r.score}%`} note={`${r.blockers.length} blockers · self-reported checklist`} />
    </div>
    <section className="ws-journey" aria-label="Campaign progress">
      {stages.map((stage, i) => <button key={stage.name} onClick={() => go(stage.view)}><span className="ws-stage-number">0{i + 1}</span><div><h3>{stage.name}<b>{stage.percent}%</b></h3><p>{stage.note}</p><div className="ws-progress"><span style={{ width: `${stage.percent}%` }} /></div></div><ChevronRight /></button>)}
    </section>
    <div className="ws-two ws-action-grid">
      <section className="ws-card">
        <div className="ws-section-label"><span className="ws-eyebrow">YOUR NEXT MOVES</span><span className="ws-status">{next.length} actions</span></div>
        <h3>A useful next step. Always.</h3>
        {next.slice(0, 4).map((item, i) => <button key={item.title} className="ws-decision" onClick={() => go(item.view)}><span>0{i + 1}</span><div><small>{item.tag}</small><b>{item.title}</b><p>{item.description}</p></div><ArrowUpRight /></button>)}
      </section>
      <section className="ws-card ws-campaign-health">
        <div className="ws-section-label"><span className="ws-eyebrow">CAMPAIGN QUALITY</span><ShieldCheck /></div>
        <h3>See what needs your attention.</h3>
        <p>Live checks use your supplied campaign data. Open the workflow studio to inspect every check and its implications.</p>
        <div className="ws-health-stat"><strong>{checks.filter((x) => x.passed).length}<span>/{checks.length}</span></strong><div>Checks satisfied<small>Rules and supplied evidence</small></div></div>
        <div className="ws-health-summary"><span><b>{c.evidence.filter((x) => x.verified).length}</b> reviewed evidence records</span><span><b>{c.tasks.filter((x) => !x.done).length}</b> production tasks open</span><span><b>{c.content.filter((x) => x.status === "Approved" && x.revision === c.revision).length}</b> current content approvals</span></div>
        <div className="ws-actions"><Button onClick={() => go("workflows")}>Inspect campaign health <ArrowRight /></Button><Button variant="outline" onClick={() => { saveFile("avalon-campaign-review.md", campaignReport(c), "text/markdown"); notify("Campaign review exported with the brief, economics, evidence, content, outputs and decision history."); }}><Download /> Campaign report</Button></div>
      </section>
    </div>
    <PanelHead eyebrow="EVERYTHING WORKS TOGETHER" title="Go where the work takes you." description="Every studio opens with this campaign's context. Changes flow through revisions, connected outputs and your review queue." />
    <div className="ws-room-grid">
      {views.filter(([id]) => !["overview", "brief"].includes(id)).map(([id, label, Icon]) => <button key={id} onClick={() => go(id)}><Icon /><h3>{label}</h3><span>{roomDescriptions[id]}</span><ArrowUpRight /></button>)}
    </div>
    <section className="ws-card ws-activity"><div className="ws-section-label"><h3>Decision history</h3><Clock3 /></div>{c.activity.length ? c.activity.slice(0, 8).map((a) => <div key={a.id}><span>{new Date(a.at).toLocaleString("en-CA")}</span><b>{a.action}</b></div>) : <p>Your campaign history begins when you edit the brief or create work.</p>}</section>
  </>;
}
function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="ws-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function RemoveRecord({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={`Remove ${label}`}
      >
        <Trash2 /> Remove
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="ws-dialog">
          <DialogHeader>
            <DialogTitle>Remove {label}?</DialogTitle>
            <DialogDescription>
              This removes the record from the device campaign. Export a
              workspace backup first if you may need to restore it. Saved cloud
              snapshots are unchanged.
            </DialogDescription>
          </DialogHeader>
          <div className="ws-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Keep record
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
            >
              Remove record
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
function BriefEditor({ c, update, go }: Actions) {
  const set = <K extends keyof Brief>(k: K, v: Brief[K]) =>
    update(
      { brief: { ...c.brief, [k]: v } },
      `Updated ${k} in shared brief`,
      true,
    );
  return (
    <>
      <PanelHead
        eyebrow="01 / SINGLE SOURCE OF CONTEXT"
        title="A brief every discipline can use."
        description="Changes create a new revision, mark older outputs as stale, and reset launch sign-off. No disconnected forms."
      />
      <div className="ws-card">
        <div className="ws-form-grid">
          <Field label="Campaign name">
            <Input
              maxLength={120}
              value={c.name}
              onChange={(e) =>
                update({ name: e.target.value }, "Renamed campaign")
              }
            />
          </Field>
          <Field label="Brand or organization">
            <Input
              maxLength={120}
              value={c.brief.brand}
              onChange={(e) => set("brand", e.target.value)}
              placeholder="Your organization"
            />
          </Field>
          <Field label="Primary objective">
            <Pick
              label="Primary objective"
              value={c.brief.objective}
              options={[
                { value: "leads", label: "Qualified leads" },
                { value: "sales", label: "Online sales" },
                { value: "launch", label: "Brand or product launch" },
                { value: "local", label: "Local demand" },
                { value: "content", label: "Content system" },
                { value: "expansion", label: "Market expansion" },
              ]}
              onChange={(v) => set("objective", v as Brief["objective"])}
            />
          </Field>
          <Field label="Sector">
            <Input
              maxLength={120}
              value={c.brief.sector}
              onChange={(e) => set("sector", e.target.value)}
            />
          </Field>
          <Field label="Priority market">
            <Input
              maxLength={120}
              value={c.brief.market}
              onChange={(e) => set("market", e.target.value)}
            />
          </Field>
          <Field
            label="Website"
            note={
              c.brief.website && !safeUrl(c.brief.website)
                ? "Enter a full https:// or http:// URL."
                : undefined
            }
          >
            <Input
              type="url"
              maxLength={500}
              value={c.brief.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.ca"
            />
          </Field>
          <Field label="Priority audience">
            <Textarea
              maxLength={2000}
              value={c.brief.audience}
              onChange={(e) => set("audience", e.target.value)}
              placeholder="Who needs to act, and what is stopping them?"
            />
          </Field>
          <Field label="Offer and value proposition">
            <Textarea
              maxLength={2000}
              value={c.brief.offer}
              onChange={(e) => set("offer", e.target.value)}
              placeholder="What do they receive, and why should they care?"
            />
          </Field>
          <Field label="Evidence and proof">
            <Textarea
              maxLength={2000}
              value={c.brief.proof}
              onChange={(e) => set("proof", e.target.value)}
              placeholder="Verified benefits, customer evidence, dated sources"
            />
          </Field>
          <Field label="Voice and constraints">
            <Textarea
              maxLength={300}
              value={c.brief.voice}
              onChange={(e) => set("voice", e.target.value)}
            />
          </Field>
          <NumberField
            label="Total investment · CAD"
            value={c.brief.budget}
            onChange={(v) => set("budget", v)}
          />
          <NumberField
            label="Agency fees · CAD"
            value={c.brief.agencyFee}
            onChange={(v) => set("agencyFee", v)}
          />
          <NumberField
            label="Production, rights & other costs · CAD"
            value={c.brief.productionCost}
            onChange={(v) => set("productionCost", v)}
            note="Include talent, licensing, travel, technology and contingency. Tax excluded."
          />
          <NumberField
            label="Campaign duration · weeks"
            min={1}
            max={52}
            value={c.brief.weeks}
            onChange={(v) => set("weeks", Math.round(v))}
          />
          <NumberField
            label="Revenue per customer · CAD"
            value={c.brief.revenuePerCustomer}
            onChange={(v) => set("revenuePerCustomer", v)}
          />
          <NumberField
            label="Gross margin · %"
            max={100}
            value={c.brief.margin}
            onChange={(v) => set("margin", v)}
          />
          <NumberField
            label="Lead-to-customer conversion · %"
            max={100}
            value={c.brief.leadToSale}
            onChange={(v) => set("leadToSale", v)}
            note="Ignored for online sales: a conversion is treated as a customer."
          />
          <Field label="First content date">
            <Input
              type="date"
              value={c.brief.launchDate}
              onChange={(e) => {
                if (!e.target.value || validDate(e.target.value))
                  set("launchDate", e.target.value);
              }}
            />
          </Field>
        </div>
      </div>
      <div className="ws-actions">
        <Button onClick={() => go("agents")}>
          Use this brief across the specialists <ArrowRight />
        </Button>
      </div>
    </>
  );
}

function Agents({
  c,
  update,
  notify,
  go,
  ai,
  ownerId,
}: Actions & { ai: boolean; ownerId: string | null }) {
  const [busy, setBusy] = useState<AgentId | null>(null),
    [selected, setSelected] = useState<Run | null>(null),
    [agentSearch, setAgentSearch] = useState(""),
    [agentFilter, setAgentFilter] = useState("All specialists");
  const latest = latestAgentRuns(c);
  const currentIds = new Set(latest.filter((run) => isRunCurrent(c, run)).map((run) => run.id));
  const filteredAgents = AGENTS.filter((agent) => {
    const previous = latest.find((run) => run.agent === agent.id);
    const matchesStatus = agentFilter === "All specialists" || (agentFilter === "Not started" && !previous) || (agentFilter === "Needs review" && previous && (!previous.approved || !currentIds.has(previous.id))) || (agentFilter === "Approved" && previous?.approved && currentIds.has(previous.id));
    return matchesStatus && `${agent.name} ${agent.role} ${agent.room}`.toLowerCase().includes(agentSearch.toLowerCase());
  });
  function run(id: AgentId) {
    if (
      !c.brief.brand.trim() ||
      !c.brief.audience.trim() ||
      !c.brief.offer.trim()
    ) {
      notify(
        "Add a brand, audience and offer in Shared brief before running a specialist.",
      );
      go("brief");
      return;
    }
    const output = runAgent(c, id);
    update({ runs: [output, ...c.runs].slice(0, 100) }, `Ran ${output.title}`);
    setSelected(output);
  }
  async function runAI(id: AgentId) {
    setBusy(id);
    try {
      const r = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign: {
            ...c,
            runs: c.runs.map((r) => ({ ...r, text: "" })),
            content: c.content.map((r) => ({ ...r, copy: "" })),
            activity: [],
          },
          agent: id,
          expectedOwnerId: ownerId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "AI request failed.");
      update(
        { runs: [d.run, ...c.runs].slice(0, 100) },
        `Requested AI draft from ${id}`,
      );
      setSelected(d.run);
    } catch (e) {
      notify(
        e instanceof Error
          ? e.message
          : "AI request failed. No output was saved.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PanelHead
        eyebrow="02 / SPECIALIST WORKFLOW"
        title={`${AGENTS.length} perspectives. One shared ambition.`}
        description="Run transparent planning engines instantly. Configured AI specialists can deepen a draft, but never publish, spend, or approve on your behalf."
      >
        <Button disabled={!!busy} onClick={() => go("workflows")}>
          Build connected workflow <GitBranch />
        </Button>
      </PanelHead>
      <div className="ws-mode-note">
        <ShieldCheck />
        <p>
          <b>Planning engine</b> means explicit rules and calculations.{" "}
          <b>AI draft</b> means a model response from your configured gateway.
          Neither is independently verified research.
        </p>
      </div>
      <div className="ws-toolbar ws-agent-toolbar">
        <div className="ws-search-field"><Search /><Input aria-label="Find a specialist" placeholder="Find a specialist by expertise…" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} /></div>
        <Pick label="Filter specialists" value={agentFilter} options={["All specialists", "Not started", "Needs review", "Approved"]} onChange={setAgentFilter} />
        <span className="ws-result-count">{filteredAgents.length} specialists</span>
      </div>
      {!filteredAgents.length && <Empty title="No specialists match this view." description="Try another expertise or change the status filter." action={<Button variant="outline" onClick={() => { setAgentSearch(""); setAgentFilter("All specialists"); }}>Reset filters</Button>} />}
      <div className="ws-agent-grid">
        {filteredAgents.map((a) => {
          const previous = latest.find((r) => r.agent === a.id);
          return (
            <article className="ws-card" key={a.id}>
              <header>
                <span>
                  {String(AGENTS.findIndex((x) => x.id === a.id) + 1).padStart(2, "0")} / {a.room}
                </span>
                <Sparkles />
              </header>
              <h3>{a.name}</h3>
              <p>{a.role}.</p>
              <small className={`ws-agent-state ${previous && !currentIds.has(previous.id) ? "needs-review" : ""}`}>
                {previous ? !currentIds.has(previous.id) ? "Campaign context changed · refresh needed" : previous.approved ? "Current output · approved" : "Current draft · awaiting review" : "Ready for your shared brief"}
              </small>
              {previous && <Button variant="outline" onClick={() => setSelected(previous)}>Read latest output <ArrowUpRight /></Button>}
              <Button onClick={() => run(a.id)} disabled={!!busy}>
                Run planning engine <ArrowRight />
              </Button>
              <Button
                variant="outline"
                disabled={!ai || !!busy}
                onClick={() => void runAI(a.id)}
              >
                {busy === a.id ? <Loader2 className="ws-spin" /> : <Sparkles />}
                {ai ? "Send brief for AI draft" : "AI connection required"}
              </Button>
            </article>
          );
        })}
      </div>
      <OutputDialog
        run={selected}
        close={() => setSelected(null)}
        notify={notify}
      />
    </>
  );
}
function OutputDialog({
  run,
  close,
  notify,
}: {
  run: Run | null;
  close: () => void;
  notify: (s: string) => void;
}) {
  return (
    <Dialog
      open={!!run}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <DialogContent className="ws-dialog ws-output-dialog">
        <DialogHeader>
          <DialogTitle>{run?.title}</DialogTitle>
          <DialogDescription>
            {run?.mode} · Brief v{run?.revision} · Human review required
          </DialogDescription>
        </DialogHeader>
        <pre>{run?.text}</pre>
        <div className="ws-actions">
          <Button
            variant="outline"
            onClick={() => run && void copy(run.text, notify)}
          >
            <Clipboard /> Copy
          </Button>
          <Button
            onClick={() =>
              run &&
              saveFile(`avalon-${run.agent}.md`, run.text, "text/markdown")
            }
          >
            <Download /> Download Markdown
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentStudio({ c, update, notify }: Actions) {
  const [filter, setFilter] = useState("All"),
    [editing, setEditing] = useState<string | null>(null);
  const items = c.content.filter(
    (x) => filter === "All" || x.status === filter,
  );
  return (
    <>
      <PanelHead
        eyebrow="03 / EDITORIAL SYSTEM"
        title="One idea. Many useful stories."
        description="Build a 24-day starter calendar from your brief, adapt every item, and record approval. Dates are planning dates; nothing is posted automatically."
      >
        <Button
          onClick={() => {
            if (c.content.length > 188) {
              notify(
                "Calendar limit reached. Export before adding more items.",
              );
              return;
            }
            update(
              { content: [...c.content, ...contentCalendar(c)] },
              "Added 12 content drafts from shared brief",
            );
            notify(
              "12 editable drafts added. Replace scaffolding with final copy before approval.",
            );
          }}
        >
          <Plus /> Build 12-item calendar
        </Button>
      </PanelHead>
      <div className="ws-toolbar">
        <Pick
          label="Filter content status"
          value={filter}
          options={["All", "Draft", "In review", "Approved"]}
          onChange={setFilter}
        />
        <Button
          variant="outline"
          disabled={!c.content.length}
          onClick={() =>
            saveFile(
              "avalon-content-calendar.csv",
              csv([
                [
                  "Date",
                  "Channel",
                  "Title",
                  "Copy",
                  "Status",
                  "Brief revision",
                ],
                ...c.content.map((x) => [
                  x.date,
                  x.channel,
                  x.title,
                  x.copy,
                  x.status,
                  x.revision,
                ]),
              ]),
              "text/csv",
            )
          }
        >
          <Download /> Export calendar
        </Button>
      </div>
      {!items.length ? (
        <Empty
          title="A calendar with a purpose."
          description="Generate starter items or change the status filter. Each draft retains the brief revision it came from."
        />
      ) : (
        <div className="ws-content-grid">
          {items.map((item) => (
            <article className="ws-card" key={item.id}>
              <header>
                <span>
                  {item.date || "Unscheduled"} · {item.channel}
                </span>
                <span
                  className={`ws-status ${item.revision !== c.revision ? "ws-stale" : ""}`}
                >
                  {item.revision !== c.revision ? "Older brief" : item.status}
                </span>
              </header>
              {editing === item.id ? (
                <>
                  <Field label="Editorial title">
                    <Input
                      maxLength={180}
                      value={item.title}
                      onChange={(e) =>
                        update(
                          {
                            content: c.content.map((x) =>
                              x.id === item.id
                                ? {
                                    ...x,
                                    title: e.target.value,
                                    status: "Draft",
                                  }
                                : x,
                            ),
                          },
                          "Edited content title",
                        )
                      }
                    />
                  </Field>
                  <Field label="Post copy">
                    <Textarea
                      rows={8}
                      maxLength={5000}
                      value={item.copy}
                      onChange={(e) =>
                        update(
                          {
                            content: c.content.map((x) =>
                              x.id === item.id
                                ? {
                                    ...x,
                                    copy: e.target.value,
                                    status: "Draft",
                                  }
                                : x,
                            ),
                          },
                          "Edited content draft",
                        )
                      }
                    />
                  </Field>
                  <Field label="Planning date">
                    <Input
                      type="date"
                      value={item.date}
                      onChange={(e) =>
                        update(
                          {
                            content: c.content.map((x) =>
                              x.id === item.id
                                ? {
                                    ...x,
                                    date: e.target.value,
                                    status: "Draft",
                                  }
                                : x,
                            ),
                          },
                          "Rescheduled content",
                        )
                      }
                    />
                  </Field>
                  <Button variant="outline" onClick={() => setEditing(null)}>
                    Done editing
                  </Button>
                </>
              ) : (
                <>
                  <h3>{item.title}</h3>
                  <p className="ws-preserve">{item.copy}</p>
                  <button
                    className="ws-text-button"
                    onClick={() => setEditing(item.id)}
                  >
                    Edit draft <ArrowUpRight />
                  </button>
                </>
              )}
              <div className="ws-actions">
                <Pick
                  label={`Status for ${item.title}`}
                  value={item.status}
                  options={["Draft", "In review", "Approved"]}
                  onChange={(v) => {
                    if (v === "Approved" && item.revision !== c.revision) {
                      notify(
                        "Refresh this item against the current brief before approving.",
                      );
                      return;
                    }
                    update(
                      {
                        content: c.content.map((x) =>
                          x.id === item.id
                            ? { ...x, status: v as typeof x.status }
                            : x,
                        ),
                      },
                      `Content moved to ${v}`,
                    );
                  }}
                />
                {item.revision !== c.revision && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      update(
                        {
                          content: c.content.map((x) =>
                            x.id === item.id
                              ? { ...x, revision: c.revision, status: "Draft" }
                              : x,
                          ),
                        },
                        "Reviewed content against current brief",
                      )
                    }
                  >
                    Mark re-reviewed
                  </Button>
                )}
                <RemoveRecord
                  label="content item"
                  onRemove={() =>
                    update(
                      { content: c.content.filter((x) => x.id !== item.id) },
                      "Removed content item",
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function Production({ c, update, notify }: Actions) {
  const [task, setTask] = useState("");
  return (
    <>
      <PanelHead
        eyebrow="04 / FROM TREATMENT TO DELIVERY"
        title="Make the idea producible."
        description="A practical shot plan, versioning matrix and owned delivery board, linked to the current campaign."
      />
      <div className="ws-production-banner">
        <Image
          sizes="(max-width: 800px) 100vw, 70vw"
          src="/images/commercial-production.webp"
          alt="Synthetic concept image of a commercial production set"
          width={1200}
          height={675}
        />
        <div>
          <span className="ws-eyebrow">PRODUCTION ALLOWANCE</span>
          <strong>{money(c.brief.productionCost)}</strong>
          <p>
            Capture · post · rights · adaptations
            <br />
            All supplier costs require confirmation.
          </p>
          <small>AI-generated concept image</small>
        </div>
      </div>
      <div className="ws-two">
        <section className="ws-card">
          <h3>35-second master shot plan</h3>
          {SHOTS.map((s, i) => (
            <div className="ws-shot" key={s.title}>
              <span>
                0{i + 1}
                <b>{s.seconds}s</b>
              </span>
              <div>
                <h4>{s.title}</h4>
                <p>{s.direction}</p>
                <small>{s.deliverables}</small>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              saveFile(
                "avalon-shot-list.csv",
                csv([
                  ["Shot", "Seconds", "Direction", "Deliverables"],
                  ...SHOTS.map((s) => [
                    s.title,
                    s.seconds,
                    s.direction,
                    s.deliverables,
                  ]),
                ]),
                "text/csv",
              )
            }
          >
            <Download /> Export shot list
          </Button>
        </section>
        <section className="ws-card">
          <h3>Delivery specifications</h3>
          <div className="ws-formats">
            {[
              ["16:9", "Landscape master", "1920 × 1080"],
              ["9:16", "Vertical adaptation", "1080 × 1920"],
              ["1:1", "Square cutdown", "1080 × 1080"],
              ["4:5", "Feed adaptation", "1080 × 1350"],
            ].map(([ratio, title, size]) => (
              <div key={ratio}>
                <b>{ratio}</b>
                <h4>{title}</h4>
                <p>{size}</p>
              </div>
            ))}
          </div>
          <p className="ws-note">
            Internal working presets, not live platform specifications. Confirm
            placement requirements at booking. Deliver captions, transcript,
            usage record, source masters and a clean export.
          </p>
          <Button
            onClick={() => {
              const titles = [
                "Confirm treatment, shot list and scope",
                "Clear locations, talent, music and usage",
                "Capture approved master and stills",
                "Complete edit, colour and sound",
                "Prepare captions, transcript and format variants",
                "Review proof, brand and accessibility",
                "Obtain client sign-off and deliver masters",
              ];
              const existing = new Set(c.tasks.map((t) => t.title));
              const additions = titles
                .filter((t) => !existing.has(t))
                .map((title) => ({
                  id: uid(),
                  title,
                  owner: "",
                  due: "",
                  done: false,
                }));
              update(
                { tasks: [...c.tasks, ...additions].slice(0, 200) },
                "Added production delivery checklist",
              );
              notify(
                `${additions.length} production tasks added; duplicates skipped.`,
              );
            }}
          >
            <Plus /> Create production tasks
          </Button>
        </section>
      </div>
      <section className="ws-card">
        <h3>
          Delivery board · {c.tasks.filter((t) => t.done).length}/
          {c.tasks.length} complete
        </h3>
        <form
          className="ws-inline-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (task.trim() && c.tasks.length < 200) {
              update(
                {
                  tasks: [
                    ...c.tasks,
                    {
                      id: uid(),
                      title: task.trim(),
                      owner: "",
                      due: "",
                      done: false,
                    },
                  ],
                },
                "Added delivery task",
              );
              setTask("");
            }
          }}
        >
          <Input
            aria-label="New delivery task"
            maxLength={300}
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="Add a delivery task…"
          />
          <Button type="submit">
            <Plus /> Add
          </Button>
        </form>
        <div className="ws-task-list">
          {c.tasks.map((t) => (
            <div key={t.id}>
              <Checkbox
                aria-label={`Complete ${t.title}`}
                checked={t.done}
                onCheckedChange={(v) =>
                  update(
                    {
                      tasks: c.tasks.map((x) =>
                        x.id === t.id ? { ...x, done: v === true } : x,
                      ),
                    },
                    `${v ? "Completed" : "Reopened"} ${t.title}`,
                  )
                }
              />
              <b className={t.done ? "ws-done" : ""}>{t.title}</b>
              <Input
                aria-label={`Owner for ${t.title}`}
                maxLength={100}
                placeholder="Assign owner"
                value={t.owner}
                onChange={(e) =>
                  update(
                    {
                      tasks: c.tasks.map((x) =>
                        x.id === t.id ? { ...x, owner: e.target.value } : x,
                      ),
                    },
                    "Assigned task owner",
                  )
                }
              />
              <Input
                aria-label={`Due date for ${t.title}`}
                type="date"
                value={t.due}
                onChange={(e) =>
                  update(
                    {
                      tasks: c.tasks.map((x) =>
                        x.id === t.id ? { ...x, due: e.target.value } : x,
                      ),
                    },
                    "Changed task due date",
                  )
                }
              />
              <RemoveRecord
                label="delivery task"
                onRemove={() =>
                  update(
                    { tasks: c.tasks.filter((x) => x.id !== t.id) },
                    "Removed delivery task",
                  )
                }
              />
            </div>
          ))}
        </div>
        {!c.tasks.length && (
          <p>No tasks yet. Create the production checklist or add your own.</p>
        )}
      </section>
    </>
  );
}

function MediaLab({ c, update }: Actions) {
  const [scenario, setScenario] = useState<"base" | "conservative" | "upside">(
      "base",
    ),
    f = forecast(c, scenario);
  return (
    <>
      <PanelHead
        eyebrow="05 / UNIT ECONOMICS"
        title="See what the investment must do."
        description="Change your actual planning assumptions; press Enter or leave a numeric field to apply it. Every calculation reconciles with the shared budget. These are scenarios, not performance promises."
      />
      <div className="ws-toolbar">
        <Pick
          label="Scenario"
          value={scenario}
          options={[
            {
              value: "conservative",
              label: "Conservative · CPC +25%, CVR −25%",
            },
            { value: "base", label: "Base · your assumptions" },
            { value: "upside", label: "Upside · CPC −20%, CVR +25%" },
          ]}
          onChange={(v) => setScenario(v as typeof scenario)}
        />
        <Button
          variant="outline"
          disabled={f.invalidBudget}
          onClick={() =>
            saveFile(
              "avalon-media-plan.csv",
              csv([
                ["Scenario", scenario],
                ["Total campaign investment CAD", c.brief.budget],
                ["Agency CAD", c.brief.agencyFee],
                ["Production/other CAD", c.brief.productionCost],
                [
                  "Channel",
                  "Allocation CAD",
                  "Assumed CPC",
                  "Base CVR %",
                  "Modelled clicks",
                  "Modelled conversions",
                  "Modelled revenue",
                ],
                ...f.rows.map((r) => [
                  r.channel,
                  r.allocation.toFixed(2),
                  r.cpc,
                  r.cvr,
                  r.clicks.toFixed(1),
                  r.conversions.toFixed(1),
                  r.revenue.toFixed(2),
                ]),
              ]),
              "text/csv",
            )
          }
        >
          <Download /> Export model
        </Button>
      </div>
      {f.invalidBudget && (
        <div className="ws-alert" role="alert">
          Agency and production costs exceed the total budget. This plan is
          infeasible; revise the shared brief before making a media commitment.
        </div>
      )}
      {f.unallocated > 0 && (
        <div className="ws-alert">
          All channel weights are zero. {money(f.unallocated)} remains
          unallocated.
        </div>
      )}
      <div className="ws-metrics">
        <Metric
          label="Available media"
          value={money(f.spend)}
          note={`${money(f.dailySpend)} modelled daily pace`}
        />
        <Metric
          label={
            c.brief.objective === "sales"
              ? "Modelled purchases"
              : "Modelled leads"
          }
          value={num(f.conversions, 1)}
          note="From spend ÷ CPC × conversion rate"
        />
        <Metric
          label="Media ROAS"
          value={f.roas === null ? "—" : `${num(f.roas, 2)}×`}
          note="Revenue ÷ media spend; not profit"
        />
        <Metric
          label="Net campaign contribution"
          value={money(f.invalidBudget ? null : f.contribution)}
          note="Gross profit minus full campaign cost"
        />
      </div>
      <section className="ws-card">
        <h3>Editable channel model</h3>
        <p>
          Weights are normalized to 100%. CPC and conversion rates are user
          assumptions—not market benchmarks.{" "}
          {c.brief.objective === "sales"
            ? "A conversion is treated as a purchase."
            : `A ${c.brief.leadToSale}% lead-to-customer rate is applied.`}
        </p>
        <div className="ws-table-wrap">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Weight</th>
                <th>CPC · CAD</th>
                <th>Conversion · %</th>
                <th>Allocation</th>
                <th>Conversions</th>
              </tr>
            </thead>
            <tbody>
              {f.rows.map((row, i) => (
                <tr key={i}>
                  <td>
                    <Pick
                      label={`Channel ${i + 1}`}
                      value={row.channel}
                      options={CHANNELS}
                      onChange={(v) =>
                        update(
                          {
                            media: c.media.map((x, j) =>
                              i === j
                                ? { ...x, channel: v as typeof x.channel }
                                : x,
                            ),
                          },
                          "Changed channel",
                          true,
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberField
                      label={`${row.channel} weight`}
                      max={100}
                      value={row.weight}
                      onChange={(v) =>
                        update(
                          {
                            media: c.media.map((x, j) =>
                              i === j ? { ...x, weight: v } : x,
                            ),
                          },
                          "Changed allocation",
                          true,
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberField
                      label={`${row.channel} CPC`}
                      min={0.01}
                      max={10000}
                      step={0.1}
                      value={row.cpc}
                      onChange={(v) =>
                        update(
                          {
                            media: c.media.map((x, j) =>
                              i === j ? { ...x, cpc: v } : x,
                            ),
                          },
                          "Changed CPC assumption",
                          true,
                        )
                      }
                    />
                  </td>
                  <td>
                    <NumberField
                      label={`${row.channel} CVR`}
                      max={100}
                      step={0.1}
                      value={row.cvr}
                      onChange={(v) =>
                        update(
                          {
                            media: c.media.map((x, j) =>
                              i === j ? { ...x, cvr: v } : x,
                            ),
                          },
                          "Changed conversion assumption",
                          true,
                        )
                      }
                    />
                  </td>
                  <td>
                    <b>{money(row.allocation)}</b>
                  </td>
                  <td>
                    {num(row.conversions, 1)}
                    {c.media.length > 1 && (
                      <RemoveRecord
                        label={`${row.channel} channel row`}
                        onRemove={() =>
                          update(
                            { media: c.media.filter((_, j) => j !== i) },
                            "Removed channel row",
                          )
                        }
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button
          variant="outline"
          disabled={c.media.length >= 6}
          onClick={() =>
            update(
              {
                media: [
                  ...c.media,
                  { channel: "YouTube", weight: 10, cpc: 2, cvr: 2 },
                ],
              },
              "Added channel",
              true,
            )
          }
        >
          <Plus /> Add channel
        </Button>
      </section>
      <div className="ws-two">
        <section className="ws-card">
          <h3>Acquisition economics</h3>
          <dl className="ws-ledger">
            <dt>Modelled customers</dt>
            <dd>{num(f.customers, 1)}</dd>
            <dt>Revenue</dt>
            <dd>{money(f.revenue)}</dd>
            <dt>Gross profit before marketing</dt>
            <dd>{money(f.grossProfit)}</dd>
            <dt>Media acquisition cost / customer</dt>
            <dd>{money(f.cpa)}</dd>
            <dt>All-in acquisition cost / customer</dt>
            <dd>{money(f.fullyLoadedCac)}</dd>
            <dt>Break-even customers</dt>
            <dd>{num(f.breakEvenCustomers, 1)}</dd>
          </dl>
        </section>
        <section className="ws-card ws-dark">
          <h3>Read the assumptions, not just the number.</h3>
          <p>
            Conservative and upside scenarios move two inputs together; they are
            not statistical confidence intervals. Costs exclude tax. Gross
            margin should reflect variable fulfilment costs. Validate actual
            lead quality and revenue before scaling.
          </p>
          <p>
            Zero denominators appear as “—”, never invented returns. A zero
            allocation does not imply that a channel is free.
          </p>
        </section>
      </div>
    </>
  );
}

function SearchStudio({ c, update, notify }: Actions) {
  const [source, setSource] = useState("google"),
    [medium, setMedium] = useState("cpc"),
    [campaign, setCampaign] = useState("launch"),
    [variant, setVariant] = useState("");
  const url = buildUtm(c.brief.website, source, medium, campaign, variant),
    checks = auditWeb(c.web);
  return (
    <>
      <PanelHead
        eyebrow="06 / SEARCH, ANSWERS & CONVERSION"
        title="Make the next step easier to find."
        description="Audit supplied page copy, clarify the offer and build traceable campaign links. This tool does not crawl a website or claim live ranking data."
      />
      <div className="ws-two">
        <section className="ws-card">
          <h3>Page copy workbench</h3>
          {(
            [
              ["title", "Page title"],
              ["description", "Search description"],
              ["heading", "Primary heading"],
              ["body", "Main page copy"],
              ["alt", "Meaningful image alt text"],
              ["cta", "Call to action"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              {key === "body" ? (
                <Textarea
                  rows={8}
                  maxLength={20000}
                  value={c.web[key]}
                  onChange={(e) =>
                    update(
                      { web: { ...c.web, [key]: e.target.value } },
                      "Edited page copy",
                    )
                  }
                />
              ) : (
                <Input
                  maxLength={key === "description" ? 2000 : 500}
                  value={c.web[key]}
                  onChange={(e) =>
                    update(
                      { web: { ...c.web, [key]: e.target.value } },
                      "Edited page copy",
                    )
                  }
                />
              )}
            </Field>
          ))}
        </section>
        <section className="ws-card">
          <h3>
            Editorial checks · {checks.filter((x) => x.passed).length}/
            {checks.length}
          </h3>
          {checks.map((check) => (
            <div className="ws-audit-check" key={check.title}>
              <span className={check.passed ? "ws-pass" : "ws-review"}>
                {check.passed ? <Check /> : <Search />}
              </span>
              <div>
                <h4>{check.title}</h4>
                <p>{check.note}</p>
                <small>
                  {check.passed ? "Heuristic met" : "Review needed"}
                </small>
              </div>
            </div>
          ))}
          <p className="ws-note">
            Not an accessibility, SEO or legal certification. Human evaluation
            remains required.
          </p>
        </section>
      </div>
      <section className="ws-card">
        <h3>Campaign URL builder</h3>
        <p>
          Destination comes from the shared brief. Existing query parameters and
          fragments are preserved.
        </p>
        <div className="ws-form-grid">
          {[
            ["Source", source, setSource],
            ["Medium", medium, setMedium],
            ["Campaign", campaign, setCampaign],
            ["Content variant", variant, setVariant],
          ].map(([label, value, set]) => (
            <Field key={String(label)} label={String(label)}>
              <Input
                maxLength={120}
                value={String(value)}
                onChange={(e) => (set as (v: string) => void)(e.target.value)}
              />
            </Field>
          ))}
        </div>
        <pre className="ws-url">
          {url ||
            "Add a valid website to Shared brief, plus source, medium and campaign."}
        </pre>
        <Button disabled={!url} onClick={() => url && void copy(url, notify)}>
          <Clipboard /> Copy tracked URL
        </Button>
      </section>
    </>
  );
}

function Experiments({ c, update }: Actions) {
  const e = c.experiment,
    m = experimentMath(e);
  const set = (key: keyof typeof e, value: string | number) =>
    update({ experiment: { ...e, [key]: value } }, "Updated experiment design");
  return (
    <>
      <PanelHead
        eyebrow="07 / LEARN BEFORE YOU SCALE"
        title="Give the next decision evidence."
        description="Plan a two-arm conversion experiment, record results and inspect uncertainty. No automated winner declarations."
      />
      <section className="ws-card">
        <Field label="Testable hypothesis">
          <Textarea
            maxLength={2000}
            value={e.hypothesis}
            onChange={(v) => set("hypothesis", v.target.value)}
            placeholder="Changing [one thing] will improve [primary metric] for [audience] because [reason]."
          />
        </Field>
        <div className="ws-form-grid">
          <NumberField
            label="Baseline conversion rate · %"
            min={0.01}
            max={99}
            step={0.1}
            value={e.baseline}
            onChange={(v) => set("baseline", v)}
          />
          <NumberField
            label="Minimum detectable relative lift · %"
            min={1}
            max={500}
            value={e.lift}
            onChange={(v) => set("lift", v)}
          />
          <NumberField
            label="Eligible visitors per day · both arms"
            min={1}
            value={e.dailyVisitors}
            onChange={(v) => set("dailyVisitors", Math.round(v))}
          />
        </div>
      </section>
      <div className="ws-metrics">
        <Metric
          label="Required visitors per arm"
          value={num(m.sample)}
          note="Normal approximation · 50/50 split"
        />
        <Metric
          label="Estimated traffic days"
          value={num(m.days)}
          note="Round up to complete business cycles"
        />
        <Metric
          label="Design confidence"
          value="95%"
          note="Two-sided fixed-horizon test"
        />
        <Metric
          label="Statistical power"
          value="80%"
          note="For your specified minimum lift"
        />
      </div>
      {!m.sample && (
        <div className="ws-alert">
          The target rate must be below 100%. Reduce the baseline or target
          lift.
        </div>
      )}
      <section className="ws-card">
        <h3>Observed results</h3>
        <div className="ws-form-grid">
          {(
            [
              ["controlVisitors", "Control visitors"],
              ["controlConversions", "Control conversions"],
              ["variantVisitors", "Variant visitors"],
              ["variantConversions", "Variant conversions"],
            ] as const
          ).map(([key, label]) => (
            <NumberField
              key={key}
              label={label}
              value={e[key]}
              onChange={(v) => set(key, Math.round(v))}
            />
          ))}
        </div>
        {!m.valid ? (
          <p className="ws-alert">
            Conversions cannot exceed visitors. Correct the inputs.
          </p>
        ) : (
          <>
            <dl className="ws-ledger">
              <dt>Control conversion rate</dt>
              <dd>{m.rateA === null ? "—" : `${num(m.rateA * 100, 2)}%`}</dd>
              <dt>Variant conversion rate</dt>
              <dd>{m.rateB === null ? "—" : `${num(m.rateB * 100, 2)}%`}</dd>
              <dt>Absolute difference</dt>
              <dd>
                {m.difference === null
                  ? "—"
                  : `${num(m.difference * 100, 2)} percentage points`}
              </dd>
              <dt>Approximate 95% difference interval</dt>
              <dd>
                {m.sufficient && m.interval
                  ? `${num(m.interval[0] * 100, 2)} to ${num(m.interval[1] * 100, 2)} pp`
                  : "More observations required"}
              </dd>
            </dl>
            <p className="ws-note">
              {m.sufficient
                ? "Planned sample reached. Interpret the interval with your pre-agreed protocol and guardrail metrics."
                : "Do not call a winner: planned sample or minimum event counts have not been reached."}{" "}
              This independent-proportion approximation does not adjust for
              repeated peeking, multiple tests, clusters or tracking error.
            </p>
          </>
        )}
      </section>
    </>
  );
}

function Proof({ c, update, notify }: Actions) {
  const r = readiness(c);
  return (
    <>
      <PanelHead
        eyebrow="08 / RELEASE WITH EVIDENCE"
        title="Good work should stand up to scrutiny."
        description="Record evidence, resolve blockers and retain accountable decisions. Checklist completion is self-reported—not automated certification."
      />
      <div className="ws-two">
        <section className="ws-card">
          <h3>Release checklist · {r.score}%</h3>
          <div className="ws-check-list">
            {CHECKS.map(([id, label, critical]) => (
              <label key={id}>
                <Checkbox
                  checked={!!c.checks[id]}
                  onCheckedChange={(v) =>
                    update(
                      { checks: { ...c.checks, [id]: v === true } },
                      `${v ? "Confirmed" : "Reopened"} ${label}`,
                    )
                  }
                />
                <span>
                  {label}
                  {critical && <small>Required before launch</small>}
                </span>
              </label>
            ))}
          </div>
        </section>
        <section className="ws-card ws-dark">
          <span className="ws-eyebrow">LAUNCH GATE</span>
          <h3>
            {r.blockers.length
              ? `${r.blockers.length} reasons to pause.`
              : "Ready for final human authorization."}
          </h3>
          <ul className="ws-blockers">
            {r.blockers.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p>
            No checklist approval sends a campaign live. The campaign owner
            remains responsible for publication, spend and legal review.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              saveFile(
                "avalon-launch-review.md",
                runAgent(c, "review").text,
                "text/markdown",
              );
              notify(
                "Launch review downloaded with current blockers and evidence status.",
              );
            }}
          >
            <Download /> Export release review
          </Button>
        </section>
      </div>
      <section className="ws-card">
        <div className="ws-panel-head">
          <div>
            <h3>Claims & evidence ledger</h3>
            <p>
              A claim is marked reviewed only when it has a source and an
              accountable owner.
            </p>
          </div>
          <Button
            disabled={c.evidence.length >= 100}
            onClick={() =>
              update(
                {
                  evidence: [
                    ...c.evidence,
                    {
                      id: uid(),
                      claim: "",
                      source: "",
                      owner: "",
                      verified: false,
                    },
                  ],
                },
                "Added evidence record",
              )
            }
          >
            <Plus /> Add evidence
          </Button>
        </div>
        {c.evidence.map((e) => (
          <div className="ws-evidence" key={e.id}>
            <Field label="Claim or usage right">
              <Input
                maxLength={1000}
                value={e.claim}
                onChange={(v) =>
                  update(
                    {
                      evidence: c.evidence.map((x) =>
                        x.id === e.id
                          ? { ...x, claim: v.target.value, verified: false }
                          : x,
                      ),
                      checks: { ...c.checks, claims: false },
                    },
                    "Changed evidence claim",
                  )
                }
              />
            </Field>
            <Field label="Source URL or document reference">
              <Input
                maxLength={1000}
                value={e.source}
                onChange={(v) =>
                  update(
                    {
                      evidence: c.evidence.map((x) =>
                        x.id === e.id
                          ? { ...x, source: v.target.value, verified: false }
                          : x,
                      ),
                      checks: { ...c.checks, claims: false },
                    },
                    "Changed evidence source",
                  )
                }
              />
            </Field>
            <Field label="Review owner">
              <Input
                maxLength={100}
                value={e.owner}
                onChange={(v) =>
                  update(
                    {
                      evidence: c.evidence.map((x) =>
                        x.id === e.id
                          ? { ...x, owner: v.target.value, verified: false }
                          : x,
                      ),
                      checks: { ...c.checks, claims: false },
                    },
                    "Changed evidence owner",
                  )
                }
              />
            </Field>
            <label className="ws-inline-check">
              <Checkbox
                disabled={
                  !e.claim.trim() || !e.source.trim() || !e.owner.trim()
                }
                checked={e.verified}
                onCheckedChange={(v) =>
                  update(
                    {
                      evidence: c.evidence.map((x) =>
                        x.id === e.id ? { ...x, verified: v === true } : x,
                      ),
                    },
                    "Updated evidence review",
                  )
                }
              />{" "}
              Reviewed by owner
            </label>
            <RemoveRecord
              label="evidence record"
              onRemove={() =>
                update(
                  { evidence: c.evidence.filter((x) => x.id !== e.id) },
                  "Removed evidence record",
                )
              }
            />
          </div>
        ))}
        {!c.evidence.length && (
          <p className="ws-note">
            No evidence records supplied. Add supporting material before
            publishing factual claims.
          </p>
        )}
      </section>
    </>
  );
}

function Library({ c, update, notify, go }: Actions) {
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [filter, setFilter] = useState(""),
    [status, setStatus] = useState("All statuses"),
    [specialist, setSpecialist] = useState("all"),
    [latestOnly, setLatestOnly] = useState(true);
  const latest = latestAgentRuns(c);
  const latestIds = new Set(latest.map((run) => run.id));
  const currentIds = new Set(latest.filter((run) => isRunCurrent(c, run)).map((run) => run.id));
  const selected = c.runs.find((run) => run.id === selectedId) || null;
  const runs = c.runs.filter((run) => {
    const isCurrent = currentIds.has(run.id);
    return (!latestOnly || latestIds.has(run.id)) && (specialist === "all" || run.agent === specialist) && `${run.title} ${run.text}`.toLowerCase().includes(filter.toLowerCase()) && (status === "All statuses" || status === "Approved" && isCurrent && run.approved || status === "Needs review" && isCurrent && !run.approved || status === "Needs refresh" && !isCurrent);
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const groups = [
    { title: "Current drafts to review", note: "Read, refine and approve the work that will guide the campaign.", runs: runs.filter((run) => currentIds.has(run.id) && !run.approved) },
    { title: "Approved at this brief", note: "Human-reviewed outputs for the current campaign revision.", runs: runs.filter((run) => currentIds.has(run.id) && run.approved) },
    { title: "Earlier or superseded campaign context", note: "Retained for reference. Refresh against the current brief and upstream handoffs before approval.", runs: runs.filter((run) => !currentIds.has(run.id)) },
  ];
  return <>
    <PanelHead eyebrow="OUTPUTS WITH LINEAGE" title="Good work deserves a clear trail." description="Find every specialist output, inspect its source brief and keep review decisions close to the work. The latest edition of each specialist is shown first.">
      <Button variant="outline" onClick={() => { saveFile("avalon-campaign-review.md", campaignReport(c), "text/markdown"); notify("Full campaign report exported, including the original brief, outputs, evidence and decisions."); }}><Download /> Campaign report</Button>
    </PanelHead>
    <div className="ws-library-summary"><span><b>{c.runs.length}</b> saved outputs</span><span><b>{c.runs.filter((run) => latestIds.has(run.id)).length}</b> latest editions</span><span><b>{c.runs.filter((run) => latestIds.has(run.id) && run.approved && currentIds.has(run.id)).length}</b> current approvals</span><button onClick={() => go("workflows")}>Create more work <ArrowRight /></button></div>
    <section className="ws-card ws-library-controls">
      <div className="ws-toolbar"><div className="ws-search-field"><Search /><Input aria-label="Search saved outputs" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search titles and output content…" /></div><Pick label="Filter output status" value={status} options={["All statuses", "Needs review", "Approved", "Needs refresh"]} onChange={setStatus} /><Pick label="Filter output specialist" value={specialist} options={[{ value: "all", label: "All specialists" }, ...AGENTS.map((agent) => ({ value: agent.id, label: agent.name }))]} onChange={setSpecialist} /></div>
      <div className="ws-library-options"><label className="ws-inline-check"><Checkbox checked={latestOnly} onCheckedChange={(v) => setLatestOnly(v === true)} />Latest edition of each specialist only</label><span>{runs.length} matching outputs</span><Button variant="outline" disabled={!runs.length} onClick={() => saveFile("avalon-selected-playbook.md", `# ${c.name} · Selected outputs\n\n${runs.map((run) => `${run.text}\n\nReview status: ${!currentIds.has(run.id) ? "Needs refresh" : run.approved ? "Approved by user" : "Draft"}`).join("\n\n---\n\n")}`, "text/markdown")}><Download /> Export this view</Button></div>
    </section>
    {!runs.length ? <Empty title={c.runs.length ? "No outputs match these filters." : "Your next good idea belongs here."} description={c.runs.length ? "Reset the filters, or include previous editions to inspect the full history." : "Run a connected workflow or individual specialist to create your first reviewable output."} action={<Button onClick={() => { if (!c.runs.length) go("workflows"); else { setFilter(""); setStatus("All statuses"); setSpecialist("all"); setLatestOnly(false); } }}>{c.runs.length ? "Reset filters" : "Open workflows"}<ArrowRight /></Button>} /> : groups.filter((group) => group.runs.length).map((group) => <section key={group.title} className="ws-library-group"><div className="ws-library-group-head"><h3>{group.title}<span>{group.runs.length}</span></h3><p>{group.note}</p></div><div className="ws-library-list">{group.runs.map((run) => <article className="ws-card" key={run.id}><div className="ws-output-icon">{run.approved && currentIds.has(run.id) ? <CircleCheck /> : <FileText />}</div><div className="ws-output-description"><span className="ws-eyebrow">{run.mode} · {new Date(run.createdAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}</span><h3>{run.title}</h3><p>Brief v{run.revision} · {AGENTS.find((agent) => agent.id === run.agent)?.room}{run.model ? ` · ${run.model}` : ""}</p></div><div className="ws-actions"><Button variant="outline" onClick={() => setSelectedId(run.id)}>Read output <ArrowUpRight /></Button><Button disabled={!currentIds.has(run.id)} variant={run.approved ? "outline" : "default"} onClick={() => { try { const reviewed = approveRun(c, run.id, !run.approved); update({ runs: reviewed.runs }, `${run.approved ? "Reopened" : "Approved"} ${run.title}`); notify(run.approved ? "Output reopened for review." : "Approval recorded for this output and its campaign context."); } catch (error) { notify(error instanceof Error ? error.message : "Refresh the current output before approval."); } }}><CheckCheck />{run.approved && currentIds.has(run.id) ? "Reopen" : "Approve draft"}</Button><RemoveRecord label="specialist output" onRemove={() => update({ runs: c.runs.filter((item) => item.id !== run.id) }, "Removed specialist output")} /></div></article>)}</div></section>)}
    <OutputDialog run={selected} close={() => setSelectedId(null)} notify={notify} />
  </>;
}
