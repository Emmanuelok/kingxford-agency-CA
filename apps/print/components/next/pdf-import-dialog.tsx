import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Check, FileText, LoaderCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import type { Product } from '../../lib/presswerk/catalog';
import type { PrintFace } from '../../lib/next/artwork';
import { openPdfImport, planPdfPlacement, type PdfImportResult, type PdfImportSession, type PdfPagePreview, type PdfPageSelection } from '../../lib/next/pdf-artwork';
import './pdf-import-dialog.css';

type Props = {
  file: File; product: Product; activeFace: PrintFace; supportsBack: boolean;
  onClose: () => void; onImport: (result: PdfImportResult) => void | Promise<void>;
};
const PAGE_BATCH = 8;
const label = (face: PrintFace) => face === 'front' ? 'Front' : 'Back';
const mm = (value: number) => Number(value.toFixed(1));

export default function PdfImportDialog({ file, product, activeFace, supportsBack, onClose, onImport }: Props) {
  const firstFace = activeFace === 'back' && supportsBack ? 'back' : 'front';
  const [session, setSession] = useState<PdfImportSession | null>(null);
  const [target, setTarget] = useState<PrintFace>(firstFace);
  const [selection, setSelection] = useState<Partial<Record<PrintFace, number>>>({ [firstFace]: 1 });
  const [previews, setPreviews] = useState<Record<number, PdfPagePreview>>({});
  const [pageErrors, setPageErrors] = useState<Record<number, string>>({});
  const [batch, setBatch] = useState(0);
  const [loading, setLoading] = useState(true);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const alive = useRef(true);
  const importRequest = useRef<AbortController | null>(null);
  const previewCache = useRef<Record<number, PdfPagePreview>>({});

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    void openPdfImport(file, controller.signal).then(value => {
      if (!controller.signal.aborted) { setSession(value); setLoading(false); }
    }).catch(cause => {
      if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : 'This PDF could not be opened.'); setLoading(false); }
    });
    return () => { alive.current = false; importRequest.current?.abort(); controller.abort(); };
  }, [file]);

  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const pages = Array.from({ length: Math.min(PAGE_BATCH, session.pageCount - batch * PAGE_BATCH) }, (_, index) => batch * PAGE_BATCH + index + 1).filter(page => !previewCache.current[page]);
    let next = 0;
    setThumbnailsLoading(pages.length > 0);
    // Two small canvases at a time; full-size import waits for this batch.
    const worker = async () => {
      while (next < pages.length && !controller.signal.aborted) {
        const page = pages[next++];
        try {
          const preview = await session.preview(page, controller.signal);
          if (!controller.signal.aborted) {
            previewCache.current[page] = preview;
            setPreviews(value => ({ ...value, [page]: preview }));
            setPageErrors(value => { const next = { ...value }; delete next[page]; return next; });
          }
        } catch (cause) {
          if (!controller.signal.aborted) setPageErrors(value => ({ ...value, [page]: cause instanceof Error ? cause.message : 'This page could not be previewed.' }));
        }
      }
    };
    void Promise.all([worker(), worker()]).finally(() => { if (!controller.signal.aborted) setThumbnailsLoading(false); });
    return () => controller.abort();
  }, [session, batch]);

  const faces: PrintFace[] = supportsBack ? ['front', 'back'] : ['front'];
  const chosen: PdfPageSelection[] = faces.flatMap(face => selection[face] ? [{ face, pageNumber: selection[face]! }] : []);
  const pages = session ? Array.from({ length: Math.min(PAGE_BATCH, session.pageCount - batch * PAGE_BATCH) }, (_, index) => batch * PAGE_BATCH + index + 1) : [];
  const selectedUnavailable = chosen.some(item => !previews[item.pageNumber] || !!pageErrors[item.pageNumber]);
  const close = () => { importRequest.current?.abort(); onClose(); };
  const importPages = async () => {
    if (!session || busy || !chosen.length || selectedUnavailable) return;
    setBusy(true); setError('');
    const controller = new AbortController(); importRequest.current = controller;
    try {
      const result = await session.importPages(chosen, product, controller.signal);
      if (!controller.signal.aborted && alive.current) await onImport(result);
    } catch (cause) {
      if (!controller.signal.aborted && alive.current) setError(cause instanceof Error ? cause.message : 'The pages could not be imported. Your artwork has not changed.');
    } finally { if (alive.current) setBusy(false); }
  };

  return <Dialog open onOpenChange={open => !open && close()}>
    <DialogContent className="av-pdf-import" showCloseButton={false}>
      <DialogHeader className="pdf-import-heading">
        <div className="pdf-import-kicker"><FileText size={17}/>PDF ARTWORK</div>
        <DialogTitle>Import PDF artwork</DialogTitle>
        <DialogDescription>Choose the pages to place on your product. Each page becomes one image; its text and vectors are flattened.</DialogDescription>
        <button type="button" className="pdf-close" aria-label="Close PDF import" onClick={close}><X size={21}/></button>
      </DialogHeader>
      <div className="pdf-file-info"><FileText size={20}/><div><strong>{file.name}</strong><span>{(file.size / 1024 / 1024).toFixed(1)} MB{session && ` · ${session.pageCount} ${session.pageCount === 1 ? 'page' : 'pages'}`}</span></div><span>{product.name}<small>{product.width} × {product.height} mm</small></span></div>
      {error && <div className="pdf-import-error" role="alert"><AlertTriangle size={18}/><span>{error}</span></div>}
      {loading ? <div className="pdf-opening" role="status"><LoaderCircle className="pdf-spin" size={27}/><strong>Opening your PDF…</strong><span>Your file is processed on this device.</span></div> : session && <div className="pdf-import-layout">
        <div className="pdf-page-browser">
          <div className="pdf-page-toolbar"><div><strong>Choose a page</strong><span>Click a page to use it for the {label(target).toLowerCase()}.</span></div>{supportsBack && <div className="pdf-target-tabs" aria-label="Print face to assign">{faces.map(face => <button type="button" key={face} disabled={busy} aria-pressed={target === face} onClick={() => setTarget(face)}>{label(face)}</button>)}</div>}</div>
          <div className="pdf-page-grid" aria-busy={thumbnailsLoading}>{pages.map(number => {
            const preview = previews[number], assigned = faces.filter(face => selection[face] === number);
            return <button type="button" key={number} className={`pdf-page-choice ${assigned.length ? 'is-selected' : ''}`} aria-label={`Use PDF page ${number} for ${target}`} aria-pressed={selection[target] === number} disabled={busy || !preview || !!pageErrors[number]} onClick={() => setSelection(value => ({ ...value, [target]: number }))}>
              <div className="pdf-page-image">{preview ? <img src={preview.src} alt={`PDF page ${number}`} draggable={false}/> : pageErrors[number] ? <span><AlertTriangle size={22}/>Preview unavailable</span> : <LoaderCircle size={22} className="pdf-spin"/>}{assigned.length > 0 && <span className="pdf-page-badge"><Check size={12}/>{assigned.map(label).join(' + ')}</span>}</div>
              <strong>Page {number}</strong><small>{preview ? `${mm(preview.widthMm)} × ${mm(preview.heightMm)} mm` : pageErrors[number] ? 'Choose another page' : 'Preparing preview'}</small>
            </button>;
          })}</div>
          {pages.filter(number => pageErrors[number]).map(number => <p className="pdf-page-error-detail" key={number} role="alert">Page {number}: {pageErrors[number]}</p>)}
          {session.pageCount > PAGE_BATCH && <div className="pdf-pagination"><button type="button" disabled={batch === 0 || busy || thumbnailsLoading} aria-label="Previous PDF pages" onClick={() => setBatch(value => value - 1)}><ArrowLeft size={16}/>Previous</button><span>{batch * PAGE_BATCH + 1}–{Math.min((batch + 1) * PAGE_BATCH, session.pageCount)} of {session.pageCount}</span><button type="button" disabled={(batch + 1) * PAGE_BATCH >= session.pageCount || busy || thumbnailsLoading} aria-label="Next PDF pages" onClick={() => setBatch(value => value + 1)}>Next<ArrowRight size={16}/></button></div>}
        </div>
        <aside className="pdf-placement-review">
          <h3>On your product</h3><p>The whole page is fitted within the print area, with its proportions preserved.</p>
          {faces.map(face => {
            const number = selection[face], preview = number ? previews[number] : undefined, plan = preview ? planPdfPlacement(preview, product) : null;
            return <div className="pdf-face-review" key={face}>
              <div className="pdf-face-label"><strong>{label(face)}</strong>{number && <button type="button" disabled={busy} aria-label={`Keep current ${face} artwork`} onClick={() => setSelection(value => ({ ...value, [face]: undefined }))}><X size={14}/></button>}</div>
              {preview && plan ? <><div className="pdf-placement-stage"><div className="pdf-placement-canvas" style={{ aspectRatio: `${product.width} / ${product.height}`, maxWidth: 156 * product.width / product.height }}><img src={preview.src} alt={`${label(face)} page placement`} style={{ left: `${plan.placement.x}%`, top: `${plan.placement.y}%`, width: `${plan.placement.width}%`, height: `${plan.placement.height}%` }}/></div></div><strong className="pdf-placement-source">Page {number} <span>· {Math.round(plan.actualDpi)} PPI at this size</span></strong>{plan.hasMargins && <p className="pdf-placement-note">Different page proportions: margins will remain.</p>}{plan.reduced && <p className="pdf-placement-warning"><AlertTriangle size={14}/>Resolution reduced to fit the browser image limit.</p>}</> : <button type="button" className="pdf-empty-face" disabled={busy} onClick={() => setTarget(face)}>{number ? 'Preparing page preview…' : 'Keep current artwork'}<small>{number ? 'Your PDF is loading.' : `Select ${label(face).toLowerCase()}, then choose a page.`}</small></button>}
            </div>;
          })}
          <p className="pdf-privacy-note">PDFs stay on this device. Maximum 25 MB and 100 pages. Imported artwork uses RGB colour.</p>
        </aside>
      </div>}
      <div className="pdf-import-footer"><p>Replaces artwork on selected faces.<br/><strong>Undo restores it.</strong></p><div><button type="button" className="pdf-cancel" onClick={close}>Cancel</button><button type="button" className="pdf-import-action" disabled={loading || !session || busy || thumbnailsLoading || !chosen.length || selectedUnavailable} onClick={() => void importPages()}>{busy ? <><LoaderCircle size={17} className="pdf-spin"/>Preparing artwork…</> : <>Use selected pages<ArrowRight size={17}/></>}</button></div></div>
    </DialogContent>
  </Dialog>;
}
