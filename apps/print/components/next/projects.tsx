import { useEffect, useMemo, useRef, useState } from 'react';
import { Archive, ArchiveRestore, ArrowUpRight, Clock3, Copy, FileText, History, Search, X } from 'lucide-react';
import type { Design } from '../../lib/presswerk/catalog';
import { products } from '../../lib/presswerk/catalog';
import type { PrintProject, ProjectRevision } from '../../lib/next/types';
import { DesignPreview } from './artwork';
import './workspace-views.css';

const date = (value: string) => new Date(value).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });

export default function Projects({ projects, onOpen, onDuplicate, onArchive, onRestore, onQuote }: {
  projects: PrintProject[];
  onOpen: (design: Design) => void;
  onDuplicate: (project: PrintProject) => void;
  onArchive: (id: string, archive: boolean) => void;
  onRestore: (id: string, revision: ProjectRevision) => void;
  onQuote: (design: Design) => void;
}) {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [sort, setSort] = useState('recent');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selected = projects.find(project => project.id === historyId);
  const activeCount = projects.filter(project => !project.archived).length;
  const earlierVersions = selected ? selected.revisions.filter(revision => revision.design.version !== selected.design.version).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) : [];
  const visible = useMemo(() => projects.filter(project => project.archived === (tab === 'archived')).filter(project => `${project.design.name} ${products.find(p => p.id === project.design.productId)?.name || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'name' ? a.design.name.localeCompare(b.design.name) : sort === 'oldest' ? Date.parse(a.updatedAt) - Date.parse(b.updatedAt) : Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), [projects, tab, search, sort]);
  useEffect(() => { if (historyId && dialog.current && !dialog.current.open) dialog.current.showModal(); else if (!historyId && dialog.current?.open) dialog.current.close(); }, [historyId]);

  return <section className="pv-workspace">
    <header className="pv-page-head"><div><span className="pv-eyebrow">YOUR CREATIVE LIBRARY</span><h1>Ideas worth keeping.</h1><p>Every saved design, ready for its next chapter. Revisit your artwork, compare versions and build a print estimate.</p></div><div className="pv-count-block"><strong>{activeCount.toString().padStart(2, '0')}</strong><span>active projects</span></div></header>
    <div className="pv-toolbar"><div className="pv-tabs" aria-label="Project collection"><button className={tab === 'active' ? 'is-active' : ''} onClick={() => setTab('active')} aria-pressed={tab === 'active'}>Projects <span>{activeCount}</span></button><button className={tab === 'archived' ? 'is-active' : ''} onClick={() => setTab('archived')} aria-pressed={tab === 'archived'}>Archived <span>{projects.length - activeCount}</span></button></div><label className="pv-search"><Search size={17} /><input aria-label="Search projects" placeholder="Find a project or product…" value={search} onChange={event => setSearch(event.target.value)} /></label><label className="pv-sort"><span className="pv-sr-only">Sort projects</span><select value={sort} onChange={event => setSort(event.target.value)}><option value="recent">Recently edited</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option></select></label></div>
    {visible.length ? <div className="pv-project-grid">{visible.map(project => {
      const product = products.find(p => p.id === project.design.productId);
      return <article className="pv-project-card" key={project.id}>
        <button className="pv-project-art" onClick={() => onOpen(project.design)} aria-label={`Open ${project.design.name}`}><DesignPreview design={project.design} /><span className="pv-art-open"><ArrowUpRight size={20} /></span></button>
        <div className="pv-project-info"><div className="pv-project-meta"><span>{product?.category || 'Custom project'}</span><span>V{project.design.version}</span></div><button className="pv-project-title" onClick={() => onOpen(project.design)}>{project.design.name}</button><p>{product?.name || 'Custom print'} <span>·</span> {project.design.quantity.toLocaleString()} {project.design.quantity === 1 ? 'item' : 'items'}</p><div className="pv-project-time"><Clock3 size={13} /><span>Edited {date(project.updatedAt)}</span><button onClick={() => setHistoryId(project.id)} aria-label={`Version history for ${project.design.name}`}><History size={14} /> {project.design.version} {project.design.version === 1 ? 'version' : 'versions'}</button></div></div>
        <div className="pv-card-actions"><button className="pv-text-action" onClick={() => onQuote(project.design)}><FileText size={15} /> Build estimate</button><div><button className="pv-icon-button" title="Duplicate project" aria-label={`Duplicate ${project.design.name}`} onClick={() => onDuplicate(project)}><Copy size={16} /></button><button className="pv-icon-button" title={project.archived ? 'Restore project' : 'Archive project'} aria-label={`${project.archived ? 'Restore' : 'Archive'} ${project.design.name}`} onClick={() => onArchive(project.id, !project.archived)}>{project.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}</button></div></div>
      </article>;
    })}</div> : <div className="pv-empty"><div className="pv-empty-icon">{tab === 'archived' ? <Archive size={30} /> : <FileText size={30} />}</div><h2>{search ? 'No matching projects.' : tab === 'archived' ? 'Nothing in the archive.' : 'Your next idea belongs here.'}</h2><p>{search ? 'Try a different name or search by product type.' : tab === 'archived' ? 'Archive a project to put it aside. You can restore it whenever you need it.' : 'Open the design studio, make something yours and save your project. Your artwork and earlier versions will be collected here.'}</p>{search && <button className="pv-button" onClick={() => setSearch('')}>Clear search</button>}</div>}
    <dialog ref={dialog} className="pv-history-dialog" onCancel={() => setHistoryId(null)} onClose={() => setHistoryId(null)} onClick={event => { if (event.target === event.currentTarget) setHistoryId(null); }}>
      {selected && <div className="pv-history-inner"><div className="pv-drawer-heading"><div><span className="pv-eyebrow">PROJECT HISTORY</span><h2>{selected.design.name}</h2></div><button autoFocus className="pv-icon-button" aria-label="Close version history" onClick={() => setHistoryId(null)}><X size={21} /></button></div><p className="pv-muted">Restoring an earlier version creates a new version. Your 20 most recent saved versions are kept here.</p><div className="pv-revision-current"><div className="pv-revision-art"><DesignPreview design={selected.design} /></div><div><span className="pv-pill">Current version</span><h3>Version {selected.design.version}</h3><p>{date(selected.updatedAt)}</p><button className="pv-text-action" onClick={() => { onOpen(selected.design); setHistoryId(null); }}>Continue editing <ArrowUpRight size={16} /></button></div></div><h3 className="pv-subheading">Earlier versions <span>{earlierVersions.length}</span></h3>{earlierVersions.length ? earlierVersions.map(revision => <article className="pv-revision-row" key={revision.id}><div className="pv-revision-thumb"><DesignPreview design={revision.design} /></div><div><strong>{revision.label || `Version ${revision.design.version}`}</strong><p>{date(revision.createdAt)}</p><span>{revision.design.quantity.toLocaleString()} items · {revision.design.finish}</span></div><button className="pv-small-button" onClick={() => { onRestore(selected.id, revision); setHistoryId(null); }}>Restore</button></article>) : <div className="pv-history-empty"><History size={24} /><p>Your earlier versions will appear after you edit and save this project again.</p></div>}</div>}
    </dialog>
  </section>;
}
