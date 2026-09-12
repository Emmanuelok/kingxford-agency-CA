'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowDownToLine, ArrowRight, Check, CheckCircle2, ChevronRight, Cloud, FileCheck2, FolderOpen, KeyRound, Link2, LoaderCircle, Package, RefreshCw, ShieldCheck, Upload, Users, X } from 'lucide-react';
import Account from '../presswerk/account';
import WorkspaceSettings from '../presswerk/workspace-settings';
import { useCloudWorkspace } from '../../lib/presswerk/use-cloud-workspace';
import { approveCloudProof, cloud, hydrateDesign, orderHistory, saveCloudProject, submitCloudOrder, transitionOrder, type CloudOrder, type Workspace } from '../../lib/presswerk/cloud';
import { money, products, type Design } from '../../lib/presswerk/catalog';
import { validateLocalDesign } from '../../lib/next/workspace-store';
import { preflightArtwork } from '../../lib/next/artwork';
import { DesignPreview } from './artwork';
import './cloud-workspace.css';

type ServiceStatus = { storage: boolean; orders: boolean; ai: boolean };
type Proof = { approved_at: string; approved_by: string };
type OrderEvent = { id: string; from_status: string | null; to_status: string; created_at: string };
const stages = ['Artwork review', 'Ready to produce', 'Printing', 'Finishing', 'Dispatched'];
const designKey = (design: Design) => `${design.id}:${design.version}`;
const dateLabel = (value: string) => new Date(value).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
const messageOf = (error: unknown) => error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : 'The request could not be completed.';

