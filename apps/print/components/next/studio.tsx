import { lazy, Suspense, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { AlignCenter, AlignLeft, AlignRight, ArrowDown, ArrowLeft, ArrowUp, Box, Check, CheckCircle2, ChevronDown, ChevronUp, Copy, Crop, Download, FileText, Grid3X3, HardDrive, ImagePlus, Layers, LayoutTemplate, Maximize, Palette, PanelRight, Plus, MousePointer2, Redo2, RefreshCw, Save, ShieldCheck, Square, Trash2, Type, Undo2, Upload, X, ZoomIn, ZoomOut, AlertTriangle } from 'lucide-react';
import type { Design, DesignLayer, Tier } from '../../lib/presswerk/catalog';
import { calculateQuote, finishesFor, money, supportsReverse } from '../../lib/presswerk/catalog';
import type { BrandKit } from '../../lib/next/types';
import { alignLayer, ARTWORK_FONTS, artworkFingerprint, artworkProduct, artworkSvg, copyDesign, cropToFrame, designForFace, printFaces, downloadArtwork, export300DpiPng, imagePercentSize, imagePpi, preflightArtwork, rasterDimensions, replaceLayerImage, unrotatedLayerBounds } from '../../lib/next/artwork';
import type { PdfImportResult } from '../../lib/next/pdf-artwork';
import { Artwork, DesignPreview } from './artwork';
import { contrastingInk, designTemplates, makeTemplate } from '../../lib/next/templates';
import './studio.css';

const Mockup = lazy(() => import('../presswerk/mockup'));
const PdfImportDialog = lazy(() => import('./pdf-import-dialog'));
const ImageCropEditor = lazy(() => import('./image-crop-editor'));
type Props = { design: Design; onChange: (design: Design) => void; onSave: (design: Design) => Promise<void>; onQuote: (design: Design) => void; brand: BrandKit; saving: boolean; onExit?: () => void; storageStatus?: 'loading' | 'saving' | 'saved' | 'error' | 'conflict'; onStorage?: () => void; onReturn?: () => void; returnLabel?: string; savingreturn?: boolean; initialFile?: File; onInitialFileConsumed?: () => void };
type Resource = 'templates' | 'text' | 'uploads' | 'elements' | 'brand' | 'layers';
type Face = 'front' | 'back';
type HistoryEntry = { design: Design; face: Face };
type Drag = { id: string; pointer: number; startX: number; startY: number; width: number; height: number; resize: boolean; before: Design; face: Face; layer: DesignLayer };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const uid = () => crypto.randomUUID();
const clone = copyDesign;
function NumericField({ label, value, min, max, step = .1, onChange, suffix }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; suffix?: string }) {
  const [editing, setEditing] = useState<{ base: number; text: string } | null>(null);
  const draft = editing?.base === value ? editing.text : String(Math.round(value * 100) / 100);
  const apply = () => { const numeric = Number(draft); if (!draft.trim() || !Number.isFinite(numeric)) { setEditing(null); return; } const next = clamp(numeric, min, max); onChange(next); setEditing(null); };
  return <label className="studio-field"><span>{label}</span><div className="studio-number"><input type="number" min={min} max={max} step={step} value={draft} onChange={e => setEditing({ base: value, text: e.target.value })} onBlur={apply} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}/>{suffix && <small>{suffix}</small>}</div></label>;
}
function IconButton({ label, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: React.ReactNode }) { return <button type="button" className="studio-icon" title={label} aria-label={label} {...props}>{children}</button>; }

