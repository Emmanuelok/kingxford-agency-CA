import { useEffect, useEffectEvent, useId, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Crop, Move, RotateCcw, X } from 'lucide-react';
import type { DesignLayer, ImageCrop, Product } from '../../lib/presswerk/catalog';
import { cropToFrame, imageCrop, imagePpi, PRINT_PPI_WARNING_THRESHOLD, safeImageSource } from '../../lib/next/artwork';
import './image-crop-editor.css';

type Props = {
  layer: DesignLayer;
  product: Pick<Product, 'width' | 'height'>;
  onApply: (crop: ImageCrop) => void;
  onCancel: () => void;
};
type CropState = { zoom: number; x: number; y: number };
const clamp = (n: number, low = 0, high = 1) => Math.min(high, Math.max(low, n));

/** This dialog edits source coordinates only; the uploaded file remains untouched. */
export default function ImageCropEditor({ layer, product, onApply, onCancel }: Props) {
  const titleId = useId(), descriptionId = useId(), dialog = useRef<HTMLDivElement>(null);
  const frameWidth = (layer.width || 30) / 100 * product.width, frameHeight = (layer.height || 25) / 100 * product.height;
  const src = safeImageSource(layer.src), naturalWidth = layer.naturalWidth || 0, naturalHeight = layer.naturalHeight || 0;
  let base: ImageCrop | null = null;
  try { if (src && naturalWidth > 0 && naturalHeight > 0) base = cropToFrame(naturalWidth, naturalHeight, frameWidth, frameHeight); } catch { /* Unsupported dimensions are explained in the dialog. */ }
  const [state, setState] = useState<CropState>(() => {
    if (!base || !layer.crop) return { zoom: 1, x: .5, y: .5 };
    const original = imageCrop(layer), zoom = clamp(Math.max(base.width / original.width, base.height / original.height), 1, Math.min(8, base.width / .001, base.height / .001));
    const adjusted = cropToFrame(naturalWidth, naturalHeight, frameWidth, frameHeight, zoom);
    return { zoom, x: adjusted.width < 1 ? clamp((original.x + original.width / 2 - adjusted.width / 2) / (1 - adjusted.width)) : .5, y: adjusted.height < 1 ? clamp((original.y + original.height / 2 - adjusted.height / 2) / (1 - adjusted.height)) : .5 };
  });
  const drag = useRef<{ pointer: number; clientX: number; clientY: number; width: number; height: number; crop: ImageCrop } | null>(null);
  const crop = base ? cropToFrame(naturalWidth, naturalHeight, frameWidth, frameHeight, state.zoom, state) : null;
  const resolution = crop ? imagePpi({ ...layer, crop }, product) : null;
  const maximumZoom = base ? Math.min(8, base.width / .001, base.height / .001) : 8;
  const cancel = useEffectEvent(onCancel);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [tabindex="0"]') || []);
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); cancel(); return; }
      if (event.key !== 'Tab') return;
      const elements = focusable(), first = elements[0], last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !crop) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    const box = event.currentTarget.getBoundingClientRect();
    drag.current = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, width: box.width, height: box.height, crop };
  };
  const moveDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = drag.current; if (!start || start.pointer !== event.pointerId) return;
    const x = start.crop.x - (event.clientX - start.clientX) / start.width * start.crop.width;
    const y = start.crop.y - (event.clientY - start.clientY) / start.height * start.crop.height;
    setState(value => ({ ...value, x: start.crop.width < 1 ? clamp(x / (1 - start.crop.width)) : .5, y: start.crop.height < 1 ? clamp(y / (1 - start.crop.height)) : .5 }));
  };
  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => { if (drag.current?.pointer !== event.pointerId) return; drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); };
  return <div className="image-crop-backdrop" onPointerDown={event => { if (event.target === event.currentTarget) onCancel(); }}>
    <div className="image-crop-dialog" ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <header className="image-crop-header"><span className="image-crop-symbol"><Crop size={22}/></span><div><h2 id={titleId}>Make the frame yours</h2><p id={descriptionId}>Reposition the image to choose what appears in print.</p></div><button type="button" className="image-crop-close" aria-label="Close crop editor" onClick={onCancel}><X size={20}/></button></header>
      {crop && src ? <>
        <div className="image-crop-stage">
          <div className="image-crop-frame" style={{ width: Math.min(440, 320 * frameWidth / frameHeight), aspectRatio: `${frameWidth} / ${frameHeight}`, '--image-crop-mobile-width': `${240 * frameWidth / frameHeight}px` } as CSSProperties} onPointerDown={beginDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}>
            <svg viewBox={`${crop.x * 1000} ${crop.y * 1000} ${crop.width * 1000} ${crop.height * 1000}`} preserveAspectRatio="none" role="img" aria-label={`Crop preview for ${layer.text || 'your image'}`}><image width={1000} height={1000} href={src} preserveAspectRatio="none"/></svg>
            <div className="image-crop-thirds" aria-hidden="true"/>
          </div>
          <span className="image-crop-drag-hint"><Move size={15}/>Drag to reposition · use the controls below for precision</span>
        </div>
        <div className="image-crop-controls">
          <label className="image-crop-slider"><span>Zoom<strong>{state.zoom.toFixed(2)}×</strong></span><input type="range" min={1} max={maximumZoom} step={.01} value={state.zoom} onChange={event => setState(value => ({ ...value, zoom: Number(event.target.value) }))}/></label>
          <div className="image-crop-position">
            <label className="image-crop-slider"><span>Horizontal position<strong>{Math.round(state.x * 100)}%</strong></span><input type="range" min={0} max={100} step={.1} disabled={crop.width >= 1} value={state.x * 100} onChange={event => setState(value => ({ ...value, x: Number(event.target.value) / 100 }))}/></label>
            <label className="image-crop-slider"><span>Vertical position<strong>{Math.round(state.y * 100)}%</strong></span><input type="range" min={0} max={100} step={.1} disabled={crop.height >= 1} value={state.y * 100} onChange={event => setState(value => ({ ...value, y: Number(event.target.value) / 100 }))}/></label>
          </div>
          <div className={`image-crop-quality ${resolution && resolution.minimum < PRINT_PPI_WARNING_THRESHOLD ? 'caution' : ''}`} aria-live="polite"><strong>{resolution ? `${Math.round(resolution.minimum)} PPI at print size` : 'Image quality unavailable'}</strong><span>{Math.round(naturalWidth * crop.width).toLocaleString()} × {Math.round(naturalHeight * crop.height).toLocaleString()} pixels selected · {frameWidth.toFixed(1)} × {frameHeight.toFixed(1)} mm frame</span>{resolution && resolution.minimum < PRINT_PPI_WARNING_THRESHOLD && <small>Zooming in uses fewer original pixels. Check the preview carefully for close-view print.</small>}</div>
        </div>
      </> : <p className="image-crop-unavailable">Replace this image with a PNG, JPEG or WebP that has readable dimensions before adjusting its crop.</p>}
      <footer className="image-crop-footer"><button type="button" className="image-crop-reset" disabled={!crop} onClick={() => setState({ zoom: 1, x: .5, y: .5 })}><RotateCcw size={15}/>Reset framing</button><div><button type="button" className="image-crop-cancel" onClick={onCancel}>Cancel</button><button type="button" className="image-crop-apply" disabled={!crop} onClick={() => { if (crop) onApply({ ...crop }); }}>Apply crop</button></div></footer>
    </div>
  </div>;
}
