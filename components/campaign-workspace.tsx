"use client";
import Image from "next/image";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
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

const STORAGE = "kingxford-workspace-v2";
const views = [
  ["overview", "Overview", LayoutDashboard],
  ["brief", "Shared brief", FileText],
  ["agents", "Specialists", Sparkles],
  ["content", "Content studio", BookOpen],
  ["production", "Production", Clapperboard],
  ["media", "Media lab", Megaphone],
  ["search", "Search & web", Search],
  ["experiments", "Experiments", FlaskConical],
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
        }),
      )
      .catch(() => {});
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
  async function importBackup(file: File) {
    try {
      if (file.size > 50000000)
        throw new Error("Backup must be smaller than 50 MB.");
      const value = workspaceSchema.safeParse(JSON.parse(await file.text()));
      if (!value.success)
        throw new Error("This file is not a valid KINGXFORD v2 backup.");
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
            "kingxford-before-cloud-load.json",
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
      aria-label="KINGXFORD campaign workspace"
    >
      <Tabs
        value={view}
        onValueChange={(v) => go(v as View)}
        className="ws-layout"
      >
        <aside className="ws-sidebar">
          <a href="/platform" className="ws-wordmark">
            <span>KX</span>
            <div>
              WORKSPACE<small>One brief. Every discipline.</small>
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
            <Button variant="outline" onClick={() => add()}>
              <Plus /> New campaign
            </Button>
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
              <span>KINGXFORD / {views.find(([id]) => id === view)?.[1]}</span>
              <b>{c.brief.brand || "Your next campaign"}</b>
            </div>
            <div className="ws-top-actions">
              <span className="ws-revision">Brief v{c.revision}</span>
              <Button
                variant="outline"
                onClick={() =>
                  saveFile(
                    "kingxford-workspace.json",
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
                    "kingxford-recovery.json",
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
          <div className="ws-body">
            <TabsContent value="overview">
              <Overview {...actions} />
            </TabsContent>
            <TabsContent value="brief">
              <BriefEditor {...actions} />
            </TabsContent>
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
                      "kingxford-workspace.json",
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
                <Button variant="outline" onClick={() => add(true)}>
                  Add example
                </Button>
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
                  ? capabilities.email || "Sign-in required"
                  : "Not configured"}
              </span>
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
                      Use an invited KINGXFORD account. Contact the agency to
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
                  ? "Gateway configured · account required"
                  : "Awaiting protected AI configuration"}
              </span>
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
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="ws-dialog">
          <DialogHeader>
            <DialogTitle>Delete this device campaign?</DialogTitle>
            <DialogDescription>
              This removes “{c.name}” from this browser. Export a backup first.
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
                const campaigns = state.campaigns.filter((x) => x.id !== c.id);
                if (!campaigns.length) campaigns.push(createCampaign());
                setState({ ...state, activeId: campaigns[0].id, campaigns });
                setConfirmDelete(false);
                notify(
                  storageBlocked.current
                    ? "Removed from memory only: device storage is blocked. Reload or clear browser site data to remove the saved copy."
                    : "Device campaign deleted. It can be restored only from an exported or cloud backup.",
                );
              }}
            >
              Delete device copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Overview({ c, go }: Actions) {
  const f = forecast(c),
    r = readiness(c),
    approved = c.runs.filter(
      (x) => x.approved && x.revision === c.revision,
    ).length;
  return (
    <>
      <div className="ws-hero">
        <div>
          <span className="ws-eyebrow">THE CONNECTED CAMPAIGN</span>
          <h1>
            Make the whole
            <br />
            agency move together.
          </h1>
          <p>
            One shared brief. Nine specialist planning engines. Every draft,
            decision and next action connected.
          </p>
          <div className="ws-actions">
            <Button onClick={() => go(c.brief.brand ? "agents" : "brief")}>
              {c.brief.brand
                ? "Run your specialists"
                : "Build your shared brief"}
              <ArrowRight />
            </Button>
            <button className="ws-text-button" onClick={() => go("library")}>
              Open your outputs <ArrowUpRight />
            </button>
          </div>
        </div>
        <div className="ws-orbit" aria-label="Campaign workflow">
          <span>01 / STRATEGY</span>
          <b>{c.brief.brand || "YOUR BRIEF"}</b>
          <div>
            <span>02 / CREATE</span>
            <ChevronRight />
            <span>03 / ACTIVATE</span>
          </div>
          <small>04 / MEASURE & IMPROVE</small>
        </div>
      </div>
      <div className="ws-metrics">
        <Metric
          label="Campaign investment"
          value={money(c.brief.budget)}
          note="Working assumption · excludes tax"
        />
        <Metric
          label="Available media"
          value={money(f.spend)}
          note={
            f.invalidBudget
              ? "Costs exceed budget"
              : "After agency and production"
          }
        />
        <Metric
          label="Current approved outputs"
          value={String(approved)}
          note={`${c.runs.length} saved specialist outputs`}
        />
        <Metric
          label="Launch checklist"
          value={`${r.score}%`}
          note={`${r.blockers.length} blockers to resolve`}
        />
      </div>
      <div className="ws-two">
        <section className="ws-card">
          <h3>The next useful decisions</h3>
          {!c.brief.brand ? (
            <button className="ws-decision" onClick={() => go("brief")}>
              <span>01</span>
              <div>
                <b>Complete the campaign context</b>
                <p>Brand, audience, offer and economics power every studio.</p>
              </div>
              <ArrowUpRight />
            </button>
          ) : null}
          <button className="ws-decision" onClick={() => go("agents")}>
            <span>02</span>
            <div>
              <b>
                {c.runs.length
                  ? "Review the specialists' work"
                  : "Build your first connected plan"}
              </b>
              <p>
                Save strategy, creative, production and measurement outputs.
              </p>
            </div>
            <ArrowUpRight />
          </button>
          <button className="ws-decision" onClick={() => go("proof")}>
            <span>03</span>
            <div>
              <b>
                {r.stale
                  ? `Refresh ${r.stale} outdated outputs`
                  : `Resolve ${r.blockers.length} launch blockers`}
              </b>
              <p>Brief changes invalidate prior approval assumptions.</p>
            </div>
            <ArrowUpRight />
          </button>
        </section>
        <section className="ws-card ws-dark">
          <span className="ws-eyebrow">ONE CONTEXT, EVERY ROOM</span>
          <h3>{c.brief.offer || "Start with the thing that must change."}</h3>
          <dl>
            <dt>Audience</dt>
            <dd>{c.brief.audience || "Not defined yet"}</dd>
            <dt>Market</dt>
            <dd>{c.brief.market}</dd>
            <dt>Campaign window</dt>
            <dd>
              {c.brief.weeks} weeks · brief revision {c.revision}
            </dd>
          </dl>
          <button className="ws-text-button" onClick={() => go("brief")}>
            Refine the shared brief <ArrowRight />
          </button>
        </section>
      </div>
      <PanelHead
        eyebrow="WORKING DISCIPLINES"
        title="Your agency, connected."
        description="Move directly into a specialist room. They all work from this campaign."
      />
      <div className="ws-room-grid">
        {views.slice(2, 9).map(([id, label, Icon]) => (
          <button key={id} onClick={() => go(id)}>
            <Icon />
            <h3>{label}</h3>
            <span>
              {id === "agents"
                ? "Nine accountable specialists"
                : id === "content"
                  ? "Draft, adapt and schedule"
                  : id === "production"
                    ? "Plan the capture and delivery"
                    : id === "media"
                      ? "Model economics and scenarios"
                      : id === "search"
                        ? "Inspect copy and build tracking"
                        : id === "experiments"
                          ? "Size a test and read results"
                          : "Evidence before activation"}
            </span>
            <ArrowUpRight />
          </button>
        ))}
      </div>
      <section className="ws-card ws-activity">
        <h3>Decision history</h3>
        {c.activity.length ? (
          c.activity.slice(0, 8).map((a) => (
            <div key={a.id}>
              <span>{new Date(a.at).toLocaleString("en-CA")}</span>
              <b>{a.action}</b>
            </div>
          ))
        ) : (
          <p>
            Your campaign history begins when you edit the brief or create work.
          </p>
        )}
      </section>
    </>
  );
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
    [selected, setSelected] = useState<Run | null>(null);
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
        title="Nine perspectives. One brief."
        description="Run transparent planning engines instantly. Configured AI specialists can deepen a draft, but never publish, spend, or approve on your behalf."
      >
        <Button
          disabled={!!busy}
          onClick={() => {
            if (!c.brief.brand || !c.brief.audience || !c.brief.offer) {
              notify("Complete the brand, audience and offer first.");
              go("brief");
              return;
            }
            const runs = AGENTS.map((a) => runAgent(c, a.id));
            update(
              { runs: [...runs, ...c.runs].slice(0, 100) },
              "Built connected nine-specialist campaign plan",
            );
            notify(
              "Nine specialist outputs saved to your library, all linked to the current brief.",
            );
          }}
        >
          Build connected plan <Sparkles />
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
      <div className="ws-agent-grid">
        {AGENTS.map((a, i) => {
          const previous = c.runs.find((r) => r.agent === a.id);
          return (
            <article className="ws-card" key={a.id}>
              <header>
                <span>
                  0{i + 1} / {a.room}
                </span>
                <Sparkles />
              </header>
              <h3>{a.name}</h3>
              <p>{a.role}.</p>
              <small>
                {previous
                  ? `Last output: brief v${previous.revision}${previous.revision !== c.revision ? " · refresh needed" : ""}`
                  : "Uses your current brief"}
              </small>
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
              saveFile(`kingxford-${run.agent}.md`, run.text, "text/markdown")
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
              "kingxford-content-calendar.csv",
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
                "kingxford-shot-list.csv",
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
              "kingxford-media-plan.csv",
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
                "kingxford-launch-review.md",
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

function Library({ c, update, notify }: Actions) {
  const [selected, setSelected] = useState<Run | null>(null),
    [filter, setFilter] = useState("");
  const runs = c.runs.filter((r) =>
    (r.title + " " + r.text).toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <>
      <PanelHead
        eyebrow="09 / OUTPUTS WITH LINEAGE"
        title="Keep the work. Keep the reasoning."
        description="Every specialist output records its mode, time and source brief. Older outputs remain visible but cannot be approved until refreshed."
      />
      <div className="ws-toolbar">
        <Input
          aria-label="Search saved outputs"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search outputs…"
        />
        <Button
          variant="outline"
          disabled={!c.runs.length}
          onClick={() =>
            saveFile(
              "kingxford-campaign-playbook.md",
              `# ${c.name}\n\n${c.runs.map((r) => `${r.text}\n\nApproval: ${r.approved && r.revision === c.revision ? "Approved" : "Draft / needs review"}`).join("\n\n---\n\n")}`,
              "text/markdown",
            )
          }
        >
          <Download /> Export playbook
        </Button>
      </div>
      {!runs.length ? (
        <Empty
          title="Your work has a home."
          description="Run a specialist to create your first output, or change your search."
        />
      ) : (
        <div className="ws-library-list">
          {runs.map((r) => (
            <article className="ws-card" key={r.id}>
              <div>
                <span className="ws-eyebrow">
                  {r.mode} · {new Date(r.createdAt).toLocaleDateString("en-CA")}
                </span>
                <h3>{r.title}</h3>
                <p>
                  Brief v{r.revision}
                  {r.revision !== c.revision
                    ? " · stale: regenerate from current brief"
                    : r.approved
                      ? " · approved"
                      : " · awaiting review"}
                  {r.model ? ` · ${r.model}` : ""}
                </p>
              </div>
              <div className="ws-actions">
                <Button variant="outline" onClick={() => setSelected(r)}>
                  Read output <ArrowUpRight />
                </Button>
                <Button
                  disabled={r.revision !== c.revision}
                  variant={r.approved ? "outline" : "default"}
                  onClick={() =>
                    update(
                      {
                        runs: c.runs.map((x) =>
                          x.id === r.id ? { ...x, approved: !x.approved } : x,
                        ),
                      },
                      `${r.approved ? "Reopened" : "Approved"} ${r.title}`,
                    )
                  }
                >
                  <CheckCheck />
                  {r.approved ? "Reopen" : "Approve draft"}
                </Button>
                <RemoveRecord
                  label="specialist output"
                  onRemove={() =>
                    update(
                      { runs: c.runs.filter((x) => x.id !== r.id) },
                      "Removed specialist output",
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      )}
      <OutputDialog
        run={selected}
        close={() => setSelected(null)}
        notify={notify}
      />
    </>
  );
}