export default function PrintStudio({ design: project, onChange, onSave, onQuote, brand, saving, onExit, storageStatus, onStorage, onReturn, returnLabel = 'Update estimate artwork', savingreturn = false, initialFile, onInitialFileConsumed }: Props) {
  const [selectedFace, setSelectedFace] = useState<Face>('front');
  const face: Face = project.sides === 2 && supportsReverse(artworkProduct(project)) ? selectedFace : 'front';
  const design = useMemo(() => designForFace(project, face), [project, face]);
  const faces = useMemo(() => printFaces(project), [project]);
  const projectCurrent = useRef(project), faceCurrent = useRef(face);
  const [selectedId, setSelectedId] = useState<string | null>(null), [mode, setMode] = useState<'artwork' | 'mockup'>('artwork'), [zoom, setZoom] = useState(1), [grid, setGrid] = useState(false), [safeArea, setSafeArea] = useState(false);
  const [status, setStatus] = useState(''), [error, setError] = useState(''), [exporting, setExporting] = useState(false), [uploading, setUploading] = useState(false), [proofOpen, setProofOpen] = useState(false), [checkState, setCheckState] = useState({ fingerprint: '', values: [false, false, false] }), [reviewed, setReviewed] = useState(''), [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0 }), [lockRatio, setLockRatio] = useState(true), [sideTab, setSideTab] = useState<'design' | 'print'>('design');
  const [resource, setResource] = useState<Resource | null>(() => design.layers.length ? null : 'templates');
  const [mobileSheet, setMobileSheet] = useState<'resources' | 'inspector' | null>(null);
  const [templateCandidate, setTemplateCandidate] = useState<string | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [pdfImport, setPdfImport] = useState<{ file: File; designId: string; fingerprint: string; face: Face } | null>(null);
  const [cropTarget, setCropTarget] = useState<{ layer: DesignLayer; designId: string; fingerprint: string; face: Face } | null>(null);
  const replaceInput = useRef<HTMLInputElement>(null), replaceTarget = useRef<{layer: DesignLayer; designId: string; face: Face} | null>(null), uploadBusy = useRef(false), consumedFile = useRef<File | undefined>(undefined);
  const templatePreviews = useMemo(() => designTemplates.map(template => ({ ...template, preview: makeTemplate(template.id, design.productId) })), [design.productId]);
  const uploadedImages = useMemo(() => design.layers.filter((layer, index, all) => layer.type === 'image' && layer.src && all.findIndex(item => item.src === layer.src) === index), [design.layers]);
  const current = useRef(design), history = useRef<{ past: HistoryEntry[]; future: HistoryEntry[] }>({ past: [], future: [] }), drag = useRef<Drag | null>(null), uploadInput = useRef<HTMLInputElement>(null), stage = useRef<HTMLDivElement>(null), proofDialog = useRef<HTMLDivElement>(null), mounted = useRef(true), [available, setAvailable] = useState({ width: 680, height: 510 });
  const p = artworkProduct(design), selected = design.layers.find(layer => layer.id === selectedId), fingerprint = useMemo(() => artworkFingerprint(project), [project]), issues = useMemo(() => preflightArtwork(project), [project]), blocking = issues.filter(issue => issue.severity === 'error');
  const fit = Math.min(Math.max(80, available.width - 104) / p.width, Math.max(80, available.height - 112) / p.height), sheetWidth = p.width * fit * zoom, sheetHeight = p.height * fit * zoom;
  const quote = useMemo(() => { try { return calculateQuote({ productId: design.productId, quantity: design.quantity, tier: design.tier, finish: design.finish, sides: project.sides, city: design.city, shipping: 0 }); } catch { return null; } }, [design.productId, design.quantity, design.tier, design.finish, design.city, project.sides]);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { current.current = design; projectCurrent.current = project; faceCurrent.current = face; }, [design, project, face]);
  const checks = checkState.fingerprint === fingerprint ? checkState.values : [false, false, false];
  useEffect(() => { const el = stage.current; if (!el) return; const observer = new ResizeObserver(entries => { const entry = entries[0]; setAvailable({ width: entry.contentRect.width, height: entry.contentRect.height }); }); observer.observe(el); return () => observer.disconnect(); }, []);
  useEffect(() => { if (!proofOpen) return; const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow; document.body.style.overflow = 'hidden'; const dialog = proofDialog.current; const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') || []); focusable()[0]?.focus(); const handler = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); setProofOpen(false); } if (event.key !== 'Tab') return; const elements = focusable(), first = elements[0], last = elements[elements.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); } }; window.addEventListener('keydown', handler); return () => { window.removeEventListener('keydown', handler); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); }; }, [proofOpen]);
  const remember = (before: Design, editFace: Face = faceCurrent.current) => { history.current.past.push({ design: before, face: editFace }); if (history.current.past.length > 60) history.current.past.shift(); history.current.future = []; setHistoryCounts({ past: history.current.past.length, future: history.current.future.length }); };
  const commitProject = (next: Design, record = true) => {
    if (record) remember(projectCurrent.current);
    const updated = { ...next, updatedAt: new Date().toISOString() };
    projectCurrent.current = updated;
    const nextFace = updated.sides === 2 ? faceCurrent.current : 'front';
    current.current = designForFace(updated, nextFace);
    onChange(updated);
    setStatus('');
  };
  // The canvas only sees one face. Every change is merged into the whole project,
  // so a back-side edit can never replace the front or lose its print settings.
  const commit = (next: Design, record = true) => {
    const { background, layers, ...shared } = next;
    const combined = { ...projectCurrent.current, ...shared, sides: projectCurrent.current.sides, back: projectCurrent.current.back };
    commitProject(faceCurrent.current === 'back' ? { ...combined, back: { background, layers } } : { ...combined, background, layers }, record);
  };
  const changeFace = (next: Face) => { if (uploading || drag.current) return; const destination = next === 'back' && projectCurrent.current.sides === 2 && supportsReverse(p) ? 'back' : 'front'; setSelectedFace(destination); faceCurrent.current = destination; current.current = designForFace(projectCurrent.current, destination); setSelectedId(null); setTemplateCandidate(null); setMobileSheet(null); setStatus(''); };
  const setSides = (sides: 1 | 2) => { commitProject({ ...projectCurrent.current, sides, ...(sides === 2 && !projectCurrent.current.back ? { back: { background: '#ffffff', layers: [] } } : {}) }); changeFace(sides === 2 ? 'back' : 'front'); };
  const restoreHistory = (entry: HistoryEntry) => { projectCurrent.current = entry.design; faceCurrent.current = entry.design.sides === 2 && supportsReverse(artworkProduct(entry.design)) ? entry.face : 'front'; current.current = designForFace(entry.design, faceCurrent.current); setSelectedFace(faceCurrent.current); setSelectedId(null); setStatus(''); onChange(entry.design); setHistoryCounts({ past: history.current.past.length, future: history.current.future.length }); };
  const updateLayer = (patch: Partial<DesignLayer>) => { if (!selectedId) return; commit({ ...current.current, layers: current.current.layers.map(layer => layer.id === selectedId ? { ...layer, ...patch } : layer) }); };
  const undo = () => { const previous = history.current.past.pop(); if (!previous) return; history.current.future.push({ design: projectCurrent.current, face: faceCurrent.current }); restoreHistory(previous); };
  const redo = () => { const next = history.current.future.pop(); if (!next) return; history.current.past.push({ design: projectCurrent.current, face: faceCurrent.current }); restoreHistory(next); };
  const remove = () => { if (!selectedId) return; commit({ ...current.current, layers: current.current.layers.filter(layer => layer.id !== selectedId) }); setSelectedId(null); };
  const duplicate = () => { const layer = current.current.layers.find(l => l.id === selectedId); if (!layer) return; if (current.current.layers.length >= 100) { setError('This artwork has reached its 100-layer limit. Remove a layer before duplicating another.'); return; } const duplicate = { ...layer, id: uid(), x: clamp(layer.x + 3, 0, 100), y: clamp(layer.y + 3, 0, 100) }; commit({ ...current.current, layers: [...current.current.layers, duplicate] }); setSelectedId(duplicate.id); };
  const onKeyboard = useEffectEvent((event: KeyboardEvent) => { const target = event.target as HTMLElement; if (target.isContentEditable || target.closest('input,textarea,select,[role="dialog"]') || proofOpen || pdfImport || cropTarget || uploading || mode !== 'artwork') return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'd' && selectedId) { event.preventDefault(); duplicate(); return; }
      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) { event.preventDefault(); remove(); return; }
      if (event.key === 'Escape') { setSelectedId(null); setMobileSheet(null); setTemplateCandidate(null); return; }
      const layer = current.current.layers.find(l => l.id === selectedId); if (!layer || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
      event.preventDefault(); const step = event.shiftKey ? 1 : .1; updateLayer({ x: clamp(layer.x + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), 0, 100), y: clamp(layer.y + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0), 0, 100) });
    });
  useEffect(() => { const key = (event: KeyboardEvent) => onKeyboard(event); window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  const insertLayer = (layer: DesignLayer) => {
    if (current.current.layers.length >= 100) {
      setError('This artwork has reached its 100-layer limit. Remove a layer before adding another.');
      return;
    }
    commit({ ...current.current, layers: [...current.current.layers, layer] });
    setSelectedId(layer.id);
    setMode('artwork');
    setSideTab('design');
    setMobileSheet(null);
  };
  const addText = (preset: 'heading' | 'subheading' | 'body') => {
    const settings = {
      heading: { text: 'Your headline', size: 9, weight: 700, y: 20 },
      subheading: { text: 'A little more to say.', size: 4.5, weight: 400, y: 45 },
      body: { text: 'The details make the difference.', size: 2.7, weight: 400, y: 67 },
    }[preset];
    insertLayer({ id: uid(), type: 'text', ...settings, x: 9, color: contrastingInk(current.current.background), rotation: 0, opacity: 1, font: brand.font });
  };
  const addShape = (preset: 'rectangle' | 'square' | 'rule' | 'panel') => {
    const size = {
      rectangle: { width: 42, height: 25 },
      square: { width: Math.min(30, p.height / p.width * 30), height: Math.min(30, p.width / p.height * 30) },
      rule: { width: 65, height: Math.max(.1, Math.min(1, p.width / p.height * .6)) },
      panel: { width: 84, height: 35 },
    }[preset];
    insertLayer({ id: uid(), type: 'shape', text: preset === 'rule' ? 'Divider' : preset === 'panel' ? 'Colour panel' : preset === 'square' ? 'Square' : 'Rectangle', x: 8, y: 12, ...size, size: 5, color: brand.accent, rotation: 0, opacity: 1 });
  };
  const openResource = (next: Resource) => {
    setResource(resource === next && mobileSheet === 'resources' ? null : next);
    setMobileSheet(resource === next && mobileSheet === 'resources' ? null : 'resources');
    setTemplateCandidate(null);
  };
  const applyTemplate = (id: string) => {
    const next = makeTemplate(id, current.current.productId);
    commit({ ...current.current, background: next.background, layers: next.layers });
    setSelectedId(null);
    setTemplateCandidate(null);
    setMode('artwork');
    setMobileSheet(null);
    setStatus('Template applied. Your project name and print settings are unchanged. Undo restores your previous artwork.');
  };
  const useBrand = () => {
    const ink = contrastingInk(brand.secondary);
    commit({ ...current.current, background: brand.secondary, layers: current.current.layers.map(layer => layer.type === 'text' ? { ...layer, font: brand.font, color: ink } : layer.type === 'shape' ? { ...layer, color: brand.accent } : layer) });
    setStatus('Brand colours and typography applied.');
  };
  const reorder = (id: string, direction: number) => { const layers = [...current.current.layers], index = layers.findIndex(layer => layer.id === id), target = index + direction; if (target < 0 || target >= layers.length) return; [layers[index], layers[target]] = [layers[target], layers[index]]; commit({ ...current.current, layers }); };
  const pointerDown = (event: ReactPointerEvent<SVGGElement>, layer: DesignLayer, resize = false) => { if (event.button !== 0) return; event.stopPropagation(); event.preventDefault(); const svg = event.currentTarget.ownerSVGElement!; const rect = svg.getBoundingClientRect(); svg.setPointerCapture(event.pointerId); drag.current = { id: layer.id, pointer: event.pointerId, startX: event.clientX, startY: event.clientY, width: rect.width, height: rect.height, resize, before: projectCurrent.current, face: faceCurrent.current, layer: { ...layer } }; setSelectedId(layer.id); setSideTab('design'); };
  const pointerMove = (event: ReactPointerEvent<SVGSVGElement>) => { const action = drag.current; if (!action || action.pointer !== event.pointerId) return; const dx = (event.clientX - action.startX) / action.width * 100, dy = (event.clientY - action.startY) / action.height * 100; let patch: Partial<DesignLayer>;
    if (action.resize) { const radians = action.layer.rotation * Math.PI / 180, localX = dx / 100 * p.width * Math.cos(radians) + dy / 100 * p.height * Math.sin(radians), localY = -dx / 100 * p.width * Math.sin(radians) + dy / 100 * p.height * Math.cos(radians), bounds = unrotatedLayerBounds(action.layer, p);
      if (action.layer.type === 'text') patch = { size: clamp(action.layer.size * Math.max(.05, (bounds.width + localX) / bounds.width), .01, 50) };
      else { let width = clamp((bounds.width + localX) / p.width * 100, .1, 100), height = clamp((bounds.height + localY) / p.height * 100, .1, 100); if (lockRatio && action.layer.type === 'image') { const factor = Math.max(.01, (bounds.width + localX) / bounds.width); const limited = Math.min(factor, 100 / (action.layer.width || 30), 100 / (action.layer.height || 25)); width = (action.layer.width || 30) * limited; height = (action.layer.height || 25) * limited; } patch = { width, height }; }
    } else patch = { x: clamp(action.layer.x + dx, 0, 100), y: clamp(action.layer.y + dy, 0, 100) };
    commit({ ...current.current, layers: current.current.layers.map(layer => layer.id === action.id ? { ...layer, ...patch } : layer) }, false);
  };
  const pointerUp = (event: ReactPointerEvent<SVGSVGElement>) => { const action = drag.current; if (!action || action.pointer !== event.pointerId) return; if (artworkFingerprint(action.before) !== artworkFingerprint(projectCurrent.current)) remember(action.before, action.face); drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  const changeDimension = (axis: 'width' | 'height', value: number) => { if (!selected) return; let patch: Partial<DesignLayer> = { [axis]: value }; if (selected.type === 'image' && lockRatio) { const other = axis === 'width' ? 'height' : 'width', ratio = (selected[other] || 30) / (selected[axis] || 30); const adjusted = Math.min(value, 100 / ratio); patch = { [axis]: adjusted, [other]: adjusted * ratio }; } updateLayer(patch); };
  const upload = async (file: File, replacing?: DesignLayer) => {
    if (uploadBusy.current || pdfImport || cropTarget) return;
    setError('');
    if (!replacing && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name))) {
      if (file.size > 25 * 1024 * 1024) { setError('Choose a PDF smaller than 25 MB.'); return; }
      setPdfImport({ file, designId: projectCurrent.current.id, fingerprint: artworkFingerprint(projectCurrent.current), face: faceCurrent.current });
      return;
    }
    const designId = current.current.id, uploadFace = faceCurrent.current;
    if (!replacing && current.current.layers.length >= 100) { setError('Remove a layer before uploading another image. The limit is 100 layers.'); return; }
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError(replacing ? 'Choose a PNG, JPEG or WebP replacement image.' : 'Choose a PDF, PNG, JPEG or WebP file.'); return; }
    if (file.size > 12 * 1024 * 1024) { setError('This image is larger than 12 MB. Export a smaller image and try again.'); return; }
    uploadBusy.current = true; setUploading(true);
    let url = '';
    try {
      url = URL.createObjectURL(file);
      const image = new Image(); image.src = url; await image.decode();
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 60_000_000) throw new Error('This image exceeds 60 megapixels. Resize it before uploading.');
      const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('The image could not be read. Choose the file again.')); reader.readAsDataURL(file); });
      if (!mounted.current || current.current.id !== designId || faceCurrent.current !== uploadFace) return;
      let layer: DesignLayer;
      if (replacing) {
        const original = current.current.layers.find(item => item.id === replacing.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(replacing)) throw new Error('This image changed while the replacement was loading. Select it and try again.');
        layer = replaceLayerImage(original, p, { src, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, name: file.name.slice(0, 80) });
        commit({ ...current.current, layers: current.current.layers.map(item => item.id === layer.id ? layer : item) });
      } else {
        if (current.current.layers.length >= 100) throw new Error('This artwork reached its 100-layer limit while the image was loading. Remove a layer and upload again.');
        const dimensions = imagePercentSize(image.naturalWidth, image.naturalHeight, p);
        layer = { id: uid(), type: 'image', text: file.name.slice(0, 80), x: (100 - dimensions.width) / 2, y: (100 - dimensions.height) / 2, ...dimensions, size: 10, color: '#ffffff', rotation: 0, opacity: 1, naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight, src };
        commit({ ...current.current, layers: [...current.current.layers, layer] });
      }
      setSelectedId(layer.id); setMode('artwork'); setSideTab('design'); setMobileSheet(null);
      setStatus(replacing ? 'Image replaced. Its frame, position and rotation are preserved; crop to adjust the framing.' : `${file.name} added at its original resolution.`);
    } catch (cause) { if (mounted.current) setError(cause instanceof Error && !cause.message.includes('source image') ? cause.message : 'This image could not be opened. Export it as PNG, JPEG or WebP and try again.'); }
    finally { if (url) URL.revokeObjectURL(url); uploadBusy.current = false; if (mounted.current) setUploading(false); }
  };
  const consumeInitialFile = useEffectEvent(() => {
    if (!initialFile || consumedFile.current === initialFile) return;
    consumedFile.current = initialFile;
    void upload(initialFile);
    onInitialFileConsumed?.();
  });
  useEffect(() => { consumeInitialFile(); }, [initialFile]);
  const importPdfPages = (result: PdfImportResult) => {
    if (!pdfImport || projectCurrent.current.id !== pdfImport.designId || artworkFingerprint(projectCurrent.current) !== pdfImport.fingerprint) throw new Error('This project changed while the PDF was open. Close this window and import it again.');
    if (!result.images.length || result.images.length > 2 || new Set(result.images.map(item => item.face)).size !== result.images.length || result.images.some(item => item.face === 'back' && !supportsReverse(p))) throw new Error('Choose one page for each supported print face.');
    let next = clone(projectCurrent.current);
    for (const item of result.images) {
      const layer: DesignLayer = { id: uid(), type: 'image', text: `${result.filename} · page ${item.sourcePage}`.slice(0, 80), ...item.placement, src: item.src, naturalWidth: item.naturalWidth, naturalHeight: item.naturalHeight, size: 10, color: '#ffffff', rotation: 0, opacity: 1 };
      const page = { background: '#ffffff', layers: [layer] };
      next = item.face === 'back' ? { ...next, sides: 2, back: page } : { ...next, ...page };
    }
    commitProject(next);
    const destination = result.images[0].face;
    setSelectedFace(destination); faceCurrent.current = destination; current.current = designForFace(next, destination);
    setPdfImport(null); setSelectedId(null); setMode('artwork'); setMobileSheet(null);
    setStatus(`${result.images.length === 2 ? 'Front and back pages' : 'PDF page'} imported as image artwork. Undo restores the previous design.${result.warnings.length ? ' ' + result.warnings.join(' ') : ''}`);
  };
  const frameImage = (fill: boolean) => {
    if (selected?.type !== 'image' || !selected.naturalWidth || !selected.naturalHeight) return;
    try {
      if (fill) updateLayer({ x: 0, y: 0, width: 100, height: 100, rotation: 0, crop: cropToFrame(selected.naturalWidth, selected.naturalHeight, p.width, p.height) });
      else {
        const dimensions = imagePercentSize(selected.naturalWidth, selected.naturalHeight, p, 100);
        updateLayer({ ...dimensions, x: (100 - dimensions.width) / 2, y: (100 - dimensions.height) / 2, rotation: 0, crop: undefined });
      }
      setStatus(fill ? 'Image fills the print area. Use Crop & reframe to choose what stays in view.' : 'The complete image fits inside the print area.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The image could not fit this canvas.'); }
  };
  const exportPdf = async () => {
    setError(''); setExporting(true);
    const snapshot = clone(projectCurrent.current);
    try {
      const { exportArtworkPdf } = await import('../../lib/next/pdf-artwork');
      const blob = await exportArtworkPdf(snapshot);
      downloadArtwork(blob, `${snapshot.name.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60) || 'Avalon-artwork'}-proof.pdf`);
      if (mounted.current) setStatus('PDF proof downloaded. Each print face has its own page at the chosen dimensions, rendered at 300 DPI in RGB.');
    } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'The PDF could not be created.'); }
    finally { if (mounted.current) setExporting(false); }
  };
  const save = async () => { if (uploadBusy.current) return; setError(''); try { await onSave(clone(projectCurrent.current)); if (mounted.current) setStatus('Project saved with a new revision.'); } catch (cause) { if (mounted.current) setError(cause instanceof Error ? cause.message : 'The project could not be saved. Please try again.'); } };
  const exportFile = async (format: 'png' | 'svg', exportFace: Face = face) => { setError(''); setExporting(true); const snapshot = clone(designForFace(projectCurrent.current, exportFace)); try { if (preflightArtwork(snapshot).some(issue => issue.severity === 'error' && issue.id.endsWith('-missing'))) throw new Error('Replace the missing image before exporting this artwork.'); const blob = format === 'svg' ? new Blob([artworkSvg(snapshot)], { type: 'image/svg+xml' }) : await export300DpiPng(snapshot); downloadArtwork(blob, `${snapshot.name.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60) || 'Avalon-artwork'}-${exportFace}${format === 'png' ? '-300dpi' : ''}.${format}`); setStatus(format === 'png' ? 'PNG exported at 300 DPI. Colours are RGB; production will confirm final colour and bleed.' : 'SVG exported with editable vector text and embedded images. Keep the selected fonts available when opening it.'); } catch (cause) { setError(cause instanceof Error ? cause.message : 'The artwork could not be exported. Please try SVG instead.'); } finally { setExporting(false); } };
  const resolution = selected ? imagePpi(selected, p) : null;
  let pixelLabel = 'SVG recommended for this large format'; try { const dimensions = rasterDimensions(p); pixelLabel = `${dimensions.width.toLocaleString()} × ${dimensions.height.toLocaleString()} px at 300 DPI`; } catch {}
  const resources: { id: Resource; label: string; icon: typeof Type }[] = [
    { id: 'templates', label: 'Templates', icon: LayoutTemplate },
    { id: 'text', label: 'Text', icon: Type },
    { id: 'uploads', label: 'Uploads', icon: ImagePlus },
    { id: 'elements', label: 'Elements', icon: Square },
    { id: 'brand', label: 'Brand', icon: Palette },
    { id: 'layers', label: 'Layers', icon: Layers },
  ];
  const candidate = templatePreviews.find(template => template.id === templateCandidate);
  const closeSheet = () => { setMobileSheet(null); setResource(null); setTemplateCandidate(null); };

  return <section className="studio-app" aria-label="Artwork studio">
    <header className="studio-heading">
      <div className="studio-document">
        <button className="studio-back" onClick={onExit} disabled={savingreturn || uploading || !onExit} aria-label={onReturn ? 'Back to estimate' : 'All projects'} title={onReturn ? 'Back to estimate' : 'All projects'}><ArrowLeft size={19}/><span>{savingreturn ? 'Saving…' : onReturn ? 'Back to estimate' : 'All projects'}</span></button>
        <span className="studio-heading-divider"/>
        <div className="studio-document-title">
          <input className="studio-project-name" aria-label="Project name" maxLength={80} value={design.name}
            onChange={event => commit({ ...current.current, name: event.target.value })}
            onBlur={() => { if (!current.current.name.trim()) commit({ ...current.current, name: 'Untitled project' }); }}/>
          <p>{p.name}<span>·</span>{p.width} × {p.height} mm</p>
        </div>
      </div>
      <div className="studio-heading-actions">
        <button className="studio-button studio-upload-action" aria-label="Upload artwork" disabled={uploading} onClick={() => uploadInput.current?.click()}><Upload size={15}/><span>Upload artwork</span></button>
        {onStorage && <button className={`studio-storage ${storageStatus === 'error' || storageStatus === 'conflict' ? 'needs-attention' : ''}`} onClick={onStorage} title="Workspace storage and backups" aria-label={`Open storage and backups. ${storageStatus === 'saved' ? 'Saved on this device' : storageStatus === 'saving' ? 'Saving changes' : storageStatus === 'error' ? 'Changes could not be saved' : storageStatus === 'conflict' ? 'Storage conflict needs attention' : 'Loading workspace'}`}>
          {storageStatus === 'error' || storageStatus === 'conflict' ? <AlertTriangle size={15}/> : <HardDrive size={15}/>}<span>{storageStatus === 'saved' ? 'Saved on device' : storageStatus === 'saving' ? 'Saving…' : storageStatus === 'error' || storageStatus === 'conflict' ? 'Check storage' : 'Loading…'}</span>
        </button>}
        <button className="studio-button studio-save" aria-label="Save project" onClick={() => void save()} disabled={saving || uploading || !design.name.trim()}><Save size={15}/><span>{saving ? 'Saving…' : 'Save project'}</span></button>
        <button className="studio-button studio-primary" disabled={savingreturn || uploading} onClick={() => { if (!uploadBusy.current) { if (onReturn) onReturn(); else setProofOpen(true); } }}><ShieldCheck size={15}/><span>{savingreturn ? 'Updating…' : onReturn ? returnLabel : 'Review artwork'}</span></button>
      </div>
    </header>

    <div className="studio-toolbar">
      <div className="studio-tools">
        <IconButton label="Undo (⌘/Ctrl Z)" onClick={undo} disabled={uploading || !historyCounts.past}><Undo2 size={17}/></IconButton>
        <IconButton label="Redo (⌘/Ctrl Shift Z)" onClick={redo} disabled={uploading || !historyCounts.future}><Redo2 size={17}/></IconButton>
        <span className="studio-divider"/>
        <span className="studio-context">{selected ? selected.type === 'text' ? 'Text selected' : selected.type === 'image' ? 'Image selected' : 'Shape selected' : `${face === 'front' ? 'Front' : 'Back'} artwork`}</span>
      </div>
      <div className="studio-view-switch" aria-label="Canvas view">
        <button className={mode === 'artwork' ? 'active' : ''} aria-pressed={mode === 'artwork'} onClick={() => setMode('artwork')}><MousePointer2 size={14}/>Design</button>
        <button className={mode === 'mockup' ? 'active' : ''} aria-pressed={mode === 'mockup'} onClick={() => setMode('mockup')}><Box size={14}/>Preview</button>
      </div>
      <button className="studio-inspector-toggle" aria-label={mobileSheet === 'inspector' ? 'Close properties' : 'Open properties'} onClick={() => { setMobileSheet(mobileSheet === 'inspector' ? null : 'inspector'); setSideTab('design'); }}><PanelRight size={17}/><span>Properties</span></button>
      <ol className="studio-journey" aria-label="Print project progress"><li className="complete"><Check size={12}/><span>Product</span></li><li aria-current="step"><b>2</b><span>Artwork</span></li><li><b>3</b><span>Review</span></li></ol>
    </div>

    <div className="studio-workbench">
      <nav className="studio-rail" aria-label="Design resources">
        {resources.map(({ id, label, icon: Icon }) => <button key={id} className={resource === id ? 'active' : ''} aria-label={`Open ${label.toLowerCase()}`} aria-pressed={resource === id} onClick={() => openResource(id)}><Icon size={20}/><span>{label}</span></button>)}
      </nav>
      {mobileSheet && <button className={`studio-sheet-scrim studio-scrim-${mobileSheet}`} aria-label="Close editor panel" onClick={() => setMobileSheet(null)}/>}
      {resource && <aside className={`studio-resources ${mobileSheet === 'resources' ? 'studio-panel-open' : ''}`} aria-label={`${resource} panel`}>
        <div className="studio-panel-heading"><div><h2>{resources.find(item => item.id === resource)?.label}</h2><span>{resource === 'templates' ? 'A considered place to start.' : resource === 'uploads' ? 'Your images, ready to use.' : resource === 'layers' ? `${design.layers.length} ${design.layers.length === 1 ? 'object' : 'objects'} on this artwork` : resource === 'brand' ? 'Make it unmistakably yours.' : resource === 'text' ? 'Give your idea a voice.' : 'Build with simple forms.'}</span></div><IconButton label="Close resources" onClick={closeSheet}><X size={17}/></IconButton></div>
        <div className="studio-resource-scroll">
          {resource === 'templates' && (candidate ? <div className="studio-template-confirm">
            <button className="studio-text-button" onClick={() => setTemplateCandidate(null)}><ArrowLeft size={14}/>All templates</button>
            <div className="studio-template-large"><DesignPreview design={candidate.preview}/></div>
            <h3>{candidate.name}</h3><p>This replaces the {face} artwork only. Your other print face, project name and print settings stay in place, and you can undo the change.</p>
            <button className="studio-button studio-primary studio-full" onClick={() => applyTemplate(candidate.id)}>Apply template</button>
            <button className="studio-button studio-full" onClick={() => setTemplateCandidate(null)}>Keep exploring</button>
          </div> : <>
            <label className="studio-template-search"><span>Find a layout</span><input value={templateSearch} onChange={event => setTemplateSearch(event.target.value)} placeholder="Cards, menu, event…"/></label>
            <div className="studio-resource-caption"><span>EDITABLE LAYOUTS</span><b>{designTemplates.length}</b></div>
            <div className="studio-template-grid">{templatePreviews.filter(template => `${template.name} ${template.category}`.toLowerCase().includes(templateSearch.toLowerCase())).map(template => <button key={template.id} className="studio-template-card" onClick={() => setTemplateCandidate(template.id)} aria-label={`Preview ${template.name} template`}><div className="studio-template-art"><DesignPreview design={template.preview}/></div><strong>{template.name}</strong><span>{template.category}</span></button>)}</div>
            <p className="studio-resource-note">Each layout adapts to your selected print size.</p>
          </>)}
          {resource === 'text' && <>
            <div className="studio-text-presets">
              <button onClick={() => addText('heading')}><span className="studio-text-heading">Add a heading</span><Plus size={17}/></button>
              <button onClick={() => addText('subheading')}><span className="studio-text-subheading">Add a subheading</span><Plus size={17}/></button>
              <button onClick={() => addText('body')}><span className="studio-text-body">Add body text</span><Plus size={16}/></button>
            </div>
            <div className="studio-resource-caption"><span>YOUR TYPEFACE</span></div>
            <div className="studio-type-sample" style={{ fontFamily: brand.font }}><span>Aa</span><strong>{brand.font}</strong><p>The details make the difference.</p></div>
            <p className="studio-resource-note">Select any text on the canvas to change its font, colour and size.</p>
          </>}
          {resource === 'uploads' && <>
            <button className="studio-upload-drop" onClick={() => uploadInput.current?.click()} disabled={uploading}><span><Upload size={25}/></span><strong>{uploading ? 'Adding your artwork…' : 'Upload your artwork'}</strong><small>PDF · up to 25 MB<br/>PNG, JPG or WebP · up to 12 MB</small></button>
            <div className="studio-upload-guide"><FileText size={19}/><div><strong>Already designed elsewhere?</strong><p>Choose PDF pages for your print faces. You can preview their size before importing.</p></div></div>
            <div className="studio-resource-caption"><span>IN THIS ARTWORK</span><b>{uploadedImages.length}</b></div>
            {uploadedImages.length ? <div className="studio-upload-grid">{uploadedImages.map(layer => <button key={layer.id} title={`Add another ${layer.text}`} onClick={() => insertLayer({ ...layer, id: uid(), x: clamp(layer.x + 4, 0, 100), y: clamp(layer.y + 4, 0, 100) })}><img src={layer.src} alt={layer.text}/><span>{layer.text}</span><Plus size={15}/></button>)}</div> : <div className="studio-resource-empty"><ImagePlus size={28}/><h3>Your files belong here.</h3><p>Drop a photograph, logo or finished PDF onto the canvas to get started.</p></div>}
            {uploadedImages.length > 0 && <p className="studio-resource-note">Click an image to add another copy to your design.</p>}
          </>}
          {resource === 'elements' && <>
            <div className="studio-element-grid">
              <button onClick={() => addShape('rectangle')}><span className="studio-element-rectangle"/><strong>Rectangle</strong></button>
              <button onClick={() => addShape('square')}><span className="studio-element-square"/><strong>Square</strong></button>
              <button onClick={() => addShape('rule')}><span className="studio-element-rule"/><strong>Divider</strong></button>
              <button onClick={() => addShape('panel')}><span className="studio-element-panel"/><strong>Colour panel</strong></button>
            </div>
            <p className="studio-resource-note">Use colour blocks to frame your message. Change the colour, proportions and opacity in Design.</p>
          </>}
          {resource === 'brand' && <>
            <div className="studio-brand-card"><span>YOUR BRAND KIT</span><h3>{brand.name || 'My brand'}</h3><p>{brand.tagline || 'Your visual signature.'}</p></div>
            <div className="studio-resource-caption"><span>COLOUR PALETTE</span></div>
            <div className="studio-palette">{[{ color: brand.primary, name: 'Primary' }, { color: brand.secondary, name: 'Secondary' }, { color: brand.accent, name: 'Accent' }].map(({ color, name }) => <button key={name} onClick={() => selected && selected.type !== 'image' ? updateLayer({ color }) : commit({ ...current.current, background: color })} aria-label={`Apply ${name.toLowerCase()} brand colour`}><span style={{ background: color }}/><strong>{name}<small>{color.toUpperCase()}</small></strong></button>)}</div>
            <p className="studio-resource-note">Colours apply to selected text or shapes. Deselect a layer to change the background.</p>
            <div className="studio-type-sample compact" style={{ fontFamily: brand.font }}><span>Aa</span><strong>{brand.font}</strong></div>
            <button className="studio-button studio-full" onClick={useBrand}><Palette size={15}/>Apply brand to artwork</button>
          </>}
          {resource === 'layers' && <div className="studio-layer-list">
            {[...design.layers].reverse().map((layer, reverseIndex) => <div key={layer.id} className={`studio-layer-row ${selectedId === layer.id ? 'selected' : ''}`}>
              <button className="studio-layer-select" onClick={() => { setSelectedId(layer.id); setMode('artwork'); setSideTab('design'); setMobileSheet(null); }}>
                <span className="studio-layer-glyph">{layer.type === 'text' ? <Type size={17}/> : layer.type === 'image' ? <ImagePlus size={17}/> : <Square size={17}/>}</span>
                <span><strong>{layer.text.replace(/\n/g, ' ').slice(0, 30) || 'Empty text'}</strong><small>{layer.type} · {Math.round(layer.opacity * 100)}%</small></span>
              </button>
              <div className="studio-layer-order"><IconButton label={`Bring ${layer.type} forward`} disabled={reverseIndex === 0} onClick={() => reorder(layer.id, 1)}><ChevronUp size={14}/></IconButton><IconButton label={`Send ${layer.type} backward`} disabled={reverseIndex === design.layers.length - 1} onClick={() => reorder(layer.id, -1)}><ChevronDown size={14}/></IconButton></div>
            </div>)}
            {!design.layers.length && <p className="studio-resource-note">Your canvas is clear. Add text, an image or an element to get started.</p>}
            <p className="studio-resource-note">Top layers appear in front. Use the arrows to change their order.</p>
          </div>}
        </div>
      </aside>}

      <div className="studio-canvas-column">
        {supportsReverse(p) && <div className="studio-face-strip" aria-label="Print faces">
          <div role="group" aria-label="Choose artwork face">{faces.map(item => <button key={item.face} aria-label={`Edit ${item.face} artwork`} aria-pressed={face === item.face} disabled={uploading} onClick={() => changeFace(item.face)}><span className="studio-face-thumb"><DesignPreview design={item.design}/></span><span>{item.label}<small>{item.design.layers.length ? `${item.design.layers.length} ${item.design.layers.length === 1 ? 'object' : 'objects'}` : 'Add artwork'}</small></span></button>)}</div>
          {project.sides === 1 ? <button className="studio-add-face" disabled={uploading} onClick={() => setSides(2)}><Plus size={15}/>Add back</button> : <span className="studio-face-count">Two-sided print</span>}
        </div>}
        <div className="studio-stage" ref={stage} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file && !uploading) void upload(file); }}>
          {mode === 'artwork' ? <div className="studio-sheet-space" style={{ minWidth: sheetWidth + 90, minHeight: sheetHeight + 90 }} onPointerDown={event => { if (event.target === event.currentTarget) setSelectedId(null); }}>
            <div className="studio-sheet" style={{ width: sheetWidth, height: sheetHeight }}>
              <div className="studio-measure studio-measure-width">{p.width} mm</div><div className="studio-measure studio-measure-height">{p.height} mm</div>
              <Artwork design={design} selectedId={selectedId} onSelect={setSelectedId} onLayerPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} grid={grid} safeArea={safeArea} controlScale={1000 / sheetWidth}/>
            </div>
          </div> : <div className="studio-3d"><Suspense fallback={<div className="studio-loading"><Box size={22}/>Preparing your product preview…</div>}><Mockup design={design} faceLabel={face === 'front' ? 'Front' : 'Back'}/></Suspense></div>}
        </div>
        <footer className="studio-canvas-footer">
          <button className={`studio-checks-status ${blocking.length ? 'has-errors' : ''}`} onClick={() => { setSideTab('print'); setMobileSheet('inspector'); }}><ShieldCheck size={14}/><span>{blocking.length ? `${blocking.length} to fix` : issues.length ? `${issues.length} to review` : 'Checks passed'}</span></button>
          <div className="studio-canvas-controls">
            {mode === 'artwork' && <><IconButton label="Show alignment grid" aria-pressed={grid} onClick={() => setGrid(value => !value)}><Grid3X3 size={16}/></IconButton><IconButton label="Show 3 mm safe area" aria-pressed={safeArea} onClick={() => setSafeArea(value => !value)}><ShieldCheck size={16}/></IconButton><span className="studio-divider"/><IconButton label="Zoom out" onClick={() => setZoom(value => Math.max(.25, value - .25))} disabled={zoom <= .25}><ZoomOut size={16}/></IconButton><button className="studio-zoom-label" title="Fit artwork to screen" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button><IconButton label="Zoom in" onClick={() => setZoom(value => Math.min(3, value + .25))} disabled={zoom >= 3}><ZoomIn size={16}/></IconButton><IconButton label="Fit artwork to screen" onClick={() => setZoom(1)}><Maximize size={16}/></IconButton></>}
          </div>
          <span className="studio-face-label">{face === 'back' ? 'Back' : 'Front'} · {faces.length} print {faces.length === 1 ? 'face' : 'faces'}</span>
        </footer>
      </div>

      <aside className={`studio-inspector ${mobileSheet === 'inspector' ? 'studio-panel-open' : ''}`} aria-label="Design properties">
        <div className="studio-side-tabs" role="tablist" aria-label="Inspector">
          <button role="tab" aria-selected={sideTab === 'design'} className={sideTab === 'design' ? 'active' : ''} onClick={() => setSideTab('design')}>Design</button>
          <button role="tab" aria-selected={sideTab === 'print'} className={sideTab === 'print' ? 'active' : ''} onClick={() => setSideTab('print')}>Print</button>
          <IconButton label="Close properties" onClick={() => setMobileSheet(null)}><X size={17}/></IconButton>
        </div>
        <div className="studio-inspector-scroll">
          {sideTab === 'design' ? <>
            <div className="studio-property-section">
              <div className="studio-section-heading"><h3>{selected ? selected.type === 'text' ? 'Typography' : selected.type === 'image' ? 'Image' : 'Shape' : 'Canvas'}</h3>{selected && <button className="studio-text-button" onClick={() => setSelectedId(null)}>Deselect</button>}</div>
              {selected ? <>
                {selected.type === 'text' && <>
                  <label className="studio-field"><span>Text content</span><textarea value={selected.text} maxLength={10000} rows={3} onChange={event => updateLayer({ text: event.target.value })}/></label>
                  <label className="studio-field"><span>Typeface</span><select value={selected.font || 'Arial'} onChange={event => updateLayer({ font: event.target.value })}>{ARTWORK_FONTS.map(font => <option key={font}>{font}</option>)}</select></label>
                  <div className="studio-field-grid"><NumericField label="Size" value={selected.size / 100 * p.width * 72 / 25.4} min={p.width * .0001 * 72 / 25.4} max={p.width * .5 * 72 / 25.4} suffix="pt" onChange={value => updateLayer({ size: value * 25.4 / 72 / p.width * 100 })}/><label className="studio-field"><span>Weight</span><select value={selected.weight || 700} onChange={event => updateLayer({ weight: Number(event.target.value) })}><option value={400}>Regular</option><option value={500}>Medium</option><option value={600}>Semibold</option><option value={700}>Bold</option><option value={900}>Heavy</option></select></label></div>
                </>}
                {selected.type !== 'image' && <label className="studio-color-field"><span>Fill colour</span><input type="color" value={selected.color} onChange={event => updateLayer({ color: event.target.value })}/><code>{selected.color.toUpperCase()}</code></label>}
                {selected.type === 'image' && <div className="studio-image-tools">
                  <div className="studio-selected-image"><img src={selected.src} alt={selected.text}/><span>{selected.text}</span></div>
                  <div className="studio-image-tool-row"><button className="studio-button" disabled={uploading || !selected.src} onClick={() => setCropTarget({ layer: structuredClone(selected), designId: projectCurrent.current.id, fingerprint: artworkFingerprint(projectCurrent.current), face: faceCurrent.current })}><Crop size={15}/>Crop & reframe</button><button className="studio-button" disabled={uploading} onClick={() => { replaceTarget.current = {layer: structuredClone(selected), designId: projectCurrent.current.id, face: faceCurrent.current}; replaceInput.current?.click(); }}><RefreshCw size={15}/>Replace image</button></div>
                  <div className="studio-image-fit"><button onClick={() => frameImage(false)}><Maximize size={14}/>Fit to canvas</button><button onClick={() => frameImage(true)}><Crop size={14}/>Fill canvas</button></div>
                  <p>The original image is kept. Crop and replacement changes can be undone.</p>
                </div>}
                <div className="studio-section-heading studio-section-spacing"><h3>Transform</h3></div>
                <div className="studio-field-grid"><NumericField label="X position" value={selected.x / 100 * p.width} min={0} max={p.width} suffix="mm" onChange={value => updateLayer({ x: value / p.width * 100 })}/><NumericField label="Y position" value={selected.y / 100 * p.height} min={0} max={p.height} suffix="mm" onChange={value => updateLayer({ y: value / p.height * 100 })}/></div>
                {selected.type !== 'text' && <>
                  <div className="studio-field-grid"><NumericField label="Width" value={(selected.width || 30) / 100 * p.width} min={.001 * p.width} max={p.width} suffix="mm" onChange={value => changeDimension('width', value / p.width * 100)}/><NumericField label="Height" value={(selected.height || 25) / 100 * p.height} min={.001 * p.height} max={p.height} suffix="mm" onChange={value => changeDimension('height', value / p.height * 100)}/></div>
                  {selected.type === 'image' && <><label className="studio-check"><input type="checkbox" checked={lockRatio} onChange={event => setLockRatio(event.target.checked)}/>Keep image proportions</label><p className="studio-image-resolution">{selected.naturalWidth?.toLocaleString()} × {selected.naturalHeight?.toLocaleString()} original pixels<br/>{resolution ? `${Math.round(resolution.minimum)} PPI at this print size` : 'Original resolution unavailable'}</p></>}
                </>}
                <div className="studio-field-grid"><NumericField label="Rotation" value={selected.rotation} min={-360} max={360} step={1} suffix="°" onChange={value => updateLayer({ rotation: value })}/><NumericField label="Opacity" value={selected.opacity * 100} min={0} max={100} step={1} suffix="%" onChange={value => updateLayer({ opacity: value / 100 })}/></div>
                <span className="studio-field-label">Align to canvas</span>
                <div className="studio-align"><IconButton label="Align left" onClick={() => updateLayer(alignLayer(selected, p, 'left'))}><AlignLeft size={16}/></IconButton><IconButton label="Center horizontally" onClick={() => updateLayer(alignLayer(selected, p, 'center'))}><AlignCenter size={16}/></IconButton><IconButton label="Align right" onClick={() => updateLayer(alignLayer(selected, p, 'right'))}><AlignRight size={16}/></IconButton><IconButton label="Align top" onClick={() => updateLayer(alignLayer(selected, p, 'top'))}><ArrowUp size={16}/></IconButton><IconButton label="Center vertically" onClick={() => updateLayer(alignLayer(selected, p, 'middle'))}><AlignCenter size={16} style={{ transform: 'rotate(90deg)' }}/></IconButton><IconButton label="Align bottom" onClick={() => updateLayer(alignLayer(selected, p, 'bottom'))}><ArrowDown size={16}/></IconButton></div>
                <div className="studio-layer-actions"><button className="studio-button" onClick={duplicate}><Copy size={14}/>Duplicate</button><button className="studio-button studio-danger" onClick={remove}><Trash2 size={14}/>Delete</button></div>
              </> : <>
                <div className="studio-document-size"><span>{p.width}<small>×</small>{p.height}</span><b>millimetres</b></div>
                <label className="studio-color-field"><span>Background</span><input type="color" value={design.background} onChange={event => commit({ ...current.current, background: event.target.value })}/><code>{design.background.toUpperCase()}</code></label>
                <span className="studio-field-label">Quick colours</span>
                <div className="studio-brand-swatches">{[brand.primary, brand.secondary, brand.accent, '#ffffff', '#171b18'].map((color, index) => <button key={`${color}-${index}`} aria-label={`Set background to ${color}`} style={{ background: color }} onClick={() => commit({ ...current.current, background: color })}>{design.background === color && <Check size={14} color={contrastingInk(color)}/>}</button>)}</div>
                <div className="studio-selection-tip"><MousePointer2 size={19}/><p>Select an object on the canvas to edit its appearance and position.</p></div>
              </>}
            </div>
            <div className="studio-property-section studio-document-info"><h3>Document</h3><dl><div><dt>Product</dt><dd>{p.name}</dd></div><div><dt>Layers</dt><dd>{design.layers.length}<button className="studio-text-button" onClick={() => openResource('layers')}>View layers</button></dd></div><div><dt>Print faces</dt><dd>{faces.length}</dd></div></dl><button className="studio-button studio-full" onClick={() => { setSideTab('print'); }}><Download size={14}/>Export & print settings</button></div>
          </> : <>
            <div className="studio-property-section">
              <div className="studio-section-heading"><h3>Print specification</h3><span className="studio-pill">CAD</span></div>
              <label className="studio-field"><span>Quantity</span><input type="number" min={1} max={100000} step={1} value={design.quantity} onChange={event => { const value = Number(event.target.value); if (Number.isInteger(value) && value >= 1 && value <= 100000) commit({ ...current.current, quantity: value }); }}/></label>
              <label className="studio-field"><span>Service</span><select value={design.tier} onChange={event => commit({ ...current.current, tier: event.target.value as Tier })}><option>Value</option><option>Design Plus</option><option>Priority</option></select></label>
              <label className="studio-field"><span>Finish</span><select value={design.finish} onChange={event => commit({ ...current.current, finish: event.target.value })}>{finishesFor(p).map(finish => <option key={finish}>{finish}</option>)}</select></label>
              {supportsReverse(p) && <label className="studio-field"><span>Printed sides</span><select value={project.sides} disabled={uploading} onChange={event => setSides(Number(event.target.value) as 1 | 2)}><option value={1}>Front only</option><option value={2}>Front and back</option></select></label>}{project.sides !== 1 && !supportsReverse(p) && <button className="studio-button studio-full" onClick={() => setSides(1)}>Use one print face</button>}{project.sides === 1 && project.back && supportsReverse(p) && <p className="studio-fineprint">Your back artwork is retained. Select front and back to include it in print.</p>}
              <div className="studio-estimate"><span>{quote?.quoteOnly ? 'Custom production' : 'Estimated print subtotal'}</span><strong>{quote?.quoteOnly ? 'Custom quote' : quote ? money(quote.subtotal) : 'Check specification'}</strong><small>{quote?.quoteOnly ? 'Review your artwork to prepare a quote request.' : 'Tax and delivery excluded. Subject to confirmation.'}</small></div>
            </div>
            <div className="studio-property-section">
              <div className="studio-section-heading"><h3>Export artwork</h3><Download size={15}/></div>
              <button className="studio-button studio-full studio-pdf-export" disabled={exporting} onClick={() => void exportPdf()}><FileText size={17}/>{exporting ? 'Preparing…' : 'Download PDF proof'}</button>
              <p className="studio-fineprint">{faces.length === 2 ? 'Front and back in one PDF.' : 'One page at your print dimensions.'} Rendered at 300 DPI. RGB proof for review.</p>
              {faces.map(item => <div className="studio-export-face" key={item.face}><strong>{item.label}</strong><div className="studio-export-buttons"><button className="studio-button" aria-label={`Export ${item.face} as 300 DPI PNG`} disabled={exporting} onClick={() => void exportFile('png', item.face)}>{exporting ? 'Preparing…' : 'PNG · 300 DPI'}</button><button className="studio-button" aria-label={`Export ${item.face} as SVG`} disabled={exporting} onClick={() => void exportFile('svg', item.face)}>Vector SVG</button></div></div>)}
              <p className="studio-fineprint">{pixelLabel}. Each file contains its labelled print face at trim size, in RGB.</p>
            </div>
            <div className="studio-property-section studio-preflight">
              <div className="studio-section-heading"><h3><ShieldCheck size={15}/>Artwork checks</h3><span className={`studio-pill ${blocking.length ? 'studio-pill-error' : ''}`}>{blocking.length ? `${blocking.length} to fix` : issues.length ? `${issues.length} to review` : 'Passed'}</span></div>
              {issues.length ? <div className="studio-issues">{issues.map(issue => <button key={issue.id} className={`studio-issue ${issue.severity}`} onClick={() => { if (issue.face) changeFace(issue.face); if (issue.layerId) setSelectedId(issue.layerId); setMode('artwork'); setSideTab('design'); setMobileSheet(null); }}><AlertTriangle size={14}/><span><strong>{issue.title}</strong><small>{issue.detail}</small></span></button>)}</div> : <p className="studio-muted">No missing images or obvious layout problems found.</p>}
              <button className="studio-button studio-full studio-review-action" disabled={uploading} onClick={() => { if (!uploadBusy.current) setProofOpen(true); }}><ShieldCheck size={15}/>Review artwork</button>
              <details className="studio-production-details"><summary>Before production</summary><p>Check spelling and supplier specifications. RGB screen colour may differ from print. Automated checks do not validate colour separations, overprint, dielines, folds, embroidery or bleed.</p></details>
            </div>
          </>}
        </div>
      </aside>
    </div>

    <input ref={uploadInput} hidden type="file" accept="application/pdf,.pdf,image/png,image/jpeg,image/webp" aria-label="Choose artwork file" onChange={event => { const file = event.target.files?.[0]; if (file) void upload(file); event.target.value = ''; }}/>
    <input ref={replaceInput} hidden type="file" accept="image/png,image/jpeg,image/webp" aria-label="Choose replacement image" onChange={event => { const file = event.target.files?.[0], target = replaceTarget.current; if (file && target) { if (target.designId === projectCurrent.current.id && target.face === faceCurrent.current) void upload(file, target.layer); else setError('The artwork changed while choosing a replacement. Select the image again.'); } event.target.value = ''; replaceTarget.current = null; }}/>
    {uploading && <div className="studio-file-loading" role="status">Preparing your image…</div>}
    {pdfImport && <Suspense fallback={<div className="studio-file-loading" role="status">Opening PDF tools…</div>}><PdfImportDialog file={pdfImport.file} product={p} activeFace={pdfImport.face} supportsBack={supportsReverse(p)} onClose={() => setPdfImport(null)} onImport={importPdfPages}/></Suspense>}
    {cropTarget && <Suspense fallback={<div className="studio-file-loading" role="status">Opening image tools…</div>}><ImageCropEditor key={`${cropTarget.face}-${cropTarget.layer.id}`} layer={cropTarget.layer} product={p} onCancel={() => setCropTarget(null)} onApply={crop => {
      if (projectCurrent.current.id !== cropTarget.designId || artworkFingerprint(projectCurrent.current) !== cropTarget.fingerprint || faceCurrent.current !== cropTarget.face) { setCropTarget(null); setError('This artwork changed while the crop tool was open. Select the image and try again.'); return; }
      commit({ ...current.current, layers: current.current.layers.map(layer => layer.id === cropTarget.layer.id ? { ...layer, crop } : layer) });
      setCropTarget(null); setStatus('Image framing updated. The original image is preserved.');
    }}/></Suspense>}
    {(error || status) && <div className={`studio-notice ${error ? 'studio-error' : ''}`} role={error ? 'alert' : 'status'}>{error ? <AlertTriangle size={17}/> : <CheckCircle2 size={17}/>}<span>{error || status}</span><button aria-label="Dismiss message" onClick={() => { setError(''); setStatus(''); }}><X size={15}/></button></div>}
    {proofOpen && <div className="studio-modal-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) setProofOpen(false); }}>
      <div ref={proofDialog} className="studio-proof" role="dialog" aria-modal="true" aria-labelledby="studio-proof-title">
        <div className="studio-proof-heading"><div><span className="studio-eyebrow">ARTWORK REVIEW</span><h2 id="studio-proof-title">Ready for a closer look?</h2></div><IconButton label="Close artwork review" onClick={() => setProofOpen(false)}><X size={21}/></IconButton></div>
        <div className="studio-proof-body">
          <div className="studio-proof-faces">{faces.map(item => <figure key={item.face}><figcaption>{item.label}</figcaption><div className="studio-proof-art"><DesignPreview design={item.design}/></div></figure>)}</div>
          <div className="studio-proof-details"><h3>{design.name}</h3><p>{p.name} · {p.width} × {p.height} mm<br/>{design.quantity.toLocaleString()} {design.quantity === 1 ? 'item' : 'items'} · {design.finish} · {design.tier}<br/>{faces.length === 2 ? 'Front and back' : 'Front only'}</p>
            <div className={`studio-proof-state ${blocking.length ? 'studio-error' : ''}`}><ShieldCheck size={18}/>{blocking.length ? `${blocking.length} issue${blocking.length > 1 ? 's' : ''} must be fixed first` : issues.length ? `${issues.length} artwork warning${issues.length > 1 ? 's' : ''} to review` : 'Automated artwork checks passed'}</div>
            {issues.length > 0 && <ul className="studio-proof-warnings">{issues.map(issue => <li key={issue.id}>{issue.title}</li>)}</ul>}
            <fieldset><legend>Confirm each item for {faces.length === 2 ? 'both print faces' : 'this artwork'}</legend>{['I checked the spelling, contact details and content.', 'I checked positioning, cropped edges and the original image quality.', 'I understand this is an RGB preview; final colour, bleed and production specifications need confirmation.'].map((label, i) => <label className="studio-check" key={label}><input type="checkbox" checked={checks[i]} onChange={event => setCheckState({ fingerprint, values: checks.map((value, index) => index === i ? event.target.checked : value) })}/><span>{label}</span></label>)}</fieldset>
            {reviewed === fingerprint && <p className="studio-review-complete"><CheckCircle2 size={16}/>You reviewed this exact artwork in this session.</p>}
            <p className="studio-fineprint">Changing the artwork resets this checklist. This review does not place or pay for an order.</p>
          </div>
        </div>
        <div className="studio-proof-footer"><button className="studio-button" onClick={() => setProofOpen(false)}>Continue editing</button><button className="studio-button studio-primary" disabled={savingreturn || uploading || blocking.length > 0 || !checks.every(Boolean)} onClick={() => { setReviewed(fingerprint); setProofOpen(false); onQuote(clone(projectCurrent.current)); }}><Check size={17}/>{savingreturn ? 'Updating…' : onReturn ? returnLabel : 'Continue to estimate'}</button></div>
      </div>
    </div>}
  </section>;
}