export default function CloudWorkspace({ activeDesign, onOpenDesign }: { activeDesign: Design; onOpenDesign: (design: Design) => void }) {
  const [services, setServices] = useState<ServiceStatus | null>(null);
  const [serviceError, setServiceError] = useState('');
  const [projects, setProjects] = useState<Design[]>([]);
  const [orders, setOrders] = useState<CloudOrder[]>([]);
  const [selected, setSelected] = useState<Design | null>(null);
  const [proofs, setProofs] = useState<Record<string, Proof>>({});
  const [reviewed, setReviewed] = useState(false);
  const [copyIntent, setCopyIntent] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [tab, setTab] = useState<'projects' | 'production' | 'team'>(() => new URLSearchParams(window.location.search).has('invite') ? 'team' : 'projects');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [history, setHistory] = useState<{ orderId: string; events: OrderEvent[] } | null>(null);
  const [invitation, setInvitation] = useState(() => new URLSearchParams(window.location.search).get('invite') || '');
  const alive = useRef(false);
  const operation = useRef(0);
  const locked = useRef(false);
  const selectionSerial = useRef(0);
  const uploaded = useRef<{ localId: string; cloudId: string } | null>(null);
  const requestKeys = useRef(new Map<string, string>());

  const account = useCloudWorkspace(data => {
    setProjects(data.projects);
    setOrders(data.orders);
  }, () => {
    operation.current += 1;
    locked.current = false;
    selectionSerial.current += 1;
    uploaded.current = null;
    requestKeys.current.clear();
    setProjects([]);
    setOrders([]);
    setSelected(null);
    setProofs({});
    setReviewed(false);
    setCopyIntent(false);
    setHistory(null);
    setBusy('');
    setError('');
    setNotice('');
  });

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    fetch('/api/print/status', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Team services could not be reached.'); return response.json(); })
      .then((data: ServiceStatus) => {
        if (alive.current) setServices({ storage: data.storage === true, orders: data.orders === true, ai: data.ai === true });
      })
      .catch(cause => { if (!controller.signal.aborted && alive.current) setServiceError(messageOf(cause)); });
    return () => { alive.current = false; controller.abort(); operation.current += 1; };
  }, []);

  const canEdit = account.role === 'owner' || account.role === 'admin' || account.role === 'designer';
  const canOrder = canEdit || account.role === 'operator';
  const canOperate = account.role === 'owner' || account.role === 'admin' || account.role === 'operator';
  const admin = account.role === 'owner' || account.role === 'admin';
  const available = !!account.workspace && !!account.session && !account.loading && !account.error;
  const validEpoch = (epoch: number, token: number) => alive.current && account.epoch.current === epoch && operation.current === token;

  async function run(label: string, action: (valid: () => boolean) => Promise<void>) {
    if (locked.current) return;
    const epoch = account.epoch.current;
    const token = ++operation.current;
    locked.current = true;
    setBusy(label);
    setError('');
    setNotice('');
    try { await action(() => validEpoch(epoch, token)); }
    catch (cause) { if (validEpoch(epoch, token)) setError(messageOf(cause)); }
    finally {
      if (validEpoch(epoch, token)) { locked.current = false; setBusy(''); }
    }
  }

  const selectProject = (design: Design) => {
    const selectedAt = ++selectionSerial.current;
    const epoch = account.epoch.current;
    const workspaceId = account.workspace?.id;
    setSelected(design);
    setReviewed(false);
    setCopyIntent(false);
    setNotice('');
    if (!workspaceId) return;
    void Promise.resolve(cloud().from('pw_proofs').select('approved_at,approved_by')
      .eq('workspace_id', workspaceId).eq('project_id', design.id).eq('version', design.version)
      .order('approved_at', { ascending: false }).limit(1).maybeSingle())
      .then(({ data, error: cause }) => {
        if (!alive.current || account.epoch.current !== epoch || selectionSerial.current !== selectedAt) return;
        if (cause) { setError(cause.message); return; }
        setProofs(previous => {
          const next = { ...previous };
          if (data) next[designKey(design)] = data;
          else delete next[designKey(design)];
          return next;
        });
      }).catch(cause => {
        if (alive.current && account.epoch.current === epoch && selectionSerial.current === selectedAt) setError(messageOf(cause));
      });
  };

  const uploadDesign = () => {
    if (!available || !canEdit || !account.workspace) return;
    const workspaceId = account.workspace.id;
    void run('Uploading artwork', async valid => {
      const source = validateLocalDesign(activeDesign);
      const previous = uploaded.current?.localId === source.id ? projects.find(project => project.id === uploaded.current?.cloudId) : undefined;
      const cloudDesign = { ...source, id: previous?.id || crypto.randomUUID(), version: previous?.version || 1 };
      const saved = await saveCloudProject(workspaceId, cloudDesign, previous?.version || 0);
      if (!valid()) return;
      uploaded.current = { localId: source.id, cloudId: saved.id };
      setProjects(existing => [saved, ...existing.filter(project => project.id !== saved.id)]);
      selectProject(saved);
      setNotice(`Uploaded ${saved.name} to ${account.workspace!.name}, version ${saved.version}.`);
      setTab('projects');
    });
  };

  const copyToDevice = () => {
    if (!selected) return;
    try {
      const copy = validateLocalDesign({ ...structuredClone(selected), id: crypto.randomUUID(), version: 1, updatedAt: new Date().toISOString(), name: `${selected.name} (copy)`.slice(0, 80) });
      onOpenDesign(copy);
      setCopyIntent(false);
      setNotice('An independent copy is open in your device studio. The team project is unchanged.');
    } catch (cause) { setError(messageOf(cause)); }
  };

  const approve = () => {
    if (!available || !canEdit || !selected || !reviewed || !account.workspace) return;
    const design = selected;
    const workspaceId = account.workspace.id;
    selectionSerial.current += 1;
    void run('Saving proof approval', async valid => {
      const proof = await approveCloudProof(workspaceId, design);
      if (!valid()) return;
      setProofs(previous => ({ ...previous, [designKey(design)]: { approved_at: proof.approved_at, approved_by: proof.approved_by } }));
      setNotice(`Approval saved for exactly version ${design.version}.`);
    });
  };

  const requestProduction = () => {
    if (!available || !canOrder || !selected || !account.workspace || !services?.orders) return;
    const design = selected;
    const workspaceId = account.workspace.id;
    void run('Saving production request', async valid => {
      const key = designKey(design);
      const requestId = requestKeys.current.get(key) || crypto.randomUUID();
      requestKeys.current.set(key, requestId);
      const order = await submitCloudOrder(workspaceId, design, requestId);
      if (!valid()) return;
      setOrders(previous => [order, ...previous.filter(item => item.id !== order.id)]);
      setNotice('Production request saved for artwork review. No payment or supplier order has been submitted.');
      setTab('production');
    });
  };

  const openOrderArtwork = (order: CloudOrder) => {
    if (!account.workspace || !available) return;
    const workspaceId = account.workspace.id;
    void run('Opening saved artwork', async valid => {
      const { data, error: cause } = await cloud().from('pw_revisions').select('design')
        .eq('workspace_id', workspaceId).eq('project_id', order.project_id).eq('version', order.version).single();
      if (cause) throw cause;
      if (!valid()) return;
      const design = await hydrateDesign(data.design);
      if (!valid()) return;
      selectProject(design);
      setTab('projects');
    });
  };

  const advance = (order: CloudOrder) => {
    const next = stages[stages.indexOf(order.status) + 1];
    if (!next || !canOperate || !available || !account.workspace) return;
    const workspaceId = account.workspace.id;
    void run('Updating production record', async valid => {
      const updated = await transitionOrder(workspaceId, order.id, order.status, next);
      if (!valid()) return;
      setOrders(previous => previous.map(item => item.id === order.id ? { ...item, status: updated.status } : item));
      setHistory(null);
      setNotice(`Production record moved to ${next}.`);
    });
  };

  const joinWorkspace = () => {
    if (!account.session || !invitation.trim()) return;
    void run('Accepting invitation', async valid => {
      const trimmed = invitation.trim();
      const token = trimmed.includes('://') ? new URL(trimmed).searchParams.get('invite') : trimmed;
      if (!token) throw new Error('This invitation does not contain a valid token.');
      const { error: cause } = await cloud().rpc('pw_team', { workspace_id: account.workspace?.id || '00000000-0000-0000-0000-000000000000', action: 'accept', token });
      if (cause) throw cause;
      if (!valid()) return;
      setInvitation('');
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url);
      await account.reload();
    });
  };

  const selectedProduct = selected ? products.find(product => product.id === selected.productId) : null;
  const selectedProof = selected ? proofs[designKey(selected)] : undefined;
  const checks = selected ? preflightArtwork(selected) : [];
  const hasErrors = checks.some(check => check.severity === 'error');

  const createdForAccount = async (workspace: Workspace) => {
    const epoch = account.epoch.current;
    const { data, error: cause } = await cloud().auth.getUser();
    if (cause) throw cause;
    if (!alive.current || account.epoch.current !== epoch || data.user?.id !== workspace.owner_id) return;
    await account.created(workspace);
  };

  return <section className="av-cloud">
    {!account.configured ? <div className="av-cloud-offline">
      <div className="av-cloud-emblem"><Cloud size={31}/><span><Check size={13}/></span></div>
      <h2>{services || serviceError ? 'Team sync is not connected yet.' : 'Checking team services…'}</h2>
      <p>Your device studio is ready: create artwork, save projects, review versions and prepare estimates. A connected team account adds shared projects and production records.</p>
      <div className="av-cloud-benefits"><span><CheckCircle2 size={16}/> Device projects & artwork</span><span><CheckCircle2 size={16}/> Revision history & backups</span><span><CheckCircle2 size={16}/> Quotes & brand tools</span></div>
      {serviceError && <p className="av-cloud-subtle">{serviceError} Your device workspace remains available.</p>}
    </div> : <>
      <div className="av-cloud-header"><div><span className="av-cloud-label"><Cloud size={14}/> TEAM WORKSPACE</span><h2>{account.workspace?.name || 'Create together.'}</h2><p>{account.session ? `Signed in as ${account.session.user.email}${account.role ? ` · ${account.role}` : ''}` : 'Sign in to access private team projects and production records.'}</p></div><button className="av-btn" onClick={() => setAccountOpen(true)}><Users size={16}/>{account.session ? 'Account & workspaces' : 'Sign in'}</button></div>
      {(account.error || error) && <div className="av-cloud-message error" role="alert"><AlertCircle size={17}/><span>{error || account.error}</span>{error ? <button aria-label="Dismiss error" onClick={() => setError('')}><X size={16}/></button> : <button aria-label="Retry opening team workspace" onClick={() => void account.reload().catch(cause => setError(messageOf(cause)))}><RefreshCw size={16}/></button>}</div>}
      {notice && <div className="av-cloud-message success" role="status"><CheckCircle2 size={17}/><span>{notice}</span></div>}
      {account.session && <div className="av-cloud-tabs" role="tablist" aria-label="Team workspace sections"><button role="tab" aria-selected={tab === 'projects'} onClick={() => setTab('projects')}><FolderOpen size={16}/>Projects</button><button role="tab" aria-selected={tab === 'production'} onClick={() => setTab('production')}><Package size={16}/>Production</button><button role="tab" aria-selected={tab === 'team'} onClick={() => setTab('team')}><Users size={16}/>Team & access</button></div>}
      {account.loading && <div className="av-cloud-loading"><LoaderCircle size={21}/>Opening your private workspace…</div>}
      {account.session && !account.loading && !account.workspace && tab !== 'team' && <div className="av-cloud-empty"><FolderOpen size={29}/><h3>A shared home for your projects.</h3><p>Create a team workspace or accept an invitation to get started.</p><button className="av-btn primary" onClick={() => setAccountOpen(true)}>Create a workspace <ArrowRight size={16}/></button></div>}
      {available && tab === 'projects' && <>
        <div className="av-cloud-toolbar"><span>{projects.length} team project{projects.length === 1 ? '' : 's'}</span><div><button className="av-btn" disabled={!!busy} onClick={() => void run('Refreshing workspace', async () => { await account.reload(); })}><RefreshCw size={15}/>Refresh</button>{canEdit && <button className="av-btn primary" disabled={!!busy} onClick={uploadDesign}><Upload size={15}/>Upload current design</button>}</div></div>
        {!projects.length && <div className="av-cloud-empty compact"><FolderOpen size={28}/><h3>Your team’s next project starts here.</h3><p>Upload “{activeDesign.name}” to share a saved version with your team.</p></div>}
        {projects.length > 0 && <div className="av-cloud-projects">{projects.map(project => <button key={project.id} className={selected?.id === project.id ? 'selected' : ''} onClick={() => selectProject(project)}><div className="av-cloud-thumb"><DesignPreview design={project}/></div><span><b>{project.name}</b><small>{products.find(product => product.id === project.productId)?.name} · Version {project.version}</small></span><ChevronRight size={16}/></button>)}</div>}
        {selected && <article className="av-cloud-proof"><div className="av-cloud-proof-heading"><div><span className="av-cloud-label">SAVED TEAM ARTWORK · VERSION {selected.version}</span><h3>{selected.name}</h3></div><button className="av-btn" onClick={() => setCopyIntent(!copyIntent)}><ArrowDownToLine size={15}/>Copy to device</button></div>
          {copyIntent && <div className="av-cloud-copy-confirm"><p>Open an independent copy in your device studio? This replaces the current canvas; your saved device projects remain available.</p><div><button className="av-btn primary" onClick={copyToDevice}>Open device copy</button><button className="av-btn" onClick={() => setCopyIntent(false)}>Cancel</button></div></div>}
          <div className="av-cloud-proof-layout"><div className="av-cloud-proof-art"><DesignPreview design={selected}/></div><div className="av-cloud-spec"><b>{selectedProduct?.name}</b><span>{selectedProduct?.width} × {selectedProduct?.height} mm</span><span>{selected.quantity} items · {selected.finish}</span><span>{selected.tier} · {selected.city}</span><small>Saved {dateLabel(selected.updatedAt)}</small></div></div>
          {checks.length > 0 && <details className="av-cloud-checks"><summary><AlertCircle size={15}/>{checks.length} artwork check{checks.length === 1 ? '' : 's'} to review</summary><ul>{checks.map(check => <li key={check.id}><b>{check.title}</b><span>{check.detail}</span></li>)}</ul></details>}
          {selectedProof ? <p className="av-cloud-approved"><ShieldCheck size={17}/>Version {selected.version} approved in this team workspace · {dateLabel(selectedProof.approved_at)}</p> : canEdit && <div className="av-cloud-approve"><label><input type="checkbox" checked={reviewed} onChange={event => setReviewed(event.target.checked)}/>I reviewed this saved version’s artwork, spelling and specification.</label><button className="av-btn" disabled={!reviewed || !!busy || hasErrors} onClick={approve}><FileCheck2 size={16}/>Save version {selected.version} approval</button></div>}
          <div className="av-cloud-request">{canOrder && services?.orders && <button className="av-btn primary" disabled={!!busy || hasErrors} onClick={requestProduction}>Save production request <ArrowRight size={16}/></button>}<small>A request enters artwork review. Supplier acceptance, delivery and payment are handled separately.</small></div>
        </article>}
      </>}
      {available && tab === 'production' && <div className="av-cloud-orders"><p className="av-cloud-subtle">These are your team’s saved production records. Stage changes are recorded manually by authorized team members.</p>{!orders.length && <div className="av-cloud-empty compact"><Package size={28}/><h3>No production requests yet.</h3><p>Open saved team artwork to create a request for its exact version.</p></div>}{orders.map(order => <article key={order.id}><div className="av-cloud-order-heading"><div><h3>{order.estimate.projectName || order.estimate.product?.name || 'Print project'}</h3><span>Version {order.version} · {order.estimate.quantity} items · {order.estimate.quoteOnly ? 'Custom quotation' : money(order.estimate.total)}</span></div><b className="av-cloud-order-status">{order.status}</b></div><div className="av-cloud-order-actions"><button className="av-btn" disabled={!!busy} onClick={() => openOrderArtwork(order)}>Review saved artwork</button><button className="av-btn" disabled={!!busy} onClick={() => void run('Loading record history', async valid => { const events = await orderHistory(order.id) as OrderEvent[]; if (valid()) setHistory({ orderId: order.id, events }); })}>History</button>{canOperate && stages.indexOf(order.status) < stages.length - 1 && <button className="av-btn" disabled={!!busy} onClick={() => advance(order)}>Mark {stages[stages.indexOf(order.status) + 1]} <ArrowRight size={14}/></button>}</div>{history?.orderId === order.id && <ol className="av-cloud-history">{history.events.map(event => <li key={event.id}><CheckCircle2 size={14}/><span>{event.to_status}<small>{dateLabel(event.created_at)}</small></span></li>)}</ol>}</article>)}</div>}
      {account.session && !account.loading && tab === 'team' && <>
        {available && admin && <div className="av-cloud-admin"><WorkspaceSettings key={`${account.session.user.id}:${account.workspace!.id}:${account.role}`} workspace={account.workspace} role={account.role} onAccount={() => setAccountOpen(true)} onJoined={account.reload}/></div>}
        {(!available || !admin) && <div className="av-cloud-access"><KeyRound size={27}/><h3>{available ? 'Your workspace role' : 'Join your team'}</h3><p>{available ? `Your ${account.role} role gives you the permissions assigned by your workspace owner. Team invitations and API keys are managed by owners and administrators.` : 'Accept an invitation using the same confirmed email address your teammate invited.'}</p></div>}
        {!admin && <div className="av-cloud-invitation"><label>Invitation link or token<input value={invitation} onChange={event => setInvitation(event.target.value)} placeholder="Paste your team invitation"/></label><button className="av-btn" disabled={!invitation.trim() || !!busy} onClick={joinWorkspace}><Link2 size={16}/>Join workspace</button></div>}
      </>}
      {busy && <div className="av-cloud-busy" role="status"><LoaderCircle size={15}/>{busy}…</div>}
    </>}
    {account.configured && <Account key={account.session?.user.id || 'guest'} open={accountOpen} setOpen={setAccountOpen} configured={account.configured} session={account.session} workspace={account.workspace} workspaces={account.workspaces} role={account.role} onWorkspace={account.selectWorkspace} onRefresh={account.reload} onCreated={createdForAccount} onSignOut={account.signOut}/>}
  </section>;
}
